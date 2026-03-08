import { useCallback } from "react";
import { ApiResponse } from "@app/models/apiResponse";
import { useApi } from "@app/hooks/useApi";

const WEBRTC_API_URL = (import.meta.env.VITE_WEBRTC_API_URL as string | undefined)?.trim() ?? "";

function resolveWebRtcBaseUrl(): string {
  if (!WEBRTC_API_URL) {
    return "/api/v1";
  }

  const normalized = WEBRTC_API_URL.replace(/\/+$/, "");
  if (/\/api\/v1$/i.test(normalized)) {
    return normalized;
  }

  return `${normalized}/api/v1`;
}

export interface WebRtcVoiceTokenDto {
  token: string;
  expiresAtUtc: string;
  agentId: string;
  callSystemTenantId?: number | string;
}

export interface CreateWebRtcCallPayload {
  to: string;
  from?: string | null;
  direction?: string;
  idempotencyKey?: string;
  sessionRef?: string;
}

export interface ListWebRtcCallsParams {
  fromUtc?: string;
  toUtc?: string;
  status?: string;
  direction?: string;
  limit?: number;
}

export interface WebRtcCallDto {
  id: number;
  callSid: string;
  direction: string;
  from?: string | null;
  to?: string | null;
  status: string;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSec?: number | null;
  recordingSid?: string | null;
  costEstimated?: number | null;
  costFinal?: number | null;
  currency?: string | null;
  provider: string;
}

export interface WebRtcPresenceSessionDto {
  agentId: string;
  systemKey: string;
  sessionRef?: string | null;
  isAvailable: boolean;
  availability: "available" | "busy" | "offline" | string;
  skills: string[];
  lastHeartbeatAt: string;
  expiresAtUtc?: string | null;
  currentCallSid?: string | null;
}

export interface ConnectWebRtcPresencePayload {
  sessionRef?: string;
  skills?: string[];
  ttlSeconds?: number;
  isAvailable?: boolean;
  currentCallSid?: string;
}

export interface HeartbeatWebRtcPresencePayload {
  sessionRef?: string;
  isAvailable?: boolean;
  ttlSeconds?: number;
}

export interface SetWebRtcPresenceAvailabilityPayload {
  availability: "available" | "busy" | "offline";
  currentCallSid?: string;
  ttlSeconds?: number;
}

export type AdvisorInternalState =
  | "disponible"
  | "ocupado_llamada"
  | "break"
  | "almuerzo"
  | "bio"
  | "offline";

export interface SetAdvisorInternalStatePayload {
  internalState: AdvisorInternalState;
  reason?: string;
  source?: string;
  sessionRef?: string;
  tabId?: string;
  currentCallSid?: string;
  ttlSeconds?: number;
}

export interface WebRtcInternalStateDto {
  outcomeCode: string;
  previousState?: string | null;
  internalState: AdvisorInternalState | string;
  presenceAvailability: "available" | "busy" | string;
  reason?: string | null;
  source?: string | null;
  sessionRef?: string | null;
  tabId?: string | null;
  changedAtUtc: string;
  presence?: WebRtcPresenceSessionDto | null;
}

type ApiResult<T> = Promise<ApiResponse<T> | null>;

export function useWebRtcService() {
  const baseUrl = resolveWebRtcBaseUrl();

  const tokenApi = useApi<WebRtcVoiceTokenDto>(baseUrl, {
    timeout: 200000,
    retries: 0,
    retryDelay: 1000,
  });

  const createCallApi = useApi<WebRtcCallDto>(baseUrl, {
    timeout: 20000,
    retries: 0,
    retryDelay: 1000,
  });

  const listCallsApi = useApi<WebRtcCallDto[]>(baseUrl, {
    timeout: 20000,
    retries: 0,
    retryDelay: 1000,
  });

  const getCallByIdApi = useApi<WebRtcCallDto>(baseUrl, {
    timeout: 20000,
    retries: 0,
    retryDelay: 1000,
  });

  const hangupCallApi = useApi<WebRtcCallDto>(baseUrl, {
    timeout: 20000,
    retries: 0,
    retryDelay: 1000,
  });

  const presenceConnectApi = useApi<WebRtcPresenceSessionDto>(baseUrl, {
    timeout: 20000,
    retries: 0,
    retryDelay: 1000,
  });

  const presenceHeartbeatApi = useApi<WebRtcPresenceSessionDto>(baseUrl, {
    timeout: 20000,
    retries: 0,
    retryDelay: 1000,
  });

  const presenceAvailabilityApi = useApi<WebRtcPresenceSessionDto>(baseUrl, {
    timeout: 20000,
    retries: 0,
    retryDelay: 1000,
  });

  const presenceDisconnectApi = useApi<WebRtcPresenceSessionDto>(baseUrl, {
    timeout: 20000,
    retries: 0,
    retryDelay: 1000,
  });

  const internalStateGetApi = useApi<WebRtcInternalStateDto>(baseUrl, {
    timeout: 20000,
    retries: 0,
    retryDelay: 1000,
  });

  const internalStateSetApi = useApi<WebRtcInternalStateDto>(baseUrl, {
    timeout: 20000,
    retries: 0,
    retryDelay: 1000,
  });

  const getVoiceToken = useCallback((): ApiResult<WebRtcVoiceTokenDto> => {
    return tokenApi.request({
      method: "GET",
      url: "/webrtc/token",
    });
  }, [tokenApi.request]);

  const createCall = useCallback(
    (payload: CreateWebRtcCallPayload): ApiResult<WebRtcCallDto> => {
      return createCallApi.request({
        method: "POST",
        url: "/webrtc/calls",
        data: payload,
      });
    },
    [createCallApi.request]
  );

  const listCalls = useCallback(
    (params: ListWebRtcCallsParams = {}): ApiResult<WebRtcCallDto[]> => {
      return listCallsApi.request({
        method: "GET",
        url: "/webrtc/calls",
        params,
      });
    },
    [listCallsApi.request]
  );

  const getCallById = useCallback(
    (id: number): ApiResult<WebRtcCallDto> => {
      return getCallByIdApi.request({
        method: "GET",
        url: `/webrtc/calls/${id}`,
      });
    },
    [getCallByIdApi.request]
  );

  const hangupCall = useCallback(
    (id: number): ApiResult<WebRtcCallDto> => {
      return hangupCallApi.request({
        method: "POST",
        url: `/webrtc/calls/${id}/hangup`,
      });
    },
    [hangupCallApi.request]
  );

  const connectPresence = useCallback(
    (payload: ConnectWebRtcPresencePayload = {}): ApiResult<WebRtcPresenceSessionDto> => {
      return presenceConnectApi.request({
        method: "POST",
        url: "/webrtc/presence/connect",
        data: payload,
      });
    },
    [presenceConnectApi.request]
  );

  const heartbeatPresence = useCallback(
    (payload: HeartbeatWebRtcPresencePayload = {}): ApiResult<WebRtcPresenceSessionDto> => {
      return presenceHeartbeatApi.request({
        method: "POST",
        url: "/webrtc/presence/heartbeat",
        data: payload,
      });
    },
    [presenceHeartbeatApi.request]
  );

  const setPresenceAvailability = useCallback(
    (payload: SetWebRtcPresenceAvailabilityPayload): ApiResult<WebRtcPresenceSessionDto> => {
      return presenceAvailabilityApi.request({
        method: "POST",
        url: "/webrtc/presence/availability",
        data: payload,
      });
    },
    [presenceAvailabilityApi.request]
  );

  const disconnectPresence = useCallback(
    (): ApiResult<WebRtcPresenceSessionDto> => {
      return presenceDisconnectApi.request({
        method: "POST",
        url: "/webrtc/presence/disconnect",
      });
    },
    [presenceDisconnectApi.request]
  );

  const getAdvisorInternalState = useCallback(
    (): ApiResult<WebRtcInternalStateDto> => {
      return internalStateGetApi.request({
        method: "GET",
        url: "/webrtc/presence/internal-state",
      });
    },
    [internalStateGetApi.request]
  );

  const setAdvisorInternalState = useCallback(
    (payload: SetAdvisorInternalStatePayload): ApiResult<WebRtcInternalStateDto> => {
      return internalStateSetApi.request({
        method: "POST",
        url: "/webrtc/presence/internal-state",
        data: payload,
      });
    },
    [internalStateSetApi.request]
  );

  return {
    loading:
      tokenApi.loading ||
      createCallApi.loading ||
      listCallsApi.loading ||
      getCallByIdApi.loading ||
      hangupCallApi.loading ||
      presenceConnectApi.loading ||
      presenceHeartbeatApi.loading ||
      presenceAvailabilityApi.loading ||
      presenceDisconnectApi.loading ||
      internalStateGetApi.loading ||
      internalStateSetApi.loading,
    error:
      tokenApi.error ||
      createCallApi.error ||
      listCallsApi.error ||
      getCallByIdApi.error ||
      hangupCallApi.error ||
      presenceConnectApi.error ||
      presenceHeartbeatApi.error ||
      presenceAvailabilityApi.error ||
      presenceDisconnectApi.error ||
      internalStateGetApi.error ||
      internalStateSetApi.error,
    getVoiceToken,
    createCall,
    listCalls,
    getCallById,
    hangupCall,
    connectPresence,
    heartbeatPresence,
    setPresenceAvailability,
    disconnectPresence,
    getAdvisorInternalState,
    setAdvisorInternalState,
  };
}
