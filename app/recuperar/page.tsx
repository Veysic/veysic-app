"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

const BG = "#2C2C2C";
const DARK = "#FFFFFF";
const MID = "#A0A0A0";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Link
          href="/"
          className="font-serif uppercase"
          style={{
            display: "block",
            textAlign: "center",
            letterSpacing: "0.28em",
            fontSize: "1.1rem",
            color: DARK,
            textDecoration: "none",
            marginBottom: "3rem",
          }}
        >
          Veysic
        </Link>

        {!sent ? (
          <>
            <h1
              className="font-serif"
              style={{
                fontSize: "1.8rem",
                fontWeight: 400,
                color: DARK,
                marginBottom: "0.5rem",
              }}
            >
              Recuperar contraseña
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                color: MID,
                marginBottom: "2.5rem",
                lineHeight: 1.6,
              }}
            >
              Introduce tu email y te enviaremos instrucciones para restablecer
              tu contraseña.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label
                  style={{
                    fontSize: "0.65rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: MID,
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid #3D3D3D",
                    paddingBottom: "0.75rem",
                    paddingTop: "0.25rem",
                    fontSize: "0.875rem",
                    color: DARK,
                    outline: "none",
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderBottomColor = "#8B1A2F")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderBottomColor = "#3D3D3D")
                  }
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.9rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  backgroundColor: loading ? "#3D3D3D" : "#8B1A2F",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "2px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#B8324A";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#8B1A2F";
                }}
              >
                {loading ? "Enviando..." : "Enviar instrucciones"}
              </button>
            </form>

            <p
              style={{
                marginTop: "2rem",
                textAlign: "center",
                fontSize: "0.75rem",
                color: MID,
              }}
            >
              <Link
                href="/login"
                style={{
                  color: DARK,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Volver al inicio de sesión
              </Link>
            </p>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <CheckCircle
              size={48}
              color="#8B1A2F"
              style={{ margin: "0 auto 1.5rem" }}
            />
            <h1
              className="font-serif"
              style={{
                fontSize: "1.8rem",
                fontWeight: 400,
                color: DARK,
                marginBottom: "1rem",
              }}
            >
              Email enviado
            </h1>
            <p
              style={{
                fontSize: "0.9rem",
                color: MID,
                lineHeight: 1.8,
                marginBottom: "2rem",
              }}
            >
              Si existe una cuenta con <strong>{email}</strong>, recibirás un
              correo con las instrucciones para restablecer tu contraseña en los
              próximos minutos.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "0.85rem 2rem",
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                backgroundColor: "#8B1A2F",
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: "2px",
              }}
            >
              Volver al inicio de sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
