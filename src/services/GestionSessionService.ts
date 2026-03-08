import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";

export interface StartGestionSessionRequest {
  cliente: string;
  factura: string;
  cuenta: string;
  idempotencyKey?: string;
  source?: string;
  tabId?: string;
  autoPauseCurrentActive?: boolean;
}

export interface GetActiveGestionSessionRequest {
  cliente?: string;
  factura?: string;
  cuenta?: string;
  sessionRef?: string;
}

export interface TransitionGestionSessionRequest {
  idGestionSession?: number;
  sessionRef?: string;
  newState: string;
  reason?: string;
  idempotencyKey?: string;
  source?: string;
  tabId?: string;
}

export interface SwitchActiveGestionSessionRequest {
  idGestionSession?: number;
  sessionRef?: string;
  reason?: string;
  idempotencyKey?: string;
  source?: string;
  tabId?: string;
}

export interface GestionSession {
  idGestionSession: number;
  sessionRef: string;
  status: string;
  startedAt: string;
  lastActivityAt: string;
  endedAt: string | null;
  closeReason: string | null;
  cliente: string;
  factura: string;
  cuenta: string;
  accumulatedActiveSeconds: number;
  currentActiveStartedAt: string | null;
  elapsedActiveSeconds: number;
}

interface GestionSessionDtoApi {
  idGestionSession?: number;
  IdGestionSession?: number;
  sessionRef?: string;
  SessionRef?: string;
  status?: string;
  Status?: string;
  startedAt?: string;
  StartedAt?: string;
  lastActivityAt?: string;
  LastActivityAt?: string;
  endedAt?: string | null;
  EndedAt?: string | null;
  closeReason?: string | null;
  CloseReason?: string | null;
  cliente?: string;
  Cliente?: string;
  factura?: string;
  Factura?: string;
  cuenta?: string;
  Cuenta?: string;
  accumulatedActiveSeconds?: number;
  AccumulatedActiveSeconds?: number;
  currentActiveStartedAt?: string | null;
  CurrentActiveStartedAt?: string | null;
  elapsedActiveSeconds?: number;
  ElapsedActiveSeconds?: number;
}

interface GestionSessionOperationApi {
  outcomeCode?: string;
  OutcomeCode?: string;
  session?: GestionSessionDtoApi | null;
  Session?: GestionSessionDtoApi | null;
}

interface GestionSessionListOperationApi {
  outcomeCode?: string;
  OutcomeCode?: string;
  activeSession?: GestionSessionDtoApi | null;
  ActiveSession?: GestionSessionDtoApi | null;
  sessions?: GestionSessionDtoApi[] | null;
  Sessions?: GestionSessionDtoApi[] | null;
}

export interface GestionSessionOperationResult {
  outcomeCode: string;
  session: GestionSession | null;
}

export interface GestionSessionListOperationResult {
  outcomeCode: string;
  activeSession: GestionSession | null;
  sessions: GestionSession[];
}

export interface GestionSessionServiceResult {
  success: boolean;
  message: string;
  statusCode: number;
  errors: string[];
  operation: GestionSessionOperationResult | null;
  raw: ApiResponse<GestionSessionOperationApi> | null;
}

export interface GestionSessionListServiceResult {
  success: boolean;
  message: string;
  statusCode: number;
  errors: string[];
  operation: GestionSessionListOperationResult | null;
  raw: ApiResponse<GestionSessionListOperationApi> | null;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSession(raw: GestionSessionDtoApi | null | undefined): GestionSession | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const idGestionSession = normalizeNumber(raw.idGestionSession ?? raw.IdGestionSession);
  const sessionRef = normalizeText(raw.sessionRef ?? raw.SessionRef);
  const status = normalizeText(raw.status ?? raw.Status);
  const startedAt = normalizeText(raw.startedAt ?? raw.StartedAt);
  const lastActivityAt = normalizeText(raw.lastActivityAt ?? raw.LastActivityAt);
  const cliente = normalizeText(raw.cliente ?? raw.Cliente);
  const factura = normalizeText(raw.factura ?? raw.Factura);
  const cuenta = normalizeText(raw.cuenta ?? raw.Cuenta);

  if (!idGestionSession || !sessionRef) {
    return null;
  }

  return {
    idGestionSession,
    sessionRef,
    status,
    startedAt,
    lastActivityAt,
    endedAt: raw.endedAt ?? raw.EndedAt ?? null,
    closeReason: raw.closeReason ?? raw.CloseReason ?? null,
    cliente,
    factura,
    cuenta,
    accumulatedActiveSeconds: Math.max(
      0,
      normalizeNumber(raw.accumulatedActiveSeconds ?? raw.AccumulatedActiveSeconds) ?? 0
    ),
    currentActiveStartedAt:
      (raw.currentActiveStartedAt ?? raw.CurrentActiveStartedAt ?? null) || null,
    elapsedActiveSeconds: Math.max(
      0,
      normalizeNumber(raw.elapsedActiveSeconds ?? raw.ElapsedActiveSeconds) ?? 0
    ),
  };
}

function normalizeOperation(raw: GestionSessionOperationApi | undefined): GestionSessionOperationResult | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  return {
    outcomeCode: normalizeText(raw.outcomeCode ?? raw.OutcomeCode),
    session: normalizeSession(raw.session ?? raw.Session ?? null),
  };
}

function normalizeListOperation(
  raw: GestionSessionListOperationApi | undefined
): GestionSessionListOperationResult | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const sessionsRaw = raw.sessions ?? raw.Sessions ?? [];
  const sessions = Array.isArray(sessionsRaw)
    ? sessionsRaw
        .map((session) => normalizeSession(session))
        .filter((session): session is GestionSession => Boolean(session))
    : [];
  const activeSession =
    normalizeSession(raw.activeSession ?? raw.ActiveSession ?? null)
    ?? sessions.find((session) => session.status.toLowerCase() === "activa")
    ?? null;

  return {
    outcomeCode: normalizeText(raw.outcomeCode ?? raw.OutcomeCode),
    activeSession,
    sessions,
  };
}

function mapResult(
  response: ApiResponse<GestionSessionOperationApi> | null
): GestionSessionServiceResult {
  return {
    success: Boolean(response?.success),
    message: response?.message ?? "",
    statusCode: response?.statusCode ?? 0,
    errors: response?.errors ?? [],
    operation: normalizeOperation(response?.data),
    raw: response,
  };
}

function mapListResult(
  response: ApiResponse<GestionSessionListOperationApi> | null
): GestionSessionListServiceResult {
  return {
    success: Boolean(response?.success),
    message: response?.message ?? "",
    statusCode: response?.statusCode ?? 0,
    errors: response?.errors ?? [],
    operation: normalizeListOperation(response?.data),
    raw: response,
  };
}

export function buildGestionContextKey(cliente: string, factura: string, cuenta: string): string {
  return [normalizeText(cliente), normalizeText(factura), normalizeText(cuenta)].join("|");
}

export function getGestionSessionContextKey(session: Pick<GestionSession, "cliente" | "factura" | "cuenta">): string {
  return buildGestionContextKey(session.cliente, session.factura, session.cuenta);
}

export function calculateGestionSessionElapsedSeconds(
  session: Pick<GestionSession, "status" | "accumulatedActiveSeconds" | "currentActiveStartedAt" | "elapsedActiveSeconds">,
  nowMs = Date.now()
): number {
  const accumulated = Math.max(0, normalizeNumber(session.accumulatedActiveSeconds) ?? 0);
  const fallbackElapsed = Math.max(accumulated, normalizeNumber(session.elapsedActiveSeconds) ?? 0);

  if (normalizeText(session.status).toLowerCase() !== "activa") {
    return fallbackElapsed;
  }

  const currentActiveStartedAt = normalizeText(session.currentActiveStartedAt);
  if (!currentActiveStartedAt) {
    return fallbackElapsed;
  }

  const startedMs = Date.parse(currentActiveStartedAt);
  if (Number.isNaN(startedMs)) {
    return fallbackElapsed;
  }

  return accumulated + Math.max(0, Math.floor((nowMs - startedMs) / 1000));
}

export function useGestionSessionService() {
  const startApi = useApi<GestionSessionOperationApi>("/api/v1/gestion-session/start");
  const activeApi = useApi<GestionSessionOperationApi>("/api/v1/gestion-session/active");
  const stateApi = useApi<GestionSessionOperationApi>("/api/v1/gestion-session/state");
  const inProgressApi = useApi<GestionSessionListOperationApi>("/api/v1/gestion-session/in-progress");
  const switchApi = useApi<GestionSessionOperationApi>("/api/v1/gestion-session/switch-active");
  const startRequest = startApi.request;
  const activeRequest = activeApi.request;
  const stateRequest = stateApi.request;
  const inProgressRequest = inProgressApi.request;
  const switchRequest = switchApi.request;

  const startGestionSession = useCallback(
    async (request: StartGestionSessionRequest): Promise<GestionSessionServiceResult> => {
      const response = await startRequest({
        method: "POST",
        data: request,
      });

      return mapResult(response);
    },
    [startRequest]
  );

  const getActiveGestionSession = useCallback(
    async (request: GetActiveGestionSessionRequest): Promise<GestionSessionServiceResult> => {
      const response = await activeRequest({
        method: "GET",
        params: request,
      });

      return mapResult(response);
    },
    [activeRequest]
  );

  const transitionGestionSession = useCallback(
    async (request: TransitionGestionSessionRequest): Promise<GestionSessionServiceResult> => {
      const response = await stateRequest({
        method: "POST",
        data: request,
      });

      return mapResult(response);
    },
    [stateRequest]
  );

  const listInProgressGestionSessions = useCallback(
    async (): Promise<GestionSessionListServiceResult> => {
      const response = await inProgressRequest({
        method: "GET",
      });

      return mapListResult(response);
    },
    [inProgressRequest]
  );

  const switchActiveGestionSession = useCallback(
    async (request: SwitchActiveGestionSessionRequest): Promise<GestionSessionServiceResult> => {
      const response = await switchRequest({
        method: "POST",
        data: request,
      });

      return mapResult(response);
    },
    [switchRequest]
  );

  return {
    startGestionSession,
    getActiveGestionSession,
    transitionGestionSession,
    listInProgressGestionSessions,
    switchActiveGestionSession,
    loadingStartGestionSession: startApi.loading,
    loadingGetActiveGestionSession: activeApi.loading,
    loadingTransitionGestionSession: stateApi.loading,
    loadingListInProgressGestionSessions: inProgressApi.loading,
    loadingSwitchActiveGestionSession: switchApi.loading,
    errorStartGestionSession: startApi.error,
    errorGetActiveGestionSession: activeApi.error,
    errorTransitionGestionSession: stateApi.error,
    errorListInProgressGestionSessions: inProgressApi.error,
    errorSwitchActiveGestionSession: switchApi.error,
  };
}
