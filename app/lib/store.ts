export interface Cita {
  id: string;
  clienteId: string;
  profesionalId: string;
  fecha: string;
  hora: string;
  servicio: string;
  estado: "pendiente" | "completada" | "cancelada";
  notas?: string;
  salaId?: string;
}

export interface Mensaje {
  id: string;
  de: string;
  para: string;
  texto: string;
  fecha: string;
  leido: boolean;
  replyToId?: string;
  replyToTexto?: string;
}

export interface Ejercicio {
  nombre: string;
  series: number;
  reps: string;
  descanso: string;
  notas?: string;
}

export interface DiaEntrenamiento {
  ejercicios: Ejercicio[];
}

export interface PlanEntrenamiento {
  id: string;
  clienteId: string;
  profesionalId: string;
  nombre: string;
  dias: Record<string, DiaEntrenamiento>;
  fechaInicio: string;
  activo: boolean;
}

export interface Metrica {
  id: string;
  clienteId: string;
  fecha: string;
  peso?: number;
  altura?: number;
  grasaCorporal?: number;
}

export interface Documento {
  id: string;
  clienteId: string;
  tipo: "informe" | "consentimiento" | "factura";
  nombre: string;
  fecha: string;
  subidoPor: string;
}

export interface Pago {
  id: string;
  clienteId: string;
  tipo: "recarga" | "sesion" | "bono";
  monto: number;
  fecha: string;
  descripcion: string;
}

export interface Bono {
  id: string;
  clienteId: string;
  nombre: string;
  sesionesTotales: number;
  sesionesUsadas: number;
  fechaCompra: string;
  activo: boolean;
}

export interface Bloqueo {
  id: string;
  profesionalId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo?: string;
}

export interface Sala {
  id: string;
  nombre: string;
  activa: boolean;
}

export interface ListaEspera {
  id: string;
  clienteId: string;
  servicio: string;
  fecha: string;
  hora: string;
  creadoEn: string;
  notificado: boolean;
  notificadoEn?: string;
  expirado?: boolean;
}

export interface Reto {
  id: string;
  clienteId: string;
  nombre: string;
  categoria: "perdida_peso" | "ganancia_muscular" | "resistencia" | "flexibilidad" | "rehabilitacion" | "otro";
  fechaLimite: string;
  valorInicial: number;
  valorObjetivo: number;
  unidad: string;
  notas?: string;
  completado: boolean;
  creadoEn: string;
  predefinidoId?: string;
  comentarioPro?: string;
}

export interface ProgresoReto {
  id: string;
  retoId: string;
  fecha: string;
  valor: number;
  nota?: string;
}

export interface RetoPredefinido {
  id: string;
  nombre: string;
  categoria: Reto["categoria"];
  descripcion: string;
  valorObjetivo: number;
  unidad: string;
  duracionDias: number;
}

export interface PlanCalendario {
  id: string;
  clienteId: string;
  nombre: string;
  objetivo: string;
  diasSemana: number;
  duracionMin: number;
  dias: { tipo: string; enfoque: string }[];
  creadoEn: string;
  activo: boolean;
}

export interface SesionCalendario {
  id: string;
  planId: string;
  clienteId: string;
  fecha: string;
  tipoDia: string;
  enfoque: string;
  rutina?: string;
  estado: "programado" | "completado" | "fallado";
}

export const DURACION_SERVICIOS: Record<string, number> = {
  "Fisioterapia Esencial": 45, "Fisioterapia Avanzada": 75,
  "Entrenamiento Individual": 60, "Entrenamiento Dúo": 60,
  "Entrenamiento Grupo": 60, "Podología": 60,
  "Entrenamiento Personal": 60, "Fisioterapia": 60,
};

function gs<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function ss<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

const K = {
  citas: "veysic_v1_citas",
  mensajes: "veysic_v1_mensajes",
  planes: "veysic_v1_planes",
  metricas: "veysic_v1_metricas",
  documentos: "veysic_v1_documentos",
  pagos: "veysic_v1_pagos",
  bonos: "veysic_v1_bonos",
  bloqueos: "veysic_v1_bloqueos",
  salas: "veysic_v1_salas",
  listaEspera: "veysic_v1_lista_espera",
  retos: "veysic_v1_retos",
  progresoRetos: "veysic_v1_progreso_retos",
  retosPredefinidos: "veysic_v1_retos_predefinidos",
  planesCalendario: "veysic_v1_planes_calendario",
  sesionesCalendario: "veysic_v1_sesiones_calendario",
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function addDays(d: Date, n: number): string {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r.toISOString().split("T")[0];
}

export const citasStore = {
  getAll: () => gs<Cita>(K.citas),
  getByCliente: (id: string) =>
    gs<Cita>(K.citas).filter((c) => c.clienteId === id),
  getByProfesional: (id: string) =>
    gs<Cita>(K.citas).filter((c) => c.profesionalId === id),
  add: (cita: Omit<Cita, "id">): Cita => {
    const all = gs<Cita>(K.citas);
    const nuevo = { ...cita, id: uid() };
    ss(K.citas, [...all, nuevo]);
    return nuevo;
  },
  update: (id: string, updates: Partial<Cita>) => {
    const all = gs<Cita>(K.citas);
    const idx = all.findIndex((c) => c.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      ss(K.citas, all);
    }
  },
};

export const mensajesStore = {
  getAll: () => gs<Mensaje>(K.mensajes),
  getConversacion: (u1: string, u2: string) =>
    gs<Mensaje>(K.mensajes)
      .filter(
        (m) =>
          (m.de === u1 && m.para === u2) || (m.de === u2 && m.para === u1)
      )
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
  send: (msg: Omit<Mensaje, "id" | "leido">): Mensaje => {
    const all = gs<Mensaje>(K.mensajes);
    const nuevo = { ...msg, id: uid(), leido: false };
    ss(K.mensajes, [...all, nuevo]);
    return nuevo;
  },
  marcarLeidos: (para: string, de: string) => {
    const all = gs<Mensaje>(K.mensajes).map((m) =>
      m.para === para && m.de === de ? { ...m, leido: true } : m
    );
    ss(K.mensajes, all);
  },
};

export const planesStore = {
  getAll: () => gs<PlanEntrenamiento>(K.planes),
  getByCliente: (id: string) =>
    gs<PlanEntrenamiento>(K.planes).filter((p) => p.clienteId === id),
  getActivo: (clienteId: string) =>
    gs<PlanEntrenamiento>(K.planes).find(
      (p) => p.clienteId === clienteId && p.activo
    ),
  save: (plan: Omit<PlanEntrenamiento, "id">): PlanEntrenamiento => {
    const all = gs<PlanEntrenamiento>(K.planes).map((p) =>
      p.clienteId === plan.clienteId ? { ...p, activo: false } : p
    );
    const nuevo = { ...plan, id: uid() };
    ss(K.planes, [...all, nuevo]);
    return nuevo;
  },
  update: (id: string, updates: Partial<PlanEntrenamiento>) => {
    const all = gs<PlanEntrenamiento>(K.planes);
    const idx = all.findIndex((p) => p.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      ss(K.planes, all);
    }
  },
};

export const metricasStore = {
  getByCliente: (id: string) =>
    gs<Metrica>(K.metricas)
      .filter((m) => m.clienteId === id)
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
  add: (m: Omit<Metrica, "id">): Metrica => {
    const all = gs<Metrica>(K.metricas);
    const nuevo = { ...m, id: uid() };
    ss(K.metricas, [...all, nuevo]);
    return nuevo;
  },
};

export const documentosStore = {
  getByCliente: (id: string) =>
    gs<Documento>(K.documentos).filter((d) => d.clienteId === id),
  add: (d: Omit<Documento, "id">): Documento => {
    const all = gs<Documento>(K.documentos);
    const nuevo = { ...d, id: uid() };
    ss(K.documentos, [...all, nuevo]);
    return nuevo;
  },
};

export const pagosStore = {
  getByCliente: (id: string) =>
    gs<Pago>(K.pagos)
      .filter((p) => p.clienteId === id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
  add: (p: Omit<Pago, "id">): Pago => {
    const all = gs<Pago>(K.pagos);
    const nuevo = { ...p, id: uid() };
    ss(K.pagos, [...all, nuevo]);
    return nuevo;
  },
};

export const bonosStore = {
  getByCliente: (id: string) =>
    gs<Bono>(K.bonos).filter((b) => b.clienteId === id),
  add: (b: Omit<Bono, "id">): Bono => {
    const all = gs<Bono>(K.bonos);
    const nuevo = { ...b, id: uid() };
    ss(K.bonos, [...all, nuevo]);
    return nuevo;
  },
  update: (id: string, updates: Partial<Bono>) => {
    const all = gs<Bono>(K.bonos);
    const idx = all.findIndex((b) => b.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      ss(K.bonos, all);
    }
  },
};

export const bloqueosStore = {
  getAll: () => gs<Bloqueo>(K.bloqueos),
  getByProfesional: (id: string) =>
    gs<Bloqueo>(K.bloqueos).filter((b) => b.profesionalId === id),
  add: (b: Omit<Bloqueo, "id">): Bloqueo => {
    const all = gs<Bloqueo>(K.bloqueos);
    const nuevo = { ...b, id: uid() };
    ss(K.bloqueos, [...all, nuevo]);
    return nuevo;
  },
  remove: (id: string) => {
    ss(K.bloqueos, gs<Bloqueo>(K.bloqueos).filter((b) => b.id !== id));
  },
};

function toMinSt(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export const salasStore = {
  getAll: () => gs<Sala>(K.salas),
  getActivas: () => gs<Sala>(K.salas).filter((s) => s.activa),
  add: (s: Omit<Sala, "id">): Sala => {
    const all = gs<Sala>(K.salas);
    const nuevo = { ...s, id: uid() };
    ss(K.salas, [...all, nuevo]);
    return nuevo;
  },
  update: (id: string, updates: Partial<Sala>) => {
    const all = gs<Sala>(K.salas);
    const idx = all.findIndex((s) => s.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; ss(K.salas, all); }
  },
  remove: (id: string) => { ss(K.salas, gs<Sala>(K.salas).filter((s) => s.id !== id)); },
  asignarSala: (fecha: string, hora: string, duracion: number): string | undefined => {
    const salas = gs<Sala>(K.salas).filter((s) => s.activa);
    const citas = gs<Cita>(K.citas);
    const ini = toMinSt(hora), fin = ini + duracion;
    for (const sala of salas) {
      let libre = true;
      for (const c of citas) {
        if (c.fecha !== fecha || c.salaId !== sala.id || c.estado === "cancelada") continue;
        const dur = DURACION_SERVICIOS[c.servicio] ?? 60;
        const ci = toMinSt(c.hora), cf = ci + dur;
        if (ini < cf && fin > ci) { libre = false; break; }
      }
      if (libre) return sala.id;
    }
    return undefined;
  },
};

export const listaEsperaStore = {
  getAll: () => gs<ListaEspera>(K.listaEspera),
  getByCliente: (id: string) => gs<ListaEspera>(K.listaEspera).filter((le) => le.clienteId === id),
  add: (le: Omit<ListaEspera, "id">): ListaEspera => {
    const all = gs<ListaEspera>(K.listaEspera);
    const nuevo = { ...le, id: uid() };
    ss(K.listaEspera, [...all, nuevo]);
    return nuevo;
  },
  remove: (id: string) => { ss(K.listaEspera, gs<ListaEspera>(K.listaEspera).filter((le) => le.id !== id)); },
  estaEnLista: (clienteId: string, servicio: string, fecha: string, hora: string): boolean =>
    gs<ListaEspera>(K.listaEspera).some((le) => le.clienteId === clienteId && le.servicio === servicio && le.fecha === fecha && le.hora === hora && !le.notificado),
  reordenar: (ids: string[]) => {
    const all = gs<ListaEspera>(K.listaEspera);
    const byId = Object.fromEntries(all.map((le) => [le.id, le]));
    const ordered = ids.map((id, i) => ({ ...byId[id], orden: i })).filter(Boolean) as ListaEspera[];
    const rest = all.filter((le) => !ids.includes(le.id));
    ss(K.listaEspera, [...ordered, ...rest]);
  },
};

export const retosStore = {
  getAll: () => gs<Reto>(K.retos),
  getByCliente: (id: string) => gs<Reto>(K.retos).filter((r) => r.clienteId === id),
  add: (r: Omit<Reto, "id">): Reto => {
    const all = gs<Reto>(K.retos);
    const nuevo = { ...r, id: uid() };
    ss(K.retos, [...all, nuevo]);
    return nuevo;
  },
  update: (id: string, updates: Partial<Reto>) => {
    const all = gs<Reto>(K.retos);
    const idx = all.findIndex((r) => r.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; ss(K.retos, all); }
  },
  remove: (id: string) => { ss(K.retos, gs<Reto>(K.retos).filter((r) => r.id !== id)); },
};

export const progresoRetoStore = {
  getByReto: (retoId: string) => gs<ProgresoReto>(K.progresoRetos).filter((p) => p.retoId === retoId).sort((a, b) => a.fecha.localeCompare(b.fecha)),
  add: (p: Omit<ProgresoReto, "id">): ProgresoReto => {
    const all = gs<ProgresoReto>(K.progresoRetos);
    const nuevo = { ...p, id: uid() };
    ss(K.progresoRetos, [...all, nuevo]);
    return nuevo;
  },
};

const RETOS_PREDEFINIDOS_DEFAULT: RetoPredefinido[] = [
  { id: "rp-1", nombre: "30 días sin azúcar", categoria: "perdida_peso", descripcion: "Elimina el azúcar añadido de tu dieta durante 30 días", valorObjetivo: 30, unidad: "días", duracionDias: 30 },
  { id: "rp-2", nombre: "10.000 pasos diarios", categoria: "resistencia", descripcion: "Camina 10.000 pasos al día durante un mes", valorObjetivo: 30, unidad: "días cumplidos", duracionDias: 30 },
  { id: "rp-3", nombre: "12 sesiones de fisioterapia", categoria: "rehabilitacion", descripcion: "Completa 12 sesiones de fisioterapia", valorObjetivo: 12, unidad: "sesiones", duracionDias: 90 },
  { id: "rp-4", nombre: "Tocar el suelo con las manos", categoria: "flexibilidad", descripcion: "Mejora tu flexibilidad hasta tocar el suelo de pie", valorObjetivo: 0, unidad: "cm desde el suelo", duracionDias: 60 },
  { id: "rp-5", nombre: "Ganar 3kg de músculo", categoria: "ganancia_muscular", descripcion: "Incrementa tu masa muscular en 3 kg", valorObjetivo: 3, unidad: "kg ganados", duracionDias: 90 },
];

export const retosPredefinidosStore = {
  getAll: (): RetoPredefinido[] => {
    const saved = gs<RetoPredefinido>(K.retosPredefinidos);
    return saved.length > 0 ? saved : RETOS_PREDEFINIDOS_DEFAULT;
  },
  add: (r: Omit<RetoPredefinido, "id">): RetoPredefinido => {
    const all = retosPredefinidosStore.getAll();
    const nuevo = { ...r, id: uid() };
    ss(K.retosPredefinidos, [...all, nuevo]);
    return nuevo;
  },
};

export function notificarListaEspera(citaId: string): void {
  const cita = gs<Cita>(K.citas).find((c) => c.id === citaId);
  if (!cita) return;
  const candidatos = gs<ListaEspera>(K.listaEspera)
    .filter((le) => le.servicio === cita.servicio && le.fecha === cita.fecha && le.hora === cita.hora && !le.notificado)
    .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  if (candidatos.length === 0) return;
  const primero = candidatos[0];
  const fechaFmt = new Date(cita.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const expiryISO = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const allMsgs = gs<Mensaje>(K.mensajes);
  ss(K.mensajes, [...allMsgs, {
    id: uid(),
    de: "admin-1",
    para: primero.clienteId,
    texto: `🎉 ¡Hay un hueco disponible! Tu cita de ${cita.servicio} del ${fechaFmt} a las ${cita.hora} está disponible. Tienes hasta las ${new Date(expiryISO).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} para confirmarla desde "Reservar cita".`,
    fecha: new Date().toISOString(),
    leido: false,
  }]);
  ss(K.listaEspera, gs<ListaEspera>(K.listaEspera).map((le) => le.id === primero.id ? { ...le, notificado: true, notificadoEn: new Date().toISOString() } : le));
}

export function procesarExpiradosListaEspera(): void {
  const ahora = Date.now();
  const lista = gs<ListaEspera>(K.listaEspera);
  for (const le of lista) {
    if (!le.notificado || !le.notificadoEn) continue;
    const notifMs = new Date(le.notificadoEn).getTime();
    if (ahora - notifMs < 2 * 60 * 60 * 1000) continue;
    const confirmo = gs<Cita>(K.citas).some(
      (c) => c.clienteId === le.clienteId && c.servicio === le.servicio && c.fecha === le.fecha && c.hora === le.hora && c.estado !== "cancelada"
    );
    if (!confirmo) {
      ss(K.listaEspera, gs<ListaEspera>(K.listaEspera).map((x) => x.id === le.id ? { ...x, notificado: true, expirado: true } : x));
      const siguientes = gs<ListaEspera>(K.listaEspera)
        .filter((x) => x.servicio === le.servicio && x.fecha === le.fecha && x.hora === le.hora && !x.notificado)
        .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
      if (siguientes.length > 0) {
        const sig = siguientes[0];
        const fechaFmt = new Date(le.fecha + "T00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
        const expiryISO = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        const allMsgs = gs<Mensaje>(K.mensajes);
        ss(K.mensajes, [...allMsgs, {
          id: uid(), de: "admin-1", para: sig.clienteId,
          texto: `🎉 ¡Hay un hueco disponible! Tu cita de ${le.servicio} del ${fechaFmt} a las ${le.hora} está disponible. Tienes hasta las ${new Date(expiryISO).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} para confirmarla desde "Reservar cita".`,
          fecha: new Date().toISOString(), leido: false,
        }]);
        ss(K.listaEspera, gs<ListaEspera>(K.listaEspera).map((x) => x.id === sig.id ? { ...x, notificado: true, notificadoEn: new Date().toISOString() } : x));
      }
    }
  }
}

export function seedDemoData(
  clienteId: string,
  proId1: string,
  proId2: string
) {
  if (gs<Cita>(K.citas).length > 0) return;

  const hoy = new Date();

  ss<Cita>(K.citas, [
    {
      id: "cita-1",
      clienteId,
      profesionalId: proId1,
      fecha: addDays(hoy, 3),
      hora: "10:00",
      servicio: "Entrenamiento Personal",
      estado: "pendiente",
    },
    {
      id: "cita-2",
      clienteId,
      profesionalId: proId2,
      fecha: addDays(hoy, 7),
      hora: "11:30",
      servicio: "Fisioterapia",
      estado: "pendiente",
    },
    {
      id: "cita-3",
      clienteId,
      profesionalId: proId1,
      fecha: addDays(hoy, -14),
      hora: "09:00",
      servicio: "Entrenamiento Personal",
      estado: "completada",
    },
    {
      id: "cita-4",
      clienteId,
      profesionalId: proId2,
      fecha: addDays(hoy, -30),
      hora: "10:00",
      servicio: "Podología",
      estado: "completada",
    },
  ]);

  ss<PlanEntrenamiento>(K.planes, [
    {
      id: "plan-1",
      clienteId,
      profesionalId: proId1,
      nombre: "Plan Fuerza — Fase 1",
      dias: {
        Lunes: {
          ejercicios: [
            {
              nombre: "Sentadilla",
              series: 4,
              reps: "8-10",
              descanso: "2 min",
              notas: "Control en la bajada",
            },
            {
              nombre: "Press banca",
              series: 3,
              reps: "10-12",
              descanso: "90 seg",
              notas: "",
            },
            {
              nombre: "Remo con barra",
              series: 3,
              reps: "10",
              descanso: "90 seg",
              notas: "",
            },
          ],
        },
        Miércoles: {
          ejercicios: [
            {
              nombre: "Peso muerto",
              series: 4,
              reps: "6-8",
              descanso: "3 min",
              notas: "Espalda neutra",
            },
            {
              nombre: "Press militar",
              series: 3,
              reps: "10",
              descanso: "90 seg",
              notas: "",
            },
            {
              nombre: "Dominadas",
              series: 3,
              reps: "máx",
              descanso: "2 min",
              notas: "",
            },
          ],
        },
        Viernes: {
          ejercicios: [
            {
              nombre: "Hip thrust",
              series: 4,
              reps: "12",
              descanso: "90 seg",
              notas: "",
            },
            {
              nombre: "Zancadas",
              series: 3,
              reps: "12/pierna",
              descanso: "90 seg",
              notas: "",
            },
            {
              nombre: "Plancha",
              series: 3,
              reps: "45 seg",
              descanso: "60 seg",
              notas: "",
            },
          ],
        },
      },
      fechaInicio: addDays(hoy, -7),
      activo: true,
    },
  ]);

  const metricas: Metrica[] = [];
  for (let i = 10; i >= 0; i--) {
    metricas.push({
      id: `metrica-${i}`,
      clienteId,
      fecha: addDays(hoy, -i * 7),
      peso: parseFloat((72 + (10 - i) * 0.1 - Math.random() * 0.3).toFixed(1)),
      altura: 168,
      grasaCorporal: parseFloat((24 - (10 - i) * 0.2).toFixed(1)),
    });
  }
  ss(K.metricas, metricas);

  ss<Documento>(K.documentos, [
    {
      id: "doc-1",
      clienteId,
      tipo: "informe",
      nombre: "Valoración inicial fisioterapia.pdf",
      fecha: addDays(hoy, -30),
      subidoPor: proId2,
    },
    {
      id: "doc-2",
      clienteId,
      tipo: "consentimiento",
      nombre: "Consentimiento informado.pdf",
      fecha: addDays(hoy, -30),
      subidoPor: proId2,
    },
    {
      id: "doc-3",
      clienteId,
      tipo: "factura",
      nombre: "Factura sesión podología — Jun 2026.pdf",
      fecha: addDays(hoy, -25),
      subidoPor: "admin-1",
    },
  ]);

  ss<Pago>(K.pagos, [
    {
      id: "pago-1",
      clienteId,
      tipo: "recarga",
      monto: 100,
      fecha: addDays(hoy, -45),
      descripcion: "Recarga de créditos",
    },
    {
      id: "pago-2",
      clienteId,
      tipo: "bono",
      monto: 90,
      fecha: addDays(hoy, -30),
      descripcion: "Bono 10 sesiones de entrenamiento",
    },
    {
      id: "pago-3",
      clienteId,
      tipo: "sesion",
      monto: -9,
      fecha: addDays(hoy, -14),
      descripcion: "Sesión Entrenamiento Personal",
    },
    {
      id: "pago-4",
      clienteId,
      tipo: "sesion",
      monto: -9,
      fecha: addDays(hoy, -7),
      descripcion: "Sesión Entrenamiento Personal",
    },
  ]);

  ss<Bono>(K.bonos, [
    {
      id: "bono-1",
      clienteId,
      nombre: "Bono 10 Entrenamiento Personal",
      sesionesTotales: 10,
      sesionesUsadas: 2,
      fechaCompra: addDays(hoy, -30),
      activo: true,
    },
  ]);

  ss<Mensaje>(K.mensajes, [
    {
      id: "msg-1",
      de: proId1,
      para: clienteId,
      texto: "Hola María, ¿cómo te fue con el plan de esta semana?",
      fecha: addDays(hoy, -2) + "T10:00:00",
      leido: true,
    },
    {
      id: "msg-2",
      de: clienteId,
      para: proId1,
      texto: "Muy bien, Toro! El miércoles lo noté más pesado pero lo completé todo.",
      fecha: addDays(hoy, -2) + "T10:05:00",
      leido: true,
    },
    {
      id: "msg-3",
      de: proId1,
      para: clienteId,
      texto: "Perfecto, es normal. Esta semana subiremos un poco el peso en sentadilla.",
      fecha: addDays(hoy, -1) + "T09:30:00",
      leido: false,
    },
  ]);
}

// ── PLAN CALENDARIO ─────────────────────────────────────────────────────────
export const planCalendarioStore = {
  getAll: () => gs<PlanCalendario>(K.planesCalendario),
  getByCliente: (id: string) => gs<PlanCalendario>(K.planesCalendario).filter((p) => p.clienteId === id),
  getActivo: (clienteId: string) => gs<PlanCalendario>(K.planesCalendario).find((p) => p.clienteId === clienteId && p.activo),
  add: (p: Omit<PlanCalendario, "id">): PlanCalendario => {
    const all = gs<PlanCalendario>(K.planesCalendario);
    const nuevo = { ...p, id: uid() };
    ss(K.planesCalendario, [...all, nuevo]);
    return nuevo;
  },
  update: (id: string, updates: Partial<PlanCalendario>) => {
    const all = gs<PlanCalendario>(K.planesCalendario);
    const idx = all.findIndex((p) => p.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; ss(K.planesCalendario, all); }
  },
};

export const sesionesCalendarioStore = {
  getAll: () => gs<SesionCalendario>(K.sesionesCalendario),
  getByCliente: (clienteId: string) => gs<SesionCalendario>(K.sesionesCalendario).filter((s) => s.clienteId === clienteId),
  getByPlan: (planId: string) => gs<SesionCalendario>(K.sesionesCalendario).filter((s) => s.planId === planId),
  getByFecha: (clienteId: string, fecha: string) => gs<SesionCalendario>(K.sesionesCalendario).find((s) => s.clienteId === clienteId && s.fecha === fecha),
  add: (s: Omit<SesionCalendario, "id">): SesionCalendario => {
    const all = gs<SesionCalendario>(K.sesionesCalendario);
    const nuevo = { ...s, id: uid() };
    ss(K.sesionesCalendario, [...all, nuevo]);
    return nuevo;
  },
  update: (id: string, updates: Partial<SesionCalendario>) => {
    const all = gs<SesionCalendario>(K.sesionesCalendario);
    const idx = all.findIndex((s) => s.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; ss(K.sesionesCalendario, all); }
  },
};

const WEEKDAY_PATTERNS: Record<number, number[]> = {
  2: [1, 4],           // Lun, Jue
  3: [1, 3, 5],        // Lun, Mié, Vie
  4: [1, 2, 4, 5],     // Lun, Mar, Jue, Vie
  5: [1, 2, 3, 4, 5],  // Lun–Vie
};

export function generarSesionesCalendario(plan: PlanCalendario): void {
  const hoy = new Date().toISOString().split("T")[0];
  const existing = gs<SesionCalendario>(K.sesionesCalendario);
  ss(K.sesionesCalendario, existing.filter((s) => !(s.planId === plan.id && s.fecha >= hoy && s.estado === "programado")));

  const n = Math.min(5, Math.max(2, plan.diasSemana));
  const pattern = WEEKDAY_PATTERNS[n] ?? WEEKDAY_PATTERNS[3];
  const maxSessions = 8 * plan.diasSemana;

  let dayIdx = 0;
  let added = 0;
  const cur = new Date();
  cur.setDate(cur.getDate() + 1);

  while (added < maxSessions) {
    const weekday = cur.getDay();
    if (pattern.includes(weekday)) {
      const diaConfig = plan.dias[dayIdx % plan.dias.length];
      sesionesCalendarioStore.add({
        planId: plan.id,
        clienteId: plan.clienteId,
        fecha: cur.toISOString().split("T")[0],
        tipoDia: diaConfig.tipo,
        enfoque: diaConfig.enfoque,
        estado: "programado",
      });
      dayIdx++;
      added++;
    }
    cur.setDate(cur.getDate() + 1);
    if (cur.getFullYear() > new Date().getFullYear() + 2) break;
  }
}
