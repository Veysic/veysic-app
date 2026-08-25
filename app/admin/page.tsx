"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  CalendarDays,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Link as LinkIcon,
  MessageSquare,
  UserCog,
  BarChart3,
  Settings,
  CreditCard,
  UserCircle,
  Send,
  LayoutGrid,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { getUsers, updateUser, logout } from "../lib/auth";
import type { User } from "../lib/auth";
import {
  citasStore,
  pagosStore,
  bonosStore,
  mensajesStore,
  salasStore,
  listaEsperaStore,
  bloqueosStore,
  DURACION_SERVICIOS,
} from "../lib/store";
import type { Cita, Pago, Bono, Sala, ListaEspera, Bloqueo } from "../lib/store";

const BG = "#2C2C2C";
const DARK = "#FFFFFF";
const MID = "#A0A0A0";
const LIGHT = "#3D3D3D";

const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const CAL_DIAS = ["L", "M", "X", "J", "V", "S", "D"];

type Seccion =
  | "citas" | "salas" | "calendario" | "listaespera"
  | "usuarios"
  | "clientes" | "comunicaciones"
  | "profesionales" | "pendientes" | "asignaciones"
  | "pagos"
  | "estadisticas" | "configuracion";

const GRUPOS: { label: string; secciones: { id: Seccion; label: string; Icon: React.ElementType }[] }[] = [
  { label: "RESERVAS", secciones: [
    { id: "citas", label: "Gestión de citas", Icon: Calendar },
    { id: "salas", label: "Estado de salas", Icon: LayoutGrid },
    { id: "calendario", label: "Calendario global", Icon: CalendarDays },
    { id: "listaespera", label: "Lista de espera", Icon: Clock },
  ]},
  { label: "USUARIOS", secciones: [
    { id: "usuarios", label: "Gestión de usuarios", Icon: Users },
  ]},
  { label: "CLIENTES", secciones: [
    { id: "clientes", label: "Lista de clientes", Icon: UserCircle },
    { id: "comunicaciones", label: "Comunicaciones", Icon: MessageSquare },
  ]},
  { label: "PROFESIONALES", secciones: [
    { id: "profesionales", label: "Datos y horarios", Icon: UserCog },
    { id: "pendientes", label: "Aprobaciones pendientes", Icon: UserCheck },
    { id: "asignaciones", label: "Asignaciones", Icon: LinkIcon },
  ]},
  { label: "ECONÓMICO", secciones: [
    { id: "pagos", label: "Pagos y bonos", Icon: CreditCard },
  ]},
  { label: "SISTEMA", secciones: [
    { id: "estadisticas", label: "Estadísticas", Icon: BarChart3 },
    { id: "configuracion", label: "Configuración", Icon: Settings },
  ]},
];

// ── HELPERS ────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: MID, marginBottom: "0.4rem" }}>
      {children}
    </p>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="veysic-card" style={{ backgroundColor: LIGHT, borderRadius: "4px", padding: "1.25rem", ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "dark", small, type = "button", disabled }: {
  children: React.ReactNode; onClick?: () => void; variant?: "dark" | "outline" | "danger" | "ghost"; small?: boolean; type?: "button" | "submit"; disabled?: boolean;
}) {
  const base: React.CSSProperties = { fontSize: small ? "0.6rem" : "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: "2px", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif", padding: small ? "0.35rem 0.75rem" : "0.6rem 1.2rem", transition: "all 0.2s", border: "none", opacity: disabled ? 0.5 : 1 };
  if (variant === "danger") return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, backgroundColor: "#C0574A", color: "#fff" }}>{children}</button>;
  if (variant === "outline") return <button className="veysic-btn-outline" type={type} onClick={onClick} disabled={disabled} style={{ ...base, backgroundColor: "transparent", color: "#8B1A2F", border: "1px solid #8B1A2F" }}>{children}</button>;
  if (variant === "ghost") return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, backgroundColor: "transparent", color: MID }}>{children}</button>;
  return <button className="veysic-btn-primary" type={type} onClick={onClick} disabled={disabled} style={{ ...base, backgroundColor: "#8B1A2F", color: "#FFFFFF" }}>{children}</button>;
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ backgroundColor: LIGHT, border: "1px solid rgba(61,61,61,0.1)", borderRadius: "4px", padding: "1.25rem", borderTop: accent ? `3px solid ${accent}` : undefined }}>
      <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.5rem" }}>{label}</p>
      <p className="font-serif" style={{ fontSize: "2rem", fontWeight: 400, color: DARK, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: "0.7rem", color: MID, marginTop: "0.35rem" }}>{sub}</p>}
    </div>
  );
}

function rolBadge(role: User["role"]) {
  const map = { cliente: { bg: "rgba(74,111,165,0.1)", color: "#4A6FA5" }, profesional: { bg: "rgba(122,92,142,0.1)", color: "#7A5C8E" }, admin: { bg: "rgba(139,26,47,0.1)", color: "#8B1A2F" } };
  const s = map[role];
  return <span style={{ fontSize: "0.6rem", padding: "0.2rem 0.55rem", borderRadius: "20px", backgroundColor: s.bg, color: s.color, fontWeight: 500, letterSpacing: "0.05em", textTransform: "capitalize" }}>{role}</span>;
}

function estadoBadge(estado: User["estado"]) {
  const map = { activo: { bg: "rgba(139,26,47,0.1)", color: "#8B1A2F" }, pendiente: { bg: "rgba(192,138,46,0.12)", color: "#C08A2E" }, inactivo: { bg: "rgba(192,87,74,0.1)", color: "#C0574A" } };
  const s = map[estado];
  return <span style={{ fontSize: "0.6rem", padding: "0.2rem 0.55rem", borderRadius: "20px", backgroundColor: s.bg, color: s.color, fontWeight: 500, textTransform: "capitalize" }}>{estado}</span>;
}

function citaBadge(estado: Cita["estado"]) {
  const map = { pendiente: { bg: "rgba(74,111,165,0.1)", color: "#4A6FA5" }, completada: { bg: "rgba(139,26,47,0.1)", color: "#8B1A2F" }, cancelada: { bg: "rgba(192,87,74,0.1)", color: "#C0574A" } };
  const s = map[estado];
  return <span style={{ fontSize: "0.6rem", padding: "0.2rem 0.55rem", borderRadius: "20px", backgroundColor: s.bg, color: s.color, fontWeight: 500, textTransform: "capitalize" }}>{estado}</span>;
}

// ── GESTIÓN DE CITAS ───────────────────────────────────────────────────────
function SeccionCitas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<"todas" | "pendiente" | "completada" | "cancelada">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [editSalaId, setEditSalaId] = useState<string | null>(null);

  useEffect(() => {
    setCitas(citasStore.getAll().sort((a, b) => b.fecha.localeCompare(a.fecha)));
    setUsuarios(getUsers());
    setSalas(salasStore.getAll());
  }, []);

  function nombreUser(id: string) {
    return usuarios.find((u) => u.id === id)?.nombre || id;
  }
  function asignarSala(citaId: string, salaId: string) {
    citasStore.update(citaId, { salaId: salaId || undefined });
    setCitas(citasStore.getAll().sort((a, b) => b.fecha.localeCompare(a.fecha)));
    setEditSalaId(null);
  }

  const filtradas = citas.filter((c) => {
    const matchEstado = filtroEstado === "todas" || c.estado === filtroEstado;
    const matchBusqueda = !busqueda ||
      c.servicio.toLowerCase().includes(busqueda.toLowerCase()) ||
      nombreUser(c.clienteId).toLowerCase().includes(busqueda.toLowerCase()) ||
      nombreUser(c.profesionalId).toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Gestión de citas</h2>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por servicio, cliente o profesional..."
          style={{ flex: 1, minWidth: 220, background: "transparent", border: "1px solid #3D3D3D", padding: "0.5rem 0.75rem", borderRadius: "2px", fontSize: "0.8rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(["todas", "pendiente", "completada", "cancelada"] as const).map((f) => (
            <button key={f} onClick={() => setFiltroEstado(f)}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "capitalize", borderRadius: "2px", border: `1px solid ${filtroEstado === f ? "#8B1A2F" : "#3D3D3D"}`, backgroundColor: filtroEstado === f ? "#8B1A2F" : "transparent", color: filtroEstado === f ? "#FFFFFF" : MID, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtradas.length === 0 ? (
          <Card><p style={{ fontSize: "0.875rem", color: MID }}>No hay citas para mostrar.</p></Card>
        ) : (
          filtradas.map((c) => (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: DARK }}>{c.servicio}</p>
                    {citaBadge(c.estado)}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: MID }}>
                    {new Date(c.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {c.hora}
                  </p>
                  <p style={{ fontSize: "0.7rem", color: MID, marginTop: "0.2rem" }}>
                    Cliente: {nombreUser(c.clienteId)} · Profesional: {nombreUser(c.profesionalId)}
                  </p>
                  {editSalaId === c.id ? (
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", alignItems: "center" }}>
                      <select defaultValue={c.salaId || ""} onChange={(e) => asignarSala(c.id, e.target.value)}
                        style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem", borderRadius: "2px", border: "1px solid #3D3D3D", background: LIGHT, color: DARK, fontFamily: "var(--font-inter), system-ui, sans-serif", cursor: "pointer" }}>
                        <option value="">Sin sala</option>
                        {salas.filter((s) => s.activa).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                      </select>
                      <button onClick={() => setEditSalaId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MID, fontSize: "0.7rem" }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditSalaId(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.68rem", color: MID }}>
                        Sala: {c.salaId ? (salas.find((s) => s.id === c.salaId)?.nombre || "—") : "—"}
                      </span>
                      <Pencil size={10} color={MID} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      <p style={{ fontSize: "0.7rem", color: MID, marginTop: "1rem" }}>{filtradas.length} cita{filtradas.length !== 1 ? "s" : ""} mostrada{filtradas.length !== 1 ? "s" : ""}.</p>
    </div>
  );
}

// ── CALENDARIO GLOBAL ──────────────────────────────────────────────────────
const PRO_PALETTE_CAL = ["#4A6FA5", "#8B1A2F", "#7A5C8E", "#C08A2E", "#C0574A", "#3C8C89", "#8B5E3C", "#5B6EAE"];
const SLOT_H = 48; // px per 30-min slot
const CAL_INI_MIN = 330; // 05:30
const CAL_FIN_MIN = 1260; // 21:00
const TOTAL_SLOTS = (CAL_FIN_MIN - CAL_INI_MIN) / 30; // 31
const TIME_COL_W = 54;

const SLOT_LABELS_CAL = Array.from({ length: TOTAL_SLOTS + 1 }, (_, i) => {
  const mins = CAL_INI_MIN + i * 30;
  return `${Math.floor(mins / 60).toString().padStart(2, "0")}:${(mins % 60).toString().padStart(2, "0")}`;
});

function toMinCal(t: string): number { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function topPx(hora: string): number { return Math.max(0, (toMinCal(hora) - CAL_INI_MIN) * (SLOT_H / 30)); }
function heightPx(durMin: number): number { return Math.max(SLOT_H / 2, durMin * (SLOT_H / 30)); }
function finHHMM(hora: string, dur: number): string { const f = toMinCal(hora) + dur; return `${Math.floor(f / 60).toString().padStart(2, "0")}:${(f % 60).toString().padStart(2, "0")}`; }
function addDaysCal(ds: string, n: number): string { const d = new Date(ds + "T00:00"); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }
function mondayOf(ds: string): string {
  const d = new Date(ds + "T00:00");
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}
function fmtFechaCorta(ds: string): string {
  return new Date(ds + "T00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}
function fmtDiaSemana(ds: string): string {
  const d = new Date(ds + "T00:00");
  return CAL_DIAS[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

type PopupCita = Cita & { _proColor: string; _proNombre: string; _clienteNombre: string; _salaNombre: string };

function computeLanes(events: { id: string; ini: number; fin: number }[]): Record<string, { lane: number; total: number }> {
  const sorted = [...events].sort((a, b) => a.ini - b.ini);
  const result: Record<string, { lane: number; total: number }> = {};
  const columns: { id: string; ini: number; fin: number; lane: number }[][] = [];
  for (const ev of sorted) {
    let placed = false;
    for (const col of columns) {
      const last = col[col.length - 1];
      if (last.fin <= ev.ini) { col.push({ ...ev, lane: columns.indexOf(col) }); placed = true; break; }
    }
    if (!placed) columns.push([{ ...ev, lane: columns.length }]);
  }
  const total = columns.length;
  for (const col of columns) for (const ev of col) result[ev.id] = { lane: ev.lane, total };
  return result;
}

function SeccionCalendario() {
  const hoyDS = new Date().toISOString().split("T")[0];
  const [citas, setCitas] = useState<Cita[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [vista, setVista] = useState<"dia" | "semana">("dia");
  const [fecha, setFecha] = useState(hoyDS);
  const [filtroProIds, setFiltroProIds] = useState<string[]>([]);
  const [filtroServicio, setFiltroServicio] = useState("");
  const [filtroSala, setFiltroSala] = useState("");
  const [popup, setPopup] = useState<PopupCita | null>(null);
  const [nuevaCitaOpen, setNuevaCitaOpen] = useState(false);
  const [filtroPanelOpen, setFiltroPanelOpen] = useState(false);

  // Nueva cita form
  const [ncCliente, setNcCliente] = useState("");
  const [ncPro, setNcPro] = useState("");
  const [ncServicio, setNcServicio] = useState("");
  const [ncFecha, setNcFecha] = useState(hoyDS);
  const [ncHora, setNcHora] = useState("09:00");
  const [ncSala, setNcSala] = useState("");
  const [ncOk, setNcOk] = useState(false);

  useEffect(() => {
    setCitas(citasStore.getAll());
    setBloqueos(bloqueosStore.getAll());
    setUsuarios(getUsers());
    setSalas(salasStore.getAll());
  }, []);

  const profesionales = usuarios.filter((u) => u.role === "profesional" && u.estado === "activo");
  const clientes = usuarios.filter((u) => u.role === "cliente");
  const proColorMap: Record<string, string> = Object.fromEntries(profesionales.map((p, i) => [p.id, PRO_PALETTE_CAL[i % PRO_PALETTE_CAL.length]]));

  function nombreUser(id: string) { return usuarios.find((u) => u.id === id)?.nombre || id; }
  function salaNombre(id?: string) { return id ? (salas.find((s) => s.id === id)?.nombre || "—") : "—"; }

  const weekStart = mondayOf(fecha);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysCal(weekStart, i));

  function citasFecha(ds: string) {
    return citas.filter((c) =>
      c.fecha === ds &&
      (filtroProIds.length === 0 || filtroProIds.includes(c.profesionalId)) &&
      (!filtroServicio || c.servicio === filtroServicio) &&
      (!filtroSala || c.salaId === filtroSala)
    );
  }

  function estadoPro(proId: string): "en_sesion" | "disponible" | "fuera" {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin < CAL_INI_MIN || nowMin >= CAL_FIN_MIN) return "fuera";
    const hoy2 = now.toISOString().split("T")[0];
    const sesion = citas.find((c) => {
      if (c.fecha !== hoy2 || c.profesionalId !== proId || c.estado === "cancelada") return false;
      const ini = toMinCal(c.hora);
      return nowMin >= ini && nowMin < ini + (DURACION_SERVICIOS[c.servicio] ?? 60);
    });
    return sesion ? "en_sesion" : "disponible";
  }

  function citasHoy(proId: string) { return citas.filter((c) => c.fecha === hoyDS && c.profesionalId === proId && c.estado !== "cancelada").length; }
  function citasSemana(proId: string) {
    const fin = addDaysCal(mondayOf(hoyDS), 6);
    return citas.filter((c) => c.profesionalId === proId && c.fecha >= mondayOf(hoyDS) && c.fecha <= fin && c.estado !== "cancelada").length;
  }
  function proximaCita(proId: string): Cita | undefined {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const hoy2 = now.toISOString().split("T")[0];
    return citas.filter((c) => c.fecha === hoy2 && c.profesionalId === proId && c.estado === "pendiente" && toMinCal(c.hora) >= nowMin)
      .sort((a, b) => a.hora.localeCompare(b.hora))[0];
  }

  function openPopup(c: Cita) {
    setPopup({ ...c, _proColor: proColorMap[c.profesionalId] || DARK, _proNombre: nombreUser(c.profesionalId), _clienteNombre: nombreUser(c.clienteId), _salaNombre: salaNombre(c.salaId) });
  }

  function cancelarCita(id: string) {
    citasStore.update(id, { estado: "cancelada" });
    setCitas(citasStore.getAll());
    setPopup(null);
  }
  function completarCita(id: string) {
    citasStore.update(id, { estado: "completada" });
    setCitas(citasStore.getAll());
    setPopup(null);
  }

  function crearCita(e: React.FormEvent) {
    e.preventDefault();
    if (!ncCliente || !ncPro || !ncServicio || !ncFecha || !ncHora) return;
    const salaId = ncSala || salasStore.asignarSala(ncFecha, ncHora, DURACION_SERVICIOS[ncServicio] ?? 60) || undefined;
    citasStore.add({ clienteId: ncCliente, profesionalId: ncPro, fecha: ncFecha, hora: ncHora, servicio: ncServicio, estado: "pendiente", salaId });
    setCitas(citasStore.getAll());
    setNcOk(true);
    setTimeout(() => { setNuevaCitaOpen(false); setNcOk(false); setNcCliente(""); setNcPro(""); setNcServicio(""); setNcFecha(hoyDS); setNcHora("09:00"); setNcSala(""); }, 1500);
  }

  // ─── Summary ────────────────────────────────────────────────────────────
  const citasDia = citasFecha(fecha);
  const pendientesDia = citasDia.filter((c) => c.estado === "pendiente").length;
  const completadasDia = citasDia.filter((c) => c.estado === "completada").length;
  const canceladasDia = citasDia.filter((c) => c.estado === "cancelada").length;

  const salaMasOcupada = (() => {
    const count: Record<string, number> = {};
    for (const c of citasDia) { if (c.salaId) count[c.salaId] = (count[c.salaId] || 0) + 1; }
    const max = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    return max ? salaNombre(max[0]) : "—";
  })();
  const proMasCitas = (() => {
    const count: Record<string, number> = {};
    for (const c of citasDia) { if (c.estado !== "cancelada") count[c.profesionalId] = (count[c.profesionalId] || 0) + 1; }
    const max = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    return max ? nombreUser(max[0]).split(" ")[0] : "—";
  })();

  const serviciosUnicos = [...new Set(citas.map((c) => c.servicio))].sort();

  // ─── Time Grid (day + week shared) ─────────────────────────────────────
  function TimeGrid({ fechas }: { fechas: string[] }) {
    const isMulti = fechas.length > 1;
    const gridHeight = TOTAL_SLOTS * SLOT_H;

    return (
      <div style={{ overflowY: "auto", maxHeight: 560, position: "relative" }}>
        <div style={{ display: "flex" }}>
          {/* Time labels */}
          <div style={{ width: TIME_COL_W, flexShrink: 0, position: "sticky", left: 0, backgroundColor: LIGHT, zIndex: 2 }}>
            <div style={{ height: isMulti ? 44 : 0 }} />
            {SLOT_LABELS_CAL.map((label, i) => (
              <div key={label} style={{ height: SLOT_H, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: "0.5rem", paddingTop: "2px" }}>
                <span style={{ fontSize: "0.6rem", color: MID, fontVariantNumeric: "tabular-nums" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div style={{ display: "flex", flex: 1, minWidth: 0, gap: isMulti ? 1 : 0 }}>
            {fechas.map((ds) => {
              const citasDs = citasFecha(ds).filter((c) => c.estado !== "cancelada");
              const bloqueosDs = bloqueos.filter((b) => b.fecha === ds && (filtroProIds.length === 0 || filtroProIds.includes(b.profesionalId)));
              const isToday = ds === hoyDS;
              const events = citasDs.map((c) => ({
                id: c.id,
                ini: toMinCal(c.hora),
                fin: toMinCal(c.hora) + (DURACION_SERVICIOS[c.servicio] ?? 60),
              }));
              const lanes = computeLanes(events);

              return (
                <div key={ds} style={{ flex: 1, minWidth: isMulti ? 80 : 0, position: "relative" }}>
                  {isMulti && (
                    <div style={{ height: 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderBottom: "1px solid rgba(61,61,61,0.08)", backgroundColor: isToday ? "rgba(255,255,255,0.05)" : "transparent", position: "sticky", top: 0, zIndex: 1 }}>
                      <p style={{ fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MID }}>{fmtDiaSemana(ds)}</p>
                      <p style={{ fontSize: "0.82rem", fontWeight: isToday ? 700 : 400, color: isToday ? DARK : MID }}>{new Date(ds + "T00:00").getDate()}</p>
                    </div>
                  )}
                  <div style={{ position: "relative", height: gridHeight }}>
                    {/* Grid lines */}
                    {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
                      <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * SLOT_H, height: SLOT_H, borderTop: `1px solid rgba(255,255,255,${i % 2 === 0 ? "0.07" : "0.03"})` }} />
                    ))}

                    {/* Bloqueos */}
                    {bloqueosDs.map((b) => {
                      const ini = toMinCal(b.horaInicio);
                      const dur = toMinCal(b.horaFin) - ini;
                      if (ini >= CAL_FIN_MIN || ini + dur <= CAL_INI_MIN) return null;
                      return (
                        <div key={b.id} style={{ position: "absolute", left: 0, right: 0, top: topPx(b.horaInicio), height: heightPx(dur), backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(61,61,61,0.14)", borderRadius: "3px", overflow: "hidden", padding: "2px 4px" }}>
                          <p style={{ fontSize: "0.58rem", color: MID, fontWeight: 500 }}>No disponible</p>
                          {b.motivo && <p style={{ fontSize: "0.55rem", color: MID }}>{b.motivo}</p>}
                        </div>
                      );
                    })}

                    {/* Citas */}
                    {citasDs.map((c) => {
                      const dur = DURACION_SERVICIOS[c.servicio] ?? 60;
                      const { lane = 0, total = 1 } = lanes[c.id] || {};
                      const color = proColorMap[c.profesionalId] || DARK;
                      const w = `calc((100% - ${(total - 1) * 2}px) / ${total})`;
                      const l = `calc(${lane} * (100% - ${(total - 1) * 2}px) / ${total} + ${lane * 2}px)`;
                      return (
                        <button key={c.id} onClick={() => openPopup(c)}
                          style={{ position: "absolute", top: topPx(c.hora), height: heightPx(dur), width: w, left: l, backgroundColor: `${color}22`, borderLeft: `3px solid ${color}`, borderRadius: "0 3px 3px 0", padding: "3px 5px", overflow: "hidden", cursor: "pointer", border: `1px solid ${color}44`, borderLeftWidth: 3, textAlign: "left", fontFamily: "var(--font-inter), system-ui, sans-serif", zIndex: 1 }}>
                          <p style={{ fontSize: "0.62rem", fontWeight: 700, color, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.hora}–{finHHMM(c.hora, dur)}
                          </p>
                          <p style={{ fontSize: "0.6rem", color: DARK, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {nombreUser(c.clienteId).split(" ")[0]}
                          </p>
                          {heightPx(dur) > 50 && <p style={{ fontSize: "0.56rem", color: MID, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.servicio}</p>}
                          {heightPx(dur) > 70 && c.salaId && <p style={{ fontSize: "0.55rem", color: MID }}>📍 {salaNombre(c.salaId)}</p>}
                        </button>
                      );
                    })}

                    {/* Línea del tiempo actual */}
                    {ds === hoyDS && (() => {
                      const now = new Date();
                      const nowMin = now.getHours() * 60 + now.getMinutes();
                      if (nowMin < CAL_INI_MIN || nowMin > CAL_FIN_MIN) return null;
                      return <div style={{ position: "absolute", left: 0, right: 0, top: (nowMin - CAL_INI_MIN) * (SLOT_H / 30), height: 2, backgroundColor: "#C0574A", zIndex: 3, pointerEvents: "none" }} />;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK }}>Calendario global</h2>
        <Btn small onClick={() => setNuevaCitaOpen(true)}>
          <Plus size={11} style={{ marginRight: 4, display: "inline" }} />Nueva cita
        </Btn>
      </div>

      {/* Resumen del día */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {[
          { label: "Total", value: citasDia.length, color: DARK },
          { label: "Pendientes", value: pendientesDia, color: "#4A6FA5" },
          { label: "Completadas", value: completadasDia, color: "#8B1A2F" },
          { label: "Canceladas", value: canceladasDia, color: "#C0574A" },
          { label: "Sala + activa", value: salaMasOcupada, color: "#7A5C8E" },
          { label: "Pro + citas", value: proMasCitas, color: "#C08A2E" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: LIGHT, border: "1px solid rgba(61,61,61,0.1)", borderRadius: "4px", padding: "0.5rem 0.85rem", borderTop: `2px solid ${color}` }}>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.2rem" }}>{label}</p>
            <p style={{ fontSize: "1rem", fontWeight: 600, color: DARK, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", border: "1px solid #3D3D3D", borderRadius: "2px", overflow: "hidden" }}>
          <button onClick={() => setFecha(addDaysCal(fecha, vista === "dia" ? -1 : -7))} style={{ background: "none", border: "none", cursor: "pointer", color: DARK, padding: "0.4rem 0.5rem" }}><ChevronLeft size={14} /></button>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", fontSize: "0.75rem", color: DARK, padding: "0.35rem 0.25rem", fontFamily: "var(--font-inter), system-ui, sans-serif", cursor: "pointer" }} />
          <button onClick={() => setFecha(addDaysCal(fecha, vista === "dia" ? 1 : 7))} style={{ background: "none", border: "none", cursor: "pointer", color: DARK, padding: "0.4rem 0.5rem" }}><ChevronRight size={14} /></button>
        </div>
        <button onClick={() => setFecha(hoyDS)} style={{ padding: "0.4rem 0.75rem", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid #3D3D3D", borderRadius: "2px", background: "transparent", color: DARK, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>Hoy</button>
        <div style={{ display: "flex", border: "1px solid #3D3D3D", borderRadius: "2px", overflow: "hidden" }}>
          {(["dia", "semana"] as const).map((v) => (
            <button key={v} onClick={() => setVista(v)} style={{ padding: "0.4rem 0.75rem", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", backgroundColor: vista === v ? "#8B1A2F" : "transparent", color: vista === v ? "#FFFFFF" : MID, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
              {v === "dia" ? "Día" : "Semana"}
            </button>
          ))}
        </div>
        <button onClick={() => setFiltroPanelOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.75rem", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid #3D3D3D", borderRadius: "2px", background: (filtroProIds.length > 0 || filtroServicio || filtroSala) ? "#8B1A2F" : "transparent", color: (filtroProIds.length > 0 || filtroServicio || filtroSala) ? "#FFFFFF" : MID, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
          Filtros {filtroProIds.length > 0 || filtroServicio || filtroSala ? `(${[filtroProIds.length > 0 ? filtroProIds.length + " pro" : "", filtroServicio ? "servicio" : "", filtroSala ? "sala" : ""].filter(Boolean).join(", ")})` : ""}
          <ChevronDown size={11} style={{ transform: filtroPanelOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        {(filtroProIds.length > 0 || filtroServicio || filtroSala) && (
          <button onClick={() => { setFiltroProIds([]); setFiltroServicio(""); setFiltroSala(""); }} style={{ padding: "0.4rem 0.6rem", fontSize: "0.6rem", letterSpacing: "0.08em", border: "1px solid rgba(192,87,74,0.3)", borderRadius: "2px", background: "transparent", color: "#C0574A", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Panel de filtros */}
      {filtroPanelOpen && (
        <Card style={{ marginBottom: "1rem", padding: "1rem" }}>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.5rem" }}>Profesionales</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {profesionales.map((p) => (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.78rem", color: DARK }}>
                    <input type="checkbox" checked={filtroProIds.includes(p.id)} onChange={(e) => {
                      setFiltroProIds((prev) => e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id));
                    }} style={{ accentColor: proColorMap[p.id] || DARK }} />
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: proColorMap[p.id] || DARK, flexShrink: 0 }} />
                    {p.nombre.split(" ")[0]}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.5rem" }}>Servicio</p>
              <select value={filtroServicio} onChange={(e) => setFiltroServicio(e.target.value)}
                style={{ width: "100%", background: LIGHT, border: "1px solid #3D3D3D", borderRadius: "2px", padding: "0.4rem 0.5rem", fontSize: "0.78rem", color: DARK, fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                <option value="">Todos los servicios</option>
                {serviciosUnicos.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.5rem" }}>Sala/Box</p>
              <select value={filtroSala} onChange={(e) => setFiltroSala(e.target.value)}
                style={{ width: "100%", background: LIGHT, border: "1px solid #3D3D3D", borderRadius: "2px", padding: "0.4rem 0.5rem", fontSize: "0.78rem", color: DARK, fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                <option value="">Todas las salas</option>
                {salas.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Main layout */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexDirection: "column" }} className="md:flex-row">

        {/* Panel profesionales */}
        <div style={{ width: "100%", flexShrink: 0 }} className="md:w-[40%]">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {profesionales.length === 0 ? (
              <Card><p style={{ fontSize: "0.8rem", color: MID }}>No hay profesionales activos.</p></Card>
            ) : profesionales.map((pro) => {
              const color = proColorMap[pro.id];
              const estado = estadoPro(pro.id);
              const citasH = citasHoy(pro.id);
              const citasS = citasSemana(pro.id);
              const prox = proximaCita(pro.id);
              const filtrando = filtroProIds.includes(pro.id);
              const estadoConfig = {
                disponible: { label: "Disponible", bg: "rgba(139,26,47,0.1)", col: "#8B1A2F" },
                en_sesion: { label: "En sesión", bg: "rgba(192,138,46,0.12)", col: "#C08A2E" },
                fuera: { label: "Fuera horario", bg: "rgba(255,255,255,0.07)", col: MID },
              }[estado];
              return (
                <button key={pro.id} onClick={() => setFiltroProIds((prev) => prev.includes(pro.id) ? prev.filter((id) => id !== pro.id) : [...prev, pro.id])}
                  style={{ textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
                  <div style={{ backgroundColor: LIGHT, border: `1px solid ${filtrando ? color : "rgba(61,61,61,0.1)"}`, borderLeft: `4px solid ${color}`, borderRadius: "4px", padding: "0.85rem 1rem", transition: "border-color 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", backgroundColor: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {pro.foto ? <img src={pro.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "0.9rem", fontWeight: 700, color }}>{pro.nombre.charAt(0)}</span>}
                        </div>
                        <div>
                          <p style={{ fontSize: "0.82rem", fontWeight: 500, color: DARK, lineHeight: 1.2 }}>{pro.nombre}</p>
                          <p style={{ fontSize: "0.65rem", color: MID }}>{pro.especialidad || pro.profesionalType}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.58rem", padding: "0.2rem 0.5rem", borderRadius: "20px", backgroundColor: estadoConfig.bg, color: estadoConfig.col, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {estadoConfig.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <div>
                        <p style={{ fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MID, marginBottom: "0.1rem" }}>Hoy</p>
                        <p style={{ fontSize: "0.9rem", fontWeight: 600, color }}>  {citasH}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MID, marginBottom: "0.1rem" }}>Semana</p>
                        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: DARK }}>{citasS}</p>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MID, marginBottom: "0.1rem" }}>Próxima</p>
                        <p style={{ fontSize: "0.72rem", color: DARK, lineHeight: 1.3 }}>
                          {prox ? `${prox.hora} · ${nombreUser(prox.clienteId).split(" ")[0]}` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendario */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: "0.5rem" }}>
            {vista === "dia" ? (
              <p style={{ fontSize: "0.8rem", fontWeight: 500, color: DARK }}>
                {new Date(fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                {fecha === hoyDS && <span style={{ marginLeft: "0.5rem", fontSize: "0.6rem", padding: "0.15rem 0.45rem", borderRadius: "20px", backgroundColor: "rgba(61,61,61,0.1)", color: MID }}>Hoy</span>}
              </p>
            ) : (
              <p style={{ fontSize: "0.8rem", fontWeight: 500, color: DARK }}>
                {fmtFechaCorta(weekDays[0])} – {fmtFechaCorta(weekDays[6])}
              </p>
            )}
          </div>

          <div style={{ backgroundColor: LIGHT, border: "1px solid rgba(61,61,61,0.1)", borderRadius: "4px", overflow: "hidden" }}>
            <TimeGrid fechas={vista === "dia" ? [fecha] : weekDays} />
          </div>

          {/* Leyenda profesionales */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
            {profesionales.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: proColorMap[p.id] }} />
                <span style={{ fontSize: "0.65rem", color: MID }}>{p.nombre.split(" ")[0]}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <div style={{ width: 10, height: 10, borderRadius: "2px", backgroundColor: "rgba(61,61,61,0.12)" }} />
              <span style={{ fontSize: "0.65rem", color: MID }}>No disponible</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <div style={{ width: 10, height: 2, backgroundColor: "#C0574A" }} />
              <span style={{ fontSize: "0.65rem", color: MID }}>Ahora</span>
            </div>
          </div>
        </div>
      </div>

      {/* Popup cita */}
      {popup && (
        <div onClick={() => setPopup(null)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#3D3D3D", borderRadius: "6px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ backgroundColor: popup._proColor, padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "1rem", fontWeight: 500, color: "#fff", marginBottom: "0.25rem" }}>{popup.servicio}</p>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)" }}>
                  {new Date(popup.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · {popup.hora}–{finHHMM(popup.hora, DURACION_SERVICIOS[popup.servicio] ?? 60)}
                </p>
              </div>
              <button onClick={() => setPopup(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", padding: "0.2rem" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "1.25rem 1.5rem" }}>
              {[
                ["Cliente", popup._clienteNombre],
                ["Profesional", popup._proNombre],
                ["Sala", popup._salaNombre],
                ["Duración", `${DURACION_SERVICIOS[popup.servicio] ?? 60} min`],
                ["Estado", popup.estado],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(61,61,61,0.07)" }}>
                  <span style={{ fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MID }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: DARK, fontWeight: 500, textTransform: "capitalize" }}>{value}</span>
                </div>
              ))}
              {popup.notas && <p style={{ fontSize: "0.78rem", color: MID, marginTop: "0.75rem", fontStyle: "italic" }}>Notas: {popup.notas}</p>}
              {popup.estado === "pendiente" && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
                  <Btn small onClick={() => completarCita(popup.id)}>
                    <CheckCircle size={11} style={{ marginRight: 4, display: "inline" }} />Completada
                  </Btn>
                  <Btn small variant="outline" onClick={() => cancelarCita(popup.id)}>
                    <XCircle size={11} style={{ marginRight: 4, display: "inline" }} />Cancelar
                  </Btn>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nueva cita modal */}
      {nuevaCitaOpen && (
        <div onClick={() => setNuevaCitaOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#3D3D3D", borderRadius: "6px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: "1.5rem 2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <p className="font-serif" style={{ fontSize: "1.1rem", fontWeight: 400, color: DARK }}>Nueva cita manual</p>
              <button onClick={() => setNuevaCitaOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: MID }}><X size={16} /></button>
            </div>
            {ncOk ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <CheckCircle size={28} color="#8B1A2F" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ fontSize: "0.9rem", color: DARK }}>Cita creada correctamente.</p>
              </div>
            ) : (
              <form onSubmit={crearCita} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { label: "Cliente", el: <select value={ncCliente} onChange={(e) => setNcCliente(e.target.value)} required style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select> },
                  { label: "Profesional", el: <select value={ncPro} onChange={(e) => setNcPro(e.target.value)} required style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                    <option value="">Seleccionar profesional</option>
                    {profesionales.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select> },
                  { label: "Servicio", el: <select value={ncServicio} onChange={(e) => setNcServicio(e.target.value)} required style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                    <option value="">Seleccionar servicio</option>
                    {Object.keys(DURACION_SERVICIOS).map((s) => <option key={s} value={s}>{s} ({DURACION_SERVICIOS[s]} min)</option>)}
                  </select> },
                  { label: "Fecha", el: <input type="date" value={ncFecha} onChange={(e) => setNcFecha(e.target.value)} required style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} /> },
                  { label: "Hora de inicio", el: <input type="time" value={ncHora} onChange={(e) => setNcHora(e.target.value)} required style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} /> },
                  { label: "Sala (opcional)", el: <select value={ncSala} onChange={(e) => setNcSala(e.target.value)} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                    <option value="">Auto-asignar</option>
                    {salas.filter((s) => s.activa).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select> },
                ].map(({ label, el }) => (
                  <div key={label}>
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.4rem" }}>{label}</p>
                    {el}
                  </div>
                ))}
                <div style={{ marginTop: "0.5rem" }}>
                  <Btn type="submit">Crear cita</Btn>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ESTADO DE SALAS ────────────────────────────────────────────────────────
function SeccionSalas() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [nuevaNombre, setNuevaNombre] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSalas(salasStore.getAll());
    setCitas(citasStore.getAll());
    setUsuarios(getUsers());
  }, [tick]);

  function crearSala(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaNombre.trim()) return;
    salasStore.add({ nombre: nuevaNombre.trim(), activa: true });
    setSalas(salasStore.getAll());
    setNuevaNombre("");
  }
  function toggleActiva(id: string, activa: boolean) {
    salasStore.update(id, { activa });
    setSalas(salasStore.getAll());
  }
  function guardarNombre(id: string) {
    if (!editNombre.trim()) return;
    salasStore.update(id, { nombre: editNombre.trim() });
    setSalas(salasStore.getAll());
    setEditId(null);
  }
  function eliminarSala(id: string) {
    salasStore.remove(id);
    setSalas(salasStore.getAll());
  }

  function nombreUser(id: string) {
    return usuarios.find((u) => u.id === id)?.nombre || id;
  }

  function estadoActual(salaId: string): { ocupada: boolean; cita?: Cita } {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const hoy = now.toISOString().split("T")[0];
    for (const c of citas) {
      if (c.fecha !== hoy || c.salaId !== salaId || c.estado === "cancelada") continue;
      const ini = c.hora.split(":").reduce((h, m, i) => i === 0 ? parseInt(m) * 60 : h + parseInt(m), 0);
      const dur = DURACION_SERVICIOS[c.servicio] ?? 60;
      if (nowMins >= ini && nowMins < ini + dur) return { ocupada: true, cita: c };
    }
    return { ocupada: false };
  }

  function proximaCita(salaId: string): Cita | undefined {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const hoy = now.toISOString().split("T")[0];
    return citas
      .filter((c) => c.fecha === hoy && c.salaId === salaId && c.estado === "pendiente")
      .filter((c) => {
        const ini = c.hora.split(":").reduce((h, m, i) => i === 0 ? parseInt(m) * 60 : h + parseInt(m), 0);
        return ini > nowMins;
      })
      .sort((a, b) => a.hora.localeCompare(b.hora))[0];
  }

  const activas = salas.filter((s) => s.activa);
  const inactivas = salas.filter((s) => !s.activa);

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "0.5rem" }}>Estado de salas</h2>
      <p style={{ fontSize: "0.8rem", color: MID, marginBottom: "1.75rem" }}>Vista en tiempo real del estado de cada sala. Se actualiza cada 30 segundos.</p>

      {/* Estado en tiempo real */}
      {activas.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Estado ahora mismo</p>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "0.75rem" }}>
            {activas.map((sala) => {
              const estado = estadoActual(sala.id);
              const proxima = proximaCita(sala.id);
              return (
                <div key={sala.id} style={{ backgroundColor: LIGHT, border: `1px solid ${estado.ocupada ? "rgba(192,87,74,0.3)" : "rgba(139,26,47,0.3)"}`, borderLeft: `4px solid ${estado.ocupada ? "#C0574A" : "#8B1A2F"}`, borderRadius: "4px", padding: "1.1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: 500, color: DARK }}>{sala.nombre}</p>
                    <span style={{ fontSize: "0.6rem", padding: "0.2rem 0.6rem", borderRadius: "20px", backgroundColor: estado.ocupada ? "rgba(192,87,74,0.1)" : "rgba(139,26,47,0.1)", color: estado.ocupada ? "#C0574A" : "#8B1A2F", fontWeight: 600 }}>
                      {estado.ocupada ? "Ocupada" : "Libre"}
                    </span>
                  </div>
                  {estado.ocupada && estado.cita && (
                    <div>
                      <p style={{ fontSize: "0.75rem", color: DARK }}>{estado.cita.servicio} · {estado.cita.hora}</p>
                      <p style={{ fontSize: "0.7rem", color: MID, marginTop: "0.15rem" }}>
                        {nombreUser(estado.cita.clienteId)} con {nombreUser(estado.cita.profesionalId)}
                      </p>
                      <p style={{ fontSize: "0.68rem", color: MID, marginTop: "0.1rem" }}>
                        Hasta: {(() => {
                          const [h, m] = estado.cita.hora.split(":").map(Number);
                          const fin = h * 60 + m + (DURACION_SERVICIOS[estado.cita.servicio] ?? 60);
                          return `${Math.floor(fin / 60).toString().padStart(2, "0")}:${(fin % 60).toString().padStart(2, "0")}`;
                        })()}
                      </p>
                    </div>
                  )}
                  {!estado.ocupada && proxima && (
                    <p style={{ fontSize: "0.7rem", color: MID }}>Próxima: {proxima.servicio} a las {proxima.hora}</p>
                  )}
                  {!estado.ocupada && !proxima && (
                    <p style={{ fontSize: "0.7rem", color: MID }}>Sin citas pendientes para hoy.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gestión de salas */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem" }}>
        <Card>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Añadir sala</p>
          <form onSubmit={crearSala} style={{ display: "flex", gap: "0.75rem" }}>
            <input value={nuevaNombre} onChange={(e) => setNuevaNombre(e.target.value)} placeholder="Ej: Box 1, Sala Fisio, Sala Cardio..." required
              style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
            <Btn type="submit" small>
              <Plus size={12} style={{ marginRight: 4, display: "inline" }} />Añadir
            </Btn>
          </form>
        </Card>

        <div>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Salas configuradas</p>
          {salas.length === 0 ? (
            <Card><p style={{ fontSize: "0.8rem", color: MID }}>No hay salas configuradas aún.</p></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {salas.map((sala) => (
                <Card key={sala.id} style={{ padding: "0.9rem 1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      {editId === sala.id ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} autoFocus
                            style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid rgba(61,61,61,0.3)", paddingBottom: "0.3rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
                          <Btn small onClick={() => guardarNombre(sala.id)}>✓</Btn>
                          <Btn small variant="ghost" onClick={() => setEditId(null)}>✕</Btn>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <p style={{ fontSize: "0.875rem", color: sala.activa ? DARK : MID, fontWeight: 500 }}>{sala.nombre}</p>
                          <span style={{ fontSize: "0.6rem", padding: "0.15rem 0.45rem", borderRadius: "20px", backgroundColor: sala.activa ? "rgba(139,26,47,0.1)" : "rgba(255,255,255,0.08)", color: sala.activa ? "#8B1A2F" : MID }}>
                            {sala.activa ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      {editId !== sala.id && (
                        <button onClick={() => { setEditId(sala.id); setEditNombre(sala.nombre); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: MID, padding: "0.2rem" }} title="Renombrar">
                          <Pencil size={13} />
                        </button>
                      )}
                      <button onClick={() => toggleActiva(sala.id, !sala.activa)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: sala.activa ? "#C08A2E" : "#8B1A2F", padding: "0.2rem" }} title={sala.activa ? "Desactivar" : "Activar"}>
                        {sala.activa ? <XCircle size={13} /> : <CheckCircle size={13} />}
                      </button>
                      <button onClick={() => eliminarSala(sala.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#C0574A", padding: "0.2rem" }} title="Eliminar">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── LISTA DE ESPERA ────────────────────────────────────────────────────────
function SeccionListaEspera() {
  const [lista, setLista] = useState<ListaEspera[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);

  function recargar() {
    setLista(listaEsperaStore.getAll());
    setUsuarios(getUsers());
  }

  useEffect(() => { recargar(); }, []);

  function nombreUser(id: string) {
    return usuarios.find((u) => u.id === id)?.nombre || id;
  }
  function eliminar(id: string) {
    listaEsperaStore.remove(id);
    recargar();
  }
  function notificarManual(entrada: ListaEspera) {
    mensajesStore.send({ de: "admin-1", para: entrada.clienteId, texto: `Recordatorio: hay un posible hueco para ${entrada.servicio} el ${new Date(entrada.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} a las ${entrada.hora}. Entra en tu área personal para reservarlo.`, fecha: new Date().toISOString() });
    recargar();
  }

  // Group by servicio+fecha+hora
  type Grupo = { key: string; servicio: string; fecha: string; hora: string; entradas: ListaEspera[] };
  const grupos: Grupo[] = [];
  const keys = new Set<string>();
  for (const le of lista) {
    const key = `${le.servicio}|${le.fecha}|${le.hora}`;
    if (!keys.has(key)) {
      keys.add(key);
      grupos.push({ key, servicio: le.servicio, fecha: le.fecha, hora: le.hora, entradas: [] });
    }
    grupos.find(g => g.key === key)!.entradas.push(le);
  }
  grupos.forEach(g => {
    g.entradas.sort((a, b) => {
      const ao = (a as ListaEspera & { orden?: number }).orden;
      const bo = (b as ListaEspera & { orden?: number }).orden;
      if (ao !== undefined && bo !== undefined) return ao - bo;
      return a.creadoEn.localeCompare(b.creadoEn);
    });
  });
  grupos.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

  function moverArriba(grupo: Grupo, idx: number) {
    if (idx === 0) return;
    const ids = grupo.entradas.map(e => e.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    listaEsperaStore.reordenar(ids);
    recargar();
  }
  function moverAbajo(grupo: Grupo, idx: number) {
    if (idx === grupo.entradas.length - 1) return;
    const ids = grupo.entradas.map(e => e.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    listaEsperaStore.reordenar(ids);
    recargar();
  }

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "0.5rem" }}>Lista de espera</h2>
      <p style={{ fontSize: "0.8rem", color: MID, marginBottom: "1.75rem" }}>Clientes en lista de espera agrupados por hueco. Cuando se cancela una cita, el primero de la lista recibe una notificación automática. Puedes reordenar manualmente.</p>

      {grupos.length === 0 ? (
        <Card><p style={{ fontSize: "0.8rem", color: MID, textAlign: "center", padding: "2rem 0" }}>No hay nadie en lista de espera.</p></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {grupos.map((grupo) => (
            <div key={grupo.key}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID }}>
                  {grupo.servicio} · {new Date(grupo.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })} · {grupo.hora}
                </p>
                <span style={{ fontSize: "0.6rem", padding: "0.15rem 0.45rem", borderRadius: "20px", backgroundColor: "rgba(61,61,61,0.08)", color: MID }}>{grupo.entradas.length} en cola</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {grupo.entradas.map((le, idx) => {
                  const esNotificado = le.notificado && !le.expirado;
                  const esExpirado = le.expirado;
                  return (
                    <Card key={le.id} style={{ opacity: esExpirado ? 0.5 : 1, borderLeft: esNotificado ? "4px solid #3D3D3D" : esExpirado ? "4px solid #C0574A" : undefined }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: MID, minWidth: 24, textAlign: "center" }}>#{idx + 1}</span>
                          <div>
                            <p style={{ fontSize: "0.82rem", fontWeight: 500, color: DARK }}>{nombreUser(le.clienteId)}</p>
                            <p style={{ fontSize: "0.65rem", color: MID }}>
                              {new Date(le.creadoEn).toLocaleDateString("es-ES")} {new Date(le.creadoEn).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                              {esNotificado && <span style={{ marginLeft: "0.5rem", color: "#8B1A2F", fontWeight: 600 }}>• Notificado</span>}
                              {esExpirado && <span style={{ marginLeft: "0.5rem", color: "#C0574A", fontWeight: 600 }}>• Expirado</span>}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                          {!le.notificado && (
                            <>
                              <button onClick={() => moverArriba(grupo, idx)} disabled={idx === 0} title="Mover arriba" style={{ background: "none", border: "1px solid #3D3D3D", borderRadius: "4px", cursor: idx === 0 ? "not-allowed" : "pointer", color: idx === 0 ? "#3D3D3D" : DARK, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>↑</button>
                              <button onClick={() => moverAbajo(grupo, idx)} disabled={idx === grupo.entradas.length - 1} title="Mover abajo" style={{ background: "none", border: "1px solid #3D3D3D", borderRadius: "4px", cursor: idx === grupo.entradas.length - 1 ? "not-allowed" : "pointer", color: idx === grupo.entradas.length - 1 ? "#3D3D3D" : DARK, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>↓</button>
                              <Btn small onClick={() => notificarManual(le)}>
                                <Send size={11} style={{ marginRight: 4, display: "inline" }} />Notificar
                              </Btn>
                            </>
                          )}
                          <Btn small variant="outline" onClick={() => eliminar(le.id)}>
                            <Trash2 size={11} style={{ marginRight: 4, display: "inline" }} />Quitar
                          </Btn>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── GESTIÓN DE USUARIOS ────────────────────────────────────────────────────
function SeccionUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "cliente" | "profesional" | "admin">("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => { setUsuarios(getUsers()); }, []);

  function toggle(id: string, estado: "activo" | "inactivo") {
    updateUser(id, { estado });
    setUsuarios(getUsers());
  }
  function cambiarRol(id: string, role: User["role"]) {
    updateUser(id, { role });
    setUsuarios(getUsers());
  }

  const filtrados = usuarios.filter((u) => {
    const matchFiltro = filtro === "todos" || u.role === filtro;
    const matchBusqueda = !busqueda || u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.email.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Gestión de usuarios</h2>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o email..."
          style={{ flex: 1, minWidth: 200, background: "transparent", border: "1px solid #3D3D3D", padding: "0.5rem 0.75rem", borderRadius: "2px", fontSize: "0.8rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["todos", "cliente", "profesional", "admin"] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "capitalize", borderRadius: "2px", border: `1px solid ${filtro === f ? "#8B1A2F" : "#3D3D3D"}`, backgroundColor: filtro === f ? "#8B1A2F" : "transparent", color: filtro === f ? "#FFFFFF" : MID, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtrados.map((u) => (
          <Card key={u.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: DARK }}>{u.nombre}</p>
                  {rolBadge(u.role)}
                  {estadoBadge(u.estado)}
                </div>
                <p style={{ fontSize: "0.7rem", color: MID }}>{u.email} · Alta: {new Date(u.creadoEn).toLocaleDateString("es-ES")}</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <select value={u.role} onChange={(e) => cambiarRol(u.id, e.target.value as User["role"])}
                  style={{ fontSize: "0.65rem", padding: "0.3rem 0.5rem", borderRadius: "2px", border: "1px solid #3D3D3D", background: LIGHT, color: DARK, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                  <option value="cliente">Cliente</option>
                  <option value="profesional">Profesional</option>
                  <option value="admin">Admin</option>
                </select>
                {u.estado === "activo" ? (
                  <Btn small variant="outline" onClick={() => toggle(u.id, "inactivo")}>
                    <UserX size={11} style={{ marginRight: 4, display: "inline" }} />Desactivar
                  </Btn>
                ) : (
                  <Btn small onClick={() => toggle(u.id, "activo")}>
                    <UserCheck size={11} style={{ marginRight: 4, display: "inline" }} />Activar
                  </Btn>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p style={{ fontSize: "0.7rem", color: MID, marginTop: "1rem" }}>{filtrados.length} usuario{filtrados.length !== 1 ? "s" : ""} mostrado{filtrados.length !== 1 ? "s" : ""}.</p>
    </div>
  );
}

// ── LISTA DE CLIENTES ──────────────────────────────────────────────────────
function SeccionClientes() {
  const [clientes, setClientes] = useState<User[]>([]);
  const [todos, setTodos] = useState<User[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [selCliente, setSelCliente] = useState<User | null>(null);

  useEffect(() => {
    const users = getUsers();
    setTodos(users);
    setClientes(users.filter((u) => u.role === "cliente"));
    setCitas(citasStore.getAll());
  }, []);

  function nombrePro(id?: string) {
    if (!id) return "Sin asignar";
    return todos.find((u) => u.id === id)?.nombre || "—";
  }
  function citasDeCliente(id: string) {
    return citas.filter((c) => c.clienteId === id);
  }

  const filtrados = clientes.filter((c) =>
    !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Lista de clientes</h2>

      <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar cliente..."
        style={{ display: "block", width: "100%", maxWidth: 320, marginBottom: "1.25rem", background: "transparent", border: "1px solid #3D3D3D", padding: "0.5rem 0.75rem", borderRadius: "2px", fontSize: "0.8rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtrados.length === 0 ? (
            <Card><p style={{ fontSize: "0.8rem", color: MID }}>No hay clientes registrados.</p></Card>
          ) : filtrados.map((c) => {
            const numCitas = citasDeCliente(c.id).length;
            const sel = selCliente?.id === c.id;
            return (
              <button key={c.id} onClick={() => setSelCliente(sel ? null : c)} style={{ textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
                <Card style={{ borderLeft: sel ? `3px solid #8B1A2F` : "3px solid transparent", transition: "border-color 0.15s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: DARK, marginBottom: "0.2rem" }}>{c.nombre}</p>
                      <p style={{ fontSize: "0.7rem", color: MID }}>{c.email}</p>
                      <p style={{ fontSize: "0.7rem", color: MID, marginTop: "0.15rem" }}>
                        {nombrePro(c.profesionalAsignadoId)} · {numCitas} cita{numCitas !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {estadoBadge(c.estado)}
                      <p style={{ fontSize: "0.8rem", color: DARK, marginTop: "0.4rem", fontWeight: 600 }}>{c.creditos}€</p>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>

        <div>
          {selCliente ? (
            <Card>
              <p className="font-serif" style={{ fontSize: "1.1rem", fontWeight: 400, color: DARK, marginBottom: "1rem" }}>{selCliente.nombre}</p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  ["Email", selCliente.email],
                  ["Teléfono", selCliente.telefono || "—"],
                  ["Fecha nacimiento", selCliente.fechaNacimiento || "—"],
                  ["Créditos", `${selCliente.creditos}€`],
                  ["Profesional asignado", nombrePro(selCliente.profesionalAsignadoId)],
                  ["Registro", new Date(selCliente.creadoEn).toLocaleDateString("es-ES")],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "0.55rem 0", borderBottom: "1px solid rgba(61,61,61,0.07)" }}>
                    <span style={{ fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MID }}>{l}</span>
                    <span style={{ fontSize: "0.8rem", color: DARK }}>{v}</span>
                  </div>
                ))}
              </div>
              {selCliente.historialMedico && (
                <div style={{ marginTop: "1rem" }}>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.5rem" }}>Historial médico</p>
                  {[
                    ["Lesiones", selCliente.historialMedico.lesiones],
                    ["Alergias", selCliente.historialMedico.alergias],
                    ["Medicación", selCliente.historialMedico.medicacion],
                  ].map(([l, v]) => (
                    <p key={l} style={{ fontSize: "0.75rem", color: MID, marginBottom: "0.2rem" }}><strong>{l}:</strong> {v || "—"}</p>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.5rem" }}>
                  Citas ({citasDeCliente(selCliente.id).length})
                </p>
                {citasDeCliente(selCliente.id).slice(0, 5).map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0.35rem 0", borderBottom: "1px solid rgba(61,61,61,0.06)" }}>
                    <span style={{ color: DARK }}>{c.fecha} · {c.hora}</span>
                    <span style={{ color: MID }}>{c.servicio}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <p style={{ fontSize: "0.8rem", color: MID, textAlign: "center", padding: "2rem 0" }}>Selecciona un cliente para ver su ficha completa.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── COMUNICACIONES ─────────────────────────────────────────────────────────
function SeccionComunicaciones() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [destinatario, setDestinatario] = useState<"todos_clientes" | "todos_profesionales" | "usuario">("todos_clientes");
  const [usuarioId, setUsuarioId] = useState("");
  const [texto, setTexto] = useState("");
  const [enviados, setEnviados] = useState(0);
  const [ok, setOk] = useState(false);

  useEffect(() => { setUsuarios(getUsers()); }, []);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    let receptores: string[] = [];
    if (destinatario === "todos_clientes") {
      receptores = usuarios.filter((u) => u.role === "cliente" && u.estado === "activo").map((u) => u.id);
    } else if (destinatario === "todos_profesionales") {
      receptores = usuarios.filter((u) => u.role === "profesional" && u.estado === "activo").map((u) => u.id);
    } else if (usuarioId) {
      receptores = [usuarioId];
    }
    for (const para of receptores) {
      mensajesStore.send({ de: "admin-1", para, texto, fecha: new Date().toISOString() });
    }
    setEnviados(receptores.length);
    setTexto("");
    setOk(true);
    setTimeout(() => setOk(false), 4000);
  }

  const countClientes = usuarios.filter((u) => u.role === "cliente" && u.estado === "activo").length;
  const countProfes = usuarios.filter((u) => u.role === "profesional" && u.estado === "activo").length;

  const destLabels: Record<string, string> = {
    todos_clientes: `Todos los clientes activos (${countClientes})`,
    todos_profesionales: `Todos los profesionales activos (${countProfes})`,
    usuario: "Usuario específico",
  };

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "0.5rem" }}>Comunicaciones</h2>
      <p style={{ fontSize: "0.8rem", color: MID, marginBottom: "1.75rem" }}>Envía un mensaje a uno o varios usuarios. Recibirán el mensaje en su sección de mensajes.</p>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem" }}>
        <Card>
          <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <Label>Destinatario</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.25rem" }}>
                {(["todos_clientes", "todos_profesionales", "usuario"] as const).map((d) => (
                  <label key={d} style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.82rem", color: DARK }}>
                    <input type="radio" name="dest" value={d} checked={destinatario === d} onChange={() => { setDestinatario(d); setUsuarioId(""); }} style={{ accentColor: DARK }} />
                    {destLabels[d]}
                  </label>
                ))}
              </div>
            </div>

            {destinatario === "usuario" && (
              <div>
                <Label>Usuario</Label>
                <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} required
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.6rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                  <option value="">— Seleccionar —</option>
                  {usuarios.filter((u) => u.role !== "admin").map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre} ({u.role})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label>Mensaje</Label>
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)} required rows={5} placeholder="Escribe tu mensaje aquí..."
                style={{ width: "100%", background: "transparent", border: "1px solid #3D3D3D", borderRadius: "2px", padding: "0.75rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", resize: "vertical", boxSizing: "border-box" }} />
            </div>

            {ok && <p style={{ fontSize: "0.8rem", color: "#8B1A2F" }}>✓ Mensaje enviado a {enviados} usuario{enviados !== 1 ? "s" : ""}.</p>}

            <div>
              <Btn type="submit" disabled={!texto}>
                <Send size={12} style={{ marginRight: 6, display: "inline" }} />
                Enviar mensaje
              </Btn>
            </div>
          </form>
        </Card>

        <Card>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Información</p>
          <p style={{ fontSize: "0.8rem", color: MID, lineHeight: 1.8 }}>
            Los mensajes enviados desde aquí aparecerán en la bandeja de mensajes de cada destinatario.
            Los clientes los verán en su panel en <strong>Mensajes</strong>, y los profesionales en su sección correspondiente.
          </p>
        </Card>
      </div>
    </div>
  );
}

// ── DATOS Y HORARIOS DE PROFESIONALES ─────────────────────────────────────
function SeccionProfesionales() {
  const [profesionales, setProfesionales] = useState<User[]>([]);
  const [selPro, setSelPro] = useState<User | null>(null);
  const [nombre, setNombre] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [bio, setBio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [colegiado, setColegiado] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => { setProfesionales(getUsers().filter((u) => u.role === "profesional")); }, []);

  function selectPro(pro: User) {
    setSelPro(pro);
    setNombre(pro.nombre);
    setEspecialidad(pro.especialidad || "");
    setBio(pro.bio || "");
    setTelefono(pro.telefono || "");
    setColegiado(pro.numeroColegiado || "");
    setOk(false);
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!selPro) return;
    updateUser(selPro.id, { nombre, especialidad, bio, telefono, numeroColegiado: colegiado });
    setProfesionales(getUsers().filter((u) => u.role === "profesional"));
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  }

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Datos y horarios de profesionales</h2>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem", alignItems: "start" }}>
        <div>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Selecciona un profesional para editar</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {profesionales.length === 0 ? (
              <Card><p style={{ fontSize: "0.8rem", color: MID }}>No hay profesionales registrados.</p></Card>
            ) : profesionales.map((p) => {
              const sel = selPro?.id === p.id;
              return (
                <button key={p.id} onClick={() => selectPro(p)} style={{ textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>
                  <Card style={{ borderLeft: sel ? `3px solid #8B1A2F` : "3px solid transparent", transition: "border-color 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: DARK, marginBottom: "0.2rem" }}>{p.nombre}</p>
                        <p style={{ fontSize: "0.7rem", color: MID }}>{p.especialidad || p.profesionalType}</p>
                        {p.numeroColegiado && <p style={{ fontSize: "0.68rem", color: MID, marginTop: "0.1rem" }}>Col. {p.numeroColegiado}</p>}
                      </div>
                      {estadoBadge(p.estado)}
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {selPro ? (
            <Card>
              <p className="font-serif" style={{ fontSize: "1rem", fontWeight: 400, color: DARK, marginBottom: "1.25rem" }}>
                Editar — {selPro.nombre.split(" ")[0]}
              </p>
              <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {[
                  { l: "Nombre completo", v: nombre, s: setNombre },
                  { l: "Especialidad", v: especialidad, s: setEspecialidad },
                  { l: "Nº colegiado", v: colegiado, s: setColegiado },
                  { l: "Teléfono", v: telefono, s: setTelefono },
                ].map(({ l, v, s }) => (
                  <div key={l}>
                    <Label>{l}</Label>
                    <input value={v} onChange={(e) => s(e.target.value)}
                      style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", boxSizing: "border-box" }} />
                  </div>
                ))}
                <div>
                  <Label>Biografía</Label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                    style={{ width: "100%", background: "transparent", border: "1px solid #3D3D3D", borderRadius: "2px", padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", resize: "vertical", boxSizing: "border-box" }} />
                </div>
                {ok && <p style={{ fontSize: "0.8rem", color: "#8B1A2F" }}>✓ Datos guardados correctamente.</p>}
                <div><Btn type="submit">Guardar cambios</Btn></div>
              </form>
            </Card>
          ) : (
            <Card>
              <p style={{ fontSize: "0.8rem", color: MID, textAlign: "center", padding: "2rem 0" }}>Selecciona un profesional para editar sus datos.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── APROBACIONES PENDIENTES ────────────────────────────────────────────────
function SeccionPendientes() {
  const [pendientes, setPendientes] = useState<User[]>([]);

  useEffect(() => {
    setPendientes(getUsers().filter((u) => u.role === "profesional" && u.estado === "pendiente"));
  }, []);

  function aprobar(id: string) {
    updateUser(id, { estado: "activo" });
    setPendientes(getUsers().filter((u) => u.role === "profesional" && u.estado === "pendiente"));
  }
  function rechazar(id: string) {
    updateUser(id, { estado: "inactivo" });
    setPendientes(getUsers().filter((u) => u.role === "profesional" && u.estado === "pendiente"));
  }

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Aprobaciones pendientes</h2>

      {pendientes.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <CheckCircle size={32} color="#8B1A2F" style={{ margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.875rem", color: MID }}>No hay profesionales pendientes de aprobación.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {pendientes.map((u) => (
            <Card key={u.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <p style={{ fontSize: "0.95rem", fontWeight: 500, color: DARK, marginBottom: "0.25rem" }}>{u.nombre}</p>
                  <p style={{ fontSize: "0.75rem", color: MID, marginBottom: "0.15rem" }}>{u.email} · {u.telefono}</p>
                  <p style={{ fontSize: "0.75rem", color: MID }}>
                    Tipo: {u.profesionalType === "entrenador" ? "Entrenador/a" : "Fisioterapeuta"}
                    {u.numeroColegiado && ` · Colegiado: ${u.numeroColegiado}`}
                  </p>
                  <p style={{ fontSize: "0.7rem", color: MID, marginTop: "0.25rem" }}>
                    Solicitado: {new Date(u.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Btn small onClick={() => aprobar(u.id)}>
                    <CheckCircle size={11} style={{ marginRight: 4, display: "inline" }} />Aprobar
                  </Btn>
                  <Btn small variant="danger" onClick={() => rechazar(u.id)}>
                    <XCircle size={11} style={{ marginRight: 4, display: "inline" }} />Rechazar
                  </Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ASIGNACIONES ───────────────────────────────────────────────────────────
function SeccionAsignaciones() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [selCliente, setSelCliente] = useState("");
  const [selPro, setSelPro] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => { setUsuarios(getUsers()); }, []);

  const clientes = usuarios.filter((u) => u.role === "cliente");
  const profesionales = usuarios.filter((u) => u.role === "profesional" && u.estado === "activo");

  function asignar() {
    if (!selCliente || !selPro) return;
    updateUser(selCliente, { profesionalAsignadoId: selPro });
    const pro = usuarios.find((u) => u.id === selPro);
    if (pro) {
      const ids = new Set([...(pro.clientesIds || []), selCliente]);
      updateUser(selPro, { clientesIds: Array.from(ids) });
    }
    setUsuarios(getUsers());
    setOk(true);
    setTimeout(() => setOk(false), 3000);
  }

  function proDeCliente(id: string) {
    const u = usuarios.find((x) => x.id === id);
    if (!u?.profesionalAsignadoId) return "Sin asignar";
    return usuarios.find((x) => x.id === u.profesionalAsignadoId)?.nombre || "—";
  }

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Asignaciones profesional — cliente</h2>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem" }}>
        <Card>
          <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "1.25rem" }}>Asignar profesional a cliente</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <Label>Cliente</Label>
              <select value={selCliente} onChange={(e) => setSelCliente(e.target.value)}
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.6rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                <option value="">Seleccionar cliente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <Label>Profesional</Label>
              <select value={selPro} onChange={(e) => setSelPro(e.target.value)}
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.6rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                <option value="">Seleccionar profesional</option>
                {profesionales.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.especialidad || p.profesionalType})</option>)}
              </select>
            </div>
            {ok && <p style={{ fontSize: "0.8rem", color: "#8B1A2F" }}>✓ Asignación guardada correctamente.</p>}
            <div><Btn onClick={asignar} disabled={!selCliente || !selPro}>Guardar asignación</Btn></div>
          </div>
        </Card>

        <div>
          <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Asignaciones actuales</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {clientes.map((c) => (
              <Card key={c.id}>
                <p style={{ fontSize: "0.85rem", fontWeight: 500, color: DARK, marginBottom: "0.2rem" }}>{c.nombre}</p>
                <p style={{ fontSize: "0.7rem", color: c.profesionalAsignadoId ? DARK : MID }}>
                  {c.profesionalAsignadoId ? (
                    <><UserCheck size={11} style={{ display: "inline", marginRight: 4 }} />{proDeCliente(c.id)}</>
                  ) : "Sin profesional asignado"}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PAGOS Y BONOS ──────────────────────────────────────────────────────────
function SeccionPagos() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [filCliente, setFilCliente] = useState("");

  useEffect(() => {
    const users = getUsers();
    setUsuarios(users);
    const clientes = users.filter((u) => u.role === "cliente");
    const allPagos: Pago[] = [];
    const allBonos: Bono[] = [];
    for (const c of clientes) {
      allPagos.push(...pagosStore.getByCliente(c.id));
      allBonos.push(...bonosStore.getByCliente(c.id));
    }
    setPagos(allPagos.sort((a, b) => b.fecha.localeCompare(a.fecha)));
    setBonos(allBonos);
  }, []);

  function nombreUser(id: string) {
    return usuarios.find((u) => u.id === id)?.nombre || id;
  }

  const clientes = usuarios.filter((u) => u.role === "cliente");
  const pagosFiltrados = filCliente ? pagos.filter((p) => p.clienteId === filCliente) : pagos;
  const ingresoTotal = pagos.filter((p) => p.monto > 0).reduce((acc, p) => acc + p.monto, 0);
  const bonosActivos = bonos.filter((b) => b.activo);

  function tipoPagoBadge(tipo: Pago["tipo"]) {
    const map = { recarga: { bg: "rgba(139,26,47,0.1)", color: "#8B1A2F", label: "Recarga" }, sesion: { bg: "rgba(74,111,165,0.1)", color: "#4A6FA5", label: "Sesión" }, bono: { bg: "rgba(122,92,142,0.1)", color: "#7A5C8E", label: "Bono" } };
    const s = map[tipo];
    return <span style={{ fontSize: "0.6rem", padding: "0.2rem 0.55rem", borderRadius: "20px", backgroundColor: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span>;
  }

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Pagos y bonos</h2>

      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1rem", marginBottom: "2rem" }}>
        <KpiCard label="Ingresos totales" value={`${ingresoTotal}€`} sub="Recargas y bonos" accent="#8B1A2F" />
        <KpiCard label="Bonos activos" value={bonosActivos.length} sub={`de ${bonos.length} en total`} accent="#7A5C8E" />
        <KpiCard label="Movimientos" value={pagos.length} sub="Todos los registros" accent="#4A6FA5" />
      </div>

      {/* Bonos activos */}
      {bonosActivos.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Bonos activos por cliente</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {bonosActivos.map((b) => (
              <Card key={b.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div>
                    <p style={{ fontSize: "0.85rem", fontWeight: 500, color: DARK }}>{b.nombre}</p>
                    <p style={{ fontSize: "0.7rem", color: MID }}>{nombreUser(b.clienteId)}</p>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: DARK, fontWeight: 500 }}>{b.sesionesUsadas}/{b.sesionesTotales} sesiones</span>
                </div>
                <div style={{ height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
                  <div style={{ height: "100%", width: `${(b.sesionesUsadas / b.sesionesTotales) * 100}%`, backgroundColor: "#8B1A2F", borderRadius: "3px" }} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Historial pagos */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID }}>Historial de movimientos</p>
          <select value={filCliente} onChange={(e) => setFilCliente(e.target.value)}
            style={{ fontSize: "0.7rem", padding: "0.3rem 0.5rem", borderRadius: "2px", border: "1px solid #3D3D3D", background: LIGHT, color: DARK, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
            <option value="">Todos los clientes</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {pagosFiltrados.length === 0 ? (
            <Card><p style={{ fontSize: "0.8rem", color: MID }}>No hay movimientos registrados.</p></Card>
          ) : pagosFiltrados.map((p) => (
            <Card key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.2rem" }}>
                    {tipoPagoBadge(p.tipo)}
                    <p style={{ fontSize: "0.82rem", color: DARK }}>{p.descripcion}</p>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: MID }}>{nombreUser(p.clienteId)} · {new Date(p.fecha).toLocaleDateString("es-ES")}</p>
                </div>
                <p style={{ fontSize: "0.95rem", fontWeight: 600, color: p.monto > 0 ? "#8B1A2F" : "#C0574A" }}>
                  {p.monto > 0 ? "+" : ""}{p.monto}€
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ESTADÍSTICAS ───────────────────────────────────────────────────────────
function SeccionEstadisticas() {
  const [stats, setStats] = useState({
    totalClientes: 0, totalProfesionales: 0,
    totalCitas: 0, citasMes: 0,
    pendientes: 0, completadas: 0, canceladas: 0,
  });
  const [porServicio, setPorServicio] = useState<[string, number][]>([]);
  const [porPro, setPorPro] = useState<{ nombre: string; count: number }[]>([]);

  useEffect(() => {
    const users = getUsers();
    const citas = citasStore.getAll();
    const hoy = new Date();
    const mesInicio = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;

    const srvMap: Record<string, number> = {};
    for (const c of citas) {
      srvMap[c.servicio] = (srvMap[c.servicio] || 0) + 1;
    }

    setStats({
      totalClientes: users.filter((u) => u.role === "cliente").length,
      totalProfesionales: users.filter((u) => u.role === "profesional" && u.estado === "activo").length,
      totalCitas: citas.length,
      citasMes: citas.filter((c) => c.fecha >= mesInicio).length,
      pendientes: citas.filter((c) => c.estado === "pendiente").length,
      completadas: citas.filter((c) => c.estado === "completada").length,
      canceladas: citas.filter((c) => c.estado === "cancelada").length,
    });

    setPorServicio(Object.entries(srvMap).sort((a, b) => b[1] - a[1]));
    setPorPro(
      users.filter((u) => u.role === "profesional").map((p) => ({
        nombre: p.nombre,
        count: citas.filter((c) => c.profesionalId === p.id).length,
      })).sort((a, b) => b.count - a.count)
    );
  }, []);

  const maxSrv = Math.max(...porServicio.map(([, n]) => n), 1);
  const maxPro = Math.max(...porPro.map((p) => p.count), 1);

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Estadísticas</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: "1rem", marginBottom: "2rem" }}>
        <KpiCard label="Clientes" value={stats.totalClientes} accent="#4A6FA5" />
        <KpiCard label="Profesionales" value={stats.totalProfesionales} accent="#7A5C8E" />
        <KpiCard label="Citas totales" value={stats.totalCitas} accent={DARK} />
        <KpiCard label="Citas este mes" value={stats.citasMes} accent="#8B1A2F" />
      </div>

      {/* Estado de citas */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Pendientes", value: stats.pendientes, color: "#4A6FA5" },
          { label: "Completadas", value: stats.completadas, color: "#8B1A2F" },
          { label: "Canceladas", value: stats.canceladas, color: "#C0574A" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: LIGHT, border: "1px solid rgba(61,61,61,0.1)", borderRadius: "4px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{value}</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: MID }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem" }}>
        {/* Por servicio */}
        <Card>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Citas por servicio</p>
          {porServicio.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: MID }}>Sin datos.</p>
          ) : porServicio.map(([serv, count]) => (
            <div key={serv} style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.78rem", color: DARK }}>{serv}</span>
                <span style={{ fontSize: "0.75rem", color: MID, fontWeight: 500 }}>{count}</span>
              </div>
              <div style={{ height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
                <div style={{ height: "100%", width: `${(count / maxSrv) * 100}%`, backgroundColor: "#8B1A2F", borderRadius: "3px" }} />
              </div>
            </div>
          ))}
        </Card>

        {/* Por profesional */}
        <Card>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Citas por profesional</p>
          {porPro.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: MID }}>Sin datos.</p>
          ) : porPro.map((p) => (
            <div key={p.nombre} style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.78rem", color: DARK }}>{p.nombre}</span>
                <span style={{ fontSize: "0.75rem", color: MID, fontWeight: 500 }}>{p.count}</span>
              </div>
              <div style={{ height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
                <div style={{ height: "100%", width: `${(p.count / maxPro) * 100}%`, backgroundColor: "#8B1A2F", borderRadius: "3px" }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── CONFIGURACIÓN ──────────────────────────────────────────────────────────
function SeccionConfiguracion() {
  const SERVICIOS_INFO = [
    { nombre: "Fisioterapia Esencial", duracion: "45 min", precio: "50€/sesión" },
    { nombre: "Fisioterapia Avanzada", duracion: "75 min", precio: "65€/sesión" },
    { nombre: "Entrenamiento Individual", duracion: "60 min", precio: "45€/sesión" },
    { nombre: "Entrenamiento Dúo", duracion: "60 min", precio: "22,50€/persona" },
    { nombre: "Entrenamiento Grupo", duracion: "60 min", precio: "15€/persona" },
    { nombre: "Podología", duracion: "60 min", precio: "Consultar" },
  ];

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Configuración del centro</h2>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem" }}>
        <Card>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Información del centro</p>
          {[
            ["Centro", "Veysic"],
            ["Dirección", "Avda. Paseo de Europa 7-9, 41012 Sevilla"],
            ["Teléfono", "610 178 423"],
            ["Email principal", "luis_garvey@hotmail.com"],
            ["Email secundario", "gonzalo_garvey@hotmail.com"],
            ["Horario", "Lunes a Viernes: 05:30 – 21:00"],
            ["Fines de semana", "Cerrado"],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "0.55rem 0", borderBottom: "1px solid rgba(61,61,61,0.07)", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MID }}>{l}</span>
              <span style={{ fontSize: "0.8rem", color: DARK }}>{v}</span>
            </div>
          ))}
        </Card>

        <div>
          <Card style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Servicios y precios</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {SERVICIOS_INFO.map((s) => (
                <div key={s.nombre} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: "1px solid rgba(61,61,61,0.07)", flexWrap: "wrap", gap: "0.25rem" }}>
                  <div>
                    <p style={{ fontSize: "0.8rem", color: DARK }}>{s.nombre}</p>
                    <p style={{ fontSize: "0.65rem", color: MID }}>{s.duracion}</p>
                  </div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: DARK }}>{s.precio}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.5rem" }}>Sistema de reservas</p>
            <p style={{ fontSize: "0.8rem", color: MID, lineHeight: 1.7 }}>
              Las citas se gestionan mediante el sistema de reservas integrado. Los bloques de no disponibilidad los configura cada profesional desde su panel.
              Las citas se pueden cancelar con un mínimo de 24 horas de antelación.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── LAYOUT ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>("estadisticas");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "admin") {
      router.push(user.role === "profesional" ? "/profesional" : "/perfil");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") return null;

  function handleLogout() {
    logout();
    setUser(null);
    router.push("/");
  }

  const pendientesCount = getUsers().filter((u) => u.role === "profesional" && u.estado === "pendiente").length;

  const SECCIONES_MAP: Record<Seccion, React.ReactNode> = {
    citas: <SeccionCitas />,
    salas: <SeccionSalas />,
    calendario: <SeccionCalendario />,
    listaespera: <SeccionListaEspera />,
    usuarios: <SeccionUsuarios />,
    clientes: <SeccionClientes />,
    comunicaciones: <SeccionComunicaciones />,
    profesionales: <SeccionProfesionales />,
    pendientes: <SeccionPendientes />,
    asignaciones: <SeccionAsignaciones />,
    pagos: <SeccionPagos />,
    estadisticas: <SeccionEstadisticas />,
    configuracion: <SeccionConfiguracion />,
  };

  function SidebarNav({ mobile }: { mobile?: boolean }) {
    return (
      <nav style={{ flex: 1, overflowY: "auto", padding: mobile ? "0.5rem 0" : "0.5rem 0" }}>
        {GRUPOS.map(({ label, secciones }) => (
          <div key={label}>
            <p style={{ padding: "0.85rem 1.5rem 0.3rem", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
              {label}
            </p>
            {secciones.map(({ id, label: secLabel, Icon }) => (
              <button key={id}
                onClick={() => { setSeccion(id); setSidebarOpen(false); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0.6rem 1.5rem", background: "none", border: "none", borderLeft: `3px solid ${seccion === id ? "#8B1A2F" : "transparent"}`, backgroundColor: seccion === id ? "rgba(139,26,47,0.08)" : "transparent", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif", fontSize: "0.78rem", color: seccion === id ? "#8B1A2F" : MID, textAlign: "left", transition: "all 0.15s" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <Icon size={15} />{secLabel}
                </span>
                {id === "pendientes" && pendientesCount > 0 && (
                  <span style={{ backgroundColor: "#C08A2E", color: "#fff", borderRadius: "20px", padding: "0.1rem 0.5rem", fontSize: "0.58rem", fontWeight: 600 }}>{pendientesCount}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, backgroundColor: "rgba(44,44,44,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(61,61,61,0.1)", padding: "0 1.5rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: DARK }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <Link href="/" className="font-serif uppercase" style={{ letterSpacing: "0.28em", fontSize: "1rem", color: DARK, textDecoration: "none" }}>Veysic</Link>
          <ChevronRight size={14} color={MID} />
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID }}>Administración</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span className="hidden md:block" style={{ fontSize: "0.75rem", color: MID }}>{user.nombre}</span>
          <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: MID }} title="Cerrar sesión">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 30 }} />}

        {/* Desktop sidebar */}
        <aside className="hidden md:flex" style={{ width: 220, flexShrink: 0, backgroundColor: LIGHT, borderRight: "1px solid rgba(61,61,61,0.1)", position: "fixed", top: 60, bottom: 0, flexDirection: "column" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(61,61,61,0.08)" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 500, color: DARK }}>{user.nombre}</p>
            <p style={{ fontSize: "0.65rem", color: MID }}>Administrador</p>
          </div>
          <SidebarNav />
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <aside style={{ position: "fixed", top: 60, left: 0, bottom: 0, width: 240, backgroundColor: LIGHT, borderRight: "1px solid rgba(61,61,61,0.1)", zIndex: 35, display: "flex", flexDirection: "column" }}>
            <SidebarNav mobile />
          </aside>
        )}

        <main style={{ flex: 1, padding: "2rem 1.5rem" }} className="md:ml-[220px]">
          <div style={{ maxWidth: 920, margin: "0 auto" }}>
            {SECCIONES_MAP[seccion]}
          </div>
        </main>
      </div>
    </div>
  );
}
