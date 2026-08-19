"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { login } from "../lib/auth";
import { useAuth } from "../components/AuthProvider";

const BG = "#EDE6D9";
const DARK = "#1F1F1F";
const MID = "#3A3A3A";

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  right,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label
        style={{
          fontSize: "0.65rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: MID,
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid rgba(31,31,31,0.25)`,
            paddingBottom: "0.75rem",
            paddingTop: "0.25rem",
            paddingRight: right ? "2rem" : 0,
            fontSize: "0.875rem",
            color: DARK,
            outline: "none",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            boxSizing: "border-box",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderBottomColor = DARK)
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderBottomColor = "rgba(31,31,31,0.25)")
          }
        />
        {right && (
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: "0.6rem",
              color: MID,
            }}
          >
            {right}
          </div>
        )}
      </div>
    </div>
  );
}

function LoginContent() {
  const { setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = login(email, password);
      setUser(user);
      if (nextUrl) { router.push(nextUrl); return; }
      if (user.role === "admin") router.push("/admin");
      else if (user.role === "profesional") router.push("/profesional");
      else router.push("/perfil");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
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
        {/* Logo */}
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

        <h1
          className="font-serif"
          style={{
            fontSize: "1.8rem",
            fontWeight: 400,
            color: DARK,
            marginBottom: "0.5rem",
          }}
        >
          Iniciar sesión
        </h1>
        <p
          style={{
            fontSize: "0.85rem",
            color: MID,
            marginBottom: "2.5rem",
            lineHeight: 1.6,
          }}
        >
          Accede a tu área personal de Veysic.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
        >
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="tu@email.com"
          />
          <Field
            label="Contraseña"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            right={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ background: "none", border: "none", cursor: "pointer", color: MID, padding: 0 }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          {error && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "#c0392b",
                backgroundColor: "rgba(192,57,43,0.06)",
                padding: "0.75rem 1rem",
                borderRadius: "2px",
                borderLeft: "3px solid #c0392b",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.9rem",
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              backgroundColor: loading ? "#3A3A3A" : DARK,
              color: BG,
              border: "none",
              borderRadius: "2px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#3A3A3A";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = DARK;
            }}
          >
            {loading ? "Accediendo..." : "Iniciar sesión"}
          </button>
        </form>

        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            textAlign: "center",
          }}
        >
          <Link
            href="/recuperar"
            style={{
              fontSize: "0.75rem",
              color: MID,
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = DARK)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MID)}
          >
            ¿Olvidaste tu contraseña?
          </Link>
          <p style={{ fontSize: "0.75rem", color: MID }}>
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              style={{
                color: DARK,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Regístrate
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div
          style={{
            marginTop: "2.5rem",
            padding: "1rem",
            backgroundColor: "rgba(31,31,31,0.04)",
            borderRadius: "4px",
            border: "1px solid rgba(31,31,31,0.1)",
          }}
        >
          <p
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: MID,
              marginBottom: "0.6rem",
            }}
          >
            Accesos de demostración
          </p>
          {[
            { rol: "Cliente", email: "cliente@ejemplo.com", pw: "cliente123" },
            { rol: "Entrenador", email: "toro@veysic.com", pw: "toro123" },
            { rol: "Fisio", email: "gonzalo@veysic.com", pw: "gonzalo123" },
            { rol: "Admin", email: "admin@veysic.com", pw: "admin123" },
          ].map(({ rol, email: e, pw }) => (
            <button
              key={rol}
              type="button"
              onClick={() => {
                setEmail(e);
                setPassword(pw);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.3rem 0",
                fontSize: "0.75rem",
                color: DARK,
                fontFamily: "var(--font-inter), system-ui, sans-serif",
              }}
            >
              <strong>{rol}:</strong> {e} / {pw}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
