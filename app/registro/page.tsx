"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { register } from "../lib/auth";
import { useAuth } from "../components/AuthProvider";

const BG = "#2C2C2C";
const DARK = "#FFFFFF";
const MID = "#A0A0A0";

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = true,
  right,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
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
          required={required}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid #3D3D3D",
            paddingBottom: "0.75rem",
            paddingTop: "0.25rem",
            paddingRight: right ? "2rem" : 0,
            fontSize: "0.875rem",
            color: DARK,
            outline: "none",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#8B1A2F")}
          onBlur={(e) =>
            (e.currentTarget.style.borderBottomColor = "#3D3D3D")
          }
        />
        {right && (
          <div
            style={{ position: "absolute", right: 0, bottom: "0.6rem", color: MID }}
          >
            {right}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegistroPage() {
  const { setUser } = useAuth();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [role, setRole] = useState<"cliente" | "profesional">("cliente");
  const [profesionalType, setProfesionalType] = useState<"fisio" | "entrenador">("entrenador");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [isPro, setIsPro] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = register({
        email,
        password,
        nombre,
        telefono,
        fechaNacimiento,
        role,
        profesionalType: role === "profesional" ? profesionalType : undefined,
      });
      if (role === "profesional") {
        setIsPro(true);
        setDone(true);
      } else {
        setUser(user);
        router.push("/perfil");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrarse.");
    } finally {
      setLoading(false);
    }
  }

  if (done && isPro) {
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
        <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          <CheckCircle size={48} color="#8B1A2F" style={{ margin: "0 auto 1.5rem" }} />
          <h1
            className="font-serif"
            style={{ fontSize: "2rem", fontWeight: 400, color: DARK, marginBottom: "1rem" }}
          >
            Solicitud enviada
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: MID,
              lineHeight: 1.8,
              marginBottom: "2rem",
            }}
          >
            Tu registro como profesional está{" "}
            <strong>pendiente de aprobación</strong> por el equipo de Veysic. Te
            avisaremos por email en cuanto esté activo.
          </p>
          <Link
            href="/"
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
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "5rem 1.5rem 3rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
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
          Crear cuenta
        </h1>
        <p
          style={{
            fontSize: "0.85rem",
            color: MID,
            marginBottom: "2.5rem",
            lineHeight: 1.6,
          }}
        >
          Únete a Veysic y gestiona tu salud y entrenamiento.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
        >
          <Field
            label="Nombre completo"
            value={nombre}
            onChange={setNombre}
            placeholder="Tu nombre y apellidos"
          />
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
            placeholder="Mínimo 6 caracteres"
            right={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: MID,
                  padding: 0,
                }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
          <Field
            label="Teléfono"
            type="tel"
            value={telefono}
            onChange={setTelefono}
            placeholder="+34 600 000 000"
          />
          <Field
            label="Fecha de nacimiento"
            type="date"
            value={fechaNacimiento}
            onChange={setFechaNacimiento}
          />

          {/* Tipo de cuenta */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: MID,
              }}
            >
              Tipo de cuenta
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              {(["cliente", "profesional"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    fontSize: "0.75rem",
                    letterSpacing: "0.08em",
                    textTransform: "capitalize",
                    border: `1px solid ${role === r ? "#8B1A2F" : "#3D3D3D"}`,
                    backgroundColor: role === r ? "#8B1A2F" : "transparent",
                    color: role === r ? "#FFFFFF" : MID,
                    borderRadius: "2px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                  }}
                >
                  {r === "cliente" ? "Cliente" : "Profesional"}
                </button>
              ))}
            </div>
            {role === "profesional" && (
              <div style={{ display: "flex", gap: "1rem" }}>
                {(["entrenador", "fisio"] as const).map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setProfesionalType(pt)}
                    style={{
                      flex: 1,
                      padding: "0.6rem",
                      fontSize: "0.7rem",
                      letterSpacing: "0.05em",
                      border: `1px solid ${
                        profesionalType === pt
                          ? "#8B1A2F"
                          : "rgba(255,255,255,0.15)"
                      }`,
                      backgroundColor:
                        profesionalType === pt
                          ? "rgba(139,26,47,0.12)"
                          : "transparent",
                      color: profesionalType === pt ? "#FFFFFF" : MID,
                      borderRadius: "2px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                    }}
                  >
                    {pt === "entrenador" ? "Entrenador/a" : "Fisioterapeuta"}
                  </button>
                ))}
              </div>
            )}
            {role === "profesional" && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: MID,
                  lineHeight: 1.6,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  padding: "0.75rem",
                  borderRadius: "2px",
                }}
              >
                Los profesionales quedan pendientes de aprobación por el
                administrador antes de poder acceder.
              </p>
            )}
          </div>

          {error && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "#C0574A",
                backgroundColor: "rgba(192,87,74,0.1)",
                padding: "0.75rem 1rem",
                borderRadius: "2px",
                borderLeft: "3px solid #C0574A",
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
            {loading ? "Creando cuenta..." : "Crear cuenta"}
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
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            style={{
              color: DARK,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
