import { SaveIdempotencyAttempt, SaveIdempotencyInput } from "./contracts";

interface StoredIdempotencyEntry {
  idempotencyKey: string;
  fingerprint: string;
  createdAt: string;
}

interface StoredIdempotencyState {
  byFingerprint: Record<string, StoredIdempotencyEntry>;
  updatedAt: string;
}

interface CreateOrReuseSaveAttemptOptions {
  duplicateWindowMs?: number;
  maxAgeMs?: number;
}

const STORAGE_KEY = "sigc.gestion.save.idempotency.v1";
const DEFAULT_DUPLICATE_WINDOW_MS = 15_000;
const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage write errors
  }
}

function readState(): StoredIdempotencyState {
  const raw = safeLocalStorageGet(STORAGE_KEY);
  if (!raw) {
    return {
      byFingerprint: {},
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const parsed = JSON.parse(raw) as StoredIdempotencyState;
    if (!parsed || typeof parsed !== "object" || !parsed.byFingerprint) {
      return {
        byFingerprint: {},
        updatedAt: new Date().toISOString(),
      };
    }

    return parsed;
  } catch {
    return {
      byFingerprint: {},
      updatedAt: new Date().toISOString(),
    };
  }
}

function writeState(state: StoredIdempotencyState): void {
  safeLocalStorageSet(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      updatedAt: new Date().toISOString(),
    })
  );
}

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeDescription(value: unknown): string {
  return normalizeValue(value).replace(/\s+/g, " ").toLowerCase();
}

function randomSuffix(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function createIdempotencyKey(): string {
  return `save-${randomSuffix()}`;
}

function cleanupState(state: StoredIdempotencyState, nowMs: number, maxAgeMs: number): void {
  for (const fingerprint of Object.keys(state.byFingerprint)) {
    const entry = state.byFingerprint[fingerprint];
    const entryTs = Date.parse(entry.createdAt);
    if (Number.isNaN(entryTs) || nowMs - entryTs > maxAgeMs) {
      delete state.byFingerprint[fingerprint];
    }
  }
}

export function buildSaveFingerprint(input: SaveIdempotencyInput): string {
  const normalized = {
    sessionRef: normalizeValue(input.sessionRef),
    selectionKey: normalizeValue(input.selectionKey),
    cliente: normalizeValue(input.cliente),
    factura: normalizeValue(input.factura),
    cuenta: normalizeValue(input.cuenta),
    userId: normalizeValue(input.userId ?? ""),
    tipoContacto: normalizeValue(input.tipoContacto ?? ""),
    descripcion: normalizeDescription(input.descripcion ?? ""),
  };

  return [
    normalized.sessionRef,
    normalized.selectionKey,
    normalized.cliente,
    normalized.factura,
    normalized.cuenta,
    normalized.userId,
    normalized.tipoContacto,
    normalized.descripcion,
  ].join("|");
}

export function createOrReuseSaveAttempt(
  input: SaveIdempotencyInput,
  options: CreateOrReuseSaveAttemptOptions = {}
): SaveIdempotencyAttempt {
  const duplicateWindowMs = Math.max(1000, options.duplicateWindowMs ?? DEFAULT_DUPLICATE_WINDOW_MS);
  const maxAgeMs = Math.max(duplicateWindowMs, options.maxAgeMs ?? DEFAULT_MAX_AGE_MS);
  const state = readState();
  const now = new Date().toISOString();
  const nowMs = Date.parse(now);
  const fingerprint = buildSaveFingerprint(input);

  cleanupState(state, nowMs, maxAgeMs);

  const existing = state.byFingerprint[fingerprint];
  if (existing) {
    const existingTs = Date.parse(existing.createdAt);
    if (!Number.isNaN(existingTs) && nowMs - existingTs <= duplicateWindowMs) {
      writeState(state);
      return {
        idempotencyKey: existing.idempotencyKey,
        fingerprint: existing.fingerprint,
        createdAt: existing.createdAt,
        reused: true,
        isRecentDuplicate: true,
      };
    }
  }

  const created: StoredIdempotencyEntry = {
    idempotencyKey: createIdempotencyKey(),
    fingerprint,
    createdAt: now,
  };
  state.byFingerprint[fingerprint] = created;
  writeState(state);

  return {
    idempotencyKey: created.idempotencyKey,
    fingerprint: created.fingerprint,
    createdAt: created.createdAt,
    reused: false,
    isRecentDuplicate: false,
  };
}

