import { ActiveGestionPointer } from "./contracts";

const STORAGE_KEY = "sigc.gestion.active.pointer.v1";

const EMPTY_POINTER: ActiveGestionPointer = {
  idGestionSession: null,
  sessionRef: null,
  contextKey: null,
  startedAt: null,
  status: null,
  updatedAt: null,
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore localStorage write failures
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore localStorage remove failures
  }
}

function normalizeText(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return null;
}

function normalizeStatus(value: unknown): ActiveGestionPointer["status"] {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "activa":
    case "pausada":
    case "cerrada":
    case "cancelada":
    case "abandonada":
    case "interrumpida":
      return normalized;
    default:
      return null;
  }
}

function normalizePointer(value: unknown): ActiveGestionPointer {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_POINTER };
  }

  const source = value as Partial<ActiveGestionPointer>;
  return {
    idGestionSession: normalizeNumber(source.idGestionSession),
    sessionRef: normalizeText(source.sessionRef),
    contextKey: normalizeText(source.contextKey),
    startedAt: normalizeText(source.startedAt),
    status: normalizeStatus(source.status),
    updatedAt: normalizeText(source.updatedAt),
  };
}

function hasPointerData(pointer: ActiveGestionPointer): boolean {
  return Boolean(
    pointer.idGestionSession !== null
    || pointer.sessionRef
    || pointer.contextKey
    || pointer.startedAt
    || pointer.status
  );
}

function isSamePointer(
  left: ActiveGestionPointer | null | undefined,
  right: ActiveGestionPointer | null | undefined
): boolean {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.idGestionSession === right.idGestionSession
    && left.sessionRef === right.sessionRef
    && left.contextKey === right.contextKey
    && left.startedAt === right.startedAt
    && left.status === right.status
  );
}

export function getActiveGestionPointer(): ActiveGestionPointer | null {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const pointer = normalizePointer(parsed);
    return hasPointerData(pointer) ? pointer : null;
  } catch {
    return null;
  }
}

export function setActiveGestionPointer(
  partial: Partial<Omit<ActiveGestionPointer, "updatedAt">>
): ActiveGestionPointer {
  const current = getActiveGestionPointer();
  const baseline = current ?? EMPTY_POINTER;
  const merged: ActiveGestionPointer = {
    idGestionSession: normalizeNumber(partial.idGestionSession ?? baseline.idGestionSession),
    sessionRef: normalizeText(partial.sessionRef ?? baseline.sessionRef),
    contextKey: normalizeText(partial.contextKey ?? baseline.contextKey),
    startedAt: normalizeText(partial.startedAt ?? baseline.startedAt),
    status: normalizeStatus(partial.status ?? baseline.status),
    updatedAt: baseline.updatedAt,
  };

  if (!hasPointerData(merged)) {
    clearActiveGestionPointer();
    return { ...EMPTY_POINTER };
  }

  if (isSamePointer(current, merged)) {
    return current ?? merged;
  }

  const next = {
    ...merged,
    updatedAt: new Date().toISOString(),
  };
  safeSet(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearActiveGestionPointer(): void {
  if (safeGet(STORAGE_KEY) === null) {
    return;
  }

  safeRemove(STORAGE_KEY);
}
