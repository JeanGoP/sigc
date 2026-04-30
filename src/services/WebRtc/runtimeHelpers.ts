import type { WebRtcUiError } from "./webrtcLogger";
import type { ConnectionStatus } from "./runtimeContracts";

const ENDED_CALL_STATUSES = new Set([
  "completed",
  "failed",
  "canceled",
  "cancelled",
  "busy",
  "no-answer",
  "rejected",
  "disconnected",
]);

const ACTIVE_CALL_STATUSES = new Set([
  "in-progress",
  "in_progress",
  "inprogress",
  "answered",
  "active",
]);

const DIALING_CALL_STATUSES = new Set([
  "queued",
  "initiated",
  "ringing",
  "processing",
  "connecting",
  "dialing",
  "created",
]);

const GLOBAL_E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export interface WebRtcDialerContext {
  cliente?: string | number | null;
  factura?: string | number | null;
  cuenta?: string | number | null;
}

export interface CountryDialOption {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
  minNationalDigits: number;
  maxNationalDigits: number;
  exampleLocal: string;
}

export type PhoneNormalizationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

export const COUNTRY_DIAL_OPTIONS: readonly CountryDialOption[] = [
  {
    iso2: "CO",
    name: "Colombia",
    dialCode: "+57",
    flag: "\uD83C\uDDE8\uD83C\uDDF4",
    minNationalDigits: 10,
    maxNationalDigits: 10,
    exampleLocal: "3218446041",
  },
  {
    iso2: "MX",
    name: "Mexico",
    dialCode: "+52",
    flag: "\uD83C\uDDF2\uD83C\uDDFD",
    minNationalDigits: 10,
    maxNationalDigits: 10,
    exampleLocal: "5512345678",
  },
  {
    iso2: "PE",
    name: "Peru",
    dialCode: "+51",
    flag: "\uD83C\uDDF5\uD83C\uDDEA",
    minNationalDigits: 9,
    maxNationalDigits: 9,
    exampleLocal: "912345678",
  },
  {
    iso2: "EC",
    name: "Ecuador",
    dialCode: "+593",
    flag: "\uD83C\uDDEA\uD83C\uDDE8",
    minNationalDigits: 9,
    maxNationalDigits: 9,
    exampleLocal: "991234567",
  },
  {
    iso2: "CL",
    name: "Chile",
    dialCode: "+56",
    flag: "\uD83C\uDDE8\uD83C\uDDF1",
    minNationalDigits: 9,
    maxNationalDigits: 9,
    exampleLocal: "912345678",
  },
  {
    iso2: "AR",
    name: "Argentina",
    dialCode: "+54",
    flag: "\uD83C\uDDE6\uD83C\uDDF7",
    minNationalDigits: 10,
    maxNationalDigits: 10,
    exampleLocal: "1123456789",
  },
  {
    iso2: "US",
    name: "Estados Unidos",
    dialCode: "+1",
    flag: "\uD83C\uDDFA\uD83C\uDDF8",
    minNationalDigits: 10,
    maxNationalDigits: 10,
    exampleLocal: "3055551234",
  },
  {
    iso2: "ES",
    name: "Espana",
    dialCode: "+34",
    flag: "\uD83C\uDDEA\uD83C\uDDF8",
    minNationalDigits: 9,
    maxNationalDigits: 9,
    exampleLocal: "612345678",
  },
] as const;

export const DEFAULT_COUNTRY_ISO2 = "CO";

export function normalizeDialInput(value: string): string {
  return value.replace(/[^\d+]/g, "").trim();
}

export function normalizePhoneByCountry(
  value: string,
  fieldLabel: string,
  country: CountryDialOption,
  allowEmpty = false
): PhoneNormalizationResult {
  const normalizedInput = normalizeDialInput(value);
  if (!normalizedInput) {
    if (allowEmpty) {
      return { ok: true, value: "" };
    }

    return { ok: false, message: `Numero ${fieldLabel} requerido.` };
  }

  const dialDigits = country.dialCode.replace("+", "");
  let candidate = normalizedInput;
  if (normalizedInput.startsWith("+")) {
    candidate = `+${normalizedInput.slice(1).replace(/\D/g, "")}`;
  } else {
    const digits = normalizedInput.replace(/\D/g, "");
    const hasDialPrefix = digits.startsWith(dialDigits);
    const localDigits = hasDialPrefix
      ? digits.slice(dialDigits.length)
      : digits;
    if (
      localDigits.length < country.minNationalDigits ||
      localDigits.length > country.maxNationalDigits
    ) {
      return {
        ok: false,
        message: `Numero ${fieldLabel} invalido para ${country.name}. Usa ${country.exampleLocal} como referencia.`,
      };
    }

    candidate = `${country.dialCode}${localDigits}`;
  }

  if (!candidate.startsWith(country.dialCode)) {
    return {
      ok: false,
      message:
        "Numero " +
        `${fieldLabel} invalido. Selecciona una extension que coincida con el numero digitado.`,
    };
  }

  if (!GLOBAL_E164_PATTERN.test(candidate)) {
    return {
      ok: false,
      message: `Numero ${fieldLabel} invalido. Debe quedar en formato internacional (${country.dialCode}).`,
    };
  }

  const finalDigits = candidate.slice(1 + dialDigits.length);
  if (
    finalDigits.length < country.minNationalDigits ||
    finalDigits.length > country.maxNationalDigits
  ) {
    return {
      ok: false,
      message: `Numero ${fieldLabel} invalido para ${country.name}. Debe tener entre ${country.minNationalDigits} y ${country.maxNationalDigits} digitos locales.`,
    };
  }

  return { ok: true, value: candidate };
}

export function isEndedCallStatus(
  status: string | null | undefined
): boolean {
  return ENDED_CALL_STATUSES.has((status ?? "").trim().toLowerCase());
}

export function mapCallStatusToConnectionStatus(
  status: string | null | undefined
): ConnectionStatus {
  const normalized = (status ?? "").trim().toLowerCase();
  if (!normalized) {
    return "dialing";
  }

  if (isEndedCallStatus(normalized)) {
    return "connected";
  }

  if (ACTIVE_CALL_STATUSES.has(normalized)) {
    return "in_call";
  }

  if (DIALING_CALL_STATUSES.has(normalized)) {
    return "dialing";
  }

  return "dialing";
}

export function formatWebRtcDate(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export function getConnectionBadgeVariant(status: ConnectionStatus): string {
  switch (status) {
    case "connected":
      return "success";
    case "dialing":
      return "warning";
    case "in_call":
      return "primary";
    case "error":
      return "danger";
    case "connecting":
      return "info";
    default:
      return "secondary";
  }
}

export function getConnectionLabel(status: ConnectionStatus): string {
  switch (status) {
    case "connected":
      return "Conectado";
    case "dialing":
      return "Llamando";
    case "in_call":
      return "En llamada";
    case "error":
      return "Error";
    case "connecting":
      return "Conectando";
    default:
      return "Desconectado";
  }
}

export function getPresenceBadgeVariant(
  status: "offline" | "online" | "busy" | "error"
): string {
  switch (status) {
    case "online":
      return "success";
    case "busy":
      return "warning";
    case "error":
      return "danger";
    default:
      return "secondary";
  }
}

export function getPresenceLabel(
  status: "offline" | "online" | "busy" | "error"
): string {
  switch (status) {
    case "online":
      return "Disponible";
    case "busy":
      return "Ocupado";
    case "error":
      return "Error";
    default:
      return "Offline";
  }
}

export function createWebRtcDialIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `dial-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function buildWebRtcContextSnapshot(
  context?: WebRtcDialerContext
): Record<string, unknown> {
  return {
    cliente: context?.cliente ?? null,
    factura: context?.factura ?? null,
    cuenta: context?.cuenta ?? null,
  };
}

function decodeBase64Url(input: string): string | null {
  if (!input) {
    return null;
  }

  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(padLength);
    return atob(padded);
  } catch {
    return null;
  }
}

export function extractTenantIdFromVoiceToken(token: string): string | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  const payloadJson = decodeBase64Url(parts[1]);
  if (!payloadJson) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadJson) as {
      grants?: { identity?: string };
    };

    const identity = payload?.grants?.identity ?? "";
    const match = identity.match(/tenant:(\d+)/i);
    if (match?.[1]) {
      return match[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeCallSystemTenantId(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

export function toWebRtcUiErrorFromTwilio(
  reason: string,
  error: unknown
): WebRtcUiError {
  const source = (error ?? {}) as {
    code?: number | string;
    message?: string;
    explanation?: string;
    causes?: string[];
  };

  const details = Array.isArray(source.causes) ? source.causes : [];

  return {
    message: source.explanation || source.message || reason,
    statusCode: 500,
    code: source.code ? `Twilio.${source.code}` : "Twilio.Error",
    type: "Failure",
    errors: details,
  };
}
