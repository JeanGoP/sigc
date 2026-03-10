const CLOSED_SAVE_OUTCOME_CODES = new Set([
  "saved_and_closed",
  "idempotent_replay",
  "conflict_already_closed",
  "conflict_transition",
]);

const NON_ACTIVE_GESTION_SESSION_STATUSES = new Set([
  "pausada",
  "interrumpida",
  "cerrada",
  "cancelada",
  "abandonada",
  "finalizada",
  "completada",
  "closed",
  "completed",
]);

export const SAVE_SESSION_SYNC_RETRY_DELAYS_MS = [350, 900, 1800] as const;

export function normalizeSaveOutcomeCode(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeGestionSessionStatus(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function isClosedSaveOutcomeCode(value: unknown): boolean {
  return CLOSED_SAVE_OUTCOME_CODES.has(normalizeSaveOutcomeCode(value));
}

export function isGestionSessionNonActiveStatus(value: unknown): boolean {
  return NON_ACTIVE_GESTION_SESSION_STATUSES.has(
    normalizeGestionSessionStatus(value)
  );
}

export function findGestionSessionBySessionRef<
  T extends { sessionRef: string; status: string }
>(sessions: T[] | null | undefined, sessionRef: string): T | null {
  const normalizedSessionRef = String(sessionRef ?? "").trim();
  if (!normalizedSessionRef || !Array.isArray(sessions)) {
    return null;
  }

  return (
    sessions.find(
      (session) => String(session.sessionRef ?? "").trim() === normalizedSessionRef
    ) ?? null
  );
}

interface ShouldCloseSeguimientoDraftAfterSaveInput {
  outcomeCode?: unknown;
  sessionStatus?: unknown;
  syncedSessionStatus?: unknown;
  sessionMissing?: boolean;
}

export function shouldCloseSeguimientoDraftAfterSave(
  input: ShouldCloseSeguimientoDraftAfterSaveInput
): boolean {
  if (Boolean(input.sessionMissing)) {
    return true;
  }

  return (
    isClosedSaveOutcomeCode(input.outcomeCode)
    || isGestionSessionNonActiveStatus(input.sessionStatus)
    || isGestionSessionNonActiveStatus(input.syncedSessionStatus)
  );
}
