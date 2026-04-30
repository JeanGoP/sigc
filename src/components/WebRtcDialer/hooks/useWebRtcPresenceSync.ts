import { useCallback, useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Call } from "@twilio/voice-sdk";
import type { ApiResponse } from "@app/models/apiResponse";
import {
  AdvisorInternalStateOrder,
  mapAdvisorInternalStateToCommsAvailability,
} from "@app/services/GestionLlamadas";
import {
  buildWebRtcUiError,
  logWebRtcInfo,
  logWebRtcWarn,
  type WebRtcUiError,
} from "@app/services/WebRtc/webrtcLogger";
import type {
  AdvisorInternalState,
  ConnectWebRtcPresencePayload,
  HeartbeatWebRtcPresencePayload,
  SetAdvisorInternalStatePayload,
  SetWebRtcPresenceAvailabilityPayload,
  WebRtcInternalStateDto,
  WebRtcPresenceSessionDto,
} from "@app/services/WebRtc/webrtcService";
import type { WebRtcDialerContext } from "@app/services/WebRtc/runtimeHelpers";
import type { ConnectionStatus, PresenceAvailability } from "@app/services/WebRtc/runtimeContracts";

type PresenceResponse = Promise<ApiResponse<WebRtcPresenceSessionDto> | null>;
type InternalStateResponse = Promise<ApiResponse<WebRtcInternalStateDto> | null>;

interface UseWebRtcPresenceSyncOptions {
  activeCallSid?: string | null;
  advisorInternalState: AdvisorInternalState;
  connectionStatus: ConnectionStatus;
  contextSnapshot: WebRtcDialerContext;
  disconnectPresence: () => PresenceResponse;
  getAdvisorInternalState: () => InternalStateResponse;
  hasActiveCall: boolean;
  heartbeatPresence: (payload: HeartbeatWebRtcPresencePayload) => PresenceResponse;
  incomingCallRef: MutableRefObject<Call | null>;
  isCompanionTab: boolean;
  notifyOwnerOnlyBlocked: (action: string) => void;
  onError?: (error: WebRtcUiError) => void;
  presenceConnectedRef: MutableRefObject<boolean>;
  presenceSessionRef: MutableRefObject<string>;
  runtimeSessionRef?: string | null;
  runtimeTabId?: string | null;
  setAdvisorInternalStateRequest: (
    payload: SetAdvisorInternalStatePayload
  ) => InternalStateResponse;
  setAdvisorInternalStateValue: Dispatch<SetStateAction<AdvisorInternalState>>;
  setAdvisorStateChangedAt: Dispatch<SetStateAction<string>>;
  setLastError: Dispatch<SetStateAction<WebRtcUiError | null>>;
  setPresenceAvailabilityRequest: (
    payload: SetWebRtcPresenceAvailabilityPayload
  ) => PresenceResponse;
  setPresenceStatus: Dispatch<
    SetStateAction<"offline" | "online" | "busy" | "error">
  >;
  setSoftphoneStatus: Dispatch<
    SetStateAction<"disabled" | "initializing" | "registered" | "error">
  >;
  softphoneEnabled: boolean;
  softphoneStatus: "disabled" | "initializing" | "registered" | "error";
  twilioCallRef: MutableRefObject<Call | null>;
  connectPresence: (payload: ConnectWebRtcPresencePayload) => PresenceResponse;
}

export function useWebRtcPresenceSync({
  activeCallSid = null,
  advisorInternalState,
  connectionStatus,
  contextSnapshot,
  disconnectPresence,
  getAdvisorInternalState,
  hasActiveCall,
  heartbeatPresence,
  incomingCallRef,
  isCompanionTab,
  notifyOwnerOnlyBlocked,
  onError,
  presenceConnectedRef,
  presenceSessionRef,
  runtimeSessionRef,
  runtimeTabId,
  setAdvisorInternalStateRequest,
  setAdvisorInternalStateValue,
  setAdvisorStateChangedAt,
  setLastError,
  setPresenceAvailabilityRequest,
  setPresenceStatus,
  setSoftphoneStatus,
  softphoneEnabled,
  softphoneStatus,
  twilioCallRef,
  connectPresence,
}: UseWebRtcPresenceSyncOptions) {
  const syncPresenceConnect = useCallback(
    async (isAvailable: boolean, currentCallSid?: string | null): Promise<boolean> => {
      if (!softphoneEnabled) {
        return true;
      }

      if (isCompanionTab) {
        return false;
      }

      const payload: ConnectWebRtcPresencePayload = {
        sessionRef: presenceSessionRef.current,
        ttlSeconds: 60,
        isAvailable,
        currentCallSid: currentCallSid ?? undefined,
      };

      const response = await connectPresence(payload);
      if (response?.success && response.data) {
        presenceConnectedRef.current = true;
        setPresenceStatus(isAvailable ? "online" : "busy");
        logWebRtcInfo("presence_connect", {
          context: contextSnapshot,
          availability: response.data.availability,
          sessionRef: response.data.sessionRef ?? payload.sessionRef,
          expiresAtUtc: response.data.expiresAtUtc ?? null,
        });
        return true;
      }

      presenceConnectedRef.current = false;
      setPresenceStatus("error");
      const error = buildWebRtcUiError(
        response,
        "No fue posible registrar presencia del agente."
      );
      logWebRtcWarn("presence_connect_failed", {
        context: contextSnapshot,
        error,
      });
      return false;
    },
    [
      connectPresence,
      contextSnapshot,
      isCompanionTab,
      presenceConnectedRef,
      presenceSessionRef,
      setPresenceStatus,
      softphoneEnabled,
    ]
  );

  const syncPresenceHeartbeat = useCallback(
    async (isAvailable: boolean): Promise<void> => {
      if (!softphoneEnabled || isCompanionTab || !presenceConnectedRef.current) {
        return;
      }

      const payload: HeartbeatWebRtcPresencePayload = {
        sessionRef: presenceSessionRef.current,
        ttlSeconds: 60,
        isAvailable,
      };

      const response = await heartbeatPresence(payload);
      if (response?.success) {
        return;
      }

      const error = buildWebRtcUiError(
        response,
        "No fue posible refrescar heartbeat de presencia."
      );
      logWebRtcWarn("presence_heartbeat_failed", {
        context: contextSnapshot,
        error,
      });
    },
    [
      contextSnapshot,
      heartbeatPresence,
      isCompanionTab,
      presenceConnectedRef,
      presenceSessionRef,
      softphoneEnabled,
    ]
  );

  const syncPresenceAvailability = useCallback(
    async (
      availability: PresenceAvailability,
      currentCallSid?: string | null
    ): Promise<void> => {
      if (!softphoneEnabled || isCompanionTab || !presenceConnectedRef.current) {
        return;
      }

      const payload: SetWebRtcPresenceAvailabilityPayload = {
        availability,
        currentCallSid: currentCallSid ?? undefined,
        ttlSeconds: availability === "offline" ? undefined : 60,
      };

      const response = await setPresenceAvailabilityRequest(payload);
      if (response?.success && response.data) {
        setPresenceStatus(
          availability === "available"
            ? "online"
            : availability === "busy"
              ? "busy"
              : "offline"
        );
        return;
      }

      const error = buildWebRtcUiError(
        response,
        "No fue posible actualizar disponibilidad del agente."
      );
      logWebRtcWarn("presence_availability_failed", {
        context: contextSnapshot,
        availability,
        error,
      });
    },
    [
      contextSnapshot,
      isCompanionTab,
      presenceConnectedRef,
      setPresenceAvailabilityRequest,
      setPresenceStatus,
      softphoneEnabled,
    ]
  );

  const syncPresenceDisconnect = useCallback(
    async (reason: string): Promise<void> => {
      if (!softphoneEnabled || isCompanionTab || !presenceConnectedRef.current) {
        return;
      }

      const response = await disconnectPresence();
      if (response?.success) {
        presenceConnectedRef.current = false;
        setPresenceStatus("offline");
        logWebRtcInfo("presence_disconnected", {
          context: contextSnapshot,
          reason,
        });
        return;
      }

      const error = buildWebRtcUiError(
        response,
        "No fue posible desconectar presencia."
      );
      logWebRtcWarn("presence_disconnect_failed", {
        context: contextSnapshot,
        reason,
        error,
      });
    },
    [
      contextSnapshot,
      disconnectPresence,
      isCompanionTab,
      presenceConnectedRef,
      setPresenceStatus,
      softphoneEnabled,
    ]
  );

  const syncAdvisorInternalState = useCallback(
    async (
      nextState: AdvisorInternalState,
      reason: string,
      currentCallSid?: string | null,
      source = "webrtc_dialer"
    ): Promise<boolean> => {
      if (!softphoneEnabled || isCompanionTab) {
        return false;
      }

      const response = await setAdvisorInternalStateRequest({
        internalState: nextState,
        reason,
        source,
        sessionRef: runtimeSessionRef ?? undefined,
        tabId: runtimeTabId ?? undefined,
        currentCallSid: currentCallSid ?? undefined,
        ttlSeconds: 60,
      });

      if (response?.success && response.data) {
        const normalizedState = String(response.data.internalState ?? nextState)
          .trim()
          .toLowerCase() as AdvisorInternalState;
        const resolvedState = AdvisorInternalStateOrder.includes(normalizedState)
          ? normalizedState
          : nextState;
        const availability = String(response.data.presenceAvailability ?? "")
          .trim()
          .toLowerCase();

        setAdvisorInternalStateValue(resolvedState);
        setAdvisorStateChangedAt(
          response.data.changedAtUtc ?? new Date().toISOString()
        );
        setPresenceStatus(availability === "available" ? "online" : "busy");

        logWebRtcInfo("advisor_internal_state_synced", {
          context: contextSnapshot,
          internalState: resolvedState,
          presenceAvailability:
            availability || mapAdvisorInternalStateToCommsAvailability(resolvedState),
          changedAtUtc: response.data.changedAtUtc ?? null,
          outcomeCode: response.data.outcomeCode ?? null,
        });
        return true;
      }

      const error = buildWebRtcUiError(
        response,
        "No fue posible actualizar el estado interno del asesor."
      );
      setLastError(error);
      onError?.(error);
      logWebRtcWarn("advisor_internal_state_sync_failed", {
        context: contextSnapshot,
        internalState: nextState,
        reason,
        error,
      });
      return false;
    },
    [
      contextSnapshot,
      isCompanionTab,
      onError,
      runtimeSessionRef,
      runtimeTabId,
      setAdvisorInternalStateRequest,
      setAdvisorInternalStateValue,
      setAdvisorStateChangedAt,
      setLastError,
      setPresenceStatus,
      softphoneEnabled,
    ]
  );

  const hydrateAdvisorInternalState = useCallback(async () => {
    if (!softphoneEnabled || isCompanionTab) {
      return;
    }

    const response = await getAdvisorInternalState();
    if (!response?.success || !response.data) {
      return;
    }

    const normalizedState = String(response.data.internalState ?? "disponible")
      .trim()
      .toLowerCase() as AdvisorInternalState;
    const resolvedState = AdvisorInternalStateOrder.includes(normalizedState)
      ? normalizedState
      : "disponible";
    const availability = String(response.data.presenceAvailability ?? "")
      .trim()
      .toLowerCase();

    setAdvisorInternalStateValue(resolvedState);
    setAdvisorStateChangedAt(response.data.changedAtUtc ?? "");
    setPresenceStatus(availability === "available" ? "online" : "busy");
  }, [
    getAdvisorInternalState,
    isCompanionTab,
    setAdvisorInternalStateValue,
    setAdvisorStateChangedAt,
    setPresenceStatus,
    softphoneEnabled,
  ]);

  const applyAdvisorStateChange = useCallback(
    async (nextState: AdvisorInternalState) => {
      if (!AdvisorInternalStateOrder.includes(nextState)) {
        return {
          ok: false,
          message: "Estado interno no valido.",
        };
      }

      if (isCompanionTab) {
        notifyOwnerOnlyBlocked("set_internal_state");
        return {
          ok: false,
          message: "Solo la pestana duena puede cambiar el estado del asesor.",
        };
      }

      if (nextState === advisorInternalState) {
        return { ok: true };
      }

      if (hasActiveCall || connectionStatus === "dialing" || connectionStatus === "in_call") {
        const warning: WebRtcUiError = {
          message: "No puedes cambiar el estado interno mientras hay una llamada en curso.",
          statusCode: 409,
          code: "WEBRTC_STATE_CHANGE_BLOCKED",
          type: "Validation",
          errors: ["state_change=blocked", "call_in_progress=true"],
        };

        setLastError(warning);
        onError?.(warning);
        return {
          ok: false,
          error: warning,
        };
      }

      const synced = await syncAdvisorInternalState(
        nextState,
        "manual_status_change",
        activeCallSid ?? null,
        "manual_status_change"
      );

      if (!synced) {
        return {
          ok: false,
          message: "No fue posible cambiar el estado del asesor.",
        };
      }

      return { ok: true };
    },
    [
      activeCallSid,
      advisorInternalState,
      connectionStatus,
      hasActiveCall,
      isCompanionTab,
      notifyOwnerOnlyBlocked,
      onError,
      setLastError,
      syncAdvisorInternalState,
    ]
  );

  useEffect(() => {
    if (!softphoneEnabled) {
      return;
    }

    if (isCompanionTab) {
      setPresenceStatus("offline");
      setSoftphoneStatus("disabled");
      return;
    }

    if (softphoneStatus === "disabled") {
      setSoftphoneStatus("initializing");
    }

    void hydrateAdvisorInternalState();
  }, [
    hydrateAdvisorInternalState,
    isCompanionTab,
    setPresenceStatus,
    setSoftphoneStatus,
    softphoneEnabled,
    softphoneStatus,
  ]);

  useEffect(() => {
    if (!softphoneEnabled || !presenceConnectedRef.current) {
      return;
    }

    if (
      connectionStatus === "disconnected"
      || connectionStatus === "connecting"
      || connectionStatus === "error"
    ) {
      return;
    }

    const send = () => {
      const isAvailable =
        connectionStatus === "connected"
        && advisorInternalState === "disponible"
        && !Boolean(twilioCallRef.current)
        && !Boolean(incomingCallRef.current);
      void syncPresenceHeartbeat(isAvailable);
    };

    send();
    const interval = window.setInterval(send, 20000);
    return () => window.clearInterval(interval);
  }, [
    advisorInternalState,
    connectionStatus,
    incomingCallRef,
    presenceConnectedRef,
    softphoneEnabled,
    syncPresenceHeartbeat,
    twilioCallRef,
  ]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!presenceConnectedRef.current) {
        return;
      }

      void disconnectPresence();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [disconnectPresence, presenceConnectedRef]);

  return {
    applyAdvisorStateChange,
    hydrateAdvisorInternalState,
    syncAdvisorInternalState,
    syncPresenceAvailability,
    syncPresenceConnect,
    syncPresenceDisconnect,
    syncPresenceHeartbeat,
  };
}
