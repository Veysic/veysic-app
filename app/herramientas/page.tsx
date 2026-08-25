"use client";
import { useState } from "react";
import Link from "next/link";

const BG = "#2C2C2C";
const DARK = "#FFFFFF";
const MID = "#A0A0A0";
const LIGHT = "#3D3D3D";

// ── Shared components ───────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ backgroundColor: LIGHT, border: "1px solid rgba(61,61,61,0.08)", borderRadius: "6px", padding: "1.5rem", ...style }}>{children}</div>;
}
function Input({ label, value, onChange, type = "number", min, max, step, suffix, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; min?: number; max?: number; step?: number; suffix?: string; placeholder?: string }) {
  return (
    <div>
      <p style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.4rem" }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} min={min} max={max} step={step} placeholder={placeholder}
          style={{ flex: 1, background: LIGHT, border: "1px solid #3D3D3D", borderRadius: "4px", padding: "0.6rem 0.75rem", fontSize: "0.9rem", color: DARK, outline: "none", fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          onFocus={(e) => (e.target.style.borderColor = "#8B1A2F")} onBlur={(e) => (e.target.style.borderColor = "#3D3D3D")} />
        {suffix && <span style={{ fontSize: "0.75rem", color: MID, whiteSpace: "nowrap" }}>{suffix}</span>}
      </div>
    </div>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <p style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, marginBottom: "0.4rem" }}>{label}</p>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: LIGHT, border: "1px solid #3D3D3D", borderRadius: "4px", padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: DARK, fontFamily: "var(--font-inter), system-ui, sans-serif", outline: "none" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function CTAReserva() {
  return (
    <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "6px", border: "1px solid rgba(61,61,61,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
      <p style={{ fontSize: "0.78rem", color: MID, flex: 1 }}>¿Quieres un plan personalizado? Nuestros profesionales pueden ayudarte.</p>
      <Link href="/reservar" style={{ padding: "0.55rem 1.1rem", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", backgroundColor: "#8B1A2F", color: "#FFFFFF", textDecoration: "none", borderRadius: "4px", whiteSpace: "nowrap" }}>
        Reservar sesión
      </Link>
    </div>
  );
}

// ── Calculadora IMC ─────────────────────────────────────────────────────────
function CalcIMC() {
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");

  const imc = peso && altura ? parseFloat(peso) / Math.pow(parseFloat(altura) / 100, 2) : null;
  const categoria = imc === null ? null
    : imc < 18.5 ? { label: "Bajo peso", color: "#4A6FA5", pct: 15 }
    : imc < 25 ? { label: "Peso normal", color: "#3C8C89", pct: 38 }
    : imc < 30 ? { label: "Sobrepeso", color: "#C08A2E", pct: 63 }
    : { label: "Obesidad", color: "#C0574A", pct: 88 };

  const recomendacion = imc === null ? null
    : imc < 18.5 ? "Te recomendamos trabajar con nuestros entrenadores para un plan de ganancia muscular saludable."
    : imc < 25 ? "¡Excelente! Mantén tu peso con nuestras clases de entrenamiento y fisioterapia preventiva."
    : imc < 30 ? "Nuestro equipo puede ayudarte con un plan de entrenamiento y nutrición para alcanzar tu peso ideal."
    : "Consulta con nuestros fisioterapeutas y entrenadores para un plan adaptado a ti de forma segura.";

  return (
    <Card>
      <p className="font-serif" style={{ fontSize: "1.1rem", color: DARK, marginBottom: "0.25rem" }}>Índice de Masa Corporal</p>
      <p style={{ fontSize: "0.75rem", color: MID, marginBottom: "1.25rem" }}>Calcula tu IMC y descubre tu categoría</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
        <Input label="Peso" value={peso} onChange={setPeso} suffix="kg" min={30} max={250} />
        <Input label="Altura" value={altura} onChange={setAltura} suffix="cm" min={100} max={250} />
      </div>
      {imc !== null && categoria && (
        <div>
          <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "3rem", fontWeight: 800, color: categoria.color, lineHeight: 1 }}>{imc.toFixed(1)}</p>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: categoria.color, marginTop: "0.25rem" }}>{categoria.label}</p>
          </div>
          <div style={{ position: "relative", height: 10, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 5, marginBottom: "0.5rem", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #4A6FA5 0%, #3C8C89 25%, #C08A2E 60%, #C0574A 100%)", borderRadius: 5 }} />
            <div style={{ position: "absolute", top: -2, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#FFFFFF", border: `3px solid ${categoria.color}`, transform: "translateX(-50%)", left: `${categoria.pct}%`, boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.58rem", color: MID, marginBottom: "1rem" }}>
            {["Bajo peso", "Normal", "Sobrepeso", "Obesidad"].map(l => <span key={l}>{l}</span>)}
          </div>
          <p style={{ fontSize: "0.78rem", color: MID, lineHeight: 1.6, padding: "0.75rem", backgroundColor: `${categoria.color}18`, borderRadius: "4px", borderLeft: `3px solid ${categoria.color}` }}>
            {recomendacion}
          </p>
        </div>
      )}
      <CTAReserva />
    </Card>
  );
}

// ── Calculadora TDEE ────────────────────────────────────────────────────────
function CalcTDEE() {
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("hombre");
  const [actividad, setActividad] = useState("1.55");

  const actividadOpts = [
    { value: "1.2", label: "Sedentario (sin ejercicio)" },
    { value: "1.375", label: "Ligero (1-3 días/semana)" },
    { value: "1.55", label: "Moderado (3-5 días/semana)" },
    { value: "1.725", label: "Activo (6-7 días/semana)" },
    { value: "1.9", label: "Muy activo (trabajo físico + deporte)" },
  ];

  let tdee: number | null = null;
  if (peso && altura && edad) {
    const p = parseFloat(peso), h = parseFloat(altura), e = parseFloat(edad);
    const bmr = sexo === "hombre"
      ? 10 * p + 6.25 * h - 5 * e + 5
      : 10 * p + 6.25 * h - 5 * e - 161;
    tdee = Math.round(bmr * parseFloat(actividad));
  }

  return (
    <Card>
      <p className="font-serif" style={{ fontSize: "1.1rem", color: DARK, marginBottom: "0.25rem" }}>Calorías diarias (TDEE)</p>
      <p style={{ fontSize: "0.75rem", color: MID, marginBottom: "1.25rem" }}>Calcula tus necesidades calóricas diarias</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <Input label="Peso" value={peso} onChange={setPeso} suffix="kg" />
        <Input label="Altura" value={altura} onChange={setAltura} suffix="cm" />
        <Input label="Edad" value={edad} onChange={setEdad} suffix="años" />
        <Select label="Sexo" value={sexo} onChange={setSexo} options={[{ value: "hombre", label: "Hombre" }, { value: "mujer", label: "Mujer" }]} />
      </div>
      <div style={{ marginBottom: "1.25rem" }}>
        <Select label="Nivel de actividad" value={actividad} onChange={setActividad} options={actividadOpts} />
      </div>
      {tdee !== null && (
        <div>
          {[
            { label: "Mantenimiento", value: `${tdee} kcal`, sub: "Para mantener tu peso actual", color: "#3C8C89" },
            { label: "Perder peso (déficit -500)", value: `${tdee - 500} kcal`, sub: "Para perder ~0,5 kg por semana", color: "#4A6FA5" },
            { label: "Ganar músculo (superávit +300)", value: `${tdee + 300} kcal`, sub: "Para ganar masa muscular", color: "#7A5C8E" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ padding: "0.85rem 1rem", borderRadius: "6px", backgroundColor: `${color}18`, borderLeft: `3px solid ${color}`, marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "0.78rem", fontWeight: 600, color: DARK }}>{label}</p>
                  <p style={{ fontSize: "0.65rem", color: MID }}>{sub}</p>
                </div>
                <p style={{ fontSize: "1.2rem", fontWeight: 800, color }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <CTAReserva />
    </Card>
  );
}

// ── Calculadora 1RM ─────────────────────────────────────────────────────────
function Calc1RM() {
  const [peso, setPeso] = useState("");
  const [reps, setReps] = useState("");

  const rm1 = peso && reps ? Math.round(parseFloat(peso) * (1 + parseFloat(reps) / 30)) : null;
  const porcentajes = [95, 90, 85, 80, 75, 70, 60, 50];

  return (
    <Card>
      <p className="font-serif" style={{ fontSize: "1.1rem", color: DARK, marginBottom: "0.25rem" }}>Repetición Máxima (1RM)</p>
      <p style={{ fontSize: "0.75rem", color: MID, marginBottom: "1.25rem" }}>Estima tu fuerza máxima en un ejercicio (fórmula Epley)</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
        <Input label="Peso levantado" value={peso} onChange={setPeso} suffix="kg" />
        <Input label="Repeticiones" value={reps} onChange={setReps} suffix="reps" min={1} max={30} />
      </div>
      {rm1 !== null && (
        <div>
          <div style={{ textAlign: "center", marginBottom: "1.25rem", padding: "1rem", backgroundColor: "#8B1A2F", borderRadius: "6px" }}>
            <p style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: "0.25rem" }}>Tu 1RM estimado</p>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>{rm1} kg</p>
          </div>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MID, marginBottom: "0.75rem" }}>Tabla de trabajo</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
            {porcentajes.map((pct) => (
              <div key={pct} style={{ textAlign: "center", padding: "0.6rem 0.25rem", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "4px", border: "1px solid rgba(61,61,61,0.08)" }}>
                <p style={{ fontSize: "0.6rem", color: MID, marginBottom: "0.25rem" }}>{pct}%</p>
                <p style={{ fontSize: "0.88rem", fontWeight: 700, color: DARK }}>{Math.round(rm1 * pct / 100)} kg</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <CTAReserva />
    </Card>
  );
}

// ── Calculadora FC ──────────────────────────────────────────────────────────
function CalcFC() {
  const [edad, setEdad] = useState("");

  const fcMax = edad ? Math.round(220 - parseFloat(edad)) : null;
  const zonas = fcMax === null ? [] : [
    { nombre: "Recuperación activa", rango: [Math.round(fcMax * 0.5), Math.round(fcMax * 0.6)], color: "#4A6FA5", desc: "Warm-up, recuperación" },
    { nombre: "Aeróbico base", rango: [Math.round(fcMax * 0.6), Math.round(fcMax * 0.7)], color: "#3C8C89", desc: "Quema grasa, resistencia" },
    { nombre: "Aeróbico intenso", rango: [Math.round(fcMax * 0.7), Math.round(fcMax * 0.8)], color: "#B5762A", desc: "Cardio, resistencia cardiovascular" },
    { nombre: "Anaeróbico", rango: [Math.round(fcMax * 0.8), Math.round(fcMax * 0.9)], color: "#C08A2E", desc: "Potencia, velocidad" },
    { nombre: "Máximo", rango: [Math.round(fcMax * 0.9), fcMax], color: "#C0574A", desc: "Intervalos breves de alta intensidad" },
  ];

  return (
    <Card>
      <p className="font-serif" style={{ fontSize: "1.1rem", color: DARK, marginBottom: "0.25rem" }}>Zonas de Frecuencia Cardíaca</p>
      <p style={{ fontSize: "0.75rem", color: MID, marginBottom: "1.25rem" }}>Calcula tus zonas de entrenamiento por edad</p>
      <div style={{ marginBottom: "1.25rem", maxWidth: 200 }}>
        <Input label="Tu edad" value={edad} onChange={setEdad} suffix="años" min={10} max={100} />
      </div>
      {fcMax !== null && (
        <div>
          <div style={{ textAlign: "center", marginBottom: "1.25rem", padding: "0.75rem", backgroundColor: "#C0574A20", borderRadius: "6px", border: "1px solid #C0574A40" }}>
            <p style={{ fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#C0574A", marginBottom: "0.2rem" }}>FC Máxima estimada</p>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "#C0574A" }}>{fcMax} ppm</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {zonas.map((z) => (
              <div key={z.nombre} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 0.85rem", borderRadius: "6px", backgroundColor: `${z.color}20`, borderLeft: `3px solid ${z.color}` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.78rem", fontWeight: 600, color: DARK }}>{z.nombre}</p>
                  <p style={{ fontSize: "0.62rem", color: MID }}>{z.desc}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: z.color }}>{z.rango[0]}–{z.rango[1]}</p>
                  <p style={{ fontSize: "0.6rem", color: MID }}>ppm</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <CTAReserva />
    </Card>
  );
}

// ── Calculadora Hidratación ─────────────────────────────────────────────────
function CalcHidratacion() {
  const [peso, setPeso] = useState("");
  const [actividad, setActividad] = useState("moderado");
  const [clima, setClima] = useState("templado");

  let litros: number | null = null;
  if (peso) {
    const base = parseFloat(peso) * 0.033;
    const actExtra = actividad === "sedentario" ? 0 : actividad === "moderado" ? 0.5 : 1.0;
    const climaExtra = clima === "frio" ? -0.3 : clima === "templado" ? 0 : 0.5;
    litros = parseFloat((base + actExtra + climaExtra).toFixed(1));
    if (litros < 1.5) litros = 1.5;
  }

  const vasos = litros ? Math.round(litros / 0.25) : null;

  return (
    <Card>
      <p className="font-serif" style={{ fontSize: "1.1rem", color: DARK, marginBottom: "0.25rem" }}>Calculadora de hidratación</p>
      <p style={{ fontSize: "0.75rem", color: MID, marginBottom: "1.25rem" }}>Calcula tu necesidad diaria de agua</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.25rem" }}>
        <Input label="Peso corporal" value={peso} onChange={setPeso} suffix="kg" />
        <Select label="Nivel de actividad" value={actividad} onChange={setActividad} options={[
          { value: "sedentario", label: "Sedentario" },
          { value: "moderado", label: "Moderado (ejercicio regular)" },
          { value: "activo", label: "Muy activo (entrena a diario)" },
        ]} />
        <Select label="Clima habitual" value={clima} onChange={setClima} options={[
          { value: "frio", label: "Frío" },
          { value: "templado", label: "Templado" },
          { value: "calor", label: "Calor" },
        ]} />
      </div>
      {litros !== null && vasos !== null && (
        <div>
          <div style={{ textAlign: "center", padding: "1.5rem 1rem", backgroundColor: "rgba(74,111,165,0.12)", borderRadius: "8px", border: "1px solid rgba(74,111,165,0.25)", marginBottom: "1rem" }}>
            <p style={{ fontSize: "3.5rem", fontWeight: 800, color: "#4A6FA5", lineHeight: 1 }}>{litros}L</p>
            <p style={{ fontSize: "0.78rem", color: MID, marginTop: "0.4rem" }}>≈ {vasos} vasos de 250 ml al día</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {Array.from({ length: Math.min(vasos, 12) }).map((_, i) => (
              <span key={i} style={{ fontSize: "1.4rem" }}>💧</span>
            ))}
            {vasos > 12 && <span style={{ fontSize: "0.75rem", color: MID, alignSelf: "center" }}>+{vasos - 12} más</span>}
          </div>
          <p style={{ fontSize: "0.72rem", color: MID, marginTop: "0.85rem", lineHeight: 1.6 }}>
            Recuerda: durante el ejercicio pierde entre 0.5–1.5L extra por hora. Distribuye la ingesta a lo largo del día.
          </p>
        </div>
      )}
      <CTAReserva />
    </Card>
  );
}

// ── MAIN PAGE ───────────────────────────────────────────────────────────────
const CALCS = [
  { id: "imc", label: "IMC", emoji: "⚖️", comp: <CalcIMC /> },
  { id: "tdee", label: "Calorías", emoji: "🔥", comp: <CalcTDEE /> },
  { id: "rm", label: "1RM", emoji: "🏋️", comp: <Calc1RM /> },
  { id: "fc", label: "Frecuencia Cardíaca", emoji: "❤️", comp: <CalcFC /> },
  { id: "hidra", label: "Hidratación", emoji: "💧", comp: <CalcHidratacion /> },
];

export default function HerramientasPage() {
  const [active, setActive] = useState("imc");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(61,61,61,0.08)", backgroundColor: BG, position: "sticky", top: 0, zIndex: 10 }}>
        <div className="max-w-3xl mx-auto px-4" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <Link href="/" style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            ← Inicio
          </Link>
          <p className="font-serif" style={{ fontSize: "1rem", color: DARK }}>Herramientas de salud</p>
          <Link href="/reservar" style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MID, textDecoration: "none" }}>Reservar</Link>
        </div>
        {/* Tab bar */}
        <div style={{ display: "flex", overflowX: "auto", borderTop: "1px solid rgba(61,61,61,0.06)" }} className="max-w-3xl mx-auto px-4">
          {CALCS.map((c) => (
            <button key={c.id} onClick={() => setActive(c.id)} style={{
              padding: "0.6rem 1rem", background: "none", border: "none", borderBottom: active === c.id ? `2px solid #8B1A2F` : "2px solid transparent",
              cursor: "pointer", fontSize: "0.68rem", fontWeight: active === c.id ? 700 : 400, color: active === c.id ? DARK : MID,
              whiteSpace: "nowrap", letterSpacing: "0.05em", fontFamily: "var(--font-inter), system-ui, sans-serif",
            }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="max-w-3xl mx-auto px-4" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
        <p style={{ fontSize: "0.75rem", color: MID, marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Estas calculadoras son orientativas. Para un plan personalizado, consulta con nuestros profesionales.
        </p>
        {CALCS.find((c) => c.id === active)?.comp}
      </div>
    </div>
  );
}
