"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Calendar,
  Users,
  Dumbbell,
  MessageCircle,
  LogOut,
  Send,
  ChevronRight,
  Upload,
  Plus,
  X,
  Check,
  Lock,
  Trash2,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { updateUser, getUserById, getUsers, logout } from "../lib/auth";
import type { User as UserType } from "../lib/auth";
import {
  citasStore,
  mensajesStore,
  planesStore,
  documentosStore,
  bloqueosStore,
  salasStore,
  notificarListaEspera,
} from "../lib/store";
import type { Cita, Mensaje, PlanEntrenamiento, Ejercicio, Bloqueo, Sala } from "../lib/store";

const BG = "#2C2C2C";
const DARK = "#FFFFFF";
const MID = "#A0A0A0";
const LIGHT = "#3D3D3D";

type Seccion = "perfil" | "agenda" | "clientes" | "planes" | "mensajes";

const SECCIONES: { id: Seccion; label: string; Icon: React.ElementType }[] = [
  { id: "perfil", label: "Mi perfil", Icon: User },
  { id: "agenda", label: "Mi agenda", Icon: Calendar },
  { id: "clientes", label: "Mis clientes", Icon: Users },
  { id: "planes", label: "Planes", Icon: Dumbbell },
  { id: "mensajes", label: "Mensajes", Icon: MessageCircle },
];

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: MID, marginBottom: "0.5rem" }}>
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
  children: React.ReactNode; onClick?: () => void; variant?: "dark" | "outline" | "ghost"; small?: boolean; type?: "button" | "submit"; disabled?: boolean;
}) {
  const base: React.CSSProperties = { fontSize: small ? "0.6rem" : "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: "2px", cursor: disabled ? "not-allowed" : "pointer", border: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", padding: small ? "0.4rem 0.85rem" : "0.65rem 1.3rem", transition: "all 0.2s", opacity: disabled ? 0.5 : 1 };
  if (variant === "dark") return <button className="veysic-btn-primary" type={type} onClick={onClick} disabled={disabled} style={{ ...base, backgroundColor: "#8B1A2F", color: DARK }}>{children}</button>;
  if (variant === "outline") return <button className="veysic-btn-outline" type={type} onClick={onClick} disabled={disabled} style={{ ...base, backgroundColor: "transparent", color: "#8B1A2F", border: "1px solid #8B1A2F" }}>{children}</button>;
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, backgroundColor: "transparent", color: MID }}>{children}</button>;
}

function InputLine({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange?: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={onChange ? (e) => onChange(e.target.value) : undefined} placeholder={placeholder} readOnly={!onChange}
        style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${onChange ? "#3D3D3D" : "rgba(61,61,61,0.1)"}`, paddingBottom: "0.6rem", paddingTop: "0.15rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", boxSizing: "border-box" }}
        onFocus={(e) => { if (onChange) e.currentTarget.style.borderBottomColor = "#8B1A2F"; }}
        onBlur={(e) => { if (onChange) e.currentTarget.style.borderBottomColor = "#3D3D3D"; }}
      />
    </div>
  );
}

function estadoBadge(estado: Cita["estado"]) {
  const map = { pendiente: { bg: "rgba(74,111,165,0.1)", color: "#4A6FA5", label: "Pendiente" }, completada: { bg: "rgba(139,26,47,0.1)", color: "#8B1A2F", label: "Completada" }, cancelada: { bg: "rgba(192,87,74,0.1)", color: "#C0574A", label: "Cancelada" } };
  const s = map[estado];
  return <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.55rem", borderRadius: "20px", backgroundColor: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span>;
}

// ── PERFIL PROFESIONAL ─────────────────────────────────────────────────────
function SeccionPerfil() {
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [especialidad, setEspecialidad] = useState(user?.especialidad || "");
  const [colegiado, setColegiado] = useState(user?.numeroColegiado || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [ok, setOk] = useState(false);

  if (!user) return null;

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const foto = ev.target?.result as string;
      setUser(updateUser(user!.id, { foto }));
    };
    reader.readAsDataURL(file);
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    setUser(updateUser(user!.id, { nombre, especialidad, numeroColegiado: colegiado, bio, telefono }));
    setOk(true);
    setTimeout(() => setOk(false), 3000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK }}>Mi perfil profesional</h2>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", backgroundColor: "rgba(61,61,61,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {user.foto ? <img src={user.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={32} color={MID} />}
        </div>
        <div>
          <p style={{ fontSize: "0.9rem", fontWeight: 500, color: DARK, marginBottom: "0.25rem" }}>{user.nombre}</p>
          <p style={{ fontSize: "0.75rem", color: MID, marginBottom: "0.75rem" }}>{user.especialidad || "Profesional"}</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} />
          <Btn small variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload size={11} style={{ marginRight: 5, display: "inline" }} />Cambiar foto
          </Btn>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <Card>
          <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1.25rem" }}>Datos profesionales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.25rem" }}>
            <InputLine label="Nombre completo" value={nombre} onChange={setNombre} />
            <InputLine label="Teléfono" value={telefono} onChange={setTelefono} type="tel" />
            <InputLine label="Especialidad" value={especialidad} onChange={setEspecialidad} placeholder="Ej: Fisioterapia y Podología" />
            <InputLine label="Número de colegiado" value={colegiado} onChange={setColegiado} placeholder="FP-2024-001" />
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <Label>Bio (aparece en la web pública)</Label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.6rem", fontSize: "0.875rem", color: DARK, outline: "none", resize: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", boxSizing: "border-box" }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#8B1A2F")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#3D3D3D")}
            />
          </div>
        </Card>
        {ok && <p style={{ fontSize: "0.8rem", color: "#8B1A2F", backgroundColor: "rgba(139,26,47,0.08)", padding: "0.75rem 1rem", borderRadius: "2px", borderLeft: "3px solid #8B1A2F" }}>Cambios guardados.</p>}
        <div><Btn type="submit">Guardar cambios</Btn></div>
      </form>
    </div>
  );
}

// ── AGENDA ─────────────────────────────────────────────────────────────────
function SeccionAgenda() {
  const { user } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [tab, setTab] = useState<"hoy" | "semana" | "todo">("semana");
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [bloqOpen, setBloqOpen] = useState(false);
  const [bFecha, setBFecha] = useState(new Date().toISOString().split("T")[0]);
  const [bIni, setBIni] = useState("09:00");
  const [bFin, setBFin] = useState("10:00");
  const [bMotivo, setBMotivo] = useState("");

  useEffect(() => {
    if (user) {
      setCitas(citasStore.getByProfesional(user.id));
      setBloqueos(bloqueosStore.getByProfesional(user.id));
      setSalas(salasStore.getAll());
    }
  }, [user]);

  if (!user) return null;

  const hoy = new Date().toISOString().split("T")[0];
  const semanaFin = new Date(); semanaFin.setDate(semanaFin.getDate() + 7);
  const semanaFinStr = semanaFin.toISOString().split("T")[0];

  const filtradas = citas.filter((c) => {
    if (tab === "hoy") return c.fecha === hoy;
    if (tab === "semana") return c.fecha >= hoy && c.fecha <= semanaFinStr;
    return true;
  }).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

  function marcar(id: string, estado: "completada" | "cancelada") {
    citasStore.update(id, { estado });
    if (estado === "cancelada") notificarListaEspera(id);
    setCitas(citasStore.getByProfesional(user!.id));
  }

  function addBloqueo(e: FormEvent) {
    e.preventDefault();
    if (bFin <= bIni) { alert("La hora de fin debe ser posterior a la de inicio."); return; }
    bloqueosStore.add({ profesionalId: user!.id, fecha: bFecha, horaInicio: bIni, horaFin: bFin, motivo: bMotivo || undefined });
    setBloqueos(bloqueosStore.getByProfesional(user!.id));
    setBMotivo("");
    setBloqOpen(false);
  }

  function eliminarBloqueo(id: string) {
    bloqueosStore.remove(id);
    setBloqueos(bloqueosStore.getByProfesional(user!.id));
  }

  const hoyStr = new Date().toISOString().split("T")[0];
  const bloqueosProximos = bloqueos.filter((b) => b.fecha >= hoyStr).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio));

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Mi agenda</h2>

      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid rgba(61,61,61,0.12)", marginBottom: "1.5rem" }}>
        {(["hoy", "semana", "todo"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "#8B1A2F" : "transparent"}`, padding: "0.6rem 1.1rem", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: tab === t ? "#8B1A2F" : MID, cursor: "pointer", marginBottom: "-1px", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
            {t === "hoy" ? "Hoy" : t === "semana" ? "Esta semana" : "Todo"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtradas.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: MID, padding: "2rem 0" }}>No hay citas en este período.</p>
        ) : (
          filtradas.map((c) => {
            const cliente = getUserById(c.clienteId);
            return (
              <Card key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 500, color: DARK, marginBottom: "0.25rem" }}>{c.servicio}</p>
                    <p style={{ fontSize: "0.75rem", color: MID }}>
                      {new Date(c.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · {c.hora}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: MID, marginTop: "0.15rem" }}>Cliente: {cliente?.nombre || c.clienteId}</p>
                    {c.salaId && <p style={{ fontSize: "0.75rem", color: MID, marginTop: "0.1rem" }}>Sala: {salas.find((s) => s.id === c.salaId)?.nombre || "—"}</p>}
                    {c.notas && <p style={{ fontSize: "0.75rem", color: MID, marginTop: "0.15rem", fontStyle: "italic" }}>Notas: {c.notas}</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    {estadoBadge(c.estado)}
                    {c.estado === "pendiente" && (
                      <>
                        <Btn small onClick={() => marcar(c.id, "completada")}>
                          <Check size={11} style={{ marginRight: 4, display: "inline" }} />Completada
                        </Btn>
                        <Btn small variant="outline" onClick={() => marcar(c.id, "cancelada")}>
                          <X size={11} style={{ marginRight: 4, display: "inline" }} />Cancelar
                        </Btn>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Bloqueos de horario */}
      <div style={{ marginTop: "2.5rem", borderTop: "1px solid rgba(61,61,61,0.1)", paddingTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "0.85rem", fontWeight: 500, color: DARK, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Lock size={14} /> Horarios bloqueados
          </h3>
          <Btn small onClick={() => setBloqOpen((v) => !v)}>
            <Plus size={11} style={{ marginRight: 4, display: "inline" }} />
            Añadir bloqueo
          </Btn>
        </div>

        {bloqOpen && (
          <Card style={{ marginBottom: "1rem" }}>
            <form onSubmit={addBloqueo} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, display: "block", marginBottom: "0.4rem" }}>Fecha</label>
                  <input type="date" value={bFecha} onChange={(e) => setBFecha(e.target.value)} min={hoyStr} required style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.85rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, display: "block", marginBottom: "0.4rem" }}>Desde</label>
                  <input type="time" value={bIni} onChange={(e) => setBIni(e.target.value)} required style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.85rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, display: "block", marginBottom: "0.4rem" }}>Hasta</label>
                  <input type="time" value={bFin} onChange={(e) => setBFin(e.target.value)} required style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.85rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, display: "block", marginBottom: "0.4rem" }}>Motivo (opcional)</label>
                <input type="text" value={bMotivo} onChange={(e) => setBMotivo(e.target.value)} placeholder="Ej: Reunión, formación..." style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.5rem", fontSize: "0.85rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Btn type="submit" small>Guardar bloqueo</Btn>
                <Btn small variant="ghost" onClick={() => setBloqOpen(false)}>Cancelar</Btn>
              </div>
            </form>
          </Card>
        )}

        {bloqueosProximos.length === 0 ? (
          <p style={{ fontSize: "0.8rem", color: MID }}>No hay bloqueos configurados.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {bloqueosProximos.map((b) => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", backgroundColor: LIGHT, borderRadius: "3px" }}>
                <div>
                  <p style={{ fontSize: "0.8rem", color: DARK, fontWeight: 500 }}>
                    {new Date(b.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })} · {b.horaInicio}–{b.horaFin}
                  </p>
                  {b.motivo && <p style={{ fontSize: "0.7rem", color: MID, marginTop: "0.15rem" }}>{b.motivo}</p>}
                </div>
                <button onClick={() => eliminarBloqueo(b.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C0574A", padding: "0.25rem" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MIS CLIENTES ───────────────────────────────────────────────────────────
function SeccionClientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<UserType[]>([]);
  const [selCliente, setSelCliente] = useState<UserType | null>(null);
  const [tab, setTab] = useState<"ficha" | "subir">("ficha");
  const [docNombre, setDocNombre] = useState("");
  const [docTipo, setDocTipo] = useState<"informe" | "consentimiento" | "factura">("informe");
  const [docOk, setDocOk] = useState(false);

  useEffect(() => {
    if (!user) return;
    const todos = getUsers();
    const ids = user.clientesIds || [];
    setClientes(todos.filter((u) => ids.includes(u.id) || u.profesionalAsignadoId === user.id));
  }, [user]);

  if (!user) return null;

  function subirDoc(e: FormEvent) {
    e.preventDefault();
    if (!selCliente || !docNombre.trim()) return;
    documentosStore.add({ clienteId: selCliente.id, tipo: docTipo, nombre: docNombre, fecha: new Date().toISOString().split("T")[0], subidoPor: user!.id });
    setDocNombre("");
    setDocOk(true);
    setTimeout(() => setDocOk(false), 3000);
  }

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Mis clientes</h2>

      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1rem" }}>
        {/* Lista */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {clientes.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: MID }}>No tienes clientes asignados.</p>
          ) : (
            clientes.map((c) => (
              <button key={c.id} onClick={() => setSelCliente(c)}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 1rem", border: `1px solid ${selCliente?.id === c.id ? "#8B1A2F" : "rgba(61,61,61,0.12)"}`, borderRadius: "4px", backgroundColor: selCliente?.id === c.id ? "rgba(139,26,47,0.08)" : LIGHT, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", backgroundColor: "rgba(61,61,61,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {c.foto ? <img src={c.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} color={MID} />}
                </div>
                <div>
                  <p style={{ fontSize: "0.8rem", fontWeight: 500, color: DARK }}>{c.nombre}</p>
                  <p style={{ fontSize: "0.65rem", color: MID }}>{c.email}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Ficha */}
        <div style={{ gridColumn: "span 2" }}>
          {!selCliente ? (
            <Card style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "0.875rem", color: MID }}>Selecciona un cliente para ver su ficha.</p>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0", borderBottom: "1px solid rgba(61,61,61,0.12)" }}>
                {(["ficha", "subir"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "#8B1A2F" : "transparent"}`, padding: "0.6rem 1rem", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: tab === t ? "#8B1A2F" : MID, cursor: "pointer", marginBottom: "-1px", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                    {t === "ficha" ? "Ficha del cliente" : "Subir documento"}
                  </button>
                ))}
              </div>

              {tab === "ficha" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <Card>
                    <h3 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Datos personales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1rem" }}>
                      <InputLine label="Nombre" value={selCliente.nombre} />
                      <InputLine label="Email" value={selCliente.email} />
                      <InputLine label="Teléfono" value={selCliente.telefono || "—"} />
                      <InputLine label="F. nacimiento" value={selCliente.fechaNacimiento || "—"} />
                      {selCliente.direccion && <div style={{ gridColumn: "1/-1" }}><InputLine label="Dirección" value={selCliente.direccion} /></div>}
                    </div>
                  </Card>
                  {selCliente.historialMedico && (
                    <Card>
                      <h3 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Historial médico</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <InputLine label="Lesiones previas" value={selCliente.historialMedico.lesiones || "—"} />
                        <InputLine label="Alergias" value={selCliente.historialMedico.alergias || "—"} />
                        <InputLine label="Medicación" value={selCliente.historialMedico.medicacion || "—"} />
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <h3 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Subir documento a {selCliente.nombre}</h3>
                  <form onSubmit={subirDoc} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <InputLine label="Nombre del documento" value={docNombre} onChange={setDocNombre} placeholder="Ej: Informe valoración junio.pdf" />
                    <div>
                      <Label>Tipo</Label>
                      <select value={docTipo} onChange={(e) => setDocTipo(e.target.value as typeof docTipo)}
                        style={{ background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.6rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", width: "100%" }}>
                        <option value="informe">Informe</option>
                        <option value="consentimiento">Consentimiento</option>
                        <option value="factura">Factura</option>
                      </select>
                    </div>
                    {docOk && <p style={{ fontSize: "0.8rem", color: "#8B1A2F" }}>Documento añadido correctamente.</p>}
                    <div><Btn type="submit" small>
                      <Upload size={11} style={{ marginRight: 5, display: "inline" }} />Subir documento
                    </Btn></div>
                  </form>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PLANES DE ENTRENAMIENTO ────────────────────────────────────────────────
function SeccionPlanes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<UserType[]>([]);
  const [selCliente, setSelCliente] = useState("");
  const [planNombre, setPlanNombre] = useState("");
  const [dias, setDias] = useState<Record<string, { ejercicios: Ejercicio[] }>>({});
  const [diaSel, setDiaSel] = useState("Lunes");
  const [planesGuardados, setPlanesGuardados] = useState<PlanEntrenamiento[]>([]);
  const [ok, setOk] = useState(false);

  // Ejercicio temporal
  const [ejNombre, setEjNombre] = useState("");
  const [ejSeries, setEjSeries] = useState("3");
  const [ejReps, setEjReps] = useState("10");
  const [ejDescanso, setEjDescanso] = useState("90 seg");

  useEffect(() => {
    if (!user) return;
    const todos = getUsers();
    const ids = user.clientesIds || [];
    setClientes(todos.filter((u) => ids.includes(u.id) || u.profesionalAsignadoId === user.id));
    setPlanesGuardados(planesStore.getAll().filter((p) => p.profesionalId === user.id));
  }, [user]);

  if (!user) return null;

  function toggleDia(dia: string) {
    setDias((prev) => {
      const copy = { ...prev };
      if (copy[dia]) delete copy[dia];
      else copy[dia] = { ejercicios: [] };
      return copy;
    });
  }

  function addEjercicio() {
    if (!ejNombre.trim() || !dias[diaSel]) return;
    setDias((prev) => ({
      ...prev,
      [diaSel]: { ejercicios: [...(prev[diaSel]?.ejercicios || []), { nombre: ejNombre, series: parseInt(ejSeries), reps: ejReps, descanso: ejDescanso, notas: "" }] },
    }));
    setEjNombre("");
  }

  function removeEjercicio(dia: string, i: number) {
    setDias((prev) => ({ ...prev, [dia]: { ejercicios: prev[dia].ejercicios.filter((_, idx) => idx !== i) } }));
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!selCliente || !planNombre.trim() || Object.keys(dias).length === 0) return;
    planesStore.save({ clienteId: selCliente, profesionalId: user!.id, nombre: planNombre, dias, fechaInicio: new Date().toISOString().split("T")[0], activo: true });
    setPlanesGuardados(planesStore.getAll().filter((p) => p.profesionalId === user!.id));
    setPlanNombre("");
    setDias({});
    setSelCliente("");
    setOk(true);
    setTimeout(() => setOk(false), 3000);
  }

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Planes de entrenamiento</h2>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem" }}>
        {/* Editor */}
        <div>
          <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <Card>
              <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "1.25rem" }}>Nuevo plan</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <Label>Nombre del plan</Label>
                  <input value={planNombre} onChange={(e) => setPlanNombre(e.target.value)} placeholder="Ej: Plan Fuerza Fase 2" required
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.6rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif", boxSizing: "border-box" }} />
                </div>
                <div>
                  <Label>Asignar a cliente</Label>
                  <select value={selCliente} onChange={(e) => setSelCliente(e.target.value)} required
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.6rem", fontSize: "0.875rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Días activos</Label>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {DIAS.map((d) => (
                      <button key={d} type="button" onClick={() => toggleDia(d)}
                        style={{ padding: "0.35rem 0.65rem", fontSize: "0.65rem", letterSpacing: "0.05em", borderRadius: "2px", border: `1px solid ${dias[d] ? "#8B1A2F" : "#3D3D3D"}`, backgroundColor: dias[d] ? "#8B1A2F" : "transparent", color: dias[d] ? DARK : MID, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Editor de ejercicios por día */}
            {Object.keys(dias).length > 0 && (
              <Card>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  {Object.keys(dias).map((d) => (
                    <button key={d} type="button" onClick={() => setDiaSel(d)}
                      style={{ padding: "0.3rem 0.75rem", fontSize: "0.65rem", borderRadius: "2px", border: `1px solid ${diaSel === d ? "#8B1A2F" : "rgba(61,61,61,0.15)"}`, backgroundColor: diaSel === d ? "rgba(139,26,47,0.12)" : "transparent", color: diaSel === d ? "#8B1A2F" : MID, cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
                      {d}
                    </button>
                  ))}
                </div>

                {dias[diaSel] && (
                  <>
                    {dias[diaSel].ejercicios.map((ej, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid rgba(61,61,61,0.06)" }}>
                        <span style={{ fontSize: "0.8rem", color: DARK }}>{ej.nombre} — {ej.series}×{ej.reps} · {ej.descanso}</span>
                        <button type="button" onClick={() => removeEjercicio(diaSel, i)} style={{ background: "none", border: "none", cursor: "pointer", color: MID }}><X size={13} /></button>
                      </div>
                    ))}
                    <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <input value={ejNombre} onChange={(e) => setEjNombre(e.target.value)} placeholder="Ejercicio" style={{ flex: 2, minWidth: 100, background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.4rem", fontSize: "0.8rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
                      <input value={ejSeries} onChange={(e) => setEjSeries(e.target.value)} placeholder="Series" style={{ flex: 1, minWidth: 50, background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.4rem", fontSize: "0.8rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
                      <input value={ejReps} onChange={(e) => setEjReps(e.target.value)} placeholder="Reps" style={{ flex: 1, minWidth: 50, background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.4rem", fontSize: "0.8rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
                      <input value={ejDescanso} onChange={(e) => setEjDescanso(e.target.value)} placeholder="Descanso" style={{ flex: 1, minWidth: 60, background: "transparent", border: "none", borderBottom: "1px solid #3D3D3D", paddingBottom: "0.4rem", fontSize: "0.8rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
                      <button type="button" onClick={addEjercicio} style={{ background: "none", border: "none", cursor: "pointer", color: DARK }}><Plus size={18} /></button>
                    </div>
                  </>
                )}
              </Card>
            )}

            {ok && <p style={{ fontSize: "0.8rem", color: "#8B1A2F" }}>Plan guardado y asignado correctamente.</p>}
            <div><Btn type="submit">Guardar plan</Btn></div>
          </form>
        </div>

        {/* Planes guardados */}
        <div>
          <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "1rem" }}>Planes creados</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {planesGuardados.length === 0 ? (
              <Card><p style={{ fontSize: "0.875rem", color: MID }}>Todavía no has creado ningún plan.</p></Card>
            ) : (
              planesGuardados.map((p) => (
                <Card key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: DARK, marginBottom: "0.2rem" }}>{p.nombre}</p>
                      <p style={{ fontSize: "0.7rem", color: MID }}>Cliente: {getUserById(p.clienteId)?.nombre || p.clienteId}</p>
                      <p style={{ fontSize: "0.7rem", color: MID }}>Días: {Object.keys(p.dias).join(", ")}</p>
                    </div>
                    {p.activo && <span style={{ fontSize: "0.6rem", padding: "0.2rem 0.5rem", borderRadius: "20px", backgroundColor: "rgba(139,26,47,0.1)", color: "#8B1A2F" }}>Activo</span>}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MENSAJES ───────────────────────────────────────────────────────────────
function SeccionMensajes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<UserType[]>([]);
  const [selId, setSelId] = useState("");
  const [msgs, setMsgs] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const todos = getUsers();
    const ids = user.clientesIds || [];
    const lista = todos.filter((u) => ids.includes(u.id) || u.profesionalAsignadoId === user.id);
    setClientes(lista);
    if (lista.length > 0 && !selId) setSelId(lista[0].id);
  }, [user]);

  useEffect(() => {
    if (!user || !selId) return;
    setMsgs(mensajesStore.getConversacion(user.id, selId));
    mensajesStore.marcarLeidos(user.id, selId);
  }, [user, selId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  if (!user) return null;

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim() || !selId) return;
    mensajesStore.send({ de: user!.id, para: selId, texto: texto.trim(), fecha: new Date().toISOString() });
    setMsgs(mensajesStore.getConversacion(user!.id, selId));
    setTexto("");
  }

  const selCliente = clientes.find((c) => c.id === selId);

  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: 400, color: DARK, marginBottom: "1.5rem" }}>Mensajes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1rem" }}>
        {/* Lista clientes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {clientes.map((c) => (
            <button key={c.id} onClick={() => setSelId(c.id)}
              style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.75rem", borderRadius: "4px", border: `1px solid ${selId === c.id ? "#8B1A2F" : "rgba(61,61,61,0.1)"}`, backgroundColor: selId === c.id ? "rgba(139,26,47,0.08)" : LIGHT, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(61,61,61,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={14} color={MID} />
              </div>
              <span style={{ fontSize: "0.8rem", color: DARK }}>{c.nombre.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Chat */}
        <div style={{ gridColumn: "span 2" }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(61,61,61,0.08)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(61,61,61,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={14} color={MID} /></div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: DARK }}>{selCliente?.nombre || "—"}</p>
            </div>
            <div style={{ height: 300, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {msgs.map((m) => {
                const esMio = m.de === user.id;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: esMio ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "75%", padding: "0.55rem 0.8rem", borderRadius: esMio ? "10px 10px 2px 10px" : "10px 10px 10px 2px", backgroundColor: esMio ? "#8B1A2F" : LIGHT, border: esMio ? "none" : "1px solid rgba(61,61,61,0.1)" }}>
                      <p style={{ fontSize: "0.8rem", color: esMio ? "#FFFFFF" : DARK, lineHeight: 1.5 }}>{m.texto}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <form onSubmit={enviar} style={{ padding: "0.65rem 1rem", borderTop: "1px solid rgba(61,61,61,0.08)", display: "flex", gap: "0.75rem" }}>
              <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.875rem", color: DARK, fontFamily: "var(--font-inter), system-ui, sans-serif" }} />
              <button type="submit" style={{ background: "none", border: "none", cursor: "pointer", color: DARK }}><Send size={17} /></button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── LAYOUT PRINCIPAL ───────────────────────────────────────────────────────
export default function ProfesionalPage() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>("agenda");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role === "cliente") router.push("/perfil");
    if (!loading && user && user.role === "admin") router.push("/admin");
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

  if (loading || !user || user.role !== "profesional") return null;

  function handleLogout() {
    logout();
    setUser(null);
    router.push("/");
  }

  const secciones: Record<Seccion, React.ReactNode> = {
    perfil: <SeccionPerfil />,
    agenda: <SeccionAgenda />,
    clientes: <SeccionClientes />,
    planes: <SeccionPlanes />,
    mensajes: <SeccionMensajes />,
  };

  const tipoPro = user.profesionalType === "entrenador" ? "Entrenador/a" : "Fisioterapeuta";

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
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID }}>{tipoPro}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span className="hidden md:block" style={{ fontSize: "0.8rem", color: MID }}>{user.nombre}</span>
          <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: MID }} title="Cerrar sesión"><LogOut size={15} /></button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 30 }} />}

        {/* Desktop sidebar */}
        <aside className="hidden md:flex" style={{ width: 240, flexShrink: 0, backgroundColor: LIGHT, borderRight: "1px solid rgba(61,61,61,0.1)", padding: "1.5rem 0", position: "fixed", top: 60, bottom: 0, flexDirection: "column" }}>
          <div style={{ padding: "0 1.5rem 1.5rem", borderBottom: "1px solid rgba(61,61,61,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", backgroundColor: "rgba(61,61,61,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {user.foto ? <img src={user.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={18} color={MID} />}
              </div>
              <div>
                <p style={{ fontSize: "0.8rem", fontWeight: 500, color: DARK }}>{user.nombre.split(" ")[0]}</p>
                <p style={{ fontSize: "0.65rem", color: MID }}>{tipoPro}</p>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
            {SECCIONES.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => { setSeccion(id); setSidebarOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.7rem 1.5rem", background: "none", border: "none", borderLeft: `3px solid ${seccion === id ? "#8B1A2F" : "transparent"}`, backgroundColor: seccion === id ? "rgba(139,26,47,0.08)" : "transparent", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif", fontSize: "0.8rem", color: seccion === id ? "#8B1A2F" : MID, textAlign: "left", transition: "all 0.15s" }}>
                <Icon size={16} />{label}
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
          <aside style={{ position: "fixed", top: 60, left: 0, bottom: 0, width: 240, backgroundColor: LIGHT, borderRight: "1px solid rgba(61,61,61,0.1)", zIndex: 35, display: "flex", flexDirection: "column", padding: "1.5rem 0" }}>
            <nav style={{ flex: 1 }}>
              {SECCIONES.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => { setSeccion(id); setSidebarOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.7rem 1.5rem", background: "none", border: "none", borderLeft: `3px solid ${seccion === id ? "#8B1A2F" : "transparent"}`, backgroundColor: seccion === id ? "rgba(139,26,47,0.08)" : "transparent", cursor: "pointer", fontFamily: "var(--font-inter), system-ui, sans-serif", fontSize: "0.8rem", color: seccion === id ? "#8B1A2F" : MID, textAlign: "left" }}>
                  <Icon size={16} />{label}
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

        <main style={{ flex: 1, padding: "2rem 1.5rem" }} className="md:ml-[240px]">
          <div style={{ maxWidth: 840, margin: "0 auto" }}>{secciones[seccion]}</div>
        </main>
      </div>
    </div>
  );
}
