import { GestionSelectionContext, GestionSessionSnapshot, GestionSessionStatus } from "./contracts";

interface StoredGestionSessionRecord {
  sessionRef: string;
  selectionKey: string;
  status: GestionSessionStatus;
  startedAt: string;
  lastActivityAt: string;
  pausedAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  context: GestionSelectionContext;
}

interface StoredGestionSessionState {
  bySelection: Record<string, StoredGestionSessionRecord>;
  bySessionRef: Record<string, string>;
  updatedAt: string;
}

interface GetOrCreateGestionSessionOptions {
  reuseWindowMinutes?: number;
  statusOnCreate?: GestionSessionStatus;
}

interface MutateSessionOptions {
  closeReason?: string | null;
}

interface FindSessionRecordResult {
  key: string;
  record: StoredGestionSessionRecord;
}

const STORAGE_KEY = "sigc.gestion.sessions.v1";
const DEFAULT_REUSE_WINDOW_MINUTES = 120;
const CLOSED_STATUSES = new Set<GestionSessionStatus>(["cerrada", "cancelada", "abandonada", "interrumpida"]);
const ACTIVE_STATUSES = new Set<GestionSessionStatus>(["activa", "pausada", "consulta"]);

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

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeReason(value: unknown): string | null {
  const normalized = normalizeValue(value);
  return normalized || null;
}

function normalizeContext(context: GestionSelectionContext): GestionSelectionContext {
  return {
    cliente: normalizeValue(context.cliente),
    factura: normalizeValue(context.factura),
    cuenta: normalizeValue(context.cuenta),
    userId: context.userId ?? null,
    tenantId: context.tenantId ?? null,
  };
}

function randomSuffix(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 12);
  }

  return Math.random().toString(36).slice(2, 14);
}

function createSessionRef(): string {
  return `gs-${Date.now().toString(36)}-${randomSuffix()}`;
}

function createEmptyState(): StoredGestionSessionState {
  return {
    bySelection: {},
    bySessionRef: {},
    updatedAt: new Date().toISOString(),
  };
}

function isRecordLike(value: unknown): value is StoredGestionSessionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredGestionSessionRecord>;
  return (
    typeof candidate.sessionRef === "string"
    && typeof candidate.selectionKey === "string"
    && typeof candidate.status === "string"
    && typeof candidate.startedAt === "string"
    && typeof candidate.lastActivityAt === "string"
  );
}

function migrateLegacyState(raw: unknown): StoredGestionSessionState {
  if (!raw || typeof raw !== "object") {
    return createEmptyState();
  }

  const parsed = raw as Partial<StoredGestionSessionState> & {
    bySelection?: Record<string, unknown>;
  };

  const bySelection: Record<string, StoredGestionSessionRecord> = {};
  const bySessionRef: Record<string, string> = {};

  const entries = Object.entries(parsed.bySelection ?? {});
  for (const [selectionKey, value] of entries) {
    if (!isRecordLike(value)) {
      continue;
    }

    const context = normalizeContext(value.context ?? {
      cliente: "",
      factura: "",
      cuenta: "",
      userId: null,
      tenantId: null,
    });

    const normalizedSelectionKey = value.selectionKey || selectionKey;
    const normalizedRecord: StoredGestionSessionRecord = {
      sessionRef: normalizeValue(value.sessionRef),
      selectionKey: normalizeValue(normalizedSelectionKey),
      status: value.status as GestionSessionStatus,
      startedAt: normalizeValue(value.startedAt) || new Date().toISOString(),
      lastActivityAt: normalizeValue(value.lastActivityAt) || new Date().toISOString(),
      pausedAt: normalizeReason((value as Partial<StoredGestionSessionRecord>).pausedAt),
      closedAt: normalizeReason((value as Partial<StoredGestionSessionRecord>).closedAt),
      closeReason: normalizeReason((value as Partial<StoredGestionSessionRecord>).closeReason),
      context,
    };

    if (!normalizedRecord.sessionRef || !normalizedRecord.selectionKey) {
      continue;
    }

    bySelection[normalizedRecord.selectionKey] = normalizedRecord;
    bySessionRef[normalizedRecord.sessionRef] = normalizedRecord.selectionKey;
  }

  return {
    bySelection,
    bySessionRef,
    updatedAt: new Date().toISOString(),
  };
}

function readState(): StoredGestionSessionState {
  const raw = safeLocalStorageGet(STORAGE_KEY);
  if (!raw) {
    return createEmptyState();
  }

  try {
    const parsed = JSON.parse(raw);
    return migrateLegacyState(parsed);
  } catch {
    return createEmptyState();
  }
}

function writeState(state: StoredGestionSessionState): void {
  safeLocalStorageSet(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      updatedAt: new Date().toISOString(),
    })
  );
}

function toSnapshot(record: StoredGestionSessionRecord, source: "created" | "reused"): GestionSessionSnapshot {
  return {
    sessionRef: record.sessionRef,
    selectionKey: record.selectionKey,
    status: record.status,
    startedAt: record.startedAt,
    lastActivityAt: record.lastActivityAt,
    pausedAt: record.pausedAt,
    closedAt: record.closedAt,
    closeReason: record.closeReason,
    context: record.context,
    source,
  };
}

function isReusable(record: StoredGestionSessionRecord, reuseWindowMs: number, nowMs: number): boolean {
  if (!ACTIVE_STATUSES.has(record.status)) {
    return false;
  }

  const last = Date.parse(record.lastActivityAt || record.startedAt);
  if (Number.isNaN(last)) {
    return false;
  }

  return nowMs - last <= reuseWindowMs;
}

function findSessionRecord(state: StoredGestionSessionState, sessionRef: string): FindSessionRecordResult | null {
  const normalizedSessionRef = normalizeValue(sessionRef);
  if (!normalizedSessionRef) {
    return null;
  }

  const mappedSelectionKey = state.bySessionRef[normalizedSessionRef];
  if (mappedSelectionKey) {
    const mappedRecord = state.bySelection[mappedSelectionKey];
    if (mappedRecord && mappedRecord.sessionRef === normalizedSessionRef) {
      return { key: mappedSelectionKey, record: mappedRecord };
    }
  }

  for (const key of Object.keys(state.bySelection)) {
    const record = state.bySelection[key];
    if (record.sessionRef === normalizedSessionRef) {
      return { key, record };
    }
  }

  return null;
}

function mutateSessionStatus(
  sessionRef: string,
  nextStatus: GestionSessionStatus,
  options: MutateSessionOptions = {}
): GestionSessionSnapshot | null {
  const state = readState();
  const found = findSessionRecord(state, sessionRef);
  if (!found) {
    return null;
  }

  const now = new Date().toISOString();
  const closeReason = normalizeReason(options.closeReason);
  const previous = found.record;
  const next: StoredGestionSessionRecord = {
    ...previous,
    status: nextStatus,
    lastActivityAt: now,
    pausedAt: nextStatus === "pausada" ? now : previous.pausedAt,
    closedAt: CLOSED_STATUSES.has(nextStatus) ? now : previous.closedAt,
    closeReason: closeReason ?? previous.closeReason,
  };

  if (nextStatus === "activa") {
    next.pausedAt = null;
  }

  if (!CLOSED_STATUSES.has(nextStatus)) {
    next.closedAt = null;
  }

  state.bySelection[found.key] = next;
  state.bySessionRef[next.sessionRef] = found.key;
  writeState(state);

  return toSnapshot(next, "reused");
}

export function buildSelectionKey(context: GestionSelectionContext): string {
  const normalized = normalizeContext(context);
  return `${normalized.cliente}|${normalized.factura}|${normalized.cuenta}`;
}

export function getOrCreateGestionSession(
  context: GestionSelectionContext,
  options: GetOrCreateGestionSessionOptions = {}
): GestionSessionSnapshot {
  const normalizedContext = normalizeContext(context);
  const selectionKey = buildSelectionKey(normalizedContext);
  const now = new Date().toISOString();
  const nowMs = Date.parse(now);
  const reuseWindowMinutes = options.reuseWindowMinutes ?? DEFAULT_REUSE_WINDOW_MINUTES;
  const reuseWindowMs = Math.max(1, reuseWindowMinutes) * 60_000;
  const state = readState();
  const existing = state.bySelection[selectionKey];

  if (existing && isReusable(existing, reuseWindowMs, nowMs)) {
    const reusedRecord: StoredGestionSessionRecord = {
      ...existing,
      status: "activa",
      lastActivityAt: now,
      pausedAt: null,
      closedAt: null,
      closeReason: null,
      context: normalizedContext,
    };
    state.bySelection[selectionKey] = reusedRecord;
    state.bySessionRef[reusedRecord.sessionRef] = selectionKey;
    writeState(state);
    return toSnapshot(reusedRecord, "reused");
  }

  const createdRecord: StoredGestionSessionRecord = {
    sessionRef: createSessionRef(),
    selectionKey,
    status: options.statusOnCreate ?? "activa",
    startedAt: now,
    lastActivityAt: now,
    pausedAt: null,
    closedAt: null,
    closeReason: null,
    context: normalizedContext,
  };
  state.bySelection[selectionKey] = createdRecord;
  state.bySessionRef[createdRecord.sessionRef] = selectionKey;
  writeState(state);

  return toSnapshot(createdRecord, "created");
}

export function getGestionSessionBySelection(context: GestionSelectionContext): GestionSessionSnapshot | null {
  const selectionKey = buildSelectionKey(context);
  const state = readState();
  const existing = state.bySelection[selectionKey];
  if (!existing) {
    return null;
  }

  return toSnapshot(existing, "reused");
}

export function getGestionSessionBySessionRef(sessionRef: string): GestionSessionSnapshot | null {
  const state = readState();
  const found = findSessionRecord(state, sessionRef);
  if (!found) {
    return null;
  }

  return toSnapshot(found.record, "reused");
}

export function touchGestionSession(sessionRef: string): boolean {
  const updated = mutateSessionStatus(sessionRef, "activa");
  return Boolean(updated);
}

export function pauseGestionSession(sessionRef: string, reason?: string): GestionSessionSnapshot | null {
  return mutateSessionStatus(sessionRef, "pausada", {
    closeReason: reason ?? null,
  });
}

export function markGestionSessionAsAbandoned(sessionRef: string, reason?: string): GestionSessionSnapshot | null {
  return mutateSessionStatus(sessionRef, "abandonada", {
    closeReason: reason ?? "abandonada_por_inactividad",
  });
}

export function markGestionSessionAsInterrupted(sessionRef: string, reason?: string): GestionSessionSnapshot | null {
  return mutateSessionStatus(sessionRef, "interrumpida", {
    closeReason: reason ?? "interrupcion_cliente",
  });
}

export function closeGestionSession(sessionRef: string, reason?: string): GestionSessionSnapshot | null {
  return mutateSessionStatus(sessionRef, "cerrada", {
    closeReason: reason ?? "cerrada_por_usuario",
  });
}

export function updateGestionSessionStatus(sessionRef: string, status: GestionSessionStatus): boolean {
  const updated = mutateSessionStatus(sessionRef, status);
  return Boolean(updated);
}

export function clearGestionSessionBySelection(context: GestionSelectionContext): boolean {
  const selectionKey = buildSelectionKey(context);
  const state = readState();
  const existing = state.bySelection[selectionKey];
  if (!existing) {
    return false;
  }

  delete state.bySessionRef[existing.sessionRef];
  delete state.bySelection[selectionKey];
  writeState(state);
  return true;
}
