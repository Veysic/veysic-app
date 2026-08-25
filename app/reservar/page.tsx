"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, CheckCircle, X, Users, Clock, MapPin, Calendar,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import {
  citasStore, bloqueosStore, salasStore, listaEsperaStore, DURACION_SERVICIOS,
} from "../lib/store";
import type { Cita, Bloqueo, Sala } from "../lib/store";
import { getUsers } from "../lib/auth";
import type { User } from "../lib/auth";

// ── Tokens de color ──────────────────────────────────────────────────────────
const BG = "#2C2C2C";
const DARK = "#FFFFFF";
const MID = "#A0A0A0";
const LIGHT = "#3D3D3D";
const C_DISP = "#8B1A2F";
const C_CASI = "#C08A2E";
const C_COMP = "#C0574A";
const C_TUYA = "#4A6FA5";
const C_GREY = "#A8A296";

// ── Tipos ────────────────────────────────────────────────────────────────────
type CatId = "entrenamiento" | "fisioterapia" | "podologia";
type ServicioId = "entind" | "entduo" | "entgru" | "fisioe" | "fisioa" | "podo";
type SlotEstado = "disponible" | "casi_lleno" | "completo" | "tuya" | "pasado";

interface ServicioConfig {
  id: ServicioId;
  label: string;
  labelCompleto: string;
  duracion: number;
  precio: string;
  capacidad: number;
  proType: "fisio" | "entrenador";
  descripcion: string;
}

interface SlotInfo {
  hora: string;
  horaFin: string;
  estado: SlotEstado;
  plazasOcupadas: number;
  plazasTotales: number;
  proId: string;
  proNombre: string;
}

// ── Configuración de servicios ────────────────────────────────────────────────
const SERVICIOS: Record<ServicioId, ServicioConfig> = {
  entind: { id: "entind", label: "Individual", labelCompleto: "Entrenamiento Individual", duracion: 60, precio: "45 €/sesión", capacidad: 1, proType: "entrenador", descripcion: "Sesión personalizada 1 a 1" },
  entduo: { id: "entduo", label: "Dúo", labelCompleto: "Entrenamiento Dúo", duracion: 60, precio: "22,50 €/pers.", capacidad: 2, proType: "entrenador", descripcion: "Entrena con un compañero" },
  entgru: { id: "entgru", label: "Grupo", labelCompleto: "Entrenamiento Grupo", duracion: 60, precio: "15 €/pers.", capacidad: 6, proType: "entrenador", descripcion: "Grupos reducidos, máx. 6 personas" },
  fisioe: { id: "fisioe", label: "Esencial", labelCompleto: "Fisioterapia Esencial", duracion: 45, precio: "50 €/sesión", capacidad: 1, proType: "fisio", descripcion: "Evaluación y tratamiento" },
  fisioa: { id: "fisioa", label: "Avanzada", labelCompleto: "Fisioterapia Avanzada", duracion: 75, precio: "65 €/sesión", capacidad: 1, proType: "fisio", descripcion: "Técnicas avanzadas y ecografía" },
  podo:   { id: "podo",   label: "Podología",  labelCompleto: "Podología",              duracion: 60, precio: "Consultar",    capacidad: 1, proType: "fisio",       descripcion: "Estudio biomecánico y tratamiento" },
};

const CATEGORIAS: { id: CatId; label: string; emoji: string; servicios: ServicioId[] }[] = [
  { id: "entrenamiento", label: "Entrenamiento", emoji: "💪", servicios: ["entind", "entduo", "entgru"] },
  { id: "fisioterapia",  label: "Fisioterapia",  emoji: "🦴", servicios: ["fisioe", "fisioa"] },
  { id: "podologia",     label: "Podología",     emoji: "🦶", servicios: ["podo"] },
];

const CAT_DEFAULT_SERVICIO: Record<CatId, ServicioId> = {
  entrenamiento: "entgru",
  fisioterapia: "fisioe",
  podologia: "podo",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const HORA_INI = 5 * 60 + 30;
const HORA_FIN = 21 * 60;
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const DIAS_LARGOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function toMin(t: string): number { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function toHHMM(n: number): string { return `${Math.floor(n / 60).toString().padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`; }
function addDays(ds: string, n: number): string { const d = new Date(ds + "T00:00"); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }
function mondayOf(ds: string): string { const d = new Date(ds + "T00:00"); const dow = d.getDay(); d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1)); return d.toISOString().split("T")[0]; }
function isWeekend(ds: string): boolean { const dow = new Date(ds + "T00:00").getDay(); return dow === 0 || dow === 6; }
function fmtFecha(ds: string, opts?: Intl.DateTimeFormatOptions): string { return new Date(ds + "T00:00").toLocaleDateString("es-ES", opts || { weekday: "long", day: "numeric", month: "long" }); }
function fmtFechaCorta(ds: string): string { const d = new Date(ds + "T00:00"); return `${d.getDate()} ${MESES_ES[d.getMonth()]}`; }
function slotsDelDia(dur: number): string[] { const s: string[] = []; let c = HORA_INI; while (c + dur <= HORA_FIN) { s.push(toHHMM(c)); c += dur; } return s; }

function slotLibrePro(slot: string, dur: number, fecha: string, proId: string, citas: Cita[], bloqueos: Bloqueo[]): boolean {
  const ini = toMin(slot), fin = ini + dur;
  for (const c of citas) {
    if (c.fecha !== fecha || c.profesionalId !== proId || c.estado === "cancelada") continue;
    const ci = toMin(c.hora), cf = ci + (DURACION_SERVICIOS[c.servicio] ?? 60);
    if (ini < cf && fin > ci) return false;
  }
  for (const b of bloqueos) {
    if (b.fecha !== fecha || b.profesionalId !== proId) continue;
    const bi = toMin(b.horaInicio), bf = toMin(b.horaFin);
    if (ini < bf && fin > bi) return false;
  }
  return true;
}

function estadoColor(estado: SlotEstado): string {
  return { disponible: C_DISP, casi_lleno: C_CASI, completo: C_COMP, tuya: C_TUYA, pasado: C_GREY }[estado];
}
function estadoLabel(estado: SlotEstado, plazasLibres: number): string {
  if (estado === "disponible") return "Disponible";
  if (estado === "casi_lleno") return plazasLibres === 1 ? "¡Última plaza!" : `Quedan ${plazasLibres}`;
  if (estado === "completo") return "Completo";
  if (estado === "tuya") return "Ya reservado";
  return "No disponible";
}

function computeSlots(
  serv: ServicioConfig, fecha: string,
  citas: Cita[], bloqueos: Bloqueo[],
  profesionales: User[], userId: string | null
): SlotInfo[] {
  const hoyStr = new Date().toISOString().split("T")[0];
  const ahoraMins = new Date().getHours() * 60 + new Date().getMinutes();
  const tiposPros = profesionales.filter((p) => p.profesionalType === serv.proType && p.estado === "activo");
  const result: SlotInfo[] = [];

  for (const slot of slotsDelDia(serv.duracion)) {
    const slotMin = toMin(slot);
    const horaFin = toHHMM(slotMin + serv.duracion);

    if (fecha === hoyStr && slotMin <= ahoraMins + 15) {
      result.push({ hora: slot, horaFin, estado: "pasado", plazasOcupadas: 0, plazasTotales: serv.capacidad, proId: "", proNombre: "" });
      continue;
    }

    if (serv.capacidad > 1) {
      // Clase grupal: múltiples clientes en el mismo slot con el mismo profesional
      const existentes = citas.filter((c) =>
        c.fecha === fecha && c.hora === slot && c.servicio === serv.labelCompleto && c.estado !== "cancelada"
      );
      let proId = existentes[0]?.profesionalId || "";
      let proNombre = "";
      if (!proId) {
        const libre = tiposPros.find((p) => slotLibrePro(slot, serv.duracion, fecha, p.id, citas, bloqueos));
        if (libre) { proId = libre.id; proNombre = libre.nombre; }
      } else {
        proNombre = tiposPros.find((p) => p.id === proId)?.nombre || "";
      }
      if (!proId) {
        result.push({ hora: slot, horaFin, estado: "completo", plazasOcupadas: serv.capacidad, plazasTotales: serv.capacidad, proId: "", proNombre: "" });
        continue;
      }
      const ocupadas = existentes.filter((c) => c.profesionalId === proId).length;
      const esTuya = !!userId && existentes.some((c) => c.clienteId === userId);
      const libres = serv.capacidad - ocupadas;
      const estado: SlotEstado = esTuya ? "tuya" : ocupadas >= serv.capacidad ? "completo" : libres <= 2 ? "casi_lleno" : "disponible";
      result.push({ hora: slot, horaFin, estado, plazasOcupadas: ocupadas, plazasTotales: serv.capacidad, proId, proNombre });
    } else {
      const tuyaCita = userId ? citas.find((c) => c.fecha === fecha && c.hora === slot && c.servicio === serv.labelCompleto && c.clienteId === userId && c.estado !== "cancelada") : null;
      if (tuyaCita) {
        const proNombre = tiposPros.find((p) => p.id === tuyaCita.profesionalId)?.nombre || "";
        result.push({ hora: slot, horaFin, estado: "tuya", plazasOcupadas: 1, plazasTotales: 1, proId: tuyaCita.profesionalId, proNombre });
        continue;
      }
      const libres = tiposPros.filter((p) => slotLibrePro(slot, serv.duracion, fecha, p.id, citas, bloqueos));
      if (!libres.length) {
        result.push({ hora: slot, horaFin, estado: "completo", plazasOcupadas: 1, plazasTotales: 1, proId: "", proNombre: "" });
      } else {
        const mejor = libres.reduce((a, b) => {
          const na = citas.filter((c) => c.profesionalId === a.id && c.fecha === fecha && c.estado !== "cancelada").length;
          const nb = citas.filter((c) => c.profesionalId === b.id && c.fecha === fecha && c.estado !== "cancelada").length;
          return na <= nb ? a : b;
        });
        result.push({ hora: slot, horaFin, estado: "disponible", plazasOcupadas: 0, plazasTotales: 1, proId: mejor.id, proNombre: mejor.nombre });
      }
    }
  }
  return result;
}

// ── Componente: Tarjeta de slot (vista día) ───────────────────────────────────
function SlotCard({
  slot, serv, onReservar, onListaEspera, listaEsperaOk,
}: {
  slot: SlotInfo;
  serv: ServicioConfig;
  onReservar: (s: SlotInfo) => void;
  onListaEspera: (s: SlotInfo) => void;
  listaEsperaOk: boolean;
}) {
  const color = estadoColor(slot.estado);
  const libres = slot.plazasTotales - slot.plazasOcupadas;
  const esGrupal = serv.capacidad > 1;
  const pct = esGrupal ? (slot.plazasOcupadas / slot.plazasTotales) * 100 : 0;

  if (slot.estado === "pasado") return null;

  return (
    <div style={{
      display: "flex", alignItems: "stretch", backgroundColor: LIGHT, border: `1px solid ${color}33`,
      borderLeft: `4px solid ${color}`, borderRadius: "6px", overflow: "hidden",
      transition: "box-shadow 0.15s",
    }}>
      {/* Hora */}
      <div style={{ padding: "1rem 1.1rem", minWidth: 90, borderRight: "1px solid rgba(61,61,61,0.07)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: `${color}0a` }}>
        <p style={{ fontSize: "1rem", fontWeight: 700, color: DARK, lineHeight: 1, marginBottom: "0.25rem", fontVariantNumeric: "tabular-nums" }}>{slot.hora}</p>
        <p style={{ fontSize: "0.6rem", color: MID }}>{slot.horaFin}</p>
        <p style={{ fontSize: "0.55rem", color: MID, marginTop: "0.3rem" }}>{serv.duracion} min</p>
      </div>

      {/* Contenido central */}
      <div style={{ flex: 1, padding: "0.85rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {/* Estado badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
            {estadoLabel(slot.estado, libres)}
          </span>
        </div>

        {/* Profesional */}
        {slot.proNombre && (
          <p style={{ fontSize: "0.75rem", color: MID, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.65rem" }}>👤</span> {slot.proNombre}
          </p>
        )}

        {/* Plazas — solo para grupales */}
        {esGrupal && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "0.65rem", color: MID, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Users size={10} /> {slot.plazasOcupadas}/{slot.plazasTotales} plazas
              </span>
              {slot.estado !== "completo" && slot.estado !== "tuya" && (
                <span style={{ fontSize: "0.6rem", color: MID }}>{libres} libres</span>
              )}
            </div>
            <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 2, transition: "width 0.3s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Botón de acción */}
      <div style={{ padding: "0.85rem 1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {slot.estado === "tuya" ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle size={20} color={C_TUYA} />
            <p style={{ fontSize: "0.55rem", color: C_TUYA, marginTop: "0.25rem", fontWeight: 600 }}>Reservado</p>
          </div>
        ) : slot.estado === "completo" ? (
          listaEsperaOk ? (
            <div style={{ textAlign: "center" }}>
              <CheckCircle size={16} color={C_DISP} />
              <p style={{ fontSize: "0.55rem", color: C_DISP, marginTop: "0.2rem", fontWeight: 600 }}>En lista</p>
            </div>
          ) : (
            <button onClick={() => onListaEspera(slot)} style={{
              padding: "0.5rem 0.85rem", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase",
              border: `1px solid ${C_COMP}55`, borderRadius: "4px", backgroundColor: `${C_COMP}0d`,
              color: C_COMP, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif",
              whiteSpace: "nowrap",
            }}>
              Lista espera
            </button>
          )
        ) : (
          <button onClick={() => onReservar(slot)} style={{
            padding: "0.65rem 1.1rem", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
            border: "none", borderRadius: "4px", backgroundColor: "#8B1A2F",
            color: "#FFFFFF", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontWeight: 600, whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            Reservar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Componente: Modal de confirmación ─────────────────────────────────────────
function ModalConfirmar({
  slot, serv, fecha, salas, onConfirmar, onClose, confirmado,
}: {
  slot: SlotInfo; serv: ServicioConfig; fecha: string;
  salas: Sala[]; onConfirmar: () => void; onClose: () => void; confirmado: boolean;
}) {
  const salaAsignada = salas.find((s) => s.id);
  const fechaFmt = fmtFecha(fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}
      className="sm:items-center sm:p-4">
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: BG, width: "100%", maxWidth: 520,
        borderRadius: "12px 12px 0 0", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }} className="sm:rounded-xl">
        {confirmado ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: `${C_DISP}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <CheckCircle size={32} color={C_DISP} />
            </div>
            <p className="font-serif" style={{ fontSize: "1.4rem", fontWeight: 400, color: DARK, marginBottom: "0.5rem" }}>¡Reserva confirmada!</p>
            <p style={{ fontSize: "0.85rem", color: MID, lineHeight: 1.6 }}>
              Tu cita para {fechaFmt} a las {slot.hora} ha quedado registrada.
            </p>
            <Link href="/perfil" style={{ display: "inline-block", marginTop: "1.5rem", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: MID, textDecoration: "underline" }}>Ver mis reservas</Link>
          </div>
        ) : (
          <>
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(61,61,61,0.18)", margin: "0.75rem auto 0" }} />
            <div style={{ padding: "1.25rem 1.5rem 0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p className="font-serif" style={{ fontSize: "1.1rem", fontWeight: 400, color: DARK }}>Confirmar reserva</p>
                <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MID, padding: "0.25rem" }}><X size={18} /></button>
              </div>
            </div>

            {/* Resumen */}
            <div style={{ padding: "0 1.5rem 1.5rem" }}>
              {/* Header del servicio */}
              <div style={{ backgroundColor: LIGHT, borderRadius: "8px", padding: "1.1rem 1.25rem", marginBottom: "1.25rem" }}>
                <p style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "0.35rem" }}>{serv.descripcion}</p>
                <p style={{ fontSize: "1rem", fontWeight: 600, color: "#FFFFFF", marginBottom: "0.75rem" }}>{serv.labelCompleto}</p>
                <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                  {[
                    { icon: <Calendar size={12} />, label: fmtFecha(fecha, { weekday: "short", day: "numeric", month: "short" }) },
                    { icon: <Clock size={12} />, label: `${slot.hora} – ${slot.horaFin}` },
                    { icon: <Users size={12} />, label: slot.proNombre || "Auto-asignado" },
                  ].map(({ icon, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.85)", fontSize: "0.75rem" }}>
                      {icon} {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalles */}
              {[
                ["Duración", `${serv.duracion} minutos`],
                ["Precio", serv.precio],
                ...(serv.capacidad > 1 ? [["Plazas", `${slot.plazasTotales - slot.plazasOcupadas} disponibles`]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(61,61,61,0.06)" }}>
                  <span style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: DARK, fontWeight: 500 }}>{value}</span>
                </div>
              ))}

              <p style={{ fontSize: "0.65rem", color: MID, marginTop: "0.85rem", lineHeight: 1.6 }}>
                Las cancelaciones deben realizarse con al menos 24 h de antelación.
              </p>

              <button onClick={onConfirmar} style={{
                width: "100%", marginTop: "1.25rem", padding: "1rem", fontSize: "0.75rem",
                letterSpacing: "0.18em", textTransform: "uppercase", border: "none", borderRadius: "6px",
                backgroundColor: "#8B1A2F", color: "#FFFFFF", cursor: "pointer",
                fontFamily: "var(--font-inter), system-ui, sans-serif", fontWeight: 600,
                boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
              }}>
                Confirmar reserva
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Componente principal (con useSearchParams) ────────────────────────────────
function ReservarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const paramCat = searchParams.get("categoria") as CatId | null;
  const initCat: CatId = paramCat && CATEGORIAS.find((c) => c.id === paramCat) ? paramCat : "entrenamiento";

  const hoyStr = new Date().toISOString().split("T")[0];
  const [cat, setCat] = useState<CatId>(initCat);
  const [servId, setServId] = useState<ServicioId>(CAT_DEFAULT_SERVICIO[initCat]);
  const [vista, setVista] = useState<"dia" | "semana">("dia");
  const [fecha, setFecha] = useState(hoyStr);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [profesionales, setProfesionales] = useState<User[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotInfo | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [listaEsperaOks, setListaEsperaOks] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCitas(citasStore.getAll());
    setBloqueos(bloqueosStore.getAll());
    setProfesionales(getUsers().filter((u) => u.role === "profesional") as User[]);
    setSalas(salasStore.getAll());
  }, []);

  const serv = SERVICIOS[servId];
  const catConfig = CATEGORIAS.find((c) => c.id === cat)!;

  function cambiarCat(newCat: CatId) {
    setCat(newCat);
    setServId(CAT_DEFAULT_SERVICIO[newCat]);
    setSlotSeleccionado(null);
    setConfirmado(false);
  }

  const weekStart = mondayOf(fecha);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function slotsParaFecha(ds: string): SlotInfo[] {
    if (isWeekend(ds)) return [];
    return computeSlots(serv, ds, citas, bloqueos, profesionales, user?.id || null);
  }

  const slotsDia = slotsParaFecha(fecha);
  const slotsActivos = slotsDia.filter((s) => s.estado !== "pasado");

  function handleReservar(slot: SlotInfo) {
    if (!user) {
      router.push(`/login?next=/reservar?categoria=${cat}`);
      return;
    }
    setSlotSeleccionado(slot);
    setConfirmado(false);
  }

  function handleListaEspera(slot: SlotInfo) {
    if (!user) { router.push(`/login?next=/reservar?categoria=${cat}`); return; }
    listaEsperaStore.add({
      clienteId: user.id, servicio: serv.labelCompleto,
      fecha, hora: slot.hora, creadoEn: new Date().toISOString(), notificado: false,
    });
    setListaEsperaOks((prev) => new Set([...prev, `${fecha}-${slot.hora}`]));
  }

  function handleConfirmar() {
    if (!user || !slotSeleccionado) return;
    const salaId = salasStore.asignarSala(fecha, slotSeleccionado.hora, serv.duracion);
    citasStore.add({
      clienteId: user.id,
      profesionalId: slotSeleccionado.proId,
      fecha, hora: slotSeleccionado.hora,
      servicio: serv.labelCompleto,
      estado: "pendiente",
      salaId,
    });
    setCitas(citasStore.getAll());
    setConfirmado(true);
    setTimeout(() => { setSlotSeleccionado(null); setConfirmado(false); }, 3500);
  }

  function semanaLabel(): string {
    const ini = weekDays[0];
    const fin = weekDays[6];
    const di = new Date(ini + "T00:00");
    const df = new Date(fin + "T00:00");
    if (di.getMonth() === df.getMonth()) return `${di.getDate()}–${df.getDate()} ${MESES_ES[di.getMonth()]}`;
    return `${di.getDate()} ${MESES_ES[di.getMonth()]} – ${df.getDate()} ${MESES_ES[df.getMonth()]}`;
  }

  // Recuento de disponibilidad para el badge de semana
  function disponiblesDia(ds: string): number {
    if (isWeekend(ds)) return 0;
    return computeSlots(serv, ds, citas, bloqueos, profesionales, user?.id || null)
      .filter((s) => s.estado === "disponible" || s.estado === "casi_lleno").length;
  }

  const slots24h = Array.from({ length: 32 }, (_, i) => {
    const mins = HORA_INI + i * 30;
    if (mins > HORA_FIN) return null;
    return toHHMM(mins);
  }).filter(Boolean) as string[];

  function slotEstadoEnSemana(ds: string, hora: string): SlotEstado | null {
    if (isWeekend(ds)) return null;
    const slots = computeSlots(serv, ds, citas, bloqueos, profesionales, user?.id || null);
    const match = slots.find((s) => s.hora === hora);
    return match ? match.estado : null;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG, fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {/* Cabecera sticky */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: BG, borderBottom: "1px solid rgba(61,61,61,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem 0", maxWidth: 900, margin: "0 auto" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: MID, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <ChevronLeft size={14} /> Volver
          </Link>
          <p className="font-serif" style={{ fontSize: "1.05rem", fontWeight: 400, color: DARK }}>Reserva tu cita</p>
          {user ? (
            <Link href="/perfil" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, textDecoration: "none" }}>Mis reservas</Link>
          ) : (
            <Link href="/login" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, textDecoration: "none" }}>Entrar</Link>
          )}
        </div>

        {/* Tabs de categoría */}
        <div style={{ display: "flex", gap: 0, padding: "0.85rem 1.25rem 0", maxWidth: 900, margin: "0 auto", borderBottom: "none", overflowX: "auto" }}>
          {CATEGORIAS.map((c) => (
            <button key={c.id} onClick={() => cambiarCat(c.id)} style={{
              padding: "0.65rem 1.1rem", background: "none", border: "none", cursor: "pointer",
              fontSize: "0.7rem", fontWeight: cat === c.id ? 700 : 400, letterSpacing: "0.08em",
              color: cat === c.id ? "#8B1A2F" : MID,
              borderBottom: cat === c.id ? `2px solid #8B1A2F` : "2px solid transparent",
              transition: "all 0.15s", whiteSpace: "nowrap",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Sub-tabs de servicio (solo si hay más de uno) */}
        {catConfig.servicios.length > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", padding: "0.65rem 1.25rem", maxWidth: 900, margin: "0 auto", overflowX: "auto" }}>
            {catConfig.servicios.map((sid) => {
              const s = SERVICIOS[sid];
              const sel = servId === sid;
              return (
                <button key={sid} onClick={() => { setServId(sid); setSlotSeleccionado(null); }} style={{
                  padding: "0.4rem 0.9rem", fontSize: "0.65rem", letterSpacing: "0.08em", fontWeight: sel ? 600 : 400,
                  border: `1px solid ${sel ? "#8B1A2F" : "#3D3D3D"}`, borderRadius: "20px",
                  backgroundColor: sel ? "#8B1A2F" : "transparent", color: sel ? DARK : MID,
                  cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                }}>
                  {s.label} · {s.duracion} min · {s.precio}
                </button>
              );
            })}
          </div>
        )}

        {/* Navegación de fecha + toggle vista */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.65rem 1.25rem 0.85rem", maxWidth: 900, margin: "0 auto", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1px solid #3D3D3D", borderRadius: "6px", overflow: "hidden", flex: 1, maxWidth: 360 }}>
            <button onClick={() => setFecha(addDays(fecha, vista === "dia" ? -1 : -7))} style={{ background: "none", border: "none", borderRight: "1px solid rgba(61,61,61,0.12)", cursor: "pointer", color: DARK, padding: "0.6rem 0.85rem", flexShrink: 0 }}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ flex: 1, textAlign: "center", padding: "0.55rem 0.5rem" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: DARK, lineHeight: 1.3 }}>
                {vista === "dia" ? fmtFecha(fecha, { weekday: "long", day: "numeric", month: "long" }) : semanaLabel()}
              </p>
              {vista === "dia" && fecha === hoyStr && (
                <span style={{ fontSize: "0.55rem", color: C_DISP, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Hoy</span>
              )}
            </div>
            <button onClick={() => setFecha(addDays(fecha, vista === "dia" ? 1 : 7))} style={{ background: "none", border: "none", borderLeft: "1px solid rgba(61,61,61,0.12)", cursor: "pointer", color: DARK, padding: "0.6rem 0.85rem", flexShrink: 0 }}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            {fecha !== hoyStr && (
              <button onClick={() => setFecha(hoyStr)} style={{ padding: "0.5rem 0.85rem", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", border: `1px solid ${C_DISP}`, borderRadius: "6px", backgroundColor: `${C_DISP}12`, color: C_DISP, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif", fontWeight: 600 }}>
                Hoy
              </button>
            )}
            <div style={{ display: "flex", border: "1px solid #3D3D3D", borderRadius: "6px", overflow: "hidden" }}>
              {(["dia", "semana"] as const).map((v) => (
                <button key={v} onClick={() => setVista(v)} style={{
                  padding: "0.5rem 0.85rem", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase",
                  border: "none", backgroundColor: vista === v ? "#8B1A2F" : "transparent",
                  color: vista === v ? DARK : MID, cursor: "pointer",
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                }}>
                  {v === "dia" ? "Día" : "Semana"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1.25rem 5rem" }}>

        {/* ─── VISTA DÍA ─── */}
        {vista === "dia" && (
          <>
            {isWeekend(fecha) ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🏖️</p>
                <p style={{ fontSize: "1rem", fontWeight: 500, color: DARK, marginBottom: "0.4rem" }}>El centro está cerrado</p>
                <p style={{ fontSize: "0.82rem", color: MID, marginBottom: "1.5rem" }}>No hay citas disponibles el fin de semana.</p>
                <button onClick={() => setFecha(mondayOf(addDays(fecha, 7)))} style={{ padding: "0.65rem 1.5rem", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", border: `1px solid #8B1A2F`, borderRadius: "4px", backgroundColor: "#8B1A2F", color: "#FFFFFF", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                  Ver lunes siguiente
                </button>
              </div>
            ) : slotsActivos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                <p style={{ fontSize: "1rem", fontWeight: 500, color: DARK, marginBottom: "0.4rem" }}>Sin disponibilidad</p>
                <p style={{ fontSize: "0.82rem", color: MID }}>No hay huecos libres para {serv.labelCompleto} este día.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {/* Resumen rápido */}
                <div style={{ display: "flex", gap: "0.65rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  {[
                    { label: "Disponibles", count: slotsDia.filter((s) => s.estado === "disponible").length, color: C_DISP },
                    { label: "Casi llenas", count: slotsDia.filter((s) => s.estado === "casi_lleno").length, color: C_CASI },
                    { label: "Completos", count: slotsDia.filter((s) => s.estado === "completo").length, color: C_COMP },
                    ...(user ? [{ label: "Mis reservas", count: slotsDia.filter((s) => s.estado === "tuya").length, color: C_TUYA }] : []),
                  ].filter((i) => i.count > 0).map(({ label, count, color }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.65rem", color: MID }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
                      <span>{count} {label.toLowerCase()}</span>
                    </div>
                  ))}
                </div>

                {slotsActivos.map((slot) => (
                  <SlotCard
                    key={slot.hora}
                    slot={slot}
                    serv={serv}
                    onReservar={handleReservar}
                    onListaEspera={handleListaEspera}
                    listaEsperaOk={listaEsperaOks.has(`${fecha}-${slot.hora}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── VISTA SEMANA ─── */}
        {vista === "semana" && (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ minWidth: 640 }}>
              {/* Cabeceras de día */}
              <div style={{ display: "grid", gridTemplateColumns: `64px repeat(7, 1fr)`, gap: 1, marginBottom: 1 }}>
                <div />
                {weekDays.map((ds, di) => {
                  const isToday = ds === hoyStr;
                  const fin = isWeekend(ds);
                  const disps = !fin ? disponiblesDia(ds) : 0;
                  return (
                    <button key={ds} onClick={() => { if (!fin) { setFecha(ds); setVista("dia"); } }}
                      disabled={fin} style={{
                        padding: "0.6rem 0.25rem", textAlign: "center", background: "none", border: "none",
                        cursor: fin ? "default" : "pointer", borderRadius: "6px 6px 0 0",
                        backgroundColor: isToday ? "#8B1A2F1a" : "transparent",
                        opacity: fin ? 0.4 : 1,
                      }}>
                      <p style={{ fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID }}>{DIAS_SEMANA[di]}</p>
                      <p style={{ fontSize: "0.95rem", fontWeight: isToday ? 700 : 400, color: isToday ? DARK : MID, marginTop: "0.1rem" }}>
                        {new Date(ds + "T00:00").getDate()}
                      </p>
                      {!fin && disps > 0 && (
                        <p style={{ fontSize: "0.52rem", color: C_DISP, fontWeight: 600 }}>{disps} libres</p>
                      )}
                      {!fin && disps === 0 && (
                        <p style={{ fontSize: "0.52rem", color: C_COMP }}>Lleno</p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Grid de slots */}
              <div style={{ border: "1px solid rgba(61,61,61,0.1)", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
                {slotsDelDia(serv.duracion).map((hora, hi) => (
                  <div key={hora} style={{ display: "grid", gridTemplateColumns: `64px repeat(7, 1fr)`, borderBottom: hi < slotsDelDia(serv.duracion).length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                    {/* Etiqueta de hora */}
                    <div style={{ padding: "0.6rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "flex-end", backgroundColor: LIGHT, borderRight: "1px solid rgba(61,61,61,0.08)" }}>
                      <span style={{ fontSize: "0.6rem", color: MID, fontVariantNumeric: "tabular-nums" }}>{hora}</span>
                    </div>
                    {/* Celdas de cada día */}
                    {weekDays.map((ds) => {
                      if (isWeekend(ds)) return (
                        <div key={ds} style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(61,61,61,0.06)" }} />
                      );
                      const estado = slotEstadoEnSemana(ds, hora);
                      if (!estado) return <div key={ds} style={{ borderRight: "1px solid rgba(61,61,61,0.06)" }} />;
                      const color = estadoColor(estado);
                      const libresW = (() => {
                        const ss = computeSlots(serv, ds, citas, bloqueos, profesionales, user?.id || null).find((s) => s.hora === hora);
                        return ss ? ss.plazasTotales - ss.plazasOcupadas : 0;
                      })();
                      return (
                        <button key={ds} onClick={() => { setFecha(ds); setVista("dia"); }}
                          disabled={estado === "pasado" || estado === "completo"} style={{
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            padding: "0.55rem 0.25rem", background: `${color}18`,
                            border: "none", borderRight: "1px solid rgba(61,61,61,0.06)",
                            cursor: (estado === "pasado" || estado === "completo") ? "default" : "pointer",
                            transition: "background-color 0.15s", gap: "0.2rem",
                          }}
                          onMouseEnter={(e) => { if (estado !== "pasado" && estado !== "completo") e.currentTarget.style.backgroundColor = `${color}30`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${color}18`; }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, display: "block", flexShrink: 0 }} />
                          {serv.capacidad > 1 && estado !== "pasado" && (
                            <span style={{ fontSize: "0.5rem", color, fontWeight: 700 }}>{libresW}p</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Leyenda */}
              <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem", flexWrap: "wrap" }}>
                {[
                  { label: "Disponible", color: C_DISP },
                  { label: "Casi lleno", color: C_CASI },
                  { label: "Completo", color: C_COMP },
                  { label: "Tu reserva", color: C_TUYA },
                ].map(({ label, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.65rem", color: MID }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA si no está logueado */}
      {!user && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: BG, borderTop: "1px solid rgba(61,61,61,0.1)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", zIndex: 50, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: "0.78rem", color: MID, flex: 1 }}>
            Inicia sesión para reservar tu cita.
          </p>
          <Link href={`/login?next=/reservar?categoria=${cat}`} style={{ padding: "0.7rem 1.4rem", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", backgroundColor: "#8B1A2F", color: "#FFFFFF", textDecoration: "none", borderRadius: "4px", fontWeight: 600, whiteSpace: "nowrap" }}>
            Iniciar sesión
          </Link>
        </div>
      )}

      {/* Modal de confirmación */}
      {slotSeleccionado && (
        <ModalConfirmar
          slot={slotSeleccionado}
          serv={serv}
          fecha={fecha}
          salas={salas}
          onConfirmar={handleConfirmar}
          onClose={() => { setSlotSeleccionado(null); setConfirmado(false); }}
          confirmado={confirmado}
        />
      )}
    </div>
  );
}

// ── Export con Suspense (requerido por useSearchParams) ───────────────────────
export default function ReservarPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#2C2C2C", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "0.8rem", color: "#A0A0A0", letterSpacing: "0.1em" }}>Cargando...</p>
    </div>}>
      <ReservarContent />
    </Suspense>
  );
}
