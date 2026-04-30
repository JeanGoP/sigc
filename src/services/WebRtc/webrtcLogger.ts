import { ApiResponse } from "@app/models/apiResponse";

export interface WebRtcUiError {
  message: string;
  statusCode?: number;
  code?: string;
  type?: string;
  correlationId?: string;
  errors: string[];
}

const SensitiveKeyPattern = /(token|authorization|secret|password)/i;
const MaxDepth = 5;

const toIsoNow = () => new Date().toISOString();

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (depth >= MaxDepth) {
    return "[MaxDepth]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, current] of Object.entries(source)) {
      if (SensitiveKeyPattern.test(key)) {
        output[key] = "[REDACTED]";
        continue;
      }

      output[key] = sanitizeValue(current, depth + 1);
    }

    return output;
  }

  if (typeof value === "string" && value.length > 800) {
    return `${value.slice(0, 800)}...[truncated]`;
  }

  return value;
}

function parseValueByPrefix(errors: readonly string[] | undefined, prefix: string): string | undefined {
  if (!errors || errors.length === 0) {
    return undefined;
  }

  const hit = errors.find((item) => item.toLowerCase().startsWith(prefix.toLowerCase()));
  if (!hit) {
    return undefined;
  }

  const index = hit.indexOf("=");
  if (index <= -1 || index + 1 >= hit.length) {
    return undefined;
  }

  return hit.slice(index + 1).trim();
}

export function parseCorrelationId(errors: readonly string[] | undefined): string | undefined {
  const prefixed = parseValueByPrefix(errors, "correlationId=");
  if (prefixed) {
    return prefixed;
  }

  if (!errors || errors.length === 0) {
    return undefined;
  }

  for (const item of errors) {
    const match = item.match(/correlationId[:=]\s*([A-Za-z0-9\-]+)/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

export function buildWebRtcUiError<T>(
  response: ApiResponse<T> | null | undefined,
  fallbackMessage: string
): WebRtcUiError {
  const errors = Array.isArray(response?.errors) ? response!.errors : [];
  const code = parseValueByPrefix(errors, "code=");
  const type = parseValueByPrefix(errors, "type=");
  const correlationId = parseCorrelationId(errors);

  return {
    message: response?.message || fallbackMessage,
    statusCode: response?.statusCode,
    code,
    type,
    correlationId,
    errors,
  };
}

function logGrouped(
  level: "info" | "warn" | "error",
  eventName: string,
  payload?: Record<string, unknown>
): void {
  const safePayload = sanitizeValue(payload ?? {}) as Record<string, unknown>;
  const title = `[WebRTC][${level.toUpperCase()}] ${eventName}`;
  const groupStart = console.groupCollapsed ?? console.group;
  const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

  groupStart(title);
  logFn(safePayload);
  console.groupEnd();
}

export function logWebRtcInfo(eventName: string, payload?: Record<string, unknown>): void {
  logGrouped("info", eventName, payload);
}

export function logWebRtcSuccess(eventName: string, payload?: Record<string, unknown>): void {
  logGrouped("info", `${eventName}:success`, payload);
}

export function logWebRtcWarn(eventName: string, payload?: Record<string, unknown>): void {
  logGrouped("warn", eventName, payload);
}

export function logWebRtcError(
  eventName: string,
  error: WebRtcUiError,
  payload?: Record<string, unknown>
): void {
  logGrouped("error", `${eventName}:error`, {
    ...payload,
    error,
  });
}
