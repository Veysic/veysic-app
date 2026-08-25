"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";
import {
  Activity,
  Award,
  Package,
  CheckCircle,
  ChevronDown,
  ArrowRight,
  Star,
  Hand,
  Zap,
  Dumbbell,
  TrendingUp,
  Search,
  Target,
  AlertCircle,
  HeartPulse,
  Shield,
  RotateCcw,
  Calendar,
} from "lucide-react";

const BG = "#2C2C2C";
const SURFACE = "#3D3D3D";
const TEXT = "#FFFFFF";
const MUTED = "#A0A0A0";
const ACCENT = "#8B1A2F";
const ACCENT_HOVER = "#B8324A";

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
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
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
const SERVICIOS = [
  {
    id: "esencial",
    Icon: Activity,
    titulo: "Fisioterapia Esencial",
    precio: "50 €",
    detallePrecio: "por sesión",
    tagline: "Valoración, diagnóstico y tratamiento manual de lesiones y disfunciones del aparato locomotor.",
    descripcion:
      "La sesión estándar de fisioterapia en Veysic. Incluye una valoración inicial detallada, diagnóstico funcional y tratamiento manual adaptado a tu lesión o disfunción. Sin prisas, sin protocolos genéricos.",
    incluye: [
      "Valoración y diagnóstico inicial completo",
      "Terapia manual ortopédica",
      "Movilizaciones articulares y neurodinámicas",
      "Técnicas de tejido blando (masoterapia, liberación miofascial)",
      "Pauta de ejercicios para casa",
    ],
    popular: false,
  },
  {
    id: "avanzada",
    Icon: Award,
    titulo: "Fisioterapia Avanzada",
    precio: "65 €",
    detallePrecio: "por sesión · 45–75 min",
    tagline: "Cuando la lesión requiere herramientas de mayor precisión diagnóstica y terapéutica.",
    descripcion:
      "Integra todo lo de la sesión esencial más técnicas avanzadas: ecografía diagnóstica y terapéutica, fisioterapia invasiva (punción seca, EPI) y electroterapia de alta gama. La duración se adapta a la complejidad del caso.",
    incluye: [
      "Todo lo incluido en Fisioterapia Esencial",
      "Ecografía diagnóstica y guiada para tratamiento",
      "Punción seca (técnica de fisioterapia invasiva)",
      "EPI — Electrólisis Percutánea Intratisular",
      "Electroterapia y ultrasonido terapéutico",
      "Seguimiento ecográfico de la evolución",
    ],
    popular: true,
  },
  {
    id: "bono",
    Icon: Package,
    titulo: "Bono Rehabilitación",
    precio: "450 €",
    detallePrecio: "10 sesiones · ahorras 50 €",
    tagline: "El formato ideal para procesos de rehabilitación continuada que requieren constancia.",
    descripcion:
      "Diez sesiones de Fisioterapia Esencial con seguimiento evolutivo entre cada cita. El bono garantiza continuidad terapéutica, economiza el tratamiento y permite ajustar el plan cada semana según tu respuesta.",
    incluye: [
      "10 sesiones de Fisioterapia Esencial",
      "Ahorro de 50 € respecto al precio por sesión",
      "Revisión y ajuste del plan en cada sesión",
      "Acceso al historial clínico digital en tu perfil",
      "Coordinación con el equipo de entrenamiento si es necesario",
    ],
    popular: false,
  },
];

const TECNICAS = [
  {
    Icon: Hand,
    titulo: "Terapia manual",
    texto:
      "Movilizaciones articulares, manipulaciones de alta velocidad y técnicas neurodinámicas para recuperar la función articular y aliviar el dolor.",
  },
  {
    Icon: Search,
    titulo: "Ecografía diagnóstica y terapéutica",
    texto:
      "Imagen en tiempo real para confirmar diagnósticos musculotendinosos y guiar con precisión las técnicas invasivas.",
  },
  {
    Icon: Zap,
    titulo: "Fisioterapia invasiva",
    texto:
      "Punción seca para puntos gatillo miofasciales y EPI (Electrólisis Percutánea Intratisular) para tendinopatías y lesiones de tejido blando.",
  },
  {
    Icon: Activity,
    titulo: "Electroterapia",
    texto:
      "TENS, corrientes interferenciales y ultrasonido terapéutico para modular el dolor, reducir la inflamación y acelerar la recuperación.",
  },
  {
    Icon: Dumbbell,
    titulo: "Ejercicio terapéutico",
    texto:
      "Prescripción de ejercicio específico como parte del tratamiento: no solo para recuperarse, sino para no recaer.",
  },
  {
    Icon: TrendingUp,
    titulo: "Rehabilitación deportiva",
    texto:
      "Protocolo de retorno al deporte gradual y seguro, con criterios funcionales y de carga para cada fase de la recuperación.",
  },
];

const CUANDO = [
  {
    Icon: AlertCircle,
    titulo: "Dolor de espalda, cervical o lumbar",
    texto:
      "Uno de los motivos de consulta más frecuentes. Tanto en fase aguda como en procesos crónicos, la fisioterapia ofrece resultados con evidencia científica.",
  },
  {
    Icon: Target,
    titulo: "Lesiones deportivas",
    texto:
      "Esguinces, roturas musculares, tendinopatías, sobrecargas… Si el deporte forma parte de tu vida, la recuperación también debe serlo.",
  },
  {
    Icon: HeartPulse,
    titulo: "Recuperación postoperatoria",
    texto:
      "Tras una intervención de rodilla, hombro, columna u otras estructuras, la fisioterapia es parte esencial del protocolo para recuperar la función completa.",
  },
  {
    Icon: RotateCcw,
    titulo: "Contracturas y tendinitis",
    texto:
      "La sobrecarga repetitiva o el estrés acumulado generan contracturas y tendinopatías que, sin tratamiento, se cronifican. Actuamos antes de que el problema se instale.",
  },
  {
    Icon: Shield,
    titulo: "Problemas posturales crónicos",
    texto:
      "Años de mala postura, sedentarismo o trabajo frente a pantalla dejan huella en el aparato locomotor. Valoramos y tratamos la causa, no solo el síntoma.",
  },
  {
    Icon: Calendar,
    titulo: "Seguimiento y prevención de recaídas",
    texto:
      "Una vez superada la lesión, el seguimiento periódico permite detectar desequilibrios antes de que se conviertan en un problema mayor.",
  },
];

const FAQ = [
  {
    pregunta: "¿Necesito derivación médica para acudir?",
    respuesta:
      "No. En España puedes acudir directamente a un fisioterapeuta sin necesidad de receta o derivación médica previa. Hacemos nuestra propia valoración y diagnóstico funcional desde el primer momento.",
  },
  {
    pregunta: "¿Cuántas sesiones necesitaré?",
    respuesta:
      "Depende de la lesión, su antigüedad y tu respuesta al tratamiento. Tras la primera sesión te damos una estimación honesta. No alargamos los tratamientos más de lo necesario.",
  },
  {
    pregunta: "¿Qué es la fisioterapia invasiva y duele?",
    respuesta:
      "La punción seca y la EPI son técnicas mínimamente invasivas que actúan directamente sobre el tejido dañado con una aguja fina. Pueden provocar una ligera molestia durante el procedimiento y las 24-48h posteriores, pero son bien toleradas y de gran efectividad.",
  },
  {
    pregunta: "¿La ecografía tiene coste adicional en la sesión avanzada?",
    respuesta:
      "No. En la sesión de Fisioterapia Avanzada (65€), la ecografía está incluida. La usamos tanto para el diagnóstico como para guiar las técnicas de tratamiento cuando es necesario.",
  },
  {
    pregunta: "¿Puedo entrenar mientras recibo tratamiento de fisioterapia?",
    respuesta:
      "Depende de la lesión y la fase del tratamiento. En muchos casos no solo se puede, sino que se recomienda. Coordinamos directamente con el equipo de entrenamiento de Veysic para que la recuperación y el entrenamiento se complementen.",
  },
];

// ── Componente FAQ ─────────────────────────────────────────────────────────
function FaqItem({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(61,61,61,0.1)" }}>
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
        <span style={{ fontSize: "0.95rem", color: TEXT, fontWeight: 500, lineHeight: 1.4 }}>
          {pregunta}
        </span>
        <ChevronDown
          size={16}
          color={MUTED}
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
        <p style={{ fontSize: "0.875rem", color: MUTED, lineHeight: 1.8, paddingBottom: "1.25rem" }}>
          {respuesta}
        </p>
      </div>
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────
export default function FisioterapiaPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT }}>
      <Header />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          backgroundColor: BG,
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
              color: "rgba(255,255,255,0.5)",
              marginBottom: "2rem",
            }}
          >
            Veysic · Fisioterapia
          </p>

          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(2.6rem, 6vw, 5rem)",
              lineHeight: 1.08,
              color: TEXT,
              marginBottom: "2rem",
              maxWidth: "780px",
              fontWeight: 400,
            }}
          >
            Recupera la función.
            <br />
            Elimina el dolor.
          </h1>

          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.85,
              color: "rgba(255,255,255,0.65)",
              maxWidth: "520px",
              marginBottom: "3rem",
            }}
          >
            Fisioterapia basada en evidencia, con diagnóstico preciso y
            tratamiento individualizado. Combinamos terapia manual, ecografía y
            técnicas avanzadas para que te recuperes de verdad, no a medias.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <a
              href="#servicios"
              style={{
                padding: "0.9rem 2rem",
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                backgroundColor: ACCENT,
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: "2px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
            >
              Ver servicios y precios
            </a>
            <a
              href="#cuando"
              style={{
                padding: "0.9rem 2rem",
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                backgroundColor: "transparent",
                color: ACCENT,
                textDecoration: "none",
                border: "1px solid " + ACCENT,
                borderRadius: "2px",
                transition: "background-color 0.2s, color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = ACCENT;
                e.currentTarget.style.borderColor = ACCENT;
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = ACCENT;
                e.currentTarget.style.color = ACCENT;
              }}
            >
              ¿Cuándo acudir?
            </a>
          </div>
        </div>
      </section>

      {/* ── SERVICIOS Y TARIFAS ───────────────────────────────────────────── */}
      <section
        id="servicios"
        style={{ backgroundColor: BG, paddingTop: "7rem", paddingBottom: "7rem" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <FadeIn>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: MUTED,
                marginBottom: "1rem",
              }}
            >
              Servicios
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 400,
                color: TEXT,
                marginBottom: "1rem",
              }}
            >
              Tratamiento a tu medida
            </h2>
            <p style={{ fontSize: "0.9rem", color: MUTED, maxWidth: 520, lineHeight: 1.8, marginBottom: "4rem" }}>
              Tres opciones para adaptarse a tu situación: desde una lesión puntual hasta un proceso de rehabilitación continuada.
            </p>
          </FadeIn>

          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: "1.5rem", alignItems: "start" }}
          >
            {SERVICIOS.map(
              ({ id, Icon, titulo, precio, detallePrecio, tagline, descripcion, incluye, popular }, i) => (
                <FadeIn key={id} delay={i * 120}>
                  <div
                    style={{
                      backgroundColor: SURFACE,
                      border: popular ? `2px solid ${ACCENT}` : "1px solid rgba(61,61,61,0.1)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                  >
                    {popular && (
                      <div
                        style={{
                          backgroundColor: ACCENT,
                          color: "#FFFFFF",
                          textAlign: "center",
                          padding: "0.45rem",
                          fontSize: "0.6rem",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <Star size={9} fill="#FFFFFF" />
                        Más completo
                      </div>
                    )}

                    {/* Header */}
                    <div
                      style={{
                        padding: "1.75rem 1.75rem 1.25rem",
                        borderBottom: "1px solid rgba(61,61,61,0.08)",
                      }}
                    >
                      <Icon
                        size={20}
                        strokeWidth={1.5}
                        color={ACCENT}
                        style={{ marginBottom: "1.1rem" }}
                      />
                      <h3
                        className="font-serif"
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: 400,
                          color: TEXT,
                          marginBottom: "0.4rem",
                        }}
                      >
                        {titulo}
                      </h3>
                      <p style={{ fontSize: "0.78rem", color: MUTED, lineHeight: 1.65 }}>{tagline}</p>
                    </div>

                    {/* Precio destacado */}
                    <div
                      style={{
                        padding: "1.25rem 1.75rem",
                        borderBottom: "1px solid rgba(61,61,61,0.08)",
                        backgroundColor: popular ? "rgba(139,26,47,0.1)" : "transparent",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "2rem",
                          fontWeight: 600,
                          color: TEXT,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {precio}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: MUTED,
                          marginLeft: "0.5rem",
                        }}
                      >
                        {detallePrecio}
                      </span>
                    </div>

                    {/* Descripción */}
                    <div
                      style={{
                        padding: "1.25rem 1.75rem",
                        borderBottom: "1px solid rgba(61,61,61,0.08)",
                      }}
                    >
                      <p style={{ fontSize: "0.8rem", color: MUTED, lineHeight: 1.75 }}>
                        {descripcion}
                      </p>
                    </div>

                    {/* Qué incluye */}
                    <div style={{ padding: "1.25rem 1.75rem", flex: 1 }}>
                      <p
                        style={{
                          fontSize: "0.6rem",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: MUTED,
                          marginBottom: "0.85rem",
                        }}
                      >
                        Qué incluye
                      </p>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {incluye.map((item, j) => (
                          <li
                            key={j}
                            style={{ display: "flex", gap: "0.55rem", alignItems: "flex-start" }}
                          >
                            <CheckCircle
                              size={13}
                              color={ACCENT}
                              style={{ flexShrink: 0, marginTop: "0.2rem" }}
                            />
                            <span style={{ fontSize: "0.78rem", color: MUTED, lineHeight: 1.6 }}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Botón */}
                    <div style={{ padding: "0 1.75rem 1.75rem" }}>
                      <Link
                        href="/reservar?categoria=fisioterapia"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          padding: "0.8rem",
                          fontSize: "0.65rem",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          backgroundColor: ACCENT,
                          color: "#FFFFFF",
                          textDecoration: "none",
                          borderRadius: "2px",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = ACCENT_HOVER)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = ACCENT)
                        }
                      >
                        Reservar sesión
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </FadeIn>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── TÉCNICAS ──────────────────────────────────────────────────────── */}
      <section
        style={{ backgroundColor: SURFACE, paddingTop: "7rem", paddingBottom: "7rem" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <FadeIn>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: MUTED,
                marginBottom: "1rem",
              }}
            >
              Especialidades
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 400,
                color: TEXT,
                marginBottom: "1rem",
              }}
            >
              Técnicas y herramientas
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                color: MUTED,
                maxWidth: 520,
                lineHeight: 1.8,
                marginBottom: "4.5rem",
              }}
            >
              La variedad de técnicas disponibles en Veysic nos permite elegir
              la herramienta más adecuada para cada caso, sin ceñirnos a un
              único protocolo.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "2.5rem" }}>
            {TECNICAS.map(({ Icon, titulo, texto }, i) => (
              <FadeIn key={titulo} delay={i * 100}>
                <div>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      backgroundColor: "rgba(139,26,47,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.1rem",
                    }}
                  >
                    <Icon size={18} strokeWidth={1.5} color={ACCENT} />
                  </div>
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 400,
                      color: TEXT,
                      marginBottom: "0.55rem",
                    }}
                  >
                    {titulo}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: MUTED, lineHeight: 1.8 }}>{texto}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CUÁNDO ACUDIR ─────────────────────────────────────────────────── */}
      <section
        id="cuando"
        style={{ backgroundColor: BG, paddingTop: "7rem", paddingBottom: "7rem" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <FadeIn>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: MUTED,
                marginBottom: "1rem",
              }}
            >
              Indicaciones
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 400,
                color: TEXT,
                marginBottom: "1rem",
              }}
            >
              ¿Cuándo acudir a fisioterapia?
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                color: MUTED,
                maxWidth: 520,
                lineHeight: 1.8,
                marginBottom: "4.5rem",
              }}
            >
              No hace falta esperar a que el dolor se vuelva insoportable. Cuanto antes se trata, antes se resuelve — y más se previene una recaída.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1.25rem" }}>
            {CUANDO.map(({ Icon, titulo, texto }, i) => (
              <FadeIn key={titulo} delay={i * 90}>
                <div
                  style={{
                    backgroundColor: SURFACE,
                    border: "1px solid rgba(61,61,61,0.09)",
                    borderRadius: "4px",
                    padding: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      backgroundColor: "rgba(139,26,47,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <Icon size={16} strokeWidth={1.5} color={ACCENT} />
                  </div>
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: "1rem",
                      fontWeight: 400,
                      color: TEXT,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {titulo}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: MUTED, lineHeight: 1.75 }}>{texto}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: SURFACE, paddingTop: "7rem", paddingBottom: "7rem" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <FadeIn>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: MUTED,
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
                color: TEXT,
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
            <p style={{ marginTop: "3rem", fontSize: "0.875rem", color: MUTED }}>
              ¿Tienes alguna duda más?{" "}
              <Link
                href="/#contacto"
                style={{
                  color: ACCENT,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
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
        style={{ backgroundColor: BG, paddingTop: "8rem", paddingBottom: "8rem" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <FadeIn>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
                marginBottom: "1.5rem",
              }}
            >
              Primera consulta
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                fontWeight: 400,
                lineHeight: 1.2,
                color: TEXT,
                maxWidth: "640px",
                marginBottom: "1.5rem",
              }}
            >
              Empieza con una valoración completa. Sin esperas.
            </h2>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: 1.9,
                color: "rgba(255,255,255,0.6)",
                maxWidth: "480px",
                marginBottom: "3rem",
              }}
            >
              En la primera sesión hacemos un diagnóstico fisioterapéutico
              detallado, te explicamos qué está pasando y empezamos el
              tratamiento ese mismo día.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                href="/reservar?categoria=fisioterapia"
                style={{
                  padding: "0.9rem 2rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  backgroundColor: ACCENT,
                  color: "#FFFFFF",
                  textDecoration: "none",
                  borderRadius: "2px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
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
                  color: ACCENT,
                  textDecoration: "none",
                  border: "1px solid " + ACCENT,
                  borderRadius: "2px",
                  transition: "background-color 0.2s, color 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = ACCENT;
                  e.currentTarget.style.borderColor = ACCENT;
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = ACCENT;
                  e.currentTarget.style.color = ACCENT;
                }}
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
          backgroundColor: "#1A1A1A",
          borderTop: "1px solid rgba(61,61,61,0.08)",
          paddingTop: "3rem",
          paddingBottom: "3rem",
        }}
      >
        <div
          className="max-w-6xl mx-auto px-6 md:px-12"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
          }}
        >
          <Link
            href="/"
            className="font-serif uppercase"
            style={{
              letterSpacing: "0.28em",
              fontSize: "1.05rem",
              color: TEXT,
              textDecoration: "none",
            }}
          >
            Veysic
          </Link>
          <p
            style={{
              fontSize: "0.7rem",
              color: "rgba(255,255,255,0.38)",
              letterSpacing: "0.05em",
            }}
          >
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
                  color: "rgba(255,255,255,0.45)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.45)")
                }
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
