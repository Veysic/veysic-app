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
    backgroundColor: "#8B1A2F",
    color: "#FFFFFF",
    border: "none",
    cursor: "pointer",
  },
  outline: {
    padding: "0.55rem 1.3rem",
    backgroundColor: "transparent",
    color: "#8B1A2F",
    border: "1px solid #8B1A2F",
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
        backgroundColor: "#2C2C2C",
        borderBottom: "1px solid rgba(61,61,61,0.12)",
        boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.3)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-20">
        {/* Wordmark */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
          }}
        >
          <span
            className="font-serif"
            style={{
              width: 30,
              height: 30,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#8B1A2F",
              color: "#FFFFFF",
              borderRadius: "3px",
              fontSize: "0.95rem",
            }}
          >
            V
          </span>
          <span
            className="font-serif uppercase"
            style={{
              letterSpacing: "0.28em",
              fontSize: "1.05rem",
              color: "#FFFFFF",
            }}
          >
            Veysic
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#FFFFFF",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#B8324A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#FFFFFF")}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#8B1A2F";
                  e.currentTarget.style.borderColor = "#8B1A2F";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#8B1A2F";
                  e.currentTarget.style.color = "#8B1A2F";
                }}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                style={{ ...BTN.base, ...BTN.dark }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#A8324A")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#8B1A2F")
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
                  border: "1px solid #3D3D3D",
                  borderRadius: "2rem",
                  padding: "0.4rem 0.9rem 0.4rem 0.5rem",
                  cursor: "pointer",
                  color: "#FFFFFF",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(61,61,61,0.5)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#3D3D3D")
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
                      backgroundColor: "#3D3D3D",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={14} color="#FFFFFF" />
                  </div>
                )}
                <span
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.05em",
                    color: "#FFFFFF",
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
                    backgroundColor: "#3D3D3D",
                    border: "1px solid rgba(61,61,61,0.12)",
                    borderRadius: "4px",
                    minWidth: 200,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid rgba(61,61,61,0.08)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {user.nombre}
                    </p>
                    <p
                      style={{
                        fontSize: "0.65rem",
                        color: "#A0A0A0",
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
                      color: "#FFFFFF",
                      textDecoration: "none",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.06)")
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
                      color: "#FFFFFF",
                      background: "none",
                      border: "none",
                      borderTop: "1px solid rgba(61,61,61,0.08)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.06)")
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
            color: "#FFFFFF",
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
            backgroundColor: "#3D3D3D",
            borderTop: "1px solid rgba(61,61,61,0.1)",
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
                color: "#FFFFFF",
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
                  border: "1px solid #8B1A2F",
                  color: "#8B1A2F",
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
                  backgroundColor: "#8B1A2F",
                  color: "#FFFFFF",
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
                  border: "1px solid #8B1A2F",
                  color: "#8B1A2F",
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
                  backgroundColor: "#8B1A2F",
                  color: "#FFFFFF",
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
