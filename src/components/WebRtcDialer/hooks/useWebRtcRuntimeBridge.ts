import { useCallback, useEffect } from "react";
import type { AdvisorInternalState, WebRtcCallDto } from "@app/services/WebRtc/webrtcService";
import {
  emitGlobalWebRtcCallActivityChanged,
  emitGlobalWebRtcCallEnded,
  emitGlobalWebRtcCallStarted,
  emitGlobalWebRtcCallStatusChanged,
  registerGlobalWebRtcCallControlHandler,
  registerGlobalWebRtcAdvisorStateChangeHandler,
  registerGlobalWebRtcOutboundDialHandler,
  setGlobalWebRtcRuntimeSnapshot,
  type WebRtcAdvisorStateChangeResult,
  type WebRtcCallControlAction,
  type WebRtcCallControlResult,
  type WebRtcOutboundDialRequest,
  type WebRtcOutboundDialResult,
} from "@app/services/WebRtc/webrtcBridge";
import type {
  ConnectionStatus,
  GlobalWebRtcIncomingCallSnapshot,
} from "@app/services/WebRtc/runtimeContracts";

interface UseWebRtcRuntimeBridgeOptions {
  activeCall: WebRtcCallDto | null;
  advisorInternalState: AdvisorInternalState;
  advisorStateChangeHandler?: ((nextState: AdvisorInternalState) => Promise<WebRtcAdvisorStateChangeResult>) | null;
  callControlHandler?: ((action: WebRtcCallControlAction) => Promise<WebRtcCallControlResult>) | null;
  connectionStatus: ConnectionStatus;
  enableGlobalBridge: boolean;
  hasActiveCall: boolean;
  incomingCall: GlobalWebRtcIncomingCallSnapshot | null;
  onCallActivityChanged?: (inProgress: boolean) => void;
  onCallEnded?: (call: WebRtcCallDto | null) => void;
  onCallStarted?: (call: WebRtcCallDto) => void;
  onCallStatusChanged?: (call: WebRtcCallDto) => void;
  outboundDialHandler?: ((request: WebRtcOutboundDialRequest) => Promise<WebRtcOutboundDialResult>) | null;
  presenceStatus: "offline" | "online" | "busy" | "error";
  publishSnapshot?: boolean;
  runtimeIsMuted: boolean;
  softphoneStatus: "disabled" | "initializing" | "registered" | "error";
}

export function useWebRtcRuntimeBridge({
  activeCall,
  advisorInternalState,
  advisorStateChangeHandler = null,
  callControlHandler = null,
  connectionStatus,
  enableGlobalBridge,
  hasActiveCall,
  incomingCall,
  onCallActivityChanged,
  onCallEnded,
  onCallStarted,
  onCallStatusChanged,
  outboundDialHandler = null,
  presenceStatus,
  publishSnapshot = true,
  runtimeIsMuted,
  softphoneStatus,
}: UseWebRtcRuntimeBridgeOptions) {
  const notifyCallStatusChanged = useCallback(
    (call: WebRtcCallDto | null | undefined) => {
      if (!call) {
        return;
      }

      onCallStatusChanged?.(call);
      emitGlobalWebRtcCallStatusChanged(call);
    },
    [onCallStatusChanged]
  );

  const notifyCallStarted = useCallback(
    (call: WebRtcCallDto) => {
      onCallStarted?.(call);
      emitGlobalWebRtcCallStarted(call);
      notifyCallStatusChanged(call);
    },
    [notifyCallStatusChanged, onCallStarted]
  );

  const notifyCallEnded = useCallback(
    (call: WebRtcCallDto | null) => {
      onCallEnded?.(call);
      emitGlobalWebRtcCallEnded(call);
      notifyCallStatusChanged(call);
    },
    [notifyCallStatusChanged, onCallEnded]
  );

  useEffect(() => {
    if (!publishSnapshot) {
      return;
    }

    const inProgress =
      hasActiveCall
      || connectionStatus === "dialing"
      || connectionStatus === "in_call";

    onCallActivityChanged?.(inProgress);
    emitGlobalWebRtcCallActivityChanged(inProgress);
    setGlobalWebRtcRuntimeSnapshot({
      inProgress,
      connectionStatus,
      advisorInternalState,
      presenceStatus,
      softphoneStatus,
      isMuted: runtimeIsMuted,
      activeCall: activeCall ?? null,
      incomingCall: incomingCall ?? null,
    });
  }, [
    activeCall,
    advisorInternalState,
    connectionStatus,
    hasActiveCall,
    incomingCall,
    onCallActivityChanged,
    presenceStatus,
    publishSnapshot,
    runtimeIsMuted,
    softphoneStatus,
  ]);

  useEffect(() => {
    if (!enableGlobalBridge || !outboundDialHandler) {
      return;
    }

    registerGlobalWebRtcOutboundDialHandler(outboundDialHandler);
    return () => {
      registerGlobalWebRtcOutboundDialHandler(null);
    };
  }, [enableGlobalBridge, outboundDialHandler]);

  useEffect(() => {
    if (!enableGlobalBridge || !advisorStateChangeHandler) {
      return;
    }

    registerGlobalWebRtcAdvisorStateChangeHandler(advisorStateChangeHandler);
    return () => {
      registerGlobalWebRtcAdvisorStateChangeHandler(null);
    };
  }, [advisorStateChangeHandler, enableGlobalBridge]);

  useEffect(() => {
    if (!enableGlobalBridge || !callControlHandler) {
      return;
    }

    registerGlobalWebRtcCallControlHandler(callControlHandler);
    return () => {
      registerGlobalWebRtcCallControlHandler(null);
    };
  }, [callControlHandler, enableGlobalBridge]);

  return {
    notifyCallStatusChanged,
    notifyCallStarted,
    notifyCallEnded,
  };
}
