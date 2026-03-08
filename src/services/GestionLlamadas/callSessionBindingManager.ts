export interface CallGestionSessionBinding {
  callSid: string;
  sessionRef: string;
  idGestionSession: number | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredBindingState {
  byCallSid: Record<string, CallGestionSessionBinding>;
  updatedAt: string;
}

const STORAGE_KEY = "sigc.webrtc.call.session.binding.v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function safeSessionStorageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionStorageSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore sessionStorage write errors
  }
}

function readState(): StoredBindingState {
  const raw = safeSessionStorageGet(STORAGE_KEY);
  if (!raw) {
    return {
      byCallSid: {},
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const parsed = JSON.parse(raw) as StoredBindingState;
    if (!parsed || typeof parsed !== "object" || !parsed.byCallSid) {
      return {
        byCallSid: {},
        updatedAt: new Date().toISOString(),
      };
    }

    return parsed;
  } catch {
    return {
      byCallSid: {},
      updatedAt: new Date().toISOString(),
    };
  }
}

function writeState(state: StoredBindingState): void {
  safeSessionStorageSet(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      updatedAt: new Date().toISOString(),
    })
  );
}

function cleanupState(state: StoredBindingState): void {
  const nowMs = Date.now();
  for (const callSid of Object.keys(state.byCallSid)) {
    const entry = state.byCallSid[callSid];
    const updatedAtMs = Date.parse(entry.updatedAt || entry.createdAt);
    if (Number.isNaN(updatedAtMs) || nowMs - updatedAtMs > MAX_AGE_MS) {
      delete state.byCallSid[callSid];
    }
  }
}

export function bindCallToGestionSession(input: {
  callSid: string;
  sessionRef: string;
  idGestionSession?: number | null;
}): CallGestionSessionBinding | null {
  const callSid = normalizeText(input.callSid);
  const sessionRef = normalizeText(input.sessionRef);
  if (!callSid || !sessionRef) {
    return null;
  }

  const state = readState();
  cleanupState(state);

  const existing = state.byCallSid[callSid];
  const now = new Date().toISOString();
  const binding: CallGestionSessionBinding = {
    callSid,
    sessionRef,
    idGestionSession: normalizeNumber(input.idGestionSession ?? existing?.idGestionSession) ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  state.byCallSid[callSid] = binding;
  writeState(state);
  return binding;
}

export function getCallGestionSessionBinding(callSid: string): CallGestionSessionBinding | null {
  const normalizedCallSid = normalizeText(callSid);
  if (!normalizedCallSid) {
    return null;
  }

  const state = readState();
  cleanupState(state);
  const binding = state.byCallSid[normalizedCallSid] ?? null;
  if (binding) {
    writeState(state);
  }

  return binding;
}

export function removeCallGestionSessionBinding(callSid: string): void {
  const normalizedCallSid = normalizeText(callSid);
  if (!normalizedCallSid) {
    return;
  }

  const state = readState();
  cleanupState(state);
  delete state.byCallSid[normalizedCallSid];
  writeState(state);
}

export function clearCallGestionSessionBindings(): void {
  writeState({
    byCallSid: {},
    updatedAt: new Date().toISOString(),
  });
}
