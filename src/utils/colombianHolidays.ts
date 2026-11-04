/**
 * Utilidad determinística para cálculo de festivos en Colombia (Ley 51 de 1983 - Ley Emiliani)
 * y validación de días no hábiles (domingos y festivos nacionales).
 */

export interface FestivoColombia {
  fecha: string; // Formato YYYY-MM-DD
  nombre: string;
}

export interface ValidacionDiaEvento {
  noHabil: boolean;
  motivo: string | null;
  tipo: "DOMINGO" | "FESTIVO" | null;
}

/**
 * Calcula la fecha del Domingo de Pascua (Resurrección) usando el algoritmo de Butcher / Meeus.
 */
export function getDomingoPascua(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Marzo, 4 = Abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  // Creamos la fecha en hora local fija para evitar desfases de zona horaria
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Traslada una fecha al siguiente lunes si no cae en lunes (Ley Emiliani).
 */
function trasladarAlSiguienteLunes(date: Date): Date {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  if (dayOfWeek === 1) {
    return new Date(date);
  }
  const diasParaLunes = (8 - dayOfWeek) % 7;
  const resultado = new Date(date);
  resultado.setDate(resultado.getDate() + diasParaLunes);
  return resultado;
}

function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sumarDias(base: Date, dias: number): Date {
  const res = new Date(base);
  res.setDate(res.getDate() + dias);
  return res;
}

// Cache anual para máxima eficiencia
const holidaysCacheByYear = new Map<number, FestivoColombia[]>();

/**
 * Retorna la lista de los 18 festivos de Colombia para un año específico.
 */
export function getFestivosColombia(year: number): FestivoColombia[] {
  if (holidaysCacheByYear.has(year)) {
    return holidaysCacheByYear.get(year)!;
  }

  const pascua = getDomingoPascua(year);
  const festivos: FestivoColombia[] = [];

  const agregar = (date: Date, nombre: string) => {
    festivos.push({
      fecha: formatDateISO(date),
      nombre,
    });
  };

  // 1. Festivos fijos (no se trasladan)
  agregar(new Date(year, 0, 1, 12), "Año Nuevo");
  agregar(new Date(year, 4, 1, 12), "Día del Trabajo");
  agregar(new Date(year, 6, 20, 12), "Día de la Independencia");
  agregar(new Date(year, 7, 7, 12), "Batalla de Boyacá");
  agregar(new Date(year, 11, 8, 12), "Inmaculada Concepción");
  agregar(new Date(year, 11, 25, 12), "Navidad");

  // 2. Festivos religiosos vinculados a Pascua (inamovibles)
  agregar(sumarDias(pascua, -3), "Jueves Santo");
  agregar(sumarDias(pascua, -2), "Viernes Santo");

  // 3. Festivos de fecha fija trasladados al siguiente lunes (Ley Emiliani)
  agregar(trasladarAlSiguienteLunes(new Date(year, 0, 6, 12)), "Reyes Magos");
  agregar(trasladarAlSiguienteLunes(new Date(year, 2, 19, 12)), "Día de San José");
  agregar(trasladarAlSiguienteLunes(new Date(year, 5, 29, 12)), "San Pedro y San Pablo");
  agregar(trasladarAlSiguienteLunes(new Date(year, 7, 15, 12)), "Asunción de la Virgen");
  agregar(trasladarAlSiguienteLunes(new Date(year, 9, 12, 12)), "Día de la Raza");
  agregar(trasladarAlSiguienteLunes(new Date(year, 10, 1, 12)), "Todos los Santos");
  agregar(trasladarAlSiguienteLunes(new Date(year, 10, 11, 12)), "Independencia de Cartagena");

  // 4. Festivos basados en Pascua trasladados al siguiente lunes (Ley Emiliani)
  agregar(trasladarAlSiguienteLunes(sumarDias(pascua, 39)), "Ascensión del Señor"); // Pascua + 43 días
  agregar(trasladarAlSiguienteLunes(sumarDias(pascua, 60)), "Corpus Christi"); // Pascua + 64 días
  agregar(trasladarAlSiguienteLunes(sumarDias(pascua, 68)), "Sagrado Corazón de Jesús"); // Pascua + 71 días

  // Ordenar por fecha
  festivos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  holidaysCacheByYear.set(year, festivos);

  return festivos;
}

/**
 * Normaliza cualquier entrada (Date o string "YYYY-MM-DD" o ISO) a string "YYYY-MM-DD" y Date local seguro.
 */
export function normalizarFecha(input: Date | string): { fechaString: string; dateObj: Date } | null {
  if (!input) return null;

  if (typeof input === "string") {
    const raw = input.trim();
    if (!raw) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      const dateObj = new Date(year, month, day, 12, 0, 0);
      return { fechaString: `${match[1]}-${match[2]}-${match[3]}`, dateObj };
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return { fechaString: formatDateISO(parsed), dateObj: parsed };
  }

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return { fechaString: formatDateISO(input), dateObj: input };
  }

  return null;
}

/**
 * Determina si una fecha es domingo.
 */
export function esDomingo(date: Date | string): boolean {
  const norm = normalizarFecha(date);
  if (!norm) return false;
  return norm.dateObj.getDay() === 0;
}

/**
 * Determina si una fecha es festivo nacional de Colombia.
 * Retorna los detalles del festivo o null.
 */
export function obtenerFestivoNacional(date: Date | string): FestivoColombia | null {
  const norm = normalizarFecha(date);
  if (!norm) return null;

  const year = norm.dateObj.getFullYear();
  const festivos = getFestivosColombia(year);
  return festivos.find((f) => f.fecha === norm.fechaString) || null;
}

/**
 * Valida de forma completa si un día NO es hábil para la creación o modificación de eventos.
 * (Bloquea domingos y festivos nacionales).
 * Si options.isAdmin es true, permite el bypass de la restricción.
 */
export function validarDiaParaEvento(
  date: Date | string,
  options?: { isAdmin?: boolean }
): ValidacionDiaEvento {
  if (options?.isAdmin) {
    return { noHabil: false, motivo: null, tipo: null };
  }

  const norm = normalizarFecha(date);
  if (!norm) {
    return { noHabil: false, motivo: null, tipo: null };
  }

  if (norm.dateObj.getDay() === 0) {
    return {
      noHabil: true,
      motivo: "Domingo (día no hábil)",
      tipo: "DOMINGO",
    };
  }

  const festivo = obtenerFestivoNacional(date);
  if (festivo) {
    return {
      noHabil: true,
      motivo: `Festivo nacional: ${festivo.nombre}`,
      tipo: "FESTIVO",
    };
  }

  return { noHabil: false, motivo: null, tipo: null };
}

/**
 * Mensaje estándar amigable cuando un usuario intenta seleccionar un día no permitido.
 */
export function getMensajeDiaInvalidoEvento(
  date: Date | string,
  options?: { isAdmin?: boolean }
): string | null {
  const val = validarDiaParaEvento(date, options);
  if (!val.noHabil) return null;
  return `No se pueden programar eventos los domingos ni festivos nacionales (${val.motivo}).`;
}
