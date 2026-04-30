import { isDuplicateEvento } from "./helpers";
import type {
  Evento,
  SeguimientoEventoContext,
  TipoEventoOption,
} from "./types";

export const DUPLICATE_EVENTO_MESSAGE = "Este evento ya fue agregado.";
export const EVENTO_VALIDATION_FAILED_MESSAGE =
  "No se pudo validar el evento.";
export const EVENTO_VALIDATION_TOAST_FALLBACK = "Error, valide los campos.";
export const EVENTO_VALIDATION_EXCEPTION_MESSAGE = "Error al validar.";
export const EVENTO_VALIDATION_IN_PROGRESS_MESSAGE =
  "Se esta validando el evento. Espera a que finalice antes de guardar.";
export const SEGUIMIENTO_SAVE_BLOCKED_MESSAGE =
  "No se puede guardar seguimiento en este momento.";

export interface EventoValidationPayload {
  tipo: number;
  fecha: string | null;
  hora: string | null;
  monto: number;
  idUsuario: string | number | null;
  cliente: string | number | null;
  factura: string | number | null;
  cuenta: string | number | null;
}

export interface EventoValidationResponseLike {
  success?: boolean;
  message?: string | null;
}

export type EventoValidationToastType = "warn" | "error";

export interface EventoValidationResult {
  ok: boolean;
  message?: string;
  toastMessage?: string;
  toastType?: EventoValidationToastType;
}

export function buildEventoForValidation(
  formEvento: Evento,
  tiposEvento: readonly TipoEventoOption[]
): Evento {
  const eventoEnviar = { ...formEvento };

  if (!eventoEnviar.tipo && tiposEvento.length > 0) {
    eventoEnviar.id = tiposEvento[0].id;
    eventoEnviar.tipo = tiposEvento[0].nombre;
  }

  return eventoEnviar;
}

export function buildEventoValidationPayload(
  evento: Evento,
  contextoEvento?: SeguimientoEventoContext
): EventoValidationPayload {
  return {
    tipo: evento.id,
    fecha: evento.fecha || null,
    hora: evento.hora ?? null,
    monto: typeof evento.valor === "number" ? evento.valor : 0,
    idUsuario: contextoEvento?.idUsuario ?? null,
    cliente: contextoEvento?.cliente ?? null,
    factura: contextoEvento?.factura ?? null,
    cuenta: contextoEvento?.cuenta ?? null,
  };
}

export function buildDuplicateEventoValidationResult(
  eventos: readonly Evento[],
  evento: Evento,
  excludeIndex?: number
): EventoValidationResult | null {
  if (!isDuplicateEvento(eventos, evento, excludeIndex)) {
    return null;
  }

  return {
    ok: false,
    message: DUPLICATE_EVENTO_MESSAGE,
    toastMessage: DUPLICATE_EVENTO_MESSAGE,
    toastType: "warn",
  };
}

export function mapBackendEventoValidationResult(
  response: EventoValidationResponseLike | null | undefined
): EventoValidationResult {
  if (response?.success) {
    return { ok: true };
  }

  return {
    ok: false,
    message: response?.message || EVENTO_VALIDATION_FAILED_MESSAGE,
    toastMessage: response?.message || EVENTO_VALIDATION_TOAST_FALLBACK,
    toastType: "error",
  };
}

export function mapEventoValidationException(
  error: unknown
): EventoValidationResult {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message || "")
      : "";

  return {
    ok: false,
    message: message || EVENTO_VALIDATION_EXCEPTION_MESSAGE,
    toastMessage: message || EVENTO_VALIDATION_EXCEPTION_MESSAGE,
    toastType: "error",
  };
}

export function buildGuardarSeguimientoBlockedMessage({
  isValidatingEvent,
  disableGuardarSeguimiento,
  disableGuardarSeguimientoReason,
}: {
  isValidatingEvent: boolean;
  disableGuardarSeguimiento: boolean;
  disableGuardarSeguimientoReason?: string;
}): string {
  if (isValidatingEvent) {
    return EVENTO_VALIDATION_IN_PROGRESS_MESSAGE;
  }

  if (disableGuardarSeguimiento) {
    return disableGuardarSeguimientoReason || SEGUIMIENTO_SAVE_BLOCKED_MESSAGE;
  }

  return "";
}
