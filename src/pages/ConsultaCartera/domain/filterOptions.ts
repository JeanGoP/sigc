import { AGE_BUCKETS } from "@app/constants/ageBuckets";

export interface EdadMoraOption {
  label: string;
  value: string;
}

export interface SinGestionDiasOption {
  value: number;
  label: string;
  color: string | null;
}

export const EDAD_MORA_OPTIONS: EdadMoraOption[] = AGE_BUCKETS.map((bucket) => ({
  label: bucket.badgeLabel,
  value: bucket.key,
}));

export const SIN_GESTION_DIAS_OPTIONS: SinGestionDiasOption[] = [
  { value: 0, label: "⚪ Todos", color: null },
  { value: 1, label: "🔵 Sin gestión", color: "#0a95b9" },
  { value: 2, label: "🟢 Gestionado hoy", color: "#1d9540" },
  { value: 3, label: "🟡 1 a 5 días", color: "#ffbf06" },
  { value: 4, label: "🔴 Más de 5 días", color: "#e24744" },
];

export const normalizeEdadMora = (raw?: string | null): string => {
  const trimmed = (raw ?? "").trim();
  return trimmed.length > 0 ? trimmed : "todos";
};

export const parseEdadMora = (raw?: string | null): EdadMoraOption[] => {
  const normalized = normalizeEdadMora(raw);
  if (normalized === "todos") {
    return [];
  }

  const values = normalized
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);

  return EDAD_MORA_OPTIONS.filter((option) => values.includes(option.value));
};

export const serializeEdadMora = (items: EdadMoraOption[]): string => {
  if (!items || items.length === 0) {
    return "todos";
  }

  return items.map((option) => option.value).join(";");
};
