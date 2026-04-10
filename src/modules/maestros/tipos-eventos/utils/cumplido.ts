export type EventoCumplidoValue = string | boolean | number | null | undefined;

export type EventoCumplidoState = "done" | "pending" | "unknown";

const DONE_VALUES = new Set([
  "1",
  "true",
  "cumplido",
  "cumplida",
  "si",
  "realizado",
  "realizada",
  "hecho",
  "hecha",
  "finalizado",
  "finalizada",
  "ok",
]);

const PENDING_VALUES = new Set([
  "0",
  "false",
  "pendiente",
  "incumplido",
  "incumplida",
  "no cumplido",
  "no cumplida",
  "vencido",
  "vencida",
  "cancelado",
  "cancelada",
]);

export function getEventoCumplidoLabel(
  value: EventoCumplidoValue
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const label = value.trim();
    return label || null;
  }

  if (typeof value === "boolean") {
    return value ? "Cumplido" : "Pendiente";
  }

  if (typeof value === "number") {
    if (value === 1) return "Cumplido";
    if (value === 0) return "Pendiente";
  }

  return String(value);
}

export function getEventoCumplidoState(
  value: EventoCumplidoValue
): EventoCumplidoState | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "boolean") {
    return value ? "done" : "pending";
  }

  if (typeof value === "number") {
    if (value === 1) return "done";
    if (value === 0) return "pending";
    return "unknown";
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (DONE_VALUES.has(normalized)) {
    return "done";
  }

  if (PENDING_VALUES.has(normalized)) {
    return "pending";
  }

  return "unknown";
}
