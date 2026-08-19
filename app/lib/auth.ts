export type UserRole = "cliente" | "profesional" | "admin";
export type ProfesionalType = "fisio" | "entrenador";
export type UserEstado = "activo" | "pendiente" | "inactivo";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  nombre: string;
  telefono: string;
  fechaNacimiento: string;
  role: UserRole;
  profesionalType?: ProfesionalType;
  estado: UserEstado;
  foto?: string;
  direccion?: string;
  historialMedico?: { lesiones: string; alergias: string; medicacion: string };
  especialidad?: string;
  numeroColegiado?: string;
  bio?: string;
  horario?: Record<string, { inicio: string; fin: string; activo: boolean }>;
  creditos: number;
  profesionalAsignadoId?: string;
  clientesIds?: string[];
  creadoEn: string;
}

const KEY_USERS = "veysic_v1_users";
const KEY_SESSION = "veysic_v1_session";

function hp(p: string): string {
  return btoa(encodeURIComponent(p));
}

export function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
}

export function seedInitialData() {
  const users = getUsers();
  if (users.length > 0) return;

  const now = new Date().toISOString();
  const initial: User[] = [
    {
      id: "admin-1",
      email: "admin@veysic.com",
      passwordHash: hp("admin123"),
      nombre: "Admin Veysic",
      telefono: "+34 600 000 000",
      fechaNacimiento: "1990-01-01",
      role: "admin",
      estado: "activo",
      creditos: 0,
      creadoEn: now,
    },
    {
      id: "pro-1",
      email: "toro@veysic.com",
      passwordHash: hp("toro123"),
      nombre: "Toro García",
      telefono: "+34 600 111 111",
      fechaNacimiento: "1992-03-15",
      role: "profesional",
      profesionalType: "entrenador",
      estado: "activo",
      especialidad: "Entrenamiento Personal",
      numeroColegiado: "EP-2024-001",
      bio: "Especialista en entrenamiento personal con más de 8 años de experiencia. Enfoque en rendimiento y prevención de lesiones.",
      creditos: 0,
      clientesIds: ["cliente-1"],
      creadoEn: now,
    },
    {
      id: "pro-2",
      email: "gonzalo@veysic.com",
      passwordHash: hp("gonzalo123"),
      nombre: "Gonzalo García",
      telefono: "+34 600 222 222",
      fechaNacimiento: "1989-07-22",
      role: "profesional",
      profesionalType: "fisio",
      estado: "activo",
      especialidad: "Fisioterapia y Podología",
      numeroColegiado: "FP-2024-002",
      bio: "Fisioterapeuta y podólogo colegiado. Especializado en patologías musculoesqueléticas y biomecánica del pie.",
      creditos: 0,
      clientesIds: ["cliente-1"],
      creadoEn: now,
    },
    {
      id: "cliente-1",
      email: "cliente@ejemplo.com",
      passwordHash: hp("cliente123"),
      nombre: "María Ejemplo",
      telefono: "+34 600 333 333",
      fechaNacimiento: "1995-05-10",
      role: "cliente",
      estado: "activo",
      direccion: "Calle Mayor 45, 28001 Madrid",
      historialMedico: {
        lesiones: "Esguince tobillo derecho (2022)",
        alergias: "Ibuprofeno",
        medicacion: "Ninguna",
      },
      creditos: 150,
      profesionalAsignadoId: "pro-1",
      creadoEn: now,
    },
  ];

  saveUsers(initial);
}

export function login(email: string, password: string): User {
  const users = getUsers();
  const hash = hp(password);
  const user = users.find((u) => u.email === email && u.passwordHash === hash);
  if (!user) throw new Error("Email o contraseña incorrectos.");
  if (user.estado === "pendiente")
    throw new Error(
      "Tu cuenta está pendiente de aprobación por el administrador."
    );
  if (user.estado === "inactivo")
    throw new Error(
      "Tu cuenta ha sido desactivada. Contacta con el administrador."
    );
  localStorage.setItem(KEY_SESSION, JSON.stringify({ userId: user.id }));
  return user;
}

export function logout() {
  localStorage.removeItem(KEY_SESSION);
}

export function getSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const s = JSON.parse(localStorage.getItem(KEY_SESSION) || "null");
    if (!s) return null;
    return getUsers().find((u) => u.id === s.userId) || null;
  } catch {
    return null;
  }
}

export function register(data: {
  email: string;
  password: string;
  nombre: string;
  telefono: string;
  fechaNacimiento: string;
  role: "cliente" | "profesional";
  profesionalType?: ProfesionalType;
}): User {
  const users = getUsers();
  if (users.some((u) => u.email === data.email))
    throw new Error("Ya existe una cuenta con ese email.");

  const newUser: User = {
    id: `user-${Date.now()}`,
    email: data.email,
    passwordHash: hp(data.password),
    nombre: data.nombre,
    telefono: data.telefono,
    fechaNacimiento: data.fechaNacimiento,
    role: data.role,
    profesionalType: data.profesionalType,
    estado: data.role === "profesional" ? "pendiente" : "activo",
    creditos: 0,
    creadoEn: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);
  if (data.role === "cliente")
    localStorage.setItem(KEY_SESSION, JSON.stringify({ userId: newUser.id }));
  return newUser;
}

export function updateUser(id: string, updates: Partial<User>): User {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("Usuario no encontrado");
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return users[idx];
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}
