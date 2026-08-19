"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, User, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { logout } from "../lib/auth";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { label: "Inicio", href: "/#inicio" },
  { label: "Entrenamiento", href: "/entrenamiento" },
  { label: "Fisioterapia", href: "/fisioterapia" },
  { label: "Podología", href: "/#podologia" },
  { label: "Sobre nosotros", href: "/#sobre-nosotros" },
  { label: "Herramientas", href: "/herramientas" },
  { label: "Contacto", href: "/#contacto" },
];

const BTN = {
  base: {
    fontSize: "0.65rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    textDecoration: "none",
    borderRadius: "2px",
    transition: "background-color 0.2s",
  },
  dark: {
    padding: "0.6rem 1.4rem",
    backgroundColor: "#1F1F1F",
    color: "#EDE6D9",
    border: "none",
    cursor: "pointer",
  },
  outline: {
    padding: "0.55rem 1.3rem",
    backgroundColor: "transparent",
    color: "#1F1F1F",
    border: "1px solid rgba(31,31,31,0.35)",
  },
};

export default function Header() {
  const { user, setUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  function handleLogout() {
    logout();
    setUser(null);
    setDropOpen(false);
    router.push("/");
  }

  function areaLink() {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "profesional") return "/profesional";
    return "/perfil";
  }

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: "#EDE6D9",
        borderBottom: "1px solid rgba(31,31,31,0.12)",
        boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center justify-between h-20">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-serif uppercase"
          style={{
            letterSpacing: "0.28em",
            fontSize: "1.05rem",
            color: "#1F1F1F",
            textDecoration: "none",
          }}
        >
          Veysic
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#3A3A3A",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1F1F1F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3A3A3A")}
            >
              {link.label}
            </Link>
          ))}

          {/* Auth area */}
          {!user ? (
            <div style={{ display: "flex", gap: "0.75rem", marginLeft: "1rem", alignItems: "center" }}>
              <Link
                href="/login"
                style={{ ...BTN.base, ...BTN.outline }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(31,31,31,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                style={{ ...BTN.base, ...BTN.dark }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#3A3A3A")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1F1F1F")
                }
              >
                Registrarse
              </Link>
            </div>
          ) : (
            <div
              ref={dropRef}
              style={{ position: "relative", marginLeft: "1rem" }}
            >
              <button
                onClick={() => setDropOpen(!dropOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  background: "none",
                  border: "1px solid rgba(31,31,31,0.2)",
                  borderRadius: "2rem",
                  padding: "0.4rem 0.9rem 0.4rem 0.5rem",
                  cursor: "pointer",
                  color: "#1F1F1F",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(31,31,31,0.5)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(31,31,31,0.2)")
                }
              >
                {user.foto ? (
                  <img
                    src={user.foto}
                    alt=""
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "#1F1F1F",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={14} color="#EDE6D9" />
                  </div>
                )}
                <span
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.05em",
                    color: "#1F1F1F",
                  }}
                >
                  {user.nombre.split(" ")[0]}
                </span>
                <ChevronDown
                  size={12}
                  style={{
                    transform: dropOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {dropOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 0.5rem)",
                    right: 0,
                    backgroundColor: "#EDE6D9",
                    border: "1px solid rgba(31,31,31,0.12)",
                    borderRadius: "4px",
                    minWidth: 200,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid rgba(31,31,31,0.08)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "#1F1F1F",
                      }}
                    >
                      {user.nombre}
                    </p>
                    <p
                      style={{
                        fontSize: "0.65rem",
                        color: "#3A3A3A",
                        marginTop: "0.15rem",
                      }}
                    >
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href={areaLink()}
                    onClick={() => setDropOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.75rem 1rem",
                      fontSize: "0.7rem",
                      color: "#1F1F1F",
                      textDecoration: "none",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(31,31,31,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <Settings size={13} />
                    Mi área personal
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      width: "100%",
                      padding: "0.75rem 1rem",
                      fontSize: "0.7rem",
                      color: "#1F1F1F",
                      background: "none",
                      border: "none",
                      borderTop: "1px solid rgba(31,31,31,0.06)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(31,31,31,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <LogOut size={13} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#1F1F1F",
            padding: "0.5rem",
          }}
        >
          {menuOpen ? (
            <X size={20} strokeWidth={1.5} />
          ) : (
            <Menu size={20} strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            backgroundColor: "#EDE6D9",
            borderTop: "1px solid rgba(31,31,31,0.1)",
            padding: "2rem 1.5rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#3A3A3A",
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
          {!user ? (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  border: "1px solid rgba(31,31,31,0.35)",
                  color: "#1F1F1F",
                  textDecoration: "none",
                  borderRadius: "2px",
                  textAlign: "center",
                }}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  backgroundColor: "#1F1F1F",
                  color: "#EDE6D9",
                  textDecoration: "none",
                  borderRadius: "2px",
                  textAlign: "center",
                }}
              >
                Registrarse
              </Link>
            </>
          ) : (
            <>
              <Link
                href={areaLink()}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  border: "1px solid rgba(31,31,31,0.35)",
                  color: "#1F1F1F",
                  textDecoration: "none",
                  borderRadius: "2px",
                  textAlign: "center",
                }}
              >
                Mi área personal
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  backgroundColor: "#1F1F1F",
                  color: "#EDE6D9",
                  border: "none",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
