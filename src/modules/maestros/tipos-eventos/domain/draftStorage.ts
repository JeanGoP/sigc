import type { SeguimientoDraftState } from "./types";

export function normalizeSeguimientoDraft(
  value: unknown
): SeguimientoDraftState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const parsed = value as Partial<SeguimientoDraftState>;

  return {
    texto: String(parsed.texto ?? ""),
    eventos: Array.isArray(parsed.eventos) ? parsed.eventos : [],
    tipoContacto: parsed.tipoContacto ?? 0,
    formEvento: parsed.formEvento && typeof parsed.formEvento === "object"
      ? parsed.formEvento
      : { id: 0, tipo: "", fecha: "", hora: null, valor: undefined },
    editIndex:
      typeof parsed.editIndex === "number" && Number.isInteger(parsed.editIndex)
        ? parsed.editIndex
        : null,
    updatedAt: String(parsed.updatedAt ?? ""),
  };
}

export function readSeguimientoDraft(key?: string): SeguimientoDraftState | null {
  const storageKey = String(key ?? "").trim();
  if (!storageKey) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    return normalizeSeguimientoDraft(JSON.parse(raw));
  } catch (error) {
    console.error("Error leyendo borrador de seguimiento:", error);
    return null;
  }
}

export function writeSeguimientoDraft(
  key: string,
  draft: SeguimientoDraftState
): void {
  const storageKey = String(key ?? "").trim();
  if (!storageKey) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  } catch (error) {
    console.error("Error guardando borrador de seguimiento:", error);
  }
}

export function clearSeguimientoDraft(key?: string): void {
  const storageKey = String(key ?? "").trim();
  if (!storageKey) {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Error eliminando borrador de seguimiento:", error);
  }
}
