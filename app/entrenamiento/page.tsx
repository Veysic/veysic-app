"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";
import {
  User,
  Users,
  UserPlus,
  CheckCircle,
  Target,
  TrendingUp,
  Shield,
  Zap,
  BarChart2,
  ChevronDown,
  ArrowRight,
  Star,
  ClipboardList,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

const BG = "#EDE6D9";
const DARK = "#1F1F1F";
const MID = "#3A3A3A";
const LIGHT = "#F5F0E8";

// ── Fade-in on scroll ─────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(20px)",
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Datos ──────────────────────────────────────────────────────────────────
const MODALIDADES = [
  {
    id: "individual",
    Icon: User,
    titulo: "Individual",
    tagline: "Para quién quiere máxima atención y resultados a medida.",
    ventajas: [
      "Plan 100% personalizado a tus objetivos",
      "Atención exclusiva del entrenador en cada sesión",
      "Máxima flexibilidad de horario",
      "Seguimiento y ajuste continuo del rendimiento",
    ],
    precios: [
      { etiqueta: "Sesión suelta", precio: "45 €", detalle: "1 hora", popular: false },
      { etiqueta: "Bono 10 sesiones", precio: "400 €", detalle: "Ahorras 50 €", popular: true },
    ],
  },
  {
    id: "duo",
    Icon: UserPlus,
    titulo: "Dúo",
    tagline: "Ideal para parejas, amigos o compañeros que entrenan juntos.",
    ventajas: [
      "Misma calidad que el individual a menor coste",
      "Motivación mutua en cada entrenamiento",
      "Plan adaptado a los dos perfiles",
      "Posibilidad de mensualidad con 2 días/semana",
    ],
    precios: [
      { etiqueta: "Sesión suelta", precio: "22,50 €", detalle: "Por persona · 1 hora", popular: false, nota: "45 € entre los dos" },
      { etiqueta: "Mensualidad 2 días/sem.", precio: "180 €/mes", detalle: "Por persona", popular: false, nota: "360 € entre los dos" },
    ],
  },
  {
    id: "grupo",
    Icon: Users,
    titulo: "Grupo",
    tagline: "Máximo 5 personas. La opción más accesible sin renunciar al seguimiento.",
    ventajas: [
      "Ambiente dinámico y motivador",
      "Precio por persona muy competitivo",
      "Grupos reducidos para una atención real",
      "Ideal para iniciarse o mantener un hábito",
    ],
    precios: [
      { etiqueta: "Sesión suelta", precio: "15 €", detalle: "Por persona · 1 hora", popular: false },
      { etiqueta: "Mensualidad 2 días/sem.", precio: "96 €/mes", detalle: "Por persona", popular: false },
    ],
  },
];

const PASOS = [
  {
    numero: "01",
    Icon: MessageSquare,
    titulo: "Primera consulta gratuita",
    texto:
      "Hablamos de tus objetivos, historial y disponibilidad. Sin compromiso. En persona o por videollamada.",
  },
  {
    numero: "02",
    Icon: ClipboardList,
    titulo: "Plan personalizado",
    texto:
      "Diseñamos juntos un programa de entrenamiento adaptado a ti: frecuencia, intensidad y progresión.",
  },
  {
    numero: "03",
    Icon: Target,
    titulo: "Entrenamiento y seguimiento",
    texto:
      "Cada sesión con supervisión directa. Corregimos la técnica, medimos el progreso y ajustamos en tiempo real.",
  },
  {
    numero: "04",
    Icon: RefreshCw,
    titulo: "Revisión mensual del plan",
    texto:
      "Cada mes analizamos los resultados y evolucionamos el programa para que nunca te estanques.",
  },
];

const BENEFICIOS = [
  {
    Icon: ClipboardList,
    titulo: "Plan 100% personalizado",
    texto: "No hay rutinas genéricas. Todo parte de tu cuerpo, tus metas y tu punto de partida.",
  },
  {
    Icon: TrendingUp,
    titulo: "Seguimiento de progreso",
    texto: "Registramos métricas reales: peso, volumen de entrenamiento, rendimiento. Los datos guían cada decisión.",
  },
  {
    Icon: Shield,
    titulo: "Técnica supervisada y segura",
    texto: "Aprendes a moverte bien desde el primer día. Menos lesiones, más resultados a largo plazo.",
  },
  {
    Icon: Zap,
    titulo: "Motivación y constancia",
    texto: "Tener a alguien que espera verte y que conoce tu progreso marca la diferencia entre rendirse y continuar.",
  },
  {
    Icon: BarChart2,
    titulo: "Resultados medibles",
    texto: "Fuerza, composición corporal, resistencia — todo se mide. Sabes exactamente dónde estás y hacia dónde vas.",
  },
];

const FAQ = [
  {
    pregunta: "¿Necesito experiencia previa para empezar?",
    respuesta:
      "No. El entrenamiento se diseña desde cero según tu nivel actual. Tanto si nunca has pisado un gimnasio como si llevas años entrenando, empezamos desde donde tú estás.",
  },
  {
    pregunta: "¿Qué incluye la primera sesión?",
    respuesta:
      "La primera consulta es gratuita y sirve para conocerte: hablamos de tus objetivos, hacemos una valoración básica de movilidad y condición física, y diseñamos el punto de partida de tu plan.",
  },
  {
    pregunta: "¿Puedo cambiar de modalidad (individual, dúo, grupo)?",
    respuesta:
      "Sí, con total flexibilidad. Si empiezas en grupo y quieres pasar a individual, o si encuentras un compañero para hacer dúo, lo adaptamos sin problema.",
  },
  {
    pregunta: "¿Qué pasa si tengo una lesión o limitación física?",
    respuesta:
      "Trabajamos en coordinación con el equipo de fisioterapia de Veysic. Si hay una lesión activa, el plan se adapta para entrenar lo que se puede sin comprometer la recuperación.",
  },
  {
    pregunta: "¿Con cuánta antelación debo cancelar una sesión?",
    respuesta:
      "Pedimos un mínimo de 24 horas de antelación para cancelar sin coste. Las cancelaciones tardías o ausencias sin aviso se descuentan del bono o se cobran como sesión.",
  },
];

// ── Componente FAQ Accordion ───────────────────────────────────────────────
function FaqItem({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(31,31,31,0.1)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "1.25rem 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "0.95rem", color: DARK, fontWeight: 500, lineHeight: 1.4 }}>
          {pregunta}
        </span>
        <ChevronDown
          size={16}
          color={MID}
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.3s ease",
          }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
      >
        <p
          style={{
            fontSize: "0.875rem",
            color: MID,
            lineHeight: 1.8,
            paddingBottom: "1.25rem",
          }}
        >
          {respuesta}
        </p>
      </div>
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────
export default function EntrenamientoPage() {
  return (
    <div style={{ backgroundColor: BG, color: DARK }}>
      <Header />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          backgroundColor: DARK,
          display: "flex",
          alignItems: "center",
          paddingTop: "5rem",
        }}
      >
        <div
          className="max-w-6xl mx-auto px-6 md:px-12 w-full"
          style={{ paddingTop: "5rem", paddingBottom: "6rem" }}
        >
          <p
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(237,230,217,0.5)",
              marginBottom: "2rem",
            }}
          >
            Veysic · Entrenamiento Personal
          </p>

          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(2.6rem, 6vw, 5rem)",
              lineHeight: 1.08,
              color: BG,
              marginBottom: "2rem",
              maxWidth: "780px",
              fontWeight: 400,
            }}
          >
            Tu mejor versión,
            <br />
            entrenada con método.
          </h1>

          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.85,
              color: "rgba(237,230,217,0.65)",
              maxWidth: "520px",
              marginBottom: "3rem",
            }}
          >
            Nada de rutinas genéricas. Cada programa parte de quién eres, lo
            que tu cuerpo necesita y los resultados que quieres alcanzar.
            Entrenamiento inteligente, supervisado y medible.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <a
              href="#modalidades"
              style={{
                padding: "0.9rem 2rem",
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                backgroundColor: BG,
                color: DARK,
                textDecoration: "none",
                borderRadius: "2px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F0E8")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BG)}
            >
              Ver modalidades
            </a>
            <a
              href="#como-funciona"
              style={{
                padding: "0.9rem 2rem",
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                backgroundColor: "transparent",
                color: BG,
                textDecoration: "none",
                border: "1px solid rgba(237,230,217,0.35)",
                borderRadius: "2px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(237,230,217,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(237,230,217,0.35)")}
            >
              ¿Cómo funciona?
            </a>
          </div>
        </div>
      </section>

      {/* ── MODALIDADES ───────────────────────────────────────────────────── */}
      <section
        id="modalidades"
        style={{ backgroundColor: BG, paddingTop: "7rem", paddingBottom: "7rem" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <FadeIn>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: MID,
                marginBottom: "1rem",
              }}
            >
              Modalidades
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 400,
                color: DARK,
                marginBottom: "1rem",
              }}
            >
              Elige cómo quieres entrenar
            </h2>
            <p style={{ fontSize: "0.9rem", color: MID, maxWidth: 520, lineHeight: 1.8, marginBottom: "4rem" }}>
              Tres formatos diseñados para adaptarse a tu situación, presupuesto y objetivos. Todos con el mismo nivel de exigencia y seguimiento.
            </p>
          </FadeIn>

          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: "1.5rem", alignItems: "start" }}
          >
            {MODALIDADES.map(({ id, Icon, titulo, tagline, ventajas, precios }, i) => (
              <FadeIn key={id} delay={i * 120}>
                <div
                  style={{
                    backgroundColor: LIGHT,
                    border: "1px solid rgba(31,31,31,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      padding: "2rem 1.75rem 1.5rem",
                      borderBottom: "1px solid rgba(31,31,31,0.08)",
                    }}
                  >
                    <Icon size={22} strokeWidth={1.5} color={DARK} style={{ marginBottom: "1.25rem" }} />
                    <h3
                      className="font-serif"
                      style={{ fontSize: "1.3rem", fontWeight: 400, color: DARK, marginBottom: "0.5rem" }}
                    >
                      {titulo}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: MID, lineHeight: 1.7 }}>{tagline}</p>
                  </div>

                  {/* Ventajas */}
                  <div style={{ padding: "1.5rem 1.75rem", borderBottom: "1px solid rgba(31,31,31,0.08)" }}>
                    <p
                      style={{
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: MID,
                        marginBottom: "0.9rem",
                      }}
                    >
                      Qué incluye
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                      {ventajas.map((v, j) => (
                        <li key={j} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                          <CheckCircle size={13} color={DARK} style={{ flexShrink: 0, marginTop: "0.15rem" }} />
                          <span style={{ fontSize: "0.8rem", color: MID, lineHeight: 1.6 }}>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Precios */}
                  <div style={{ padding: "1.5rem 1.75rem", flex: 1 }}>
                    <p
                      style={{
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: MID,
                        marginBottom: "0.9rem",
                      }}
                    >
                      Tarifas
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {precios.map((p, j) => (
                        <div
                          key={j}
                          style={{
                            position: "relative",
                            padding: "0.9rem 1rem",
                            borderRadius: "3px",
                            backgroundColor: p.popular
                              ? DARK
                              : "rgba(31,31,31,0.04)",
                            border: p.popular
                              ? "none"
                              : "1px solid rgba(31,31,31,0.1)",
                          }}
                        >
                          {p.popular && (
                            <div
                              style={{
                                position: "absolute",
                                top: -10,
                                right: 10,
                                backgroundColor: "#c0392b",
                                color: "#fff",
                                fontSize: "0.55rem",
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "20px",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                              }}
                            >
                              <Star size={8} fill="#fff" />
                              Más popular
                            </div>
                          )}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: p.popular ? "rgba(237,230,217,0.7)" : MID,
                              }}
                            >
                              {p.etiqueta}
                            </span>
                            <span
                              style={{
                                fontSize: "1.05rem",
                                fontWeight: 600,
                                color: p.popular ? BG : DARK,
                              }}
                            >
                              {p.precio}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.15rem" }}>
                            <span style={{ fontSize: "0.7rem", color: p.popular ? "rgba(237,230,217,0.5)" : MID }}>
                              {p.detalle}
                            </span>
                            {"nota" in p && p.nota && (
                              <span style={{ fontSize: "0.65rem", color: p.popular ? "rgba(237,230,217,0.5)" : MID, fontStyle: "italic" }}>
                                {p.nota}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón reservar */}
                  <div style={{ padding: "0 1.75rem 1.75rem" }}>
                    <Link
                      href="/reservar?categoria=entrenamiento"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        padding: "0.8rem",
                        fontSize: "0.65rem",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        backgroundColor: DARK,
                        color: BG,
                        textDecoration: "none",
                        borderRadius: "2px",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3A3A3A")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = DARK)}
                    >
                      Reservar
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Nota grupo */}
          <FadeIn delay={400}>
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: MID, textAlign: "center" }}>
              * Entrenamiento en grupo: máximo 5 personas por sesión.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ─────────────────────────────────────────────────── */}
      <section
        id="como-funciona"
        style={{ backgroundColor: LIGHT, paddingTop: "7rem", paddingBottom: "7rem" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <FadeIn>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: MID,
                marginBottom: "1rem",
              }}
            >
              El proceso
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 400,
                color: DARK,
                marginBottom: "4.5rem",
              }}
            >
              ¿Cómo funciona?
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: "0" }}>
            {PASOS.map(({ numero, Icon, titulo, texto }, i) => (
              <FadeIn key={numero} delay={i * 120}>
                <div
                  style={{
                    padding: "0 2rem 2rem 0",
                    paddingRight: i < PASOS.length - 1 ? "2rem" : 0,
                    borderRight: i < PASOS.length - 1 ? "1px solid rgba(31,31,31,0.1)" : "none",
                    marginRight: i < PASOS.length - 1 ? "2rem" : 0,
                  }}
                  className={i < PASOS.length - 1 ? "md:border-r md:mr-8 md:pr-8 mb-10 md:mb-0" : "mb-10 md:mb-0"}
                >
                  <p
                    className="font-serif"
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 400,
                      color: "rgba(31,31,31,0.1)",
                      lineHeight: 1,
                      marginBottom: "1.25rem",
                    }}
                  >
                    {numero}
                  </p>
                  <Icon size={20} strokeWidth={1.5} color={DARK} style={{ marginBottom: "1rem" }} />
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 400,
                      color: DARK,
                      marginBottom: "0.6rem",
                    }}
                  >
                    {titulo}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: MID, lineHeight: 1.8 }}>{texto}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ────────────────────────────────────────────────────── */}
      <section
        style={{ backgroundColor: BG, paddingTop: "7rem", paddingBottom: "7rem" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <FadeIn>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: MID,
                marginBottom: "1rem",
              }}
            >
              Por qué funciona
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 400,
                color: DARK,
                marginBottom: "4.5rem",
              }}
            >
              Ventajas del entrenamiento personal
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "2rem" }}>
            {BENEFICIOS.map(({ Icon, titulo, texto }, i) => (
              <FadeIn key={titulo} delay={i * 100}>
                <div>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      backgroundColor: "rgba(31,31,31,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <Icon size={18} strokeWidth={1.5} color={DARK} />
                  </div>
                  <h3
                    className="font-serif"
                    style={{ fontSize: "1.1rem", fontWeight: 400, color: DARK, marginBottom: "0.6rem" }}
                  >
                    {titulo}
                  </h3>
                  <p style={{ fontSize: "0.825rem", color: MID, lineHeight: 1.8 }}>{texto}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section
        style={{ backgroundColor: LIGHT, paddingTop: "7rem", paddingBottom: "7rem" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <FadeIn>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: MID,
                marginBottom: "1rem",
              }}
            >
              Preguntas frecuentes
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 400,
                color: DARK,
                marginBottom: "3.5rem",
              }}
            >
              Todo lo que necesitas saber
            </h2>
          </FadeIn>

          <div style={{ maxWidth: 720 }}>
            {FAQ.map(({ pregunta, respuesta }) => (
              <FaqItem key={pregunta} pregunta={pregunta} respuesta={respuesta} />
            ))}
          </div>

          <FadeIn delay={200}>
            <p style={{ marginTop: "3rem", fontSize: "0.875rem", color: MID }}>
              ¿Tienes otra pregunta?{" "}
              <Link
                href="/#contacto"
                style={{ color: DARK, textDecoration: "underline", textUnderlineOffset: "3px" }}
              >
                Escríbenos
              </Link>{" "}
              o llámanos al <strong>610 178 423</strong>.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: DARK,
          paddingTop: "8rem",
          paddingBottom: "8rem",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <FadeIn>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(237,230,217,0.45)",
                marginBottom: "1.5rem",
              }}
            >
              Empieza hoy
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                fontWeight: 400,
                lineHeight: 1.2,
                color: BG,
                maxWidth: "640px",
                marginBottom: "1.5rem",
              }}
            >
              Primera sesión de valoración gratuita. Sin compromisos.
            </h2>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: 1.9,
                color: "rgba(237,230,217,0.6)",
                maxWidth: "480px",
                marginBottom: "3rem",
              }}
            >
              Cuéntanos tus objetivos y en esa primera sesión te decimos exactamente
              cómo podemos ayudarte. Gratis, sin letra pequeña.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                href="/reservar?categoria=entrenamiento"
                style={{
                  padding: "0.9rem 2rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  backgroundColor: BG,
                  color: DARK,
                  textDecoration: "none",
                  borderRadius: "2px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F0E8")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BG)}
              >
                Reservar primera sesión
              </Link>
              <Link
                href="/#contacto"
                style={{
                  padding: "0.9rem 2rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  backgroundColor: "transparent",
                  color: BG,
                  textDecoration: "none",
                  border: "1px solid rgba(237,230,217,0.35)",
                  borderRadius: "2px",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(237,230,217,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(237,230,217,0.35)")}
              >
                Contactar
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer
        style={{
          backgroundColor: DARK,
          borderTop: "1px solid rgba(237,230,217,0.08)",
          paddingTop: "3rem",
          paddingBottom: "3rem",
        }}
      >
        <div
          className="max-w-6xl mx-auto px-6 md:px-12"
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
          }}
        >
          <Link
            href="/"
            className="font-serif uppercase"
            style={{ letterSpacing: "0.28em", fontSize: "1.05rem", color: BG, textDecoration: "none" }}
          >
            Veysic
          </Link>
          <p style={{ fontSize: "0.7rem", color: "rgba(237,230,217,0.38)", letterSpacing: "0.05em" }}>
            © 2026 Veysic. Todos los derechos reservados.
          </p>
          <nav style={{ display: "flex", gap: "2rem" }}>
            {[
              { label: "Inicio", href: "/" },
              { label: "Entrenamiento", href: "/entrenamiento" },
              { label: "Fisioterapia", href: "/fisioterapia" },
              { label: "Contacto", href: "/#contacto" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(237,230,217,0.45)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BG)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(237,230,217,0.45)")}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
