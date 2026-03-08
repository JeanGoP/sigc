export interface PendingInboundCallSnapshot {
  callSid: string;
  direction: string | null;
  status: string | null;
  from: string | null;
  to: string | null;
  startedAt: string | null;
  endedAt: string | null;
  updatedAt: string;
}

interface StoredPendingInboundState {
  calls: PendingInboundCallSnapshot[];
  updatedAt: string;
}

interface UpsertPendingInboundCallInput {
  callSid: string;
  direction?: string | null;
  status?: string | null;
  from?: string | null;
  to?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
}

type PendingInboundListener = (calls: PendingInboundCallSnapshot[]) => void;

const STORAGE_KEY = "sigc.gestion.inbound.pending.v1";
const LOCAL_EVENT_NAME = "sigc.gestion.inbound.pending.changed";
const MAX_ITEMS = 20;
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

function normalizeText(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

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
    // ignore storage errors
  }
}

function notifyChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(LOCAL_EVENT_NAME));
}

function normalizeCall(value: unknown): PendingInboundCallSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Partial<PendingInboundCallSnapshot>;
  const callSid = normalizeText(source.callSid);
  if (!callSid) {
    return null;
  }

  return {
    callSid,
    direction: normalizeText(source.direction),
    status: normalizeText(source.status),
    from: normalizeText(source.from),
    to: normalizeText(source.to),
    startedAt: normalizeText(source.startedAt),
    endedAt: normalizeText(source.endedAt),
    updatedAt: normalizeText(source.updatedAt) ?? new Date().toISOString(),
  };
}

function readState(): StoredPendingInboundState {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) {
    return {
      calls: [],
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const parsed = JSON.parse(raw) as StoredPendingInboundState;
    const calls = Array.isArray(parsed?.calls)
      ? parsed.calls.map((entry) => normalizeCall(entry)).filter(Boolean) as PendingInboundCallSnapshot[]
      : [];

    return {
      calls,
      updatedAt: normalizeText(parsed?.updatedAt) ?? new Date().toISOString(),
    };
  } catch {
    return {
      calls: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

function cleanupCalls(calls: PendingInboundCallSnapshot[]): PendingInboundCallSnapshot[] {
  const now = Date.now();
  const dedup = new Map<string, PendingInboundCallSnapshot>();

  for (const call of calls) {
    const parsedUpdatedAt = Date.parse(call.updatedAt);
    if (Number.isNaN(parsedUpdatedAt) || now - parsedUpdatedAt > MAX_AGE_MS) {
      continue;
    }

    const existing = dedup.get(call.callSid);
    if (!existing) {
      dedup.set(call.callSid, call);
      continue;
    }

    const existingMs = Date.parse(existing.updatedAt);
    if (Number.isNaN(existingMs) || parsedUpdatedAt >= existingMs) {
      dedup.set(call.callSid, call);
    }
  }

  return Array.from(dedup.values())
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, MAX_ITEMS);
}

function writeState(state: StoredPendingInboundState): void {
  const sanitized = cleanupCalls(state.calls);
  safeSet(STORAGE_KEY, JSON.stringify({
    calls: sanitized,
    updatedAt: new Date().toISOString(),
  }));
  notifyChanged();
}

function mergeValue(next: string | null, previous: string | null): string | null {
  return next ?? previous ?? null;
}

export function getPendingInboundCalls(): PendingInboundCallSnapshot[] {
  const state = readState();
  const sanitized = cleanupCalls(state.calls);
  if (sanitized.length !== state.calls.length) {
    writeState({
      calls: sanitized,
      updatedAt: new Date().toISOString(),
    });
  }
  return sanitized;
}

export function upsertPendingInboundCall(input: UpsertPendingInboundCallInput): void {
  const callSid = normalizeText(input.callSid);
  if (!callSid) {
    return;
  }

  const state = readState();
  const calls = cleanupCalls(state.calls);
  const existingIndex = calls.findIndex((entry) => entry.callSid === callSid);
  const nowIso = new Date().toISOString();

  const nextRecord: PendingInboundCallSnapshot = existingIndex >= 0
    ? {
      ...calls[existingIndex],
      direction: mergeValue(normalizeText(input.direction), calls[existingIndex].direction),
      status: mergeValue(normalizeText(input.status), calls[existingIndex].status),
      from: mergeValue(normalizeText(input.from), calls[existingIndex].from),
      to: mergeValue(normalizeText(input.to), calls[existingIndex].to),
      startedAt: mergeValue(normalizeText(input.startedAt), calls[existingIndex].startedAt),
      endedAt: mergeValue(normalizeText(input.endedAt), calls[existingIndex].endedAt),
      updatedAt: nowIso,
    }
    : {
      callSid,
      direction: normalizeText(input.direction),
      status: normalizeText(input.status),
      from: normalizeText(input.from),
      to: normalizeText(input.to),
      startedAt: normalizeText(input.startedAt),
      endedAt: normalizeText(input.endedAt),
      updatedAt: nowIso,
    };

  if (existingIndex >= 0) {
    calls[existingIndex] = nextRecord;
  } else {
    calls.unshift(nextRecord);
  }

  writeState({
    calls,
    updatedAt: nowIso,
  });
}

export function removePendingInboundCall(callSidValue: string): void {
  const callSid = normalizeText(callSidValue);
  if (!callSid) {
    return;
  }

  const state = readState();
  const calls = cleanupCalls(state.calls).filter((entry) => entry.callSid !== callSid);
  writeState({
    calls,
    updatedAt: new Date().toISOString(),
  });
}

export function subscribePendingInboundCalls(listener: PendingInboundListener): () => void {
  if (typeof window === "undefined") {
    listener(getPendingInboundCalls());
    return () => {};
  }

  const notify = () => {
    listener(getPendingInboundCalls());
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    notify();
  };

  const onLocalChange = () => {
    notify();
  };

  listener(getPendingInboundCalls());
  window.addEventListener("storage", onStorage);
  window.addEventListener(LOCAL_EVENT_NAME, onLocalChange as EventListener);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LOCAL_EVENT_NAME, onLocalChange as EventListener);
  };
}
