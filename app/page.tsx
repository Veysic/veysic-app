"use client";

import { useState, useEffect, useRef } from "react";
import { Dumbbell, Activity, Footprints, ArrowRight } from "lucide-react";
import Link from "next/link";
import Header from "./components/Header";

// ── Fade-in on scroll ──────────────────────────────────────────────────────
function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(22px)",
        transition: `opacity 0.9s ease ${delay}ms, transform 0.9s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Entrenamiento", href: "/entrenamiento" },
  { label: "Fisioterapia", href: "/fisioterapia" },
  { label: "Servicios", href: "#servicios" },
  { label: "Sobre nosotros", href: "#sobre-nosotros" },
  { label: "Contacto", href: "#contacto" },
];

const SERVICES = [
  {
    Icon: Dumbbell,
    title: "Entrenamiento Personal",
    description:
      "Planificación individualizada según tus objetivos, historial y disponibilidad. Técnica, progresión y resultados reales.",
    href: "/entrenamiento",
  },
  {
    Icon: Activity,
    title: "Fisioterapia",
    description:
      "Diagnóstico y tratamiento de lesiones musculoesqueléticas. Terapia manual, ecografía y técnicas avanzadas para que te recuperes de verdad.",
    href: "/fisioterapia",
  },
  {
    Icon: Footprints,
    title: "Podología",
    description:
      "Estudio biomecánico, tratamiento de patologías del pie y plantillas a medida para que cada paso sea el correcto.",
    href: null,
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#EDE6D9", color: "#1F1F1F" }}
    >
      <Header />

      <main>
        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section
          id="inicio"
          style={{
            minHeight: "100vh",
            backgroundColor: "#EDE6D9",
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
                color: "#3A3A3A",
                marginBottom: "2.5rem",
              }}
            >
              Entrenamiento · Fisioterapia · Podología
            </p>

            <h1
              className="font-serif"
              style={{
                fontSize: "clamp(2.6rem, 6vw, 5rem)",
                lineHeight: 1.08,
                color: "#1F1F1F",
                marginBottom: "2rem",
                maxWidth: "780px",
                fontWeight: 400,
              }}
            >
              Cuidamos tu cuerpo.
              <br />
              Elevamos tu rendimiento.
            </h1>

            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.8,
                color: "#3A3A3A",
                maxWidth: "480px",
                marginBottom: "3rem",
              }}
            >
              Entrenamiento personal, fisioterapia y podología en un mismo
              espacio. Hecho a medida para ti.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                href="/reservar"
                style={{
                  padding: "0.85rem 2rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  backgroundColor: "#1F1F1F",
                  color: "#EDE6D9",
                  textDecoration: "none",
                  borderRadius: "2px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#3A3A3A")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1F1F1F")
                }
              >
                Reservar cita
              </Link>
              <a
                href="#servicios"
                style={{
                  padding: "0.85rem 2rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  backgroundColor: "transparent",
                  color: "#1F1F1F",
                  textDecoration: "none",
                  border: "1px solid #1F1F1F",
                  borderRadius: "2px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(31,31,31,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Conocer servicios
              </a>
            </div>
          </div>
        </section>

        {/* ── SERVICIOS ──────────────────────────────────────────────────── */}
        <section
          id="servicios"
          style={{ backgroundColor: "#F5F0E8", paddingTop: "7rem", paddingBottom: "7rem" }}
        >
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <FadeIn>
              <h2
                className="font-serif"
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                  fontWeight: 400,
                  color: "#1F1F1F",
                  marginBottom: "4.5rem",
                }}
              >
                Servicios
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3">
              {SERVICES.map(({ Icon, title, description, href }, i) => (
                <div
                  key={title}
                  id={title === "Podología" ? "podologia" : undefined}
                  className={
                    i === 0
                      ? "py-10 md:py-0 md:pr-12 border-b md:border-b-0"
                      : i === 1
                      ? "py-10 md:py-0 md:px-12 border-b md:border-b-0 md:border-l md:border-r"
                      : "py-10 md:py-0 md:pl-12"
                  }
                  style={{ borderColor: "rgba(31,31,31,0.12)" }}
                >
                  <FadeIn delay={i * 130}>
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      style={{ color: "#1F1F1F", marginBottom: "1.75rem" }}
                    />
                    <h3
                      className="font-serif"
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 400,
                        color: "#1F1F1F",
                        marginBottom: "1rem",
                      }}
                    >
                      {title}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        lineHeight: 1.8,
                        color: "#3A3A3A",
                        marginBottom: href ? "1.25rem" : 0,
                      }}
                    >
                      {description}
                    </p>
                    {href && (
                      <Link
                        href={href}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          fontSize: "0.65rem",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "#1F1F1F",
                          textDecoration: "none",
                          borderBottom: "1px solid rgba(31,31,31,0.3)",
                          paddingBottom: "0.15rem",
                          transition: "border-color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1F1F1F")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(31,31,31,0.3)")}
                      >
                        Ver modalidades y precios
                        <ArrowRight size={11} />
                      </Link>
                    )}
                  </FadeIn>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOBRE NOSOTROS ─────────────────────────────────────────────── */}
        <section
          id="sobre-nosotros"
          style={{
            backgroundColor: "#1F1F1F",
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
                  marginBottom: "2rem",
                }}
              >
                Sobre nosotros
              </p>
              <h2
                className="font-serif"
                style={{
                  fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: "#EDE6D9",
                  maxWidth: "700px",
                  marginBottom: "2.5rem",
                }}
              >
                Cuidado integral del cuerpo, desde la experiencia y el rigor
                profesional.
              </h2>
              <p
                style={{
                  fontSize: "0.95rem",
                  lineHeight: 1.9,
                  color: "rgba(237,230,217,0.65)",
                  maxWidth: "560px",
                }}
              >
                Veysic nace de dos hermanos con una misma visión: acompañar a
                cada persona en su proceso con honestidad y precisión. Toro,
                especialista en entrenamiento personal, y Gonzalo,
                fisioterapeuta y podólogo, combinan su experiencia para
                ofrecerte un cuidado sin fragmentar. Un solo lugar, todas las
                respuestas.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ── CONTACTO ───────────────────────────────────────────────────── */}
        <section
          id="contacto"
          style={{
            backgroundColor: "#F5F0E8",
            paddingTop: "7rem",
            paddingBottom: "7rem",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <FadeIn>
              <h2
                className="font-serif"
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                  fontWeight: 400,
                  color: "#1F1F1F",
                  marginBottom: "4.5rem",
                }}
              >
                Contacto
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
              {/* Info */}
              <FadeIn>
                <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                  {[
                    {
                      label: "Email",
                      value: (
                        <>
                          luis_garvey@hotmail.com
                          <br />
                          gonzalo_garvey@hotmail.com
                        </>
                      ),
                    },
                    { label: "Teléfono", value: "610 178 423" },
                    {
                      label: "Dirección",
                      value: (
                        <>
                          Avda. Paseo de Europa 7-9
                          <br />
                          41012 Sevilla, España
                        </>
                      ),
                    },
                    {
                      label: "Horario",
                      value: (
                        <>
                          Lunes – Viernes: 8:00 – 20:00
                          <br />
                          Sábados: 9:00 – 14:00
                        </>
                      ),
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p
                        style={{
                          fontSize: "0.65rem",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "#3A3A3A",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          lineHeight: 1.7,
                          color: "#1F1F1F",
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Form */}
              <FadeIn delay={150}>
                <form
                  style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}
                  onSubmit={(e) => e.preventDefault()}
                >
                  {[
                    { label: "Nombre", type: "text", placeholder: "Tu nombre" },
                    { label: "Email", type: "email", placeholder: "tu@email.com" },
                  ].map(({ label, type, placeholder }) => (
                    <div key={label} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      <label
                        style={{
                          fontSize: "0.65rem",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "#3A3A3A",
                        }}
                      >
                        {label}
                      </label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        style={{
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid rgba(31,31,31,0.25)",
                          paddingBottom: "0.75rem",
                          paddingTop: "0.25rem",
                          fontSize: "0.875rem",
                          color: "#1F1F1F",
                          outline: "none",
                          width: "100%",
                          fontFamily: "var(--font-inter), system-ui, sans-serif",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderBottomColor = "#1F1F1F")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderBottomColor =
                            "rgba(31,31,31,0.25)")
                        }
                      />
                    </div>
                  ))}

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <label
                      style={{
                        fontSize: "0.65rem",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "#3A3A3A",
                      }}
                    >
                      Mensaje
                    </label>
                    <textarea
                      rows={4}
                      placeholder="¿En qué podemos ayudarte?"
                      style={{
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid rgba(31,31,31,0.25)",
                        paddingBottom: "0.75rem",
                        paddingTop: "0.25rem",
                        fontSize: "0.875rem",
                        color: "#1F1F1F",
                        outline: "none",
                        resize: "none",
                        width: "100%",
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderBottomColor = "#1F1F1F")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderBottomColor =
                          "rgba(31,31,31,0.25)")
                      }
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      style={{
                        padding: "0.85rem 2rem",
                        fontSize: "0.65rem",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        backgroundColor: "#1F1F1F",
                        color: "#EDE6D9",
                        border: "none",
                        borderRadius: "2px",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#3A3A3A")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#1F1F1F")
                      }
                    >
                      Enviar mensaje
                    </button>
                  </div>
                </form>
              </FadeIn>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer
        style={{
          backgroundColor: "#1F1F1F",
          paddingTop: "3.5rem",
          paddingBottom: "3.5rem",
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
          <span
            className="font-serif uppercase"
            style={{
              letterSpacing: "0.28em",
              fontSize: "1.05rem",
              color: "#EDE6D9",
            }}
          >
            Veysic
          </span>

          <p
            style={{
              fontSize: "0.7rem",
              color: "rgba(237,230,217,0.38)",
              letterSpacing: "0.05em",
            }}
          >
            © 2026 Veysic. Todos los derechos reservados.
          </p>

          <nav style={{ display: "flex", gap: "2rem" }}>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(237,230,217,0.45)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#EDE6D9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(237,230,217,0.45)")
                }
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
