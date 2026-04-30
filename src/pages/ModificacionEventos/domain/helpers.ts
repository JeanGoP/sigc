export const pickFirstValue = (source: unknown, keys: string[]): unknown => {
  const record =
    source && typeof source === "object"
      ? (source as Record<string, unknown>)
      : {};

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

export const parseNumberValue = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const parseBooleanValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "si";
  }
  return false;
};

export const extractDatePart = (value?: unknown): string => {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const raw = String(value).trim();
  if (!raw) return "";
  const norm = raw.includes(" ") ? raw.replace(" ", "T") : raw;
  const match = norm.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match?.[1]) return match[1];
  const date = new Date(norm);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const extractTimePart = (value?: unknown): string => {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
  }
  const raw = String(value).trim();
  if (!raw) return "";
  const norm = raw.includes(" ") ? raw.replace(" ", "T") : raw;
  const match = norm.match(/T(\d{2}:\d{2})/);
  if (match?.[1]) return match[1];
  const date = new Date(norm);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export const mergeDateAndTime = (
  datePart: string,
  timePart: string,
  includeTime: boolean
) => {
  if (!datePart) return "";
  return includeTime && timePart
    ? `${datePart}T${timePart}:00`
    : `${datePart}T00:00:00`;
};

export const toLocalDateString = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

export const toLocalTimeString = (value: Date) =>
  `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;

export const getApiErrorMessage = (response: unknown, fallback: string) => {
  const value =
    response && typeof response === "object"
      ? (response as { errors?: unknown; message?: unknown })
      : {};
  const first =
    Array.isArray(value.errors) &&
    value.errors.find(
      (error): error is string =>
        typeof error === "string" && error.trim().length > 0
    );
  const message =
    typeof value.message === "string" && value.message.trim().length > 0
      ? value.message
      : "";
  return first || message || fallback;
};

export const formatMonto = (value: number | null): string =>
  value === null ? "-" : value.toFixed(2);

export const formatFechaHora = (value: string): string => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("es-CO");
  } catch {
    return value;
  }
};

export const normalizeGestionFilterValue = (value: string): string | null => {
  const normalized = value.trim();
  return normalized ? normalized : null;
};
