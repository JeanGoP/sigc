interface StoredActionLock {
  ownerId: string;
  expiresAt: string;
  updatedAt: string;
}

interface StoredActionLockState {
  byKey: Record<string, StoredActionLock>;
  updatedAt: string;
}

interface AcquireActionLockInput {
  scopeKey: string;
  action: string;
  ownerId: string;
  ttlMs?: number;
}

interface ReleaseActionLockInput {
  scopeKey: string;
  action: string;
  ownerId?: string | null;
}

export interface ActionLockAcquireResult {
  acquired: boolean;
  key: string;
  ownerId: string | null;
  expiresAt: string | null;
}

const STORAGE_KEY = "sigc.gestion.action.lock.v1";
const DEFAULT_LOCK_TTL_MS = 45_000;

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

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function buildKey(scopeKey: string, action: string): string {
  return `${normalizeText(scopeKey)}|${normalizeText(action)}`;
}

function readState(): StoredActionLockState {
  const raw = safeLocalStorageGet(STORAGE_KEY);
  if (!raw) {
    return {
      byKey: {},
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const parsed = JSON.parse(raw) as StoredActionLockState;
    if (!parsed || typeof parsed !== "object" || !parsed.byKey) {
      return {
        byKey: {},
        updatedAt: new Date().toISOString(),
      };
    }

    return parsed;
  } catch {
    return {
      byKey: {},
      updatedAt: new Date().toISOString(),
    };
  }
}

function writeState(state: StoredActionLockState): void {
  safeLocalStorageSet(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      updatedAt: new Date().toISOString(),
    })
  );
}

function cleanupState(state: StoredActionLockState, nowMs: number): void {
  for (const key of Object.keys(state.byKey)) {
    const lock = state.byKey[key];
    const expiresAtMs = Date.parse(lock.expiresAt);
    if (Number.isNaN(expiresAtMs) || expiresAtMs <= nowMs) {
      delete state.byKey[key];
    }
  }
}

export function acquireActionLock(input: AcquireActionLockInput): ActionLockAcquireResult {
  const scopeKey = normalizeText(input.scopeKey);
  const action = normalizeText(input.action);
  const ownerId = normalizeText(input.ownerId);
  const ttlMs = Math.max(1000, input.ttlMs ?? DEFAULT_LOCK_TTL_MS);
  const key = buildKey(scopeKey, action);

  if (!scopeKey || !action || !ownerId) {
    return {
      acquired: false,
      key,
      ownerId: null,
      expiresAt: null,
    };
  }

  const state = readState();
  const now = new Date();
  const nowMs = now.getTime();
  cleanupState(state, nowMs);

  const existing = state.byKey[key];
  if (existing) {
    if (existing.ownerId === ownerId) {
      state.byKey[key] = {
        ownerId,
        expiresAt: new Date(nowMs + ttlMs).toISOString(),
        updatedAt: now.toISOString(),
      };
      writeState(state);
      return {
        acquired: true,
        key,
        ownerId,
        expiresAt: state.byKey[key].expiresAt,
      };
    }

    writeState(state);
    return {
      acquired: false,
      key,
      ownerId: existing.ownerId,
      expiresAt: existing.expiresAt,
    };
  }

  state.byKey[key] = {
    ownerId,
    expiresAt: new Date(nowMs + ttlMs).toISOString(),
    updatedAt: now.toISOString(),
  };
  writeState(state);

  return {
    acquired: true,
    key,
    ownerId,
    expiresAt: state.byKey[key].expiresAt,
  };
}

export function releaseActionLock(input: ReleaseActionLockInput): void {
  const scopeKey = normalizeText(input.scopeKey);
  const action = normalizeText(input.action);
  const ownerId = normalizeText(input.ownerId);
  const key = buildKey(scopeKey, action);
  if (!scopeKey || !action) {
    return;
  }

  const state = readState();
  const existing = state.byKey[key];
  if (!existing) {
    return;
  }

  if (ownerId && existing.ownerId !== ownerId) {
    return;
  }

  delete state.byKey[key];
  writeState(state);
}
