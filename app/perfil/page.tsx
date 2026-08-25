"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Calendar,
  Dumbbell,
  TrendingUp,
  FileText,
  CreditCard,
  MessageCircle,
  LogOut,
  Upload,
  Send,
  X,
  Plus,
  ChevronRight,
  ChevronLeft,
  Activity,
  Footprints,
  CheckCircle,
  Sparkles,
  RotateCcw,
  StopCircle,
  Target,
  ListOrdered,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { updateUser, getUserById, getUsers, logout } from "../lib/auth";
import type { User as AuthUser } from "../lib/auth";
import {
  citasStore,
  mensajesStore,
  planesStore,
  metricasStore,
  documentosStore,
  pagosStore,
  bonosStore,
  bloqueosStore,
  salasStore,
  listaEsperaStore,
  notificarListaEspera,
  retosStore,
  progresoRetoStore,
  retosPredefinidosStore,
  procesarExpiradosListaEspera,
  planCalendarioStore,
  sesionesCalendarioStore,
  generarSesionesCalendario,
} from "../lib/store";
import type {
  Cita,
  Mensaje,
  PlanEntrenamiento,
  Metrica,
  Documento,
  Pago,
  Bono,
  Bloqueo,
  Sala,
  ListaEspera,
  Reto,
  ProgresoReto,
  RetoPredefinido,
  PlanCalendario,
  SesionCalendario,
} from "../lib/store";

const BG = "#2C2C2C";
const DARK = "#FFFFFF";
const MID = "#A0A0A0";
const LIGHT = "#3D3D3D";

// ── RESERVA WIZARD ─────────────────────────────────────────────────────────
type ServicioReserva = {
  id: string;
  label: string;
  duracion: number;
  precio: string;
  proType: "fisio" | "entrenador";
  Icon: React.ElementType;
  descripcion: string;
};

const SERVICIOS_RESERVA: ServicioReserva[] = [
  { id: "fisioe", label: "Fisioterapia Esencial", duracion: 45, precio: "50€/sesión", proType: "fisio", Icon: Activity, descripcion: "45 min · Evaluación y tratamiento" },
  { id: "fisioa", label: "Fisioterapia Avanzada", duracion: 75, precio: "65€/sesión", proType: "fisio", Icon: Activity, descripcion: "75 min · Técnicas avanzadas y ecografía" },
  { id: "entind", label: "Entrenamiento Individual", duracion: 60, precio: "45€/sesión", proType: "entrenador", Icon: Dumbbell, descripcion: "60 min · Sesión personalizada 1 a 1" },
  { id: "entduo", label: "Entrenamiento Dúo", duracion: 60, precio: "22,50€/persona", proType: "entrenador", Icon: Dumbbell, descripcion: "60 min · Entrena con un compañero" },
  { id: "entgru", label: "Entrenamiento Grupo", duracion: 60, precio: "15€/persona", proType: "entrenador", Icon: Dumbbell, descripcion: "60 min · Grupos reducidos, máx. 6 pers." },
  { id: "podo", label: "Podología", duracion: 60, precio: "Consultar", proType: "fisio", Icon: Footprints, descripcion: "60 min · Estudio biomecánico y tratamiento" },
];

const CAL_DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const HORA_INI = 5 * 60 + 30;
const HORA_FIN_CENTRO = 21 * 60;
const STEP_LABELS = ["Servicio", "Fecha", "Hora", "Resumen"];

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(n: number) {
  return `${Math.floor(n / 60).toString().padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`;
}
function duracionDeServicio(serv: string): number {
  const map: Record<string, number> = {
    "Fisioterapia Esencial": 45, "Fisioterapia Avanzada": 75,
    "Entrenamiento Individual": 60, "Entrenamiento Dúo": 60,
    "Entrenamiento Grupo": 60, "Podología": 60,
    "Entrenamiento Personal": 60, "Fisioterapia": 60,
  };
  return map[serv] ?? 60;
}
function slotsDelDia(dur: number): string[] {
  const s: string[] = [];
  let cur = HORA_INI;
  while (cur + dur <= HORA_FIN_CENTRO) { s.push(toHHMM(cur)); cur += dur; }
  return s;
}
function slotLibre(slot: string, dur: number, fecha: string, proId: string, citas: Cita[], bloqueos: Bloqueo[]): boolean {
  const ini = toMin(slot), fin = ini + dur;
  for (const c of citas) {
    if (c.fecha !== fecha || c.profesionalId !== proId || c.estado === "cancelada") continue;
    const ci = toMin(c.hora), cf = ci + duracionDeServicio(c.servicio);
    if (ini < cf && fin > ci) return false;
  }
  for (const b of bloqueos) {
    if (b.fecha !== fecha || b.profesionalId !== proId) continue;
    const bi = toMin(b.horaInicio), bf = toMin(b.horaFin);
    if (ini < bf && fin > bi) return false;
  }
  return true;
}

type SlotDispo = { slot: string; proId: string; proNombre: string };

function calcDispo(fecha: string, serv: ServicioReserva, profs: AuthUser[], citas: Cita[], bloqueos: Bloqueo[]): SlotDispo[] {
  const tipos = profs.filter((p) => p.profesionalType === serv.proType && p.estado === "activo");
  const hoyStr = new Date().toISOString().split("T")[0];
  const ahoraMins = new Date().getHours() * 60 + new Date().getMinutes();
  const result: SlotDispo[] = [];
  for (const slot of slotsDelDia(serv.duracion)) {
    if (fecha === hoyStr && toMin(slot) <= ahoraMins + 30) continue;
    const libres = tipos.filter((p) => slotLibre(slot, serv.duracion, fecha, p.id, citas, bloqueos));
    if (!libres.length) continue;
    const mejor = libres.reduce((a, b) => {
      const na = citas.filter((c) => c.profesionalId === a.id && c.fecha === fecha && c.estado !== "cancelada").length;
      const nb = citas.filter((c) => c.profesionalId === b.id && c.fecha === fecha && c.estado !== "cancelada").length;
      return na <= nb ? a : b;
    });
    result.push({ slot, proId: mejor.id, proNombre: mejor.nombre });
  }
  return result;
}

function FilaResumen({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0.65rem 0", borderBottom: "1px solid rgba(61,61,61,0.07)" }}>
      <span style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID }}>{label}</span>
      <span style={{ fontSize: "0.875rem", color: DARK, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ReservaWizard({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [servicio, setServicio] = useState<ServicioReserva | null>(null);
  const [fecha, setFecha] = useState("");
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [slots, setSlots] = useState<SlotDispo[]>([]);
  const [slotSel, setSlotSel] = useState<SlotDispo | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [salaAsignada, setSalaAsignada] = useState<string | undefined>(undefined);
  const [listaEsperaOkSlot, setListaEsperaOkSlot] = useState<string | null>(null);

  const todasCitas = citasStore.getAll();
  const todosBloqueos = bloqueosStore.getAll();
  const todosProfs = getUsers().filter((u) => u.role === "profesional") as AuthUser[];

  const hoyDate = new Date();
  const hoyStr = hoyDate.toISOString().split("T")[0];
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const prefixCells = firstDow === 0 ? 6 : firstDow - 1;

  function isDayOk(day: number): boolean {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (ds < hoyStr) return false;
    const dow = new Date(ds + "T00:00").getDay();
    return dow !== 0 && dow !== 6;
  }
  function selectDay(day: number) {
    if (!isDayOk(day)) return;
    setFecha(`${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  const isPrevDisabled = calYear < hoyDate.getFullYear() ||
    (calYear === hoyDate.getFullYear() && calMonth <= hoyDate.getMonth());
  function prevMes() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  }
  function nextMes() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  }

  const hoyStr2 = new Date().toISOString().split("T")[0];
  const ahoraMins = new Date().getHours() * 60 + new Date().getMinutes();
  const slotsOcupados: string[] = servicio && fecha
    ? (() => {
        const tiposDisponibles = todosProfs.filter((p) => p.profesionalType === servicio.proType && p.estado === "activo");
        if (!tiposDisponibles.length) return [];
        return slotsDelDia(servicio.duracion).filter((slot) => {
          if (fecha === hoyStr2 && toMin(slot) <= ahoraMins + 30) return false;
          return !slots.some((s) => s.slot === slot);
        });
      })()
    : [];

  function apuntarLista(slot: string) {
    if (!user || !servicio) return;
    listaEsperaStore.add({ clienteId: user.id, servicio: servicio.label, fecha, hora: slot, creadoEn: new Date().toISOString(), notificado: false });
    setListaEsperaOkSlot(slot);
  }

  function avanzar() {
    if (step === 1 && servicio) {
      setStep(2);
    } else if (step === 2 && servicio && fecha) {
      const disp = calcDispo(fecha, servicio, todosProfs, todasCitas, todosBloqueos);
      setSlots(disp);
      setSlotSel(null);
      setListaEsperaOkSlot(null);
      setStep(3);
    } else if (step === 3 && slotSel) {
      const sId = salasStore.asignarSala(fecha, slotSel.slot, servicio!.duracion);
      setSalaAsignada(sId);
      setStep(4);
    }
  }
  function confirmar() {
    if (!user || !servicio || !fecha || !slotSel) return;
    citasStore.add({ clienteId: user.id, profesionalId: slotSel.proId, fecha, hora: slotSel.slot, servicio: servicio.label, estado: "pendiente", salaId: salaAsignada });
    setConfirmado(true);
    setTimeout(onSuccess, 2000);
  }

  const fechaFmt = fecha ? new Date(fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : "";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ backgroundColor: "#3D3D3D", borderRadius: "6px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1.5rem 2rem 1.25rem", borderBottom: "1px solid rgba(61,61,61,0.1)", flexShrink: 0 }}>
          <div>
            <p className="font-serif" style={{ fontSize: "1.25rem", fontWeight: 400, color: DARK, marginBottom: "0.75rem" }}>Reservar cita</p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
              {STEP_LABELS.map((label, i) => {
                const n = i + 1;
                const done = n < step;
                const active = n === step;
                return (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: done ? "#8B1A2F" : active ? "#8B1A2F" : "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", fontWeight: 600, color: (done || active) ? "#FFFFFF" : MID, flexShrink: 0 }}>
                        {done ? "✓" : n}
                      </div>
                      <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: active ? DARK : "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{label}</span>
                    </div>
                    {i < 3 && <div style={{ width: 14, height: 1, backgroundColor: "rgba(255,255,255,0.15)", flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MID, padding: "0.25rem", marginTop: "0.25rem", flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "2rem", flex: 1 }}>

          {/* PASO 1 — Servicio */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: "0.8rem", color: MID, marginBottom: "1.5rem" }}>Selecciona el servicio que deseas reservar.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                {SERVICIOS_RESERVA.map((s) => {
                  const sel = servicio?.id === s.id;
                  return (
                    <button key={s.id} onClick={() => setServicio(s)} style={{ textAlign: "left", background: sel ? "#8B1A2F" : LIGHT, border: `1px solid ${sel ? "#8B1A2F" : "rgba(61,61,61,0.12)"}`, borderRadius: "4px", padding: "1rem 1.1rem", cursor: "pointer", transition: "all 0.15s" }}>
                      <s.Icon size={18} style={{ color: sel ? "#FFFFFF" : DARK, marginBottom: "0.65rem", display: "block" }} />
                      <p style={{ fontSize: "0.82rem", fontWeight: 500, color: sel ? "#FFFFFF" : DARK, marginBottom: "0.2rem" }}>{s.label}</p>
                      <p style={{ fontSize: "0.68rem", color: sel ? "rgba(255,255,255,0.65)" : MID, marginBottom: "0.55rem", lineHeight: 1.5 }}>{s.descripcion}</p>
                      <p style={{ fontSize: "0.8rem", fontWeight: 600, color: sel ? "#FFFFFF" : DARK }}>{s.precio}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 2 — Calendario */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: "0.8rem", color: MID, marginBottom: "1.5rem" }}>Selecciona el día que prefieres. Solo se muestran días laborables.</p>
              <div style={{ maxWidth: 360, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <button onClick={prevMes} disabled={isPrevDisabled} style={{ background: "none", border: "none", cursor: isPrevDisabled ? "not-allowed" : "pointer", color: isPrevDisabled ? "#3D3D3D" : DARK, padding: "0.4rem" }}>
                    <ChevronLeft size={18} />
                  </button>
                  <p className="font-serif" style={{ fontSize: "1rem", fontWeight: 400, color: DARK }}>{MESES[calMonth]} {calYear}</p>
                  <button onClick={nextMes} style={{ background: "none", border: "none", cursor: "pointer", color: DARK, padding: "0.4rem" }}>
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
                  {CAL_DIAS.map((d, di) => (
                    <div key={d} style={{ textAlign: "center", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: di >= 5 ? "rgba(255,255,255,0.3)" : MID, padding: "0.4rem 0", fontWeight: 500 }}>{d}</div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                  {Array.from({ length: prefixCells }).map((_, i) => <div key={`px${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const ok = isDayOk(day);
                    const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const sel = ds === fecha;
                    const isToday = ds === hoyStr;
                    return (
                      <button
                        key={day}
                        onClick={() => selectDay(day)}
                        disabled={!ok}
                        style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: (isToday && !sel) ? "1px solid rgba(61,61,61,0.4)" : "1px solid transparent", backgroundColor: sel ? "#8B1A2F" : "transparent", color: sel ? "#FFFFFF" : ok ? DARK : "rgba(255,255,255,0.22)", cursor: ok ? "pointer" : "not-allowed", fontSize: "0.82rem", fontWeight: sel ? 600 : 400, transition: "background-color 0.1s", fontFamily: "var(--font-inter), system-ui, sans-serif" }}
                        onMouseEnter={(e) => { if (ok && !sel) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
                        onMouseLeave={(e) => { if (!sel) e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {fecha && (
                  <p style={{ fontSize: "0.78rem", color: DARK, marginTop: "1.25rem", textAlign: "center", fontWeight: 500 }}>
                    {fechaFmt}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PASO 3 — Hora */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: DARK, marginBottom: "0.2rem", fontWeight: 500 }}>{fechaFmt} · {servicio?.label}</p>
              <p style={{ fontSize: "0.72rem", color: MID, marginBottom: "1.5rem" }}>El profesional se asigna automáticamente según disponibilidad.</p>

              {slots.length === 0 && slotsOcupados.length === 0 && (
                <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
                  <p style={{ fontSize: "1rem", color: DARK, marginBottom: "0.5rem", fontWeight: 500 }}>Sin disponibilidad</p>
                  <p style={{ fontSize: "0.8rem", color: MID }}>No hay huecos libres para el {fechaFmt}. Usa "Atrás" para elegir otro día.</p>
                </div>
              )}

              {slots.length > 0 && (
                <div style={{ marginBottom: slotsOcupados.length > 0 ? "1.75rem" : 0 }}>
                  <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Disponibles</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {slots.map((s) => {
                      const sel = slotSel?.slot === s.slot;
                      return (
                        <button key={s.slot} onClick={() => setSlotSel(s)} style={{ padding: "0.5rem 1.1rem", fontSize: "0.85rem", fontWeight: sel ? 600 : 400, borderRadius: "20px", border: `1px solid ${sel ? "#8B1A2F" : "#3D3D3D"}`, backgroundColor: sel ? "#8B1A2F" : "transparent", color: sel ? "#FFFFFF" : DARK, cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                          {s.slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {slotsOcupados.length > 0 && (
                <div style={{ borderTop: slots.length > 0 ? "1px solid rgba(61,61,61,0.1)" : "none", paddingTop: slots.length > 0 ? "1.5rem" : 0 }}>
                  <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Ocupados — apúntate a la lista de espera</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {slotsOcupados.map((slot) => {
                      const yaEnLista = user ? listaEsperaStore.estaEnLista(user.id, servicio!.label, fecha, slot) : false;
                      const recienOk = listaEsperaOkSlot === slot;
                      return (
                        <div key={slot} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.9rem", borderRadius: "4px", border: "1px solid rgba(61,61,61,0.1)", backgroundColor: LIGHT }}>
                          <span style={{ fontSize: "0.9rem", color: MID, fontWeight: 500 }}>{slot}</span>
                          {(yaEnLista || recienOk) ? (
                            <span style={{ fontSize: "0.65rem", color: "#8B1A2F", fontWeight: 500, letterSpacing: "0.05em" }}>✓ En lista de espera</span>
                          ) : (
                            <button onClick={() => apuntarLista(slot)} style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.35rem 0.8rem", borderRadius: "2px", border: "1px solid #8B1A2F", backgroundColor: "transparent", color: "#8B1A2F", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                              + Lista de espera
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 4 — Resumen */}
          {step === 4 && !confirmado && (
            <div>
              <p style={{ fontSize: "0.8rem", color: MID, marginBottom: "1.5rem" }}>Revisa los detalles de tu reserva antes de confirmar.</p>
              <div style={{ backgroundColor: LIGHT, borderRadius: "4px", padding: "0.25rem 1.25rem 0.5rem" }}>
                <FilaResumen label="Servicio" value={servicio?.label || ""} />
                <FilaResumen label="Duración" value={`${servicio?.duracion} minutos`} />
                <FilaResumen label="Precio" value={servicio?.precio || ""} />
                <FilaResumen label="Fecha" value={new Date(fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
                <FilaResumen label="Hora" value={slotSel?.slot || ""} />
                <FilaResumen label="Profesional" value={slotSel?.proNombre || ""} />
                {salaAsignada && (
                  <FilaResumen label="Sala" value={salasStore.getAll().find((s) => s.id === salaAsignada)?.nombre || "—"} />
                )}
              </div>
              <p style={{ fontSize: "0.7rem", color: MID, marginTop: "1rem" }}>
                Las cancelaciones deben realizarse con al menos 24 horas de antelación.
              </p>
            </div>
          )}

          {/* CONFIRMADO */}
          {confirmado && (
            <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(139,26,47,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                <CheckCircle size={28} style={{ color: "#8B1A2F" }} />
              </div>
              <p className="font-serif" style={{ fontSize: "1.25rem", fontWeight: 400, color: DARK, marginBottom: "0.5rem" }}>¡Reserva confirmada!</p>
              <p style={{ fontSize: "0.82rem", color: MID }}>
                Tu cita para el {fechaFmt} a las {slotSel?.slot} ha sido registrada correctamente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!confirmado && (
          <div style={{ display: "flex", justifyContent: step === 1 ? "flex-end" : "space-between", padding: "1.25rem 2rem 1.75rem", borderTop: "1px solid rgba(61,61,61,0.1)", flexShrink: 0 }}>
            {step > 1 && (
              <Btn variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft size={13} style={{ marginRight: 4, display: "inline" }} /> Atrás
              </Btn>
            )}
            {step < 4 && (step !== 3 || slots.length > 0) && (
              <Btn onClick={avanzar} disabled={(step === 1 && !servicio) || (step === 2 && !fecha) || (step === 3 && !slotSel)}>
                Siguiente <ChevronRight size={13} style={{ marginLeft: 4, display: "inline" }} />
              </Btn>
            )}
            {step === 4 && <Btn onClick={confirmar}>Confirmar reserva</Btn>}
          </div>
        )}
      </div>
    </div>
  );
}

type Seccion =
  | "perfil"
  | "reservas"
  | "plan"
  | "calendario"
  | "evolucion"
  | "documentos"
  | "pagos"
  | "mensajes"
  | "asistente"
  | "listaespera"
  | "retos";

const SECCIONES: { id: Seccion; label: string; Icon: React.ElementType }[] = [
  { id: "perfil", label: "Mi perfil", Icon: User },
  { id: "reservas", label: "Mis reservas", Icon: Calendar },
  { id: "plan", label: "Mi plan", Icon: Dumbbell },
  { id: "calendario", label: "Mi calendario", Icon: CalendarCheck },
  { id: "evolucion", label: "Mi evolución", Icon: TrendingUp },
  { id: "documentos", label: "Mis documentos", Icon: FileText },
  { id: "pagos", label: "Pagos y créditos", Icon: CreditCard },
  { id: "mensajes", label: "Mensajes", Icon: MessageCircle },
  { id: "listaespera", label: "Listas de espera", Icon: ListOrdered },
  { id: "retos", label: "Mis retos", Icon: Target },
  { id: "asistente", label: "Asistente IA", Icon: Sparkles },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "0.65rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: MID,
        marginBottom: "0.5rem",
      }}
    >
      {children}
    </p>
  );
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="veysic-card"
      style={{
        backgroundColor: LIGHT,
        borderRadius: "4px",
        padding: "1.5rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = "dark",
  small,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "dark" | "outline" | "ghost";
  small?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base: React.CSSProperties = {
    fontSize: small ? "0.6rem" : "0.65rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    borderRadius: "2px",
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    padding: small ? "0.45rem 0.9rem" : "0.7rem 1.4rem",
    transition: "all 0.2s",
    opacity: disabled ? 0.5 : 1,
  };
  if (variant === "dark")
    return (
      <button
        className="veysic-btn-primary"
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={{ ...base, backgroundColor: "#8B1A2F", color: "#FFFFFF" }}
      >
        {children}
      </button>
    );
  if (variant === "outline")
    return (
      <button
        className="veysic-btn-outline"
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={{
          ...base,
          backgroundColor: "transparent",
          color: "#8B1A2F",
          border: `1px solid #8B1A2F`,
        }}
      >
        {children}
      </button>
    );
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, backgroundColor: "transparent", color: MID, padding: small ? "0.3rem 0.5rem" : "0.5rem 0.8rem" }}
    >
      {children}
    </button>
  );
}

function InputLine({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={!onChange}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${onChange ? "#3D3D3D" : "rgba(61,61,61,0.1)"}`,
          paddingBottom: "0.6rem",
          paddingTop: "0.15rem",
          fontSize: "0.875rem",
          color: DARK,
          outline: "none",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          if (onChange) e.currentTarget.style.borderBottomColor = "#8B1A2F";
        }}
        onBlur={(e) => {
          if (onChange)
            e.currentTarget.style.borderBottomColor = "#3D3D3D";
        }}
      />
    </div>
  );
}

// ── SECCIÓN: MI PERFIL ─────────────────────────────────────────────────────
function SeccionPerfil() {
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [email] = useState(user?.email || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [fechaNacimiento, setFechaNacimiento] = useState(user?.fechaNacimiento || "");
  const [direccion, setDireccion] = useState(user?.direccion || "");
  const [lesiones, setLesiones] = useState(user?.historialMedico?.lesiones || "");
  const [alergias, setAlergias] = useState(user?.historialMedico?.alergias || "");
  const [medicacion, setMedicacion] = useState(user?.historialMedico?.medicacion || "");
  const [ok, setOk] = useState(false);

  if (!user) return null;

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const foto = ev.target?.result as string;
      const updated = updateUser(user!.id, { foto });
      setUser(updated);
    };
    reader.readAsDataURL(file);
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    const updated = updateUser(user!.id, {
      nombre,
      telefono,
      fechaNacimiento,
      direccion,
      historialMedico: { lesiones, alergias, medicacion },
    });
    setUser(updated);
    setOk(true);
    setTimeout(() => setOk(false), 3000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h2
          className="font-serif"
          style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}
        >
          Mi perfil
        </h2>

        {/* Foto */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {user.foto ? (
              <img src={user.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <User size={32} color={MID} />
            )}
          </div>
          <div>
            <p style={{ fontSize: "0.9rem", color: DARK, fontWeight: 500, marginBottom: "0.4rem" }}>{user.nombre}</p>
            <p style={{ fontSize: "0.75rem", color: MID, marginBottom: "0.75rem" }}>
              {user.role === "cliente" ? "Cliente" : user.role}
            </p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} />
            <Btn small variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload size={11} style={{ marginRight: 6, display: "inline" }} />
              Cambiar foto
            </Btn>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <Card>
          <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1.5rem" }}>
            Datos personales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem" }}>
            <InputLine label="Nombre completo" value={nombre} onChange={setNombre} />
            <InputLine label="Email" value={email} />
            <InputLine label="Teléfono" value={telefono} onChange={setTelefono} type="tel" />
            <InputLine label="Fecha de nacimiento" value={fechaNacimiento} onChange={setFechaNacimiento} type="date" />
            <div style={{ gridColumn: "1 / -1" }}>
              <InputLine label="Dirección" value={direccion} onChange={setDireccion} placeholder="Calle, ciudad, código postal" />
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1.5rem" }}>
            Historial médico básico
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <InputLine label="Lesiones previas" value={lesiones} onChange={setLesiones} placeholder="Ej: Esguince tobillo (2022)" />
            <InputLine label="Alergias" value={alergias} onChange={setAlergias} placeholder="Ej: Ibuprofeno, látex..." />
            <InputLine label="Medicación relevante" value={medicacion} onChange={setMedicacion} placeholder="Ej: Ninguna" />
          </div>
        </Card>

        {ok && (
          <p style={{ fontSize: "0.8rem", color: "#8B1A2F", backgroundColor: "rgba(139,26,47,0.08)", padding: "0.75rem 1rem", borderRadius: "2px", borderLeft: "3px solid #3D3D3D" }}>
            Cambios guardados correctamente.
          </p>
        )}
        <div>
          <Btn type="submit">Guardar cambios</Btn>
        </div>
      </form>
    </div>
  );
}

// ── SECCIÓN: MIS RESERVAS ──────────────────────────────────────────────────
function SeccionReservas() {
  const { user } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [tab, setTab] = useState<"proximas" | "historial">("proximas");
  useEffect(() => {
    if (user) {
      setCitas(citasStore.getByCliente(user.id));
      setSalas(salasStore.getAll());
    }
  }, [user]);

  if (!user) return null;

  const hoy = new Date().toISOString().split("T")[0];
  const proximas = citas.filter((c) => c.fecha >= hoy && c.estado !== "cancelada");
  const historial = citas.filter((c) => c.fecha < hoy || c.estado === "cancelada" || c.estado === "completada");

  function cancelar(id: string) {
    const cita = citas.find((c) => c.id === id);
    if (!cita) return;
    const diff = (new Date(cita.fecha).getTime() - Date.now()) / 3600000;
    if (diff < 24) {
      alert("Solo puedes cancelar con al menos 24 horas de antelación.");
      return;
    }
    citasStore.update(id, { estado: "cancelada" });
    notificarListaEspera(id);
    setCitas(citasStore.getByCliente(user!.id));
  }

  function nombrePro(id: string) {
    return getUserById(id)?.nombre || id;
  }

  function estadoBadge(estado: Cita["estado"]) {
    const map = {
      pendiente: { bg: "rgba(74,111,165,0.1)", color: "#4A6FA5", label: "Pendiente" },
      completada: { bg: "rgba(139,26,47,0.1)", color: "#8B1A2F", label: "Completada" },
      cancelada: { bg: "rgba(192,87,74,0.1)", color: "#C0574A", label: "Cancelada" },
    };
    const s = map[estado];
    return (
      <span style={{ fontSize: "0.65rem", padding: "0.25rem 0.6rem", borderRadius: "20px", backgroundColor: s.bg, color: s.color, fontWeight: 500, letterSpacing: "0.05em" }}>
        {s.label}
      </span>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK }}>
          Mis reservas
        </h2>
        <Link href="/reservar" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", backgroundColor: "#8B1A2F", color: "#FFFFFF", textDecoration: "none", borderRadius: "2px", fontWeight: 500 }}>
          <Plus size={12} style={{ display: "inline" }} />
          Nueva cita
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid rgba(61,61,61,0.12)", marginBottom: "1.5rem" }}>
        {(["proximas", "historial"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t ? "#8B1A2F" : "transparent"}`,
              padding: "0.6rem 1.2rem",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: tab === t ? DARK : MID,
              cursor: "pointer",
              marginBottom: "-1px",
              transition: "all 0.2s",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            }}
          >
            {t === "proximas" ? "Próximas" : "Historial"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {(tab === "proximas" ? proximas : historial).length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: MID, padding: "2rem 0" }}>
            No hay citas en esta sección.
          </p>
        ) : (
          (tab === "proximas" ? proximas : historial).map((c) => (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 500, color: DARK, marginBottom: "0.3rem" }}>{c.servicio}</p>
                  <p style={{ fontSize: "0.75rem", color: MID }}>
                    {new Date(c.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · {c.hora}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: MID, marginTop: "0.2rem" }}>
                    Profesional: {nombrePro(c.profesionalId)}
                    {c.salaId && ` · ${salas.find((s) => s.id === c.salaId)?.nombre || ""}`}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {estadoBadge(c.estado)}
                  {c.estado === "pendiente" && (
                    <Btn small variant="outline" onClick={() => cancelar(c.id)}>
                      Cancelar
                    </Btn>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ── SECCIÓN: MI PLAN ───────────────────────────────────────────────────────
function SeccionPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanEntrenamiento | undefined>();
  const [historial, setHistorial] = useState<PlanEntrenamiento[]>([]);

  useEffect(() => {
    if (!user) return;
    setPlan(planesStore.getActivo(user.id));
    setHistorial(planesStore.getByCliente(user.id).filter((p) => !p.activo));
  }, [user]);

  if (!user) return null;

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK }}>
          Mi plan de entrenamiento
        </h2>
        <button
          onClick={() => {
            const btn = document.querySelector<HTMLButtonElement>("[data-seccion='asistente']");
            btn?.click();
          }}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.85rem", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid #3D3D3D", borderRadius: "20px", backgroundColor: LIGHT, color: MID, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          <Sparkles size={12} /> Crear rutina con IA
        </button>
      </div>

      {!plan ? (
        <Card>
          <p style={{ fontSize: "0.875rem", color: MID }}>
            Aún no tienes un plan asignado. Tu entrenador te lo asignará próximamente.
          </p>
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1rem", color: DARK, marginBottom: "0.25rem" }}>{plan.nombre}</h3>
              <p style={{ fontSize: "0.75rem", color: MID }}>
                Desde {new Date(plan.fechaInicio + "T00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <span style={{ fontSize: "0.65rem", padding: "0.25rem 0.7rem", borderRadius: "20px", backgroundColor: "rgba(139,26,47,0.1)", color: "#8B1A2F", fontWeight: 500 }}>
              Activo
            </span>
          </div>

          {/* Progreso semanal */}
          <Card style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>
              Días de entrenamiento esta semana
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {dias.map((d) => {
                const activo = !!plan.dias[d];
                return (
                  <div
                    key={d}
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "2px",
                      backgroundColor: activo ? "#8B1A2F" : "transparent",
                      border: `1px solid ${activo ? "#8B1A2F" : "rgba(61,61,61,0.15)"}`,
                      fontSize: "0.65rem",
                      letterSpacing: "0.05em",
                      color: activo ? "#FFFFFF" : MID,
                    }}
                  >
                    {d.slice(0, 3)}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Ejercicios por día */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {Object.entries(plan.dias).map(([dia, { ejercicios }]) => (
              <Card key={dia}>
                <h4 style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: DARK, marginBottom: "1rem" }}>
                  {dia}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {ejercicios.map((ej, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto auto auto",
                        gap: "1rem",
                        alignItems: "center",
                        padding: "0.5rem 0",
                        borderBottom: i < ejercicios.length - 1 ? "1px solid rgba(61,61,61,0.06)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "0.875rem", color: DARK }}>{ej.nombre}</span>
                      <span style={{ fontSize: "0.7rem", color: MID }}>{ej.series} × {ej.reps}</span>
                      <span style={{ fontSize: "0.7rem", color: MID }}>{ej.descanso}</span>
                      {ej.notas && <span style={{ fontSize: "0.65rem", color: MID, fontStyle: "italic" }}>{ej.notas}</span>}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {historial.length > 0 && (
            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>
                Planes anteriores
              </h3>
              {historial.map((p) => (
                <Card key={p.id} style={{ marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.875rem", color: DARK }}>{p.nombre}</p>
                  <p style={{ fontSize: "0.7rem", color: MID, marginTop: "0.25rem" }}>
                    Desde {new Date(p.fechaInicio + "T00:00").toLocaleDateString("es-ES")}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── SECCIÓN: MI EVOLUCIÓN ──────────────────────────────────────────────────
function SeccionEvolucion() {
  const { user } = useAuth();
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [grasa, setGrasa] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (user) setMetricas(metricasStore.getByCliente(user.id));
  }, [user]);

  if (!user) return null;

  const ultima = metricas[metricas.length - 1];
  const imc =
    ultima?.peso && ultima?.altura
      ? (ultima.peso / ((ultima.altura / 100) ** 2)).toFixed(1)
      : null;

  function guardar(e: FormEvent) {
    e.preventDefault();
    metricasStore.add({
      clienteId: user!.id,
      fecha: new Date().toISOString().split("T")[0],
      peso: peso ? parseFloat(peso) : undefined,
      altura: altura ? parseFloat(altura) : undefined,
      grasaCorporal: grasa ? parseFloat(grasa) : undefined,
    });
    setMetricas(metricasStore.getByCliente(user!.id));
    setPeso("");
    setAltura("");
    setGrasa("");
    setOk(true);
    setTimeout(() => setOk(false), 3000);
  }

  // Mini chart (SVG line graph for weight)
  const pesos = metricas.filter((m) => m.peso).slice(-8);
  function miniChart() {
    if (pesos.length < 2) return null;
    const vals = pesos.map((m) => m.peso!);
    const min = Math.min(...vals) - 1;
    const max = Math.max(...vals) + 1;
    const W = 300;
    const H = 80;
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H - ((v - min) / (max - min)) * H;
      return `${x},${y}`;
    });
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, height: 80 }}>
        <polyline points={pts.join(" ")} fill="none" stroke={"#8B1A2F"} strokeWidth="1.5" strokeLinejoin="round" />
        {pesos.map((m, i) => {
          const x = (i / (vals.length - 1)) * W;
          const y = H - ((vals[i] - min) / (max - min)) * H;
          return <circle key={i} cx={x} cy={y} r="3" fill={"#8B1A2F"} />;
        })}
      </svg>
    );
  }

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>
        Mi evolución física
      </h2>

      {/* Resumen actual */}
      {ultima && (
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Peso", value: ultima.peso ? `${ultima.peso} kg` : "—" },
            { label: "Altura", value: ultima.altura ? `${ultima.altura} cm` : "—" },
            { label: "% Grasa", value: ultima.grasaCorporal ? `${ultima.grasaCorporal}%` : "—" },
            { label: "IMC", value: imc ?? "—" },
          ].map(({ label, value }) => (
            <Card key={label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.4rem", fontWeight: 500, color: DARK, marginBottom: "0.25rem" }}>{value}</p>
              <Label>{label}</Label>
            </Card>
          ))}
        </div>
      )}

      {/* Gráfico de peso */}
      {pesos.length >= 2 && (
        <Card style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>
            Evolución del peso (últimas mediciones)
          </p>
          {miniChart()}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
            <span style={{ fontSize: "0.65rem", color: MID }}>{pesos[0]?.fecha}</span>
            <span style={{ fontSize: "0.65rem", color: MID }}>{pesos[pesos.length - 1]?.fecha}</span>
          </div>
        </Card>
      )}

      {/* Añadir medición */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>
          Registrar nueva medición
        </h3>
        <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1rem" }}>
            <InputLine label="Peso (kg)" value={peso} onChange={setPeso} type="number" placeholder="72.5" />
            <InputLine label="Altura (cm)" value={altura} onChange={setAltura} type="number" placeholder="168" />
            <InputLine label="% Grasa corporal" value={grasa} onChange={setGrasa} type="number" placeholder="22.0" />
          </div>
          {ok && (
            <p style={{ fontSize: "0.8rem", color: "#8B1A2F" }}>Medición guardada.</p>
          )}
          <div><Btn type="submit" small>Guardar medición</Btn></div>
        </form>
      </Card>

      {/* Historial */}
      <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>
        Historial de mediciones
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {[...metricas].reverse().map((m) => (
          <Card key={m.id}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: MID }}>{new Date(m.fecha + "T00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                {m.peso && <span style={{ fontSize: "0.8rem", color: DARK }}><strong>{m.peso}</strong> kg</span>}
                {m.altura && <span style={{ fontSize: "0.8rem", color: DARK }}><strong>{m.altura}</strong> cm</span>}
                {m.grasaCorporal && <span style={{ fontSize: "0.8rem", color: DARK }}><strong>{m.grasaCorporal}</strong>% grasa</span>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── SECCIÓN: MIS DOCUMENTOS ────────────────────────────────────────────────
function SeccionDocumentos() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Documento[]>([]);

  useEffect(() => {
    if (user) setDocs(documentosStore.getByCliente(user.id));
  }, [user]);

  if (!user) return null;

  const iconoTipo = {
    informe: "📋",
    consentimiento: "✍️",
    factura: "🧾",
  };

  const labelTipo = {
    informe: "Informe",
    consentimiento: "Consentimiento",
    factura: "Factura",
  };

  const grupos = ["informe", "consentimiento", "factura"] as const;

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>
        Mis documentos
      </h2>

      {docs.length === 0 ? (
        <Card>
          <p style={{ fontSize: "0.875rem", color: MID }}>No tienes documentos todavía.</p>
        </Card>
      ) : (
        grupos.map((tipo) => {
          const lista = docs.filter((d) => d.tipo === tipo);
          if (lista.length === 0) return null;
          return (
            <div key={tipo} style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>
                {iconoTipo[tipo]} {labelTipo[tipo]}s
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {lista.map((d) => (
                  <Card key={d.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <p style={{ fontSize: "0.875rem", color: DARK, marginBottom: "0.2rem" }}>{d.nombre}</p>
                        <p style={{ fontSize: "0.7rem", color: MID }}>
                          {new Date(d.fecha + "T00:00").toLocaleDateString("es-ES")} · Subido por {getUserById(d.subidoPor)?.nombre || d.subidoPor}
                        </p>
                      </div>
                      <Btn small variant="outline">
                        <FileText size={11} style={{ marginRight: 5, display: "inline" }} />
                        Ver
                      </Btn>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── SECCIÓN: PAGOS Y CRÉDITOS ──────────────────────────────────────────────
function SeccionPagos() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [bonos, setBonos] = useState<Bono[]>([]);

  useEffect(() => {
    if (!user) return;
    setPagos(pagosStore.getByCliente(user.id));
    setBonos(bonosStore.getByCliente(user.id));
  }, [user]);

  if (!user) return null;

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>
        Pagos y créditos
      </h2>

      {/* Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1rem", marginBottom: "1.5rem" }}>
        <Card style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "2.5rem", fontWeight: 600, color: DARK }}>{user.creditos} €</p>
          <Label>Saldo disponible</Label>
          <div style={{ marginTop: "1rem" }}>
            <Btn small>Recargar créditos</Btn>
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {bonos.filter((b) => b.activo).map((b) => (
            <Card key={b.id}>
              <p style={{ fontSize: "0.875rem", color: DARK, marginBottom: "0.25rem" }}>{b.nombre}</p>
              <div style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden", height: 6, marginBottom: "0.4rem" }}>
                <div
                  style={{
                    width: `${((b.sesionesTotales - b.sesionesUsadas) / b.sesionesTotales) * 100}%`,
                    height: "100%",
                    backgroundColor: "#8B1A2F",
                    borderRadius: "20px",
                  }}
                />
              </div>
              <p style={{ fontSize: "0.7rem", color: MID }}>
                {b.sesionesTotales - b.sesionesUsadas} sesiones restantes de {b.sesionesTotales}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Historial */}
      <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>
        Historial de movimientos
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {pagos.map((p) => (
          <Card key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <p style={{ fontSize: "0.875rem", color: DARK, marginBottom: "0.2rem" }}>{p.descripcion}</p>
                <p style={{ fontSize: "0.7rem", color: MID }}>{new Date(p.fecha + "T00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <span style={{ fontSize: "1rem", fontWeight: 500, color: p.monto > 0 ? "#8B1A2F" : DARK }}>
                {p.monto > 0 ? "+" : ""}{p.monto} €
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── SECCIÓN: MENSAJES ──────────────────────────────────────────────────────
// ── SECCIÓN: LISTA DE ESPERA ───────────────────────────────────────────────
function SeccionListaEspera() {
  const { user } = useAuth();
  const [lista, setLista] = useState<ListaEspera[]>([]);

  useEffect(() => {
    if (!user) return;
    procesarExpiradosListaEspera();
    setLista(listaEsperaStore.getByCliente(user.id).sort((a, b) => a.creadoEn.localeCompare(b.creadoEn)));
  }, [user]);

  if (!user) return null;

  function posicionEnCola(le: ListaEspera): number {
    const todos = listaEsperaStore.getAll()
      .filter(x => x.servicio === le.servicio && x.fecha === le.fecha && x.hora === le.hora && !x.notificado)
      .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
    return todos.findIndex(x => x.id === le.id) + 1;
  }

  function salirDeLista(id: string) {
    listaEsperaStore.remove(id);
    setLista(listaEsperaStore.getByCliente(user!.id).sort((a, b) => a.creadoEn.localeCompare(b.creadoEn)));
  }

  const pendientes = lista.filter(le => !le.notificado && !le.expirado);
  const notificados = lista.filter(le => le.notificado && !le.expirado);
  const expirados = lista.filter(le => le.expirado);

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Mis listas de espera</h2>
      {lista.length === 0 ? (
        <Card><p style={{ fontSize: "0.875rem", color: MID }}>No estás en ninguna lista de espera actualmente.</p></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {pendientes.length > 0 && (
            <div>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>En espera</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {pendientes.map(le => {
                  const pos = posicionEnCola(le);
                  return (
                    <Card key={le.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "0.85rem", fontWeight: 500, color: DARK, marginBottom: "0.2rem" }}>{le.servicio}</p>
                          <p style={{ fontSize: "0.72rem", color: MID }}>{new Date(le.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · {le.hora}</p>
                          {pos > 0 && (
                            <p style={{ fontSize: "0.68rem", color: "#C08A2E", marginTop: "0.35rem", fontWeight: 500 }}>
                              Posición {pos} en la cola
                            </p>
                          )}
                        </div>
                        <button onClick={() => salirDeLista(le.id)} style={{ fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.35rem 0.65rem", border: "1px solid rgba(192,87,74,0.3)", borderRadius: "4px", backgroundColor: "transparent", color: "#C0574A", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif", whiteSpace: "nowrap" }}>
                          Salir
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          {notificados.length > 0 && (
            <div>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>¡Hay un hueco para ti!</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {notificados.map(le => (
                  <Card key={le.id} style={{ borderLeft: "4px solid #3D3D3D" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: 500, color: DARK, marginBottom: "0.2rem" }}>🎉 {le.servicio}</p>
                        <p style={{ fontSize: "0.72rem", color: MID }}>{new Date(le.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · {le.hora}</p>
                        <p style={{ fontSize: "0.68rem", color: "#8B1A2F", marginTop: "0.35rem", fontWeight: 500 }}>Te han notificado — revisa tus mensajes</p>
                      </div>
                      <Link href="/reservar" style={{ fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.4rem 0.75rem", border: "none", borderRadius: "4px", backgroundColor: "#8B1A2F", color: "#FFFFFF", textDecoration: "none", whiteSpace: "nowrap" }}>
                        Reservar
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {expirados.length > 0 && (
            <div>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Caducados</p>
              {expirados.map(le => (
                <Card key={le.id} style={{ opacity: 0.6 }}>
                  <p style={{ fontSize: "0.82rem", color: MID }}>{le.servicio} · {le.fecha} · {le.hora} — Expirado</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SECCIÓN: MIS RETOS ─────────────────────────────────────────────────────
const CATEGORIAS_RETO: { id: Reto["categoria"]; label: string; color: string }[] = [
  { id: "perdida_peso", label: "Pérdida de peso", color: "#C08A2E" },
  { id: "ganancia_muscular", label: "Ganancia muscular", color: "#7A5C8E" },
  { id: "resistencia", label: "Resistencia", color: "#8B1A2F" },
  { id: "flexibilidad", label: "Flexibilidad", color: "#4A6FA5" },
  { id: "rehabilitacion", label: "Rehabilitación", color: "#C0574A" },
  { id: "otro", label: "Otro", color: MID },
];

function SeccionRetos() {
  const { user } = useAuth();
  const [retos, setRetos] = useState<Reto[]>([]);
  const [predefinidos, setPredefinidos] = useState<RetoPredefinido[]>([]);
  const [vista, setVista] = useState<"lista" | "nuevo" | "detalle">("lista");
  const [retoActivo, setRetoActivo] = useState<Reto | null>(null);
  const [progreso, setProgreso] = useState<ProgresoReto[]>([]);
  const [nuevoValor, setNuevoValor] = useState("");
  const [nuevaNota, setNuevaNota] = useState("");
  const [fNombre, setFNombre] = useState("");
  const [fCat, setFCat] = useState<Reto["categoria"]>("otro");
  const [fFechaLimite, setFFechaLimite] = useState("");
  const [fValorInicial, setFValorInicial] = useState("");
  const [fValorObjetivo, setFValorObjetivo] = useState("");
  const [fUnidad, setFUnidad] = useState("");
  const [fNotas, setFNotas] = useState("");

  useEffect(() => {
    if (!user) return;
    setRetos(retosStore.getByCliente(user.id));
    setPredefinidos(retosPredefinidosStore.getAll());
  }, [user]);

  useEffect(() => {
    if (retoActivo) setProgreso(progresoRetoStore.getByReto(retoActivo.id));
  }, [retoActivo]);

  if (!user) return null;

  function crearReto(e: React.FormEvent) {
    e.preventDefault();
    if (!fNombre || !fFechaLimite || !fValorInicial || !fValorObjetivo || !fUnidad) return;
    const nuevo = retosStore.add({
      clienteId: user!.id, nombre: fNombre, categoria: fCat,
      fechaLimite: fFechaLimite, valorInicial: parseFloat(fValorInicial),
      valorObjetivo: parseFloat(fValorObjetivo), unidad: fUnidad,
      notas: fNotas, completado: false, creadoEn: new Date().toISOString(),
    });
    progresoRetoStore.add({ retoId: nuevo.id, fecha: new Date().toISOString().split("T")[0], valor: parseFloat(fValorInicial), nota: "Valor inicial" });
    setRetos(retosStore.getByCliente(user!.id));
    setVista("lista");
    setFNombre(""); setFCat("otro"); setFFechaLimite(""); setFValorInicial(""); setFValorObjetivo(""); setFUnidad(""); setFNotas("");
  }

  function adoptarPredefinido(rp: RetoPredefinido) {
    const hoy = new Date();
    const fechaLimite = new Date(hoy.getTime() + rp.duracionDias * 86400000).toISOString().split("T")[0];
    const nuevo = retosStore.add({
      clienteId: user!.id, nombre: rp.nombre, categoria: rp.categoria,
      fechaLimite, valorInicial: 0, valorObjetivo: rp.valorObjetivo,
      unidad: rp.unidad, notas: rp.descripcion, completado: false,
      creadoEn: new Date().toISOString(), predefinidoId: rp.id,
    });
    progresoRetoStore.add({ retoId: nuevo.id, fecha: hoy.toISOString().split("T")[0], valor: 0, nota: "Inicio del reto" });
    setRetos(retosStore.getByCliente(user!.id));
  }

  function registrarProgreso(e: React.FormEvent) {
    e.preventDefault();
    if (!retoActivo || !nuevoValor) return;
    progresoRetoStore.add({ retoId: retoActivo.id, fecha: new Date().toISOString().split("T")[0], valor: parseFloat(nuevoValor), nota: nuevaNota || undefined });
    const ultimoValor = parseFloat(nuevoValor);
    const completado = retoActivo.valorObjetivo > retoActivo.valorInicial
      ? ultimoValor >= retoActivo.valorObjetivo
      : ultimoValor <= retoActivo.valorObjetivo;
    if (completado && !retoActivo.completado) retosStore.update(retoActivo.id, { completado: true });
    setProgreso(progresoRetoStore.getByReto(retoActivo.id));
    setRetos(retosStore.getByCliente(user!.id));
    setRetoActivo(retosStore.getByCliente(user!.id).find(r => r.id === retoActivo.id) || null);
    setNuevoValor(""); setNuevaNota("");
  }

  const catConfig = (cat: Reto["categoria"]) => CATEGORIAS_RETO.find(c => c.id === cat) || CATEGORIAS_RETO[CATEGORIAS_RETO.length - 1];

  function PorcentajeReto(r: Reto): number {
    const prog = progresoRetoStore.getByReto(r.id);
    if (prog.length === 0) return 0;
    const ultimo = prog[prog.length - 1].valor;
    const rango = r.valorObjetivo - r.valorInicial;
    if (rango === 0) return 100;
    return Math.min(100, Math.max(0, Math.round(((ultimo - r.valorInicial) / rango) * 100)));
  }

  if (vista === "nuevo") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button onClick={() => setVista("lista")} style={{ background: "none", border: "none", cursor: "pointer", color: MID, fontSize: "0.75rem" }}>← Volver</button>
        <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK }}>Nuevo reto</h2>
      </div>
      <Card>
        <form onSubmit={crearReto} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {[
            { label: "Nombre del objetivo", el: <input value={fNombre} onChange={e => setFNombre(e.target.value)} required placeholder="Ej: Perder 5 kg, Correr 5 km..." style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", boxSizing: "border-box" as const }} /> },
            { label: "Categoría", el: <select value={fCat} onChange={e => setFCat(e.target.value as Reto["categoria"])} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>{CATEGORIAS_RETO.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select> },
            { label: "Fecha límite", el: <input type="date" value={fFechaLimite} onChange={e => setFFechaLimite(e.target.value)} required min={new Date().toISOString().split("T")[0]} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} /> },
            { label: "Unidad de medida", el: <input value={fUnidad} onChange={e => setFUnidad(e.target.value)} required placeholder="kg, cm, repeticiones, minutos..." style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", boxSizing: "border-box" as const }} /> },
          ].map(({ label, el }) => (
            <div key={label}><p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.4rem" }}>{label}</p>{el}</div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div><p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.4rem" }}>Valor inicial</p><input type="number" value={fValorInicial} onChange={e => setFValorInicial(e.target.value)} required step="0.1" style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} /></div>
            <div><p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.4rem" }}>Valor objetivo</p><input type="number" value={fValorObjetivo} onChange={e => setFValorObjetivo(e.target.value)} required step="0.1" style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} /></div>
          </div>
          <div><p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.4rem" }}>Notas (opcional)</p><textarea value={fNotas} onChange={e => setFNotas(e.target.value)} rows={2} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", resize: "none", boxSizing: "border-box" as const }} /></div>
          <button type="submit" style={{ padding: "0.75rem 1.5rem", backgroundColor: "#8B1A2F", color: "#FFFFFF", border: "none", borderRadius: "4px", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>Crear reto</button>
        </form>
      </Card>
    </div>
  );

  if (vista === "detalle" && retoActivo) {
    const cc = catConfig(retoActivo.categoria);
    const pct = PorcentajeReto(retoActivo);
    const ultimoValor = progreso.length > 0 ? progreso[progreso.length - 1].valor : retoActivo.valorInicial;
    const diasRestantes = Math.max(0, Math.ceil((new Date(retoActivo.fechaLimite).getTime() - Date.now()) / 86400000));
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <button onClick={() => { setVista("lista"); setRetoActivo(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: MID, fontSize: "0.75rem" }}>← Volver</button>
          <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, flex: 1 }}>{retoActivo.nombre}</h2>
          {retoActivo.completado && <span style={{ fontSize: "1.5rem" }}>🏆</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card style={{ borderLeft: `4px solid ${cc.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.62rem", padding: "0.2rem 0.5rem", borderRadius: "20px", backgroundColor: `${cc.color}18`, color: cc.color, fontWeight: 600 }}>{cc.label}</span>
              <span style={{ fontSize: "0.72rem", color: MID }}>{diasRestantes > 0 ? `${diasRestantes} días restantes` : "Fecha límite pasada"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: MID }}>Progreso</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: cc.color }}>{pct}%</span>
            </div>
            <div style={{ height: 10, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 5, overflow: "hidden", marginBottom: "0.75rem" }}>
              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: cc.color, borderRadius: 5, transition: "width 0.5s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.6rem", color: MID, marginBottom: "0.15rem" }}>Inicio</p>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: DARK }}>{retoActivo.valorInicial} {retoActivo.unidad}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.6rem", color: MID, marginBottom: "0.15rem" }}>Actual</p>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: cc.color }}>{ultimoValor} {retoActivo.unidad}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.6rem", color: MID, marginBottom: "0.15rem" }}>Objetivo</p>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: DARK }}>{retoActivo.valorObjetivo} {retoActivo.unidad}</p>
              </div>
            </div>
            {retoActivo.comentarioPro && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "4px", borderLeft: "3px solid #3D3D3D" }}>
                <p style={{ fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MID, marginBottom: "0.3rem" }}>Comentario de tu profesional</p>
                <p style={{ fontSize: "0.8rem", color: DARK }}>{retoActivo.comentarioPro}</p>
              </div>
            )}
          </Card>
          {progreso.length > 1 && (
            <Card>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Evolución</p>
              <div style={{ position: "relative", height: 80, display: "flex", alignItems: "flex-end", gap: "4px" }}>
                {progreso.map((p, i) => {
                  const rango = retoActivo.valorObjetivo - retoActivo.valorInicial;
                  const h = rango === 0 ? 100 : Math.min(100, Math.max(5, Math.round(((p.valor - retoActivo.valorInicial) / rango) * 100)));
                  return (
                    <div key={i} title={`${p.fecha}: ${p.valor} ${retoActivo.unidad}`}
                      style={{ flex: 1, height: `${h}%`, backgroundColor: i === progreso.length - 1 ? cc.color : `${cc.color}60`, borderRadius: "2px 2px 0 0", minWidth: 8, transition: "height 0.3s" }} />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem" }}>
                <span style={{ fontSize: "0.58rem", color: MID }}>{progreso[0]?.fecha}</span>
                <span style={{ fontSize: "0.58rem", color: MID }}>{progreso[progreso.length - 1]?.fecha}</span>
              </div>
            </Card>
          )}
          {!retoActivo.completado && (
            <Card>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Registrar actualización</p>
              <form onSubmit={registrarProgreso} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ fontSize: "0.6rem", color: MID, marginBottom: "0.3rem" }}>Valor actual ({retoActivo.unidad})</p>
                  <input type="number" value={nuevoValor} onChange={e => setNuevoValor(e.target.value)} required step="0.1" style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.4rem", fontSize: "0.9rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
                </div>
                <div style={{ flex: 2, minWidth: 180 }}>
                  <p style={{ fontSize: "0.6rem", color: MID, marginBottom: "0.3rem" }}>Nota (opcional)</p>
                  <input value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.4rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
                </div>
                <button type="submit" style={{ padding: "0.5rem 1rem", backgroundColor: "#8B1A2F", color: "#FFFFFF", border: "none", borderRadius: "4px", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif", flexShrink: 0 }}>Guardar</button>
              </form>
            </Card>
          )}
          {retoActivo.completado && (
            <div style={{ textAlign: "center", padding: "2rem", backgroundColor: "rgba(139,26,47,0.08)", borderRadius: "8px", border: "1px solid rgba(139,26,47,0.2)" }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏆</p>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#8B1A2F", marginBottom: "0.25rem" }}>¡Objetivo conseguido!</p>
              <p style={{ fontSize: "0.78rem", color: MID }}>Enhorabuena por completar este reto.</p>
            </div>
          )}
          {progreso.length > 0 && (
            <Card>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Historial</p>
              {[...progreso].reverse().map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid rgba(61,61,61,0.06)" }}>
                  <div>
                    <p style={{ fontSize: "0.78rem", color: DARK }}>{p.fecha}</p>
                    {p.nota && <p style={{ fontSize: "0.65rem", color: MID }}>{p.nota}</p>}
                  </div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600, color: cc.color }}>{p.valor} {retoActivo.unidad}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK }}>Mis retos</h2>
        <button onClick={() => setVista("nuevo")} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", backgroundColor: "#8B1A2F", color: "#FFFFFF", border: "none", borderRadius: "2px", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
          + Nuevo reto
        </button>
      </div>
      {retos.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {retos.map(r => {
              const cc = catConfig(r.categoria);
              const pct = PorcentajeReto(r);
              return (
                <button key={r.id} onClick={() => { setRetoActivo(r); setVista("detalle"); }} style={{ textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
                  <Card style={{ borderLeft: `4px solid ${cc.color}`, transition: "box-shadow 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                          {r.completado && <span>🏆</span>}
                          <p style={{ fontSize: "0.88rem", fontWeight: 500, color: DARK }}>{r.nombre}</p>
                        </div>
                        <span style={{ fontSize: "0.6rem", padding: "0.15rem 0.45rem", borderRadius: "20px", backgroundColor: `${cc.color}18`, color: cc.color }}>{cc.label}</span>
                      </div>
                      <p style={{ fontSize: "1rem", fontWeight: 700, color: cc.color }}>{pct}%</p>
                    </div>
                    <div style={{ height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, backgroundColor: cc.color, borderRadius: 3 }} />
                    </div>
                    <p style={{ fontSize: "0.65rem", color: MID, marginTop: "0.4rem" }}>
                      Hasta {new Date(r.fechaLimite + "T00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                    </p>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Retos sugeridos por Veysic</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {predefinidos.map(rp => {
            const cc = catConfig(rp.categoria);
            const yaAdoptado = retos.some(r => r.predefinidoId === rp.id && !r.completado);
            return (
              <Card key={rp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: 500, color: DARK, marginBottom: "0.2rem" }}>{rp.nombre}</p>
                    <p style={{ fontSize: "0.7rem", color: MID, marginBottom: "0.35rem" }}>{rp.descripcion}</p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.58rem", padding: "0.15rem 0.45rem", borderRadius: "20px", backgroundColor: `${cc.color}18`, color: cc.color }}>{cc.label}</span>
                      <span style={{ fontSize: "0.58rem", color: MID }}>{rp.duracionDias} días</span>
                    </div>
                  </div>
                  <button onClick={() => !yaAdoptado && adoptarPredefinido(rp)} disabled={yaAdoptado} style={{ padding: "0.4rem 0.85rem", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", border: `1px solid ${yaAdoptado ? "rgba(61,61,61,0.15)" : "#8B1A2F"}`, borderRadius: "4px", backgroundColor: yaAdoptado ? "transparent" : "#8B1A2F", color: yaAdoptado ? MID : "#FFFFFF", cursor: yaAdoptado ? "default" : "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {yaAdoptado ? "En curso" : "Adoptar"}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SeccionMensajes() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const proId = user?.profesionalAsignadoId || "pro-1";
  const pro = getUserById(proId);

  useEffect(() => {
    if (!user) return;
    setMsgs(mensajesStore.getConversacion(user.id, proId));
    mensajesStore.marcarLeidos(user.id, proId);
  }, [user, proId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  if (!user) return null;

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    mensajesStore.send({
      de: user!.id,
      para: proId,
      texto: texto.trim(),
      fecha: new Date().toISOString(),
    });
    setMsgs(mensajesStore.getConversacion(user!.id, proId));
    setTexto("");
  }

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>
        Mensajes
      </h2>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* Header chat */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(61,61,61,0.08)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(61,61,61,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={16} color={MID} />
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: DARK }}>{pro?.nombre || "Profesional"}</p>
            <p style={{ fontSize: "0.65rem", color: MID }}>{pro?.especialidad || ""}</p>
          </div>
        </div>

        {/* Mensajes */}
        <div style={{ height: 360, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {msgs.map((m) => {
            const esMio = m.de === user.id;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: esMio ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "0.6rem 0.9rem",
                    borderRadius: esMio ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    backgroundColor: esMio ? "#8B1A2F" : LIGHT,
                    border: esMio ? "none" : "1px solid rgba(61,61,61,0.1)",
                  }}
                >
                  <p style={{ fontSize: "0.85rem", color: esMio ? "#FFFFFF" : DARK, lineHeight: 1.5 }}>{m.texto}</p>
                  <p style={{ fontSize: "0.6rem", color: esMio ? "rgba(255,255,255,0.6)" : MID, marginTop: "0.3rem", textAlign: "right" }}>
                    {new Date(m.fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form onSubmit={enviar} style={{ padding: "0.75rem 1rem", borderTop: "1px solid rgba(61,61,61,0.08)", display: "flex", gap: "0.75rem" }}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "0.875rem",
              color: DARK,
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            }}
          />
          <button
            type="submit"
            style={{ background: "none", border: "none", cursor: "pointer", color: DARK, padding: "0.25rem" }}
          >
            <Send size={18} />
          </button>
        </form>
      </Card>
    </div>
  );
}

// ── ASISTENTE IA ───────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Quiero un plan de entrenamiento personalizado",
  "Rutina de recuperación de rodilla",
  "Ejercicios de movilidad para espalda",
  "Rutina de cardio sin impacto",
  "¿Cuántas veces a la semana debo entrenar?",
  "Rutina de 20 minutos en casa",
];

type ChatMsg = { role: "user" | "assistant"; content: string };

type BocetoData = {
  nombre: string;
  diasSemana: number;
  duracionMin: number;
  objetivo: string;
  dias: { tipo: string; enfoque: string }[];
};

function parseBoceto(text: string): { cleaned: string; boceto: BocetoData | null } {
  const match = text.match(/```boceto\n([\s\S]*?)\n```/);
  if (!match) return { cleaned: text, boceto: null };
  try {
    const boceto = JSON.parse(match[1]) as BocetoData;
    const cleaned = text.replace(/```boceto\n[\s\S]*?\n```/, "").trim();
    return { cleaned, boceto };
  } catch {
    return { cleaned: text, boceto: null };
  }
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("### ")) {
      nodes.push(<p key={i} style={{ fontSize: "0.82rem", fontWeight: 700, color: DARK, margin: "0.85rem 0 0.35rem" }}>{line.slice(4)}</p>);
    } else if (line.startsWith("## ")) {
      nodes.push(<p key={i} style={{ fontSize: "0.95rem", fontWeight: 700, color: DARK, margin: "1rem 0 0.4rem" }}>{line.slice(3)}</p>);
    } else if (line.startsWith("- ")) {
      const inner = line.slice(2).replace(/\*\*(.+?)\*\*/g, "**$1**");
      nodes.push(
        <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", margin: "0.2rem 0" }}>
          <span style={{ color: DARK, flexShrink: 0, marginTop: "0.1rem", fontSize: "0.7rem" }}>•</span>
          <span style={{ fontSize: "0.8rem", color: DARK, lineHeight: 1.6 }}>{inlineFormat(line.slice(2))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={i} style={{ height: "0.4rem" }} />);
    } else {
      nodes.push(<p key={i} style={{ fontSize: "0.8rem", color: DARK, lineHeight: 1.6, margin: "0.15rem 0" }}>{inlineFormat(line)}</p>);
    }
    i++;
  }
  return nodes;
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

// ── SECCIÓN: CALENDARIO DE ENTRENAMIENTO ─────────────────────────────────────
function SeccionCalendario() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanCalendario | null>(null);
  const [sesiones, setSesiones] = useState<SesionCalendario[]>([]);
  const [mes, setMes] = useState(new Date().getMonth());
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [sesionDia, setSesionDia] = useState<SesionCalendario | null>(null);
  const [ejercicios, setEjercicios] = useState<string>("");
  const [loadingEj, setLoadingEj] = useState(false);
  const abortEjRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) return;
    const p = planCalendarioStore.getActivo(user.id) ?? null;
    setPlan(p);
    if (p) setSesiones(sesionesCalendarioStore.getByPlan(p.id));
  }, [user]);

  const hoy = new Date().toISOString().split("T")[0];

  function seleccionarDia(ds: string) {
    const sesion = sesiones.find((s) => s.fecha === ds) ?? null;
    setDiaSeleccionado(ds);
    setSesionDia(sesion);
    setEjercicios(sesion?.rutina ?? "");
  }

  function marcarEstado(estado: "completado" | "fallado") {
    if (!sesionDia) return;
    sesionesCalendarioStore.update(sesionDia.id, { estado });
    const updated = { ...sesionDia, estado };
    setSesionDia(updated);
    setSesiones(sesiones.map((s) => (s.id === sesionDia.id ? updated : s)));
  }

  async function generarEjercicios() {
    if (!plan || !sesionDia) return;
    setLoadingEj(true);
    setEjercicios("");
    const ctrl = new AbortController();
    abortEjRef.current = ctrl;

    const prompt = `Genera los ejercicios completos para el Día ${sesionDia.tipoDia} del plan "${plan.nombre}". Enfoque: ${sesionDia.enfoque}. Objetivo del plan: ${plan.objetivo}. Duración de la sesión: ${plan.duracionMin} minutos.`;

    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) { setLoadingEj(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setEjercicios(acc);
      }
      sesionesCalendarioStore.update(sesionDia.id, { rutina: acc });
      setSesionDia((prev) => (prev ? { ...prev, rutina: acc } : prev));
    } catch (err) {
      if ((err as Error).name !== "AbortError") setEjercicios("⚠️ Error al generar ejercicios.");
    } finally {
      setLoadingEj(false);
    }
  }

  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offset = (primerDia + 6) % 7; // Mon-first
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function fmtFecha(d: number) {
    return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const ESTADO_COLOR: Record<string, string> = {
    programado: "#4A6FA5",
    completado: "#8B1A2F",
    fallado: "#C0574A",
  };

  if (!plan) {
    return (
      <div>
        <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Mi calendario de entrenamiento</h2>
        <Card style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📅</p>
          <p style={{ fontSize: "0.9rem", fontWeight: 500, color: DARK, marginBottom: "0.5rem" }}>Aún no tienes un plan activo</p>
          <p style={{ fontSize: "0.78rem", color: MID, marginBottom: "1.5rem", lineHeight: 1.7, maxWidth: 320, margin: "0 auto 1.5rem" }}>
            Habla con Vic, tu asistente IA, para que te cree un plan personalizado. Cuando lo aceptes, lo verás aquí.
          </p>
          <button
            onClick={() => document.querySelector<HTMLButtonElement>("[data-seccion='asistente']")?.click()}
            style={{ padding: "0.65rem 1.5rem", backgroundColor: "#8B1A2F", color: "#FFFFFF", border: "none", borderRadius: "4px", fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          >
            Hablar con Vic
          </button>
        </Card>
      </div>
    );
  }

  const esFuturo = diaSeleccionado ? diaSeleccionado > hoy : false;
  const esHoyOPasado = diaSeleccionado ? diaSeleccionado <= hoy : false;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 className="font-serif" style={{ fontSize: "1.4rem", fontWeight: 400, color: DARK, marginBottom: "0.15rem" }}>{plan.nombre}</h2>
          <p style={{ fontSize: "0.72rem", color: MID }}>{plan.objetivo} · {plan.diasSemana} días/semana · {plan.duracionMin} min/sesión</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {(["programado", "completado", "fallado"] as const).map((e) => (
            <div key={e} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: ESTADO_COLOR[e] }} />
              <span style={{ fontSize: "0.58rem", color: MID, textTransform: "capitalize" }}>{e}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tipos de sesión */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {plan.dias.map((d) => (
          <span key={d.tipo} style={{ fontSize: "0.65rem", padding: "0.25rem 0.65rem", borderRadius: "20px", backgroundColor: "rgba(61,61,61,0.07)", color: DARK }}>
            <strong>Día {d.tipo}:</strong> {d.enfoque}
          </span>
        ))}
      </div>

      {/* Calendario */}
      <Card style={{ marginBottom: diaSeleccionado ? "0.75rem" : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <button onClick={() => { const d = new Date(anio, mes - 1); setMes(d.getMonth()); setAnio(d.getFullYear()); }} style={{ background: "none", border: "none", cursor: "pointer", color: DARK, fontSize: "1.1rem", padding: "0.2rem 0.5rem" }}>‹</button>
          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: DARK }}>{MESES[mes]} {anio}</p>
          <button onClick={() => { const d = new Date(anio, mes + 1); setMes(d.getMonth()); setAnio(d.getFullYear()); }} style={{ background: "none", border: "none", cursor: "pointer", color: DARK, fontSize: "1.1rem", padding: "0.2rem 0.5rem" }}>›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "6px" }}>
          {CAL_DIAS.map((d) => <p key={d} style={{ textAlign: "center", fontSize: "0.58rem", color: MID, fontWeight: 600, margin: 0 }}>{d}</p>)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const ds = fmtFecha(day);
            const sesion = sesiones.find((s) => s.fecha === ds);
            const esHoyCell = ds === hoy;
            const isSelected = diaSeleccionado === ds;
            const col = sesion ? ESTADO_COLOR[sesion.estado] : null;

            return (
              <button key={i} onClick={() => sesion ? seleccionarDia(ds) : undefined}
                style={{
                  aspectRatio: "1", borderRadius: "6px", padding: 0,
                  border: isSelected ? `2px solid #8B1A2F` : esHoyCell ? `1px solid rgba(255,255,255,0.4)` : "1px solid transparent",
                  backgroundColor: col ? `${col}18` : "transparent",
                  cursor: sesion ? "pointer" : "default",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1px",
                }}>
                <span style={{ fontSize: "0.7rem", fontWeight: esHoyCell ? 700 : 400, color: DARK, lineHeight: 1 }}>{day}</span>
                {sesion && <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: col! }} />}
                {sesion && <span style={{ fontSize: "0.44rem", color: col!, fontWeight: 700 }}>{sesion.tipoDia}</span>}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Panel de día */}
      {diaSeleccionado && sesionDia && (
        <Card style={{ borderTop: `3px solid ${ESTADO_COLOR[sesionDia.estado]}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.6rem", color: MID, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>
                {new Date(diaSeleccionado + "T12:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: DARK }}>Día {sesionDia.tipoDia} — {sesionDia.enfoque}</p>
              <p style={{ fontSize: "0.7rem", color: MID, marginTop: "0.1rem" }}>
                {plan.duracionMin} min · {sesionDia.estado === "programado" ? "Pendiente" : sesionDia.estado === "completado" ? "✅ Completado" : "❌ Fallado"}
              </p>
            </div>
            <button onClick={() => { setDiaSeleccionado(null); setSesionDia(null); setEjercicios(""); abortEjRef.current?.abort(); }} style={{ background: "none", border: "none", cursor: "pointer", color: MID, fontSize: "1.2rem", lineHeight: 1, padding: "0.25rem" }}>×</button>
          </div>

          {/* Botones hoy/pasado */}
          {esHoyOPasado && sesionDia.estado === "programado" && (
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <button onClick={() => marcarEstado("completado")} style={{ flex: 1, padding: "0.6rem", border: "none", borderRadius: "6px", backgroundColor: "#8B1A2F", color: "#fff", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                ✅ Lo he cumplido
              </button>
              <button onClick={() => marcarEstado("fallado")} style={{ flex: 1, padding: "0.6rem", border: "1px solid rgba(192,87,74,0.3)", borderRadius: "6px", backgroundColor: "transparent", color: "#C0574A", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                ❌ No pude
              </button>
            </div>
          )}

          {/* Ejercicios */}
          {ejercicios ? (
            <div>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Ejercicios del día</p>
              <div>{renderMarkdown(ejercicios)}</div>
            </div>
          ) : (
            <button onClick={generarEjercicios} disabled={loadingEj} style={{
              width: "100%", padding: "0.7rem", border: `1px solid #8B1A2F`, borderRadius: "6px",
              backgroundColor: loadingEj ? "transparent" : "#8B1A2F", color: loadingEj ? DARK : "#FFFFFF",
              fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: loadingEj ? "default" : "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}>
              {loadingEj ? (
                <><div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid #8B1A2F`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} /> Generando ejercicios...</>
              ) : (
                "✨ Ver ejercicios del día"
              )}
            </button>
          )}
        </Card>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SeccionAsistente() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "¡Buenas! Soy Vic, tu asistente de entrenamiento en Veysic 💪\n\nPuedo diseñarte un plan personalizado, resolver dudas sobre ejercicios o ayudarte con la recuperación. ¿Por dónde empezamos?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);
  const [acceptedBoceto, setAcceptedBoceto] = useState<BocetoData | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    const userText = text.trim();
    if (!userText || loading) return;

    const newHistory: ChatMsg[] = [...messages, { role: "user", content: userText }];
    setMessages([...newHistory, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const ctrl = new AbortController();
    setAbortCtrl(ctrl);

    try {
      const apiMessages = newHistory.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: `⚠️ ${errText || "Error al conectar con el asistente."}` }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: snap }]);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: "⚠️ Error de conexión. Inténtalo de nuevo." }]);
      }
    } finally {
      setLoading(false);
      setAbortCtrl(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function stopGeneration() {
    abortCtrl?.abort();
    setLoading(false);
  }

  function resetChat() {
    abortCtrl?.abort();
    setMessages([{ role: "assistant", content: "¡Buenas! Soy Vic, tu asistente de entrenamiento en Veysic 💪\n\nPuedo diseñarte un plan personalizado, resolver dudas sobre ejercicios o ayudarte con la recuperación. ¿Por dónde empezamos?" }]);
    setInput("");
    setLoading(false);
    setAcceptedBoceto(null);
  }

  function handleAceptarPlan(boceto: BocetoData) {
    if (!user) return;
    // Desactivar planes anteriores
    planCalendarioStore.getByCliente(user.id)
      .filter((p) => p.activo)
      .forEach((p) => planCalendarioStore.update(p.id, { activo: false }));
    // Crear nuevo plan
    const plan = planCalendarioStore.add({
      clienteId: user.id,
      nombre: boceto.nombre,
      objetivo: boceto.objetivo,
      diasSemana: boceto.diasSemana,
      duracionMin: boceto.duracionMin,
      dias: boceto.dias,
      creadoEn: new Date().toISOString(),
      activo: true,
    });
    generarSesionesCalendario(plan);
    setAcceptedBoceto(boceto);
    // Navegar al calendario
    setTimeout(() => document.querySelector<HTMLButtonElement>("[data-seccion='calendario']")?.click(), 300);
  }

  const showSuggestions = messages.length === 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Cabecera */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexShrink: 0, backgroundColor: "#8B1A2F", borderRadius: "8px", padding: "0.85rem 1.1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          {/* Avatar IA */}
          <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#3D3D3D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={20} color="#FFFFFF" />
          </div>
          <div>
            <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#FFFFFF", lineHeight: 1.2 }}>Vic · Asistente Veysic</p>
            <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em" }}>Tu entrenador personal con IA</p>
          </div>
        </div>
        <button onClick={resetChat} title="Nueva conversación" style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "none", border: "1px solid rgba(61,61,61,0.35)", borderRadius: "4px", cursor: "pointer", padding: "0.4rem 0.7rem", color: "#FFFFFF", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
          <RotateCcw size={11} /> Nueva
        </button>
      </div>

      {/* Zona de chat */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "0.5rem", paddingRight: "0.25rem" }}>

        {/* Suggestions */}
        {showSuggestions && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)} style={{
                padding: "0.45rem 0.85rem", fontSize: "0.7rem", borderRadius: "20px",
                border: "1px solid #3D3D3D", backgroundColor: LIGHT, color: DARK,
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                fontFamily: "var(--font-inter), system-ui, sans-serif", lineHeight: 1.4,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#8B1A2F"; e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.borderColor = "#8B1A2F"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = LIGHT; e.currentTarget.style.color = DARK; e.currentTarget.style.borderColor = "#3D3D3D"; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Mensajes */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const isStreaming = !isUser && loading && idx === messages.length - 1;
          const isLastAssistant = !isUser && idx === messages.length - 1;
          const { cleaned, boceto } = (!isUser && !isStreaming) ? parseBoceto(msg.content) : { cleaned: msg.content, boceto: null };

          return (
            <div key={idx}>
              <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start", gap: "0.6rem" }}>
                {/* Avatar asistente */}
                {!isUser && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#8B1A2F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.15rem" }}>
                    <Sparkles size={13} color={"#FFFFFF"} />
                  </div>
                )}

                {/* Burbuja */}
                <div style={{
                  maxWidth: "78%", padding: "0.85rem 1rem",
                  borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                  backgroundColor: isUser ? "#8B1A2F" : LIGHT,
                  border: isUser ? "none" : "1px solid #3D3D3D",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  {isUser ? (
                    <p style={{ fontSize: "0.82rem", color: "#FFFFFF", lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
                  ) : msg.content === "" && isStreaming ? (
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "0.2rem 0" }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: MID, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  ) : (
                    <div>{renderMarkdown(cleaned)}</div>
                  )}
                  {isStreaming && msg.content !== "" && (
                    <div style={{ width: 8, height: 16, display: "inline-block", marginLeft: 2, borderRight: `2px solid ${DARK}`, animation: "blink 0.8s step-end infinite", verticalAlign: "text-bottom" }} />
                  )}
                </div>
              </div>

              {/* Boceto card */}
              {boceto && isLastAssistant && !acceptedBoceto && (
                <div style={{ marginLeft: 42, marginTop: "0.75rem", backgroundColor: "#8B1A2F", borderRadius: "8px", padding: "1.25rem 1.5rem", maxWidth: "calc(78% + 42px)" }}>
                  <p style={{ fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>Tu plan</p>
                  <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "1rem" }}>{boceto.nombre}</p>
                  <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    {[
                      { emoji: "📅", val: `${boceto.diasSemana} días/semana` },
                      { emoji: "⏱️", val: `${boceto.duracionMin} min/sesión` },
                      { emoji: "🎯", val: boceto.objetivo },
                    ].map(({ emoji, val }) => (
                      <div key={val} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.85rem" }}>{emoji}</span>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)" }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: "1.25rem" }}>
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>Lo que trabajaremos</p>
                    {boceto.dias.map((d) => (
                      <div key={d.tipo} style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, minWidth: 40, backgroundColor: "rgba(255,255,255,0.12)", padding: "0.15rem 0.4rem", borderRadius: "3px", color: "#FFFFFF", textAlign: "center" }}>Día {d.tipo}</span>
                        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)" }}>{d.enfoque}</span>
                      </div>
                    ))}
                    <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: "0.6rem", fontStyle: "italic" }}>Los ejercicios detallados los encontrarás en tu calendario.</p>
                  </div>
                  <button onClick={() => handleAceptarPlan(boceto)} style={{
                    width: "100%", padding: "0.75rem", backgroundColor: BG, color: DARK,
                    border: "none", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                  }}>
                    ✅ Aceptar este plan y ver mi calendario
                  </button>
                </div>
              )}

              {/* Confirmación de plan aceptado */}
              {boceto && isLastAssistant && acceptedBoceto && (
                <div style={{ marginLeft: 42, marginTop: "0.75rem", padding: "0.75rem 1rem", backgroundColor: "rgba(139,26,47,0.1)", borderRadius: "6px", border: "1px solid rgba(139,26,47,0.25)", maxWidth: "78%" }}>
                  <p style={{ fontSize: "0.78rem", color: "#8B1A2F", fontWeight: 500 }}>✅ Plan guardado — abriendo tu calendario...</p>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, paddingTop: "0.75rem", borderTop: "1px solid rgba(61,61,61,0.1)" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu consulta… (Enter para enviar, Shift+Enter para nueva línea)"
            rows={1}
            style={{
              flex: 1, resize: "none", background: LIGHT, border: "1px solid #3D3D3D",
              borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.82rem", color: DARK,
              outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif",
              lineHeight: 1.5, overflowY: "hidden", transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#8B1A2F")}
            onBlur={(e) => (e.target.style.borderColor = "#3D3D3D")}
            disabled={loading}
          />
          {loading ? (
            <button type="button" onClick={stopGeneration} title="Detener" style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: "8px", border: "1px solid rgba(192,87,74,0.3)",
              backgroundColor: "rgba(192,87,74,0.08)", color: "#C0574A", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <StopCircle size={16} />
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: "8px", border: "none",
              backgroundColor: input.trim() ? "#8B1A2F" : "rgba(255,255,255,0.15)", color: input.trim() ? "#FFFFFF" : MID,
              cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background-color 0.15s",
            }}>
              <Send size={16} />
            </button>
          )}
        </form>
        <p style={{ fontSize: "0.58rem", color: MID, marginTop: "0.4rem", textAlign: "center", letterSpacing: "0.05em" }}>
          Powered by Claude · Las rutinas no reemplazan el consejo médico profesional
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── LAYOUT PRINCIPAL ───────────────────────────────────────────────────────
export default function PerfilPage() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>("perfil");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const all = mensajesStore.getAll();
    setUnreadMsgs(all.filter((m: Mensaje) => m.para === user.id && !m.leido).length);
    const interval = setInterval(() => {
      const all2 = mensajesStore.getAll();
      setUnreadMsgs(all2.filter((m: Mensaje) => m.para === user.id && !m.leido).length);
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading || !user) return null;

  if (user.role === "profesional") {
    router.push("/profesional");
    return null;
  }
  if (user.role === "admin") {
    router.push("/admin");
    return null;
  }

  function handleLogout() {
    logout();
    setUser(null);
    router.push("/");
  }

  const secciones: Record<Seccion, React.ReactNode> = {
    perfil: <SeccionPerfil />,
    reservas: <SeccionReservas />,
    plan: <SeccionPlan />,
    calendario: <SeccionCalendario />,
    evolucion: <SeccionEvolucion />,
    documentos: <SeccionDocumentos />,
    pagos: <SeccionPagos />,
    mensajes: <SeccionMensajes />,
    listaespera: <SeccionListaEspera />,
    retos: <SeccionRetos />,
    asistente: <SeccionAsistente />,
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(61,61,61,0.1)",
          padding: "0 1.5rem",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: DARK, padding: "0.25rem" }}
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="font-serif uppercase" style={{ letterSpacing: "0.28em", fontSize: "1rem", color: DARK, textDecoration: "none" }}>
            Veysic
          </Link>
          <ChevronRight size={14} color={MID} />
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID }}>
            Área personal
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span className="hidden md:block" style={{ fontSize: "0.8rem", color: MID }}>{user.nombre}</span>
          <button
            onClick={handleLogout}
            style={{ background: "none", border: "none", cursor: "pointer", color: MID, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem" }}
            title="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar overlay mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 30 }}
          />
        )}

        {/* Sidebar */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            backgroundColor: LIGHT,
            borderRight: "1px solid rgba(61,61,61,0.1)",
            padding: "1.5rem 0",
            position: "fixed" as const,
            top: 60,
            bottom: 0,
            left: sidebarOpen ? 0 : undefined,
            transform: sidebarOpen ? "translateX(0)" : undefined,
            zIndex: sidebarOpen ? 35 : undefined,
            display: "flex",
            flexDirection: "column" as const,
          }}
          className="hidden md:flex"
        >
          {/* Usuario */}
          <div style={{ padding: "0 1.5rem 1.5rem", borderBottom: "1px solid rgba(61,61,61,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", backgroundColor: "rgba(61,61,61,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {user.foto ? (
                  <img src={user.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <User size={18} color={MID} />
                )}
              </div>
              <div>
                <p style={{ fontSize: "0.8rem", fontWeight: 500, color: DARK }}>{user.nombre.split(" ")[0]}</p>
                <p style={{ fontSize: "0.65rem", color: MID }}>Cliente</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
            {SECCIONES.map(({ id, label, Icon }) => (
              <button
                key={id}
                data-seccion={id}
                onClick={() => { setSeccion(id); setSidebarOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.7rem 1.5rem",
                  background: "none",
                  border: "none",
                  borderLeft: `3px solid ${seccion === id ? "#8B1A2F" : "transparent"}`,
                  backgroundColor: seccion === id ? "rgba(139,26,47,0.08)" : "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "0.8rem",
                  color: seccion === id ? "#8B1A2F" : MID,
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={id === "asistente" ? 15 : 16} style={id === "asistente" ? { color: "#7A5C8E" } : undefined} />
                {label}
                {id === "asistente" && (
                  <span style={{ marginLeft: "auto", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", backgroundColor: "#7A5C8E", color: "#fff", padding: "0.15rem 0.4rem", borderRadius: "3px", fontWeight: 700 }}>IA</span>
                )}
                {id === "mensajes" && unreadMsgs > 0 && (
                  <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: "50%", backgroundColor: "#C0574A", color: "#fff", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                    {unreadMsgs > 9 ? "9+" : unreadMsgs}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <aside
            style={{
              position: "fixed",
              top: 60,
              left: 0,
              bottom: 0,
              width: 240,
              backgroundColor: LIGHT,
              borderRight: "1px solid rgba(61,61,61,0.1)",
              zIndex: 35,
              display: "flex",
              flexDirection: "column",
              padding: "1.5rem 0",
            }}
          >
            <nav style={{ flex: 1 }}>
              {SECCIONES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => { setSeccion(id); setSidebarOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    width: "100%",
                    padding: "0.7rem 1.5rem",
                    background: "none",
                    border: "none",
                    borderLeft: `3px solid ${seccion === id ? "#8B1A2F" : "transparent"}`,
                    backgroundColor: seccion === id ? "rgba(139,26,47,0.08)" : "transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: "0.8rem",
                    color: seccion === id ? "#8B1A2F" : MID,
                    textAlign: "left",
                  }}
                >
                  <Icon size={16} />
                  {label}
                  {id === "mensajes" && unreadMsgs > 0 && (
                    <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: "50%", backgroundColor: "#C0574A", color: "#fff", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                      {unreadMsgs > 9 ? "9+" : unreadMsgs}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Content */}
        <main style={{ flex: 1, marginLeft: 0, padding: "2rem 1.5rem" }} className="md:ml-[240px]">
          <div style={{ maxWidth: 760, margin: "0 auto" }}>{secciones[seccion]}</div>
        </main>
      </div>
    </div>
  );
}

function Menu({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
