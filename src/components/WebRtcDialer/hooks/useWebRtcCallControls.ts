import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { Call, Device } from "@twilio/voice-sdk";
import type { ApiResponse } from "@app/models/apiResponse";
import {
  buildWebRtcUiError,
  logWebRtcError,
  logWebRtcInfo,
  logWebRtcSuccess,
  logWebRtcWarn,
  type WebRtcUiError,
} from "@app/services/WebRtc/webrtcLogger";
import {
  createWebRtcDialIdempotencyKey,
  mapCallStatusToConnectionStatus,
  normalizeDialInput,
  normalizePhoneByCountry,
  toWebRtcUiErrorFromTwilio,
  type CountryDialOption,
  type PhoneNormalizationResult,
  type WebRtcDialerContext,
} from "@app/services/WebRtc/runtimeHelpers";
import type {
  ConnectionStatus,
  GlobalWebRtcIncomingCallSnapshot,
  PresenceAvailability,
} from "@app/services/WebRtc/runtimeContracts";
import type {
  AdvisorInternalState,
  CreateWebRtcCallPayload,
  WebRtcCallDto,
} from "@app/services/WebRtc/webrtcService";
import type {
  WebRtcCallControlAction,
  WebRtcCallControlResult,
  WebRtcOutboundDialRequest,
  WebRtcOutboundDialResult,
} from "@app/services/WebRtc/webrtcBridge";

type CallResponse = Promise<ApiResponse<WebRtcCallDto> | null>;

interface UseWebRtcCallControlsOptions {
  activeCall: WebRtcCallDto | null;
  bindRuntimeCall: (callSid?: string | null) => void;
  callSystemTenantIdRef: MutableRefObject<string | null>;
  connectAgent: () => Promise<boolean>;
  connectionStatusRef: MutableRefObject<ConnectionStatus>;
  contextSnapshot: WebRtcDialerContext;
  createCall: (payload: CreateWebRtcCallPayload) => CallResponse;
  defaultDirection: string;
  destination: string;
  fromNumber: string;
  hangupCall: (callId: number) => CallResponse;
  incomingCall: GlobalWebRtcIncomingCallSnapshot | null;
  incomingCallRef: MutableRefObject<Call | null>;
  isCompanionTab: boolean;
  isMuted: boolean;
  notifyCallEnded: (call: WebRtcCallDto | null) => void;
  notifyCallStarted: (call: WebRtcCallDto) => void;
  notifyCallStatusChanged: (call: WebRtcCallDto | null | undefined) => void;
  notifyOwnerOnlyBlocked: (action: string) => void;
  onError?: (error: WebRtcUiError) => void;
  refreshRecentCalls: (reason: string) => Promise<void>;
  runtimeSessionRef?: string | null;
  selectedCountry: CountryDialOption;
  setActiveCall: Dispatch<SetStateAction<WebRtcCallDto | null>>;
  setConnectionStatus: Dispatch<SetStateAction<ConnectionStatus>>;
  setDestination: Dispatch<SetStateAction<string>>;
  setFromNumber: Dispatch<SetStateAction<string>>;
  setIsMuted: Dispatch<SetStateAction<boolean>>;
  setLastDialedNumber: Dispatch<SetStateAction<string>>;
  setLastError: Dispatch<SetStateAction<WebRtcUiError | null>>;
  softphoneEnabled: boolean;
  softphoneStatusRef: MutableRefObject<
    "disabled" | "initializing" | "registered" | "error"
  >;
  syncAdvisorInternalState: (
    nextState: AdvisorInternalState,
    reason: string,
    currentCallSid?: string | null,
    source?: string
  ) => Promise<boolean>;
  syncPresenceAvailability: (
    availability: PresenceAvailability,
    currentCallSid?: string | null
  ) => Promise<void>;
  twilioCallRef: MutableRefObject<Call | null>;
  twilioDeviceRef: MutableRefObject<Device | null>;
}

function buildSoftphoneCallDto(
  call: Call,
  to: string,
  from?: string | null
): WebRtcCallDto {
  const callSid = call.parameters?.CallSid ?? call.outboundConnectionId ?? "";
  return {
    id: 0,
    callSid,
    direction: "outbound-client",
    from: from ?? null,
    to,
    status: "dialing",
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationSec: null,
    recordingSid: null,
    costEstimated: null,
    costFinal: null,
    currency: null,
    provider: "Twilio",
  };
}

export function useWebRtcCallControls({
  activeCall,
  bindRuntimeCall,
  callSystemTenantIdRef,
  connectAgent,
  connectionStatusRef,
  contextSnapshot,
  createCall,
  defaultDirection,
  destination,
  fromNumber,
  hangupCall,
  incomingCall,
  incomingCallRef,
  isCompanionTab,
  isMuted,
  notifyCallEnded,
  notifyCallStarted,
  notifyCallStatusChanged,
  notifyOwnerOnlyBlocked,
  onError,
  refreshRecentCalls,
  runtimeSessionRef,
  selectedCountry,
  setActiveCall,
  setConnectionStatus,
  setDestination,
  setFromNumber,
  setIsMuted,
  setLastDialedNumber,
  setLastError,
  softphoneEnabled,
  softphoneStatusRef,
  syncAdvisorInternalState,
  syncPresenceAvailability,
  twilioCallRef,
  twilioDeviceRef,
}: UseWebRtcCallControlsOptions) {
  const dial = useCallback(
    async (
      targetNumber: string,
      source: "manual" | "retry" | "external",
      fromOverride?: string | null
    ): Promise<WebRtcOutboundDialResult> => {
      if (isCompanionTab) {
        notifyOwnerOnlyBlocked("dial");
        return {
          ok: false,
          message: "Esta pestana esta en modo acompanante. Usa la pestana duena del softphone.",
        };
      }

      const normalizedToResult = normalizePhoneByCountry(
        targetNumber,
        "destino",
        selectedCountry
      );
      let activeDevice = twilioDeviceRef.current;
      let callSystemTenantId = callSystemTenantIdRef.current;
      let currentConnectionStatus = connectionStatusRef.current;
      let currentSoftphoneStatus = softphoneStatusRef.current;
      const hasReadySoftphone = Boolean(
        softphoneEnabled
        && activeDevice
        && callSystemTenantId
        && currentSoftphoneStatus === "registered"
      );
      let useSoftphonePath = Boolean(
        softphoneEnabled
        && activeDevice
        && callSystemTenantId
      );
      const shouldEnsureSoftphoneReady = softphoneEnabled && !hasReadySoftphone;

      if (
        (!softphoneEnabled && currentConnectionStatus !== "connected")
        || shouldEnsureSoftphoneReady
      ) {
        logWebRtcInfo("call_auto_connect_start", {
          source,
          context: contextSnapshot,
          currentStatus: currentConnectionStatus,
          shouldEnsureSoftphoneReady,
        });

        const connected = await connectAgent();
        if (!connected) {
          logWebRtcWarn("call_auto_connect_failed", {
            source,
            context: contextSnapshot,
            shouldEnsureSoftphoneReady,
          });
          return {
            ok: false,
            message: "No fue posible conectar el softphone para iniciar la llamada.",
          };
        }

        activeDevice = twilioDeviceRef.current;
        callSystemTenantId = callSystemTenantIdRef.current;
        currentConnectionStatus = connectionStatusRef.current;
        currentSoftphoneStatus = softphoneStatusRef.current;
        useSoftphonePath = Boolean(
          softphoneEnabled
          && activeDevice
          && callSystemTenantId
        );
      }

      if (!normalizedToResult.ok) {
        const error: WebRtcUiError = {
          message: normalizedToResult.message,
          code: "WebRtc.Validation.ToInvalid",
          type: "Validation",
          statusCode: 400,
          errors: [],
        };
        setLastError(error);
        onError?.(error);
        logWebRtcWarn("call_validation_to", {
          source,
          to: normalizeDialInput(targetNumber),
          context: contextSnapshot,
        });
        return {
          ok: false,
          error,
        };
      }

      const effectiveFromInput = String(
        fromOverride != null
          ? fromOverride
          : source === "external"
            ? ""
            : fromNumber
      ).trim();
      const normalizedFromResult: PhoneNormalizationResult = !effectiveFromInput
        ? { ok: true, value: "" }
        : normalizePhoneByCountry(
            effectiveFromInput,
            "origen",
            selectedCountry,
            false
          );

      if (!normalizedFromResult.ok) {
        const error: WebRtcUiError = {
          message: normalizedFromResult.message,
          code: useSoftphonePath
            ? "WebRtc.Validation.FromInvalidSoftphone"
            : "WebRtc.Validation.FromInvalid",
          type: "Validation",
          statusCode: 400,
          errors: [],
        };
        setLastError(error);
        onError?.(error);
        logWebRtcWarn(
          useSoftphonePath
            ? "call_validation_from_softphone"
            : "call_validation_from",
          {
            source,
            from: normalizeDialInput(effectiveFromInput ?? ""),
            context: contextSnapshot,
          }
        );
        return {
          ok: false,
          error,
        };
      }

      const normalizedTo = normalizedToResult.value;
      const normalizedFrom = normalizedFromResult.value;

      setConnectionStatus("dialing");
      setLastError(null);

      logWebRtcInfo("call_start", {
        source,
        mode: useSoftphonePath ? "softphone" : "backend",
        to: normalizedTo,
        from: normalizedFrom || null,
        context: contextSnapshot,
      });

      if (softphoneEnabled && !useSoftphonePath) {
        logWebRtcWarn("call_softphone_fallback_backend", {
          source,
          hasDevice: Boolean(activeDevice),
          hasTenantId: Boolean(callSystemTenantId),
          softphoneStatus: currentSoftphoneStatus,
          context: contextSnapshot,
        });
      }

      if (useSoftphonePath && activeDevice) {
        const twimlParams: Record<string, string> = {
          to: normalizedTo,
          tenantId: callSystemTenantId!,
        };

        if (normalizedFrom) {
          twimlParams.callerId = normalizedFrom;
        }

        try {
          const browserCall = await activeDevice.connect({ params: twimlParams });
          twilioCallRef.current = browserCall;
          setIsMuted(false);

          const provisionalCall = buildSoftphoneCallDto(
            browserCall,
            normalizedTo,
            normalizedFrom || null
          );
          bindRuntimeCall(provisionalCall.callSid);
          setActiveCall(provisionalCall);
          setLastError(null);
          setConnectionStatus("dialing");
          void syncPresenceAvailability("busy", provisionalCall.callSid || null);
          notifyCallStarted(provisionalCall);
          void syncAdvisorInternalState(
            "ocupado_llamada",
            "outbound_dialing",
            provisionalCall.callSid || null,
            "softphone_outbound_start"
          );

          logWebRtcSuccess("call_create_softphone", {
            source,
            callSid: provisionalCall.callSid || null,
            params: twimlParams,
            context: contextSnapshot,
          });

          browserCall.on("accept", (acceptedCall: Call) => {
            const acceptedCallSid =
              acceptedCall.parameters?.CallSid ?? provisionalCall.callSid ?? "";
            bindRuntimeCall(acceptedCallSid);
            const acceptedCallState: WebRtcCallDto = {
              ...provisionalCall,
              callSid: acceptedCallSid,
              status: "in-progress",
              startedAt: provisionalCall.startedAt,
            };
            setConnectionStatus("in_call");
            setActiveCall((previous) => ({
              ...(previous ?? provisionalCall),
              callSid: acceptedCallSid,
              status: "in-progress",
              startedAt: previous?.startedAt ?? provisionalCall.startedAt,
            }));
            notifyCallStatusChanged(acceptedCallState);
            void syncPresenceAvailability("busy", acceptedCallSid || null);
            void syncAdvisorInternalState(
              "ocupado_llamada",
              "outbound_call_accepted",
              acceptedCallSid || null,
              "softphone_outbound_accept"
            );
            logWebRtcInfo("call_softphone_accept", {
              callSid: acceptedCallSid,
              context: contextSnapshot,
            });
          });

          browserCall.on("ringing", () => {
            const ringingCallState: WebRtcCallDto = {
              ...provisionalCall,
              callSid: browserCall.parameters?.CallSid ?? provisionalCall.callSid,
              status: "ringing",
            };
            bindRuntimeCall(ringingCallState.callSid);
            setActiveCall((previous) => ({
              ...(previous ?? provisionalCall),
              status: "ringing",
            }));
            notifyCallStatusChanged(ringingCallState);
            logWebRtcInfo("call_softphone_ringing", {
              callSid:
                browserCall.parameters?.CallSid ?? provisionalCall.callSid ?? null,
              context: contextSnapshot,
            });
          });

          browserCall.on("audio", (remoteAudio: HTMLAudioElement) => {
            logWebRtcInfo("call_softphone_audio_ready", {
              callSid:
                browserCall.parameters?.CallSid ?? provisionalCall.callSid ?? null,
              hasRemoteAudio: Boolean(remoteAudio),
              context: contextSnapshot,
            });
          });

          browserCall.on("disconnect", (disconnectedCall: Call) => {
            twilioCallRef.current = null;
            const endedCall: WebRtcCallDto = {
              ...provisionalCall,
              callSid:
                disconnectedCall.parameters?.CallSid ?? provisionalCall.callSid,
              status: "completed",
              endedAt: new Date().toISOString(),
            };

            bindRuntimeCall(endedCall.callSid);
            setActiveCall(endedCall);
            setConnectionStatus("connected");
            notifyCallEnded(endedCall);
            void syncPresenceAvailability("available");
            void syncAdvisorInternalState(
              "disponible",
              "outbound_call_disconnected",
              endedCall.callSid || null,
              "softphone_outbound_disconnect"
            );

            logWebRtcSuccess("call_softphone_disconnect", {
              callSid: endedCall.callSid || null,
              status: endedCall.status,
              context: contextSnapshot,
            });

            void refreshRecentCalls("after-softphone-disconnect");
          });

          browserCall.on("cancel", () => {
            twilioCallRef.current = null;
            const canceledCall: WebRtcCallDto = {
              ...provisionalCall,
              callSid:
                browserCall.parameters?.CallSid ?? provisionalCall.callSid,
              status: "canceled",
              endedAt: new Date().toISOString(),
            };

            bindRuntimeCall(canceledCall.callSid);
            setActiveCall(canceledCall);
            setConnectionStatus("connected");
            notifyCallEnded(canceledCall);
            void syncPresenceAvailability("available");
            void syncAdvisorInternalState(
              "disponible",
              "outbound_call_canceled",
              canceledCall.callSid || null,
              "softphone_outbound_cancel"
            );

            logWebRtcWarn("call_softphone_canceled", {
              callSid: canceledCall.callSid || null,
              context: contextSnapshot,
            });
            void refreshRecentCalls("after-softphone-cancel");
          });

          browserCall.on("reject", () => {
            twilioCallRef.current = null;
            const rejectedCall: WebRtcCallDto = {
              ...provisionalCall,
              callSid:
                browserCall.parameters?.CallSid ?? provisionalCall.callSid,
              status: "rejected",
              endedAt: new Date().toISOString(),
            };

            bindRuntimeCall(rejectedCall.callSid);
            setActiveCall(rejectedCall);
            setConnectionStatus("connected");
            notifyCallEnded(rejectedCall);
            void syncPresenceAvailability("available");
            void syncAdvisorInternalState(
              "disponible",
              "outbound_call_rejected",
              rejectedCall.callSid || null,
              "softphone_outbound_reject"
            );

            logWebRtcWarn("call_softphone_rejected", {
              callSid: rejectedCall.callSid || null,
              context: contextSnapshot,
            });
            void refreshRecentCalls("after-softphone-reject");
          });

          browserCall.on("error", (twilioError: unknown) => {
            const uiError = toWebRtcUiErrorFromTwilio(
              "Error en llamada WebRTC del navegador.",
              twilioError
            );
            twilioCallRef.current = null;
            setConnectionStatus("connected");
            setLastError(uiError);
            onError?.(uiError);
            void syncPresenceAvailability("available");
            void syncAdvisorInternalState(
              "disponible",
              "outbound_call_error",
              browserCall.parameters?.CallSid ?? provisionalCall.callSid ?? null,
              "softphone_outbound_error"
            );
            logWebRtcError("call_softphone", uiError, {
              callSid:
                browserCall.parameters?.CallSid ?? provisionalCall.callSid ?? null,
              context: contextSnapshot,
            });
            void refreshRecentCalls("after-softphone-error");
          });

          setLastDialedNumber(normalizedTo);
          setDestination(normalizedTo);
          if (fromOverride != null) {
            setFromNumber(normalizedFrom);
          }
          void refreshRecentCalls("after-softphone-call-create");
          return {
            ok: true,
          };
        } catch (softphoneError) {
          const error = toWebRtcUiErrorFromTwilio(
            "No fue posible iniciar la llamada desde el navegador.",
            softphoneError
          );
          setConnectionStatus("connected");
          setLastError(error);
          onError?.(error);
          logWebRtcError("call_create_softphone", error, {
            source,
            to: normalizedTo,
            from: normalizedFrom || null,
            tenantId: callSystemTenantId,
            context: contextSnapshot,
          });
          return {
            ok: false,
            error,
          };
        }
      }

      const payload: CreateWebRtcCallPayload = {
        to: normalizedTo,
        direction: defaultDirection,
        idempotencyKey: createWebRtcDialIdempotencyKey(),
        sessionRef: runtimeSessionRef ?? undefined,
      };
      if (normalizedFrom) {
        payload.from = normalizedFrom;
      }

      const response = await createCall(payload);
      if (response?.success && response.data) {
        const call = response.data;
        const nextConnectionStatus = mapCallStatusToConnectionStatus(call.status);
        bindRuntimeCall(call.callSid);
        setActiveCall(call);
        setLastDialedNumber(normalizedTo);
        setDestination(normalizedTo);
        setConnectionStatus(nextConnectionStatus);
        setLastError(null);

        notifyCallStarted(call);
        void syncAdvisorInternalState(
          nextConnectionStatus === "connected"
            ? "disponible"
            : "ocupado_llamada",
          nextConnectionStatus === "connected"
            ? "backend_call_ended"
            : nextConnectionStatus === "in_call"
              ? "backend_call_in_progress"
              : "backend_call_dialing",
          call.callSid ?? null,
          "backend_call_create"
        );
        logWebRtcSuccess("call_create", {
          source,
          callId: call.id,
          callSid: call.callSid,
          status: call.status,
          to: call.to ?? normalizedTo,
          from: call.from ?? normalizedFrom,
          context: contextSnapshot,
        });

        void refreshRecentCalls("after-call-create");
        if (fromOverride != null) {
          setFromNumber(normalizedFrom);
        }
        return {
          ok: true,
        };
      }

      const error = buildWebRtcUiError(
        response,
        "No fue posible crear la llamada."
      );
      setConnectionStatus("connected");
      setLastError(error);
      onError?.(error);
      logWebRtcError("call_create", error, {
        source,
        payload,
        context: contextSnapshot,
      });
      return {
        ok: false,
        error,
      };
    },
    [
      bindRuntimeCall,
      callSystemTenantIdRef,
      connectAgent,
      connectionStatusRef,
      contextSnapshot,
      createCall,
      defaultDirection,
      fromNumber,
      isCompanionTab,
      notifyCallEnded,
      notifyCallStarted,
      notifyCallStatusChanged,
      notifyOwnerOnlyBlocked,
      onError,
      refreshRecentCalls,
      runtimeSessionRef,
      selectedCountry,
      setActiveCall,
      setConnectionStatus,
      setDestination,
      setFromNumber,
      setIsMuted,
      setLastDialedNumber,
      setLastError,
      softphoneEnabled,
      softphoneStatusRef,
      syncAdvisorInternalState,
      syncPresenceAvailability,
      twilioCallRef,
      twilioDeviceRef,
    ]
  );

  const handleHangup = useCallback(async () => {
    if (isCompanionTab) {
      notifyOwnerOnlyBlocked("hangup");
      return;
    }

    const browserCall = twilioCallRef.current;
    if (softphoneEnabled && browserCall) {
      logWebRtcInfo("call_hangup_start", {
        mode: "softphone",
        callSid: browserCall.parameters?.CallSid ?? activeCall?.callSid ?? null,
        context: contextSnapshot,
      });

      try {
        browserCall.disconnect();
        twilioCallRef.current = null;
        setConnectionStatus("connected");

        const endedCall: WebRtcCallDto = {
          ...(activeCall ?? buildSoftphoneCallDto(browserCall, destination, fromNumber || null)),
          callSid: browserCall.parameters?.CallSid ?? activeCall?.callSid ?? "",
          status: "completed",
          endedAt: new Date().toISOString(),
        };

        setActiveCall(endedCall);
        notifyCallEnded(endedCall);
        void syncPresenceAvailability("available");
        void syncAdvisorInternalState(
          "disponible",
          "hangup_softphone",
          endedCall.callSid || null,
          "softphone_hangup"
        );

        logWebRtcSuccess("call_hangup", {
          mode: "softphone",
          callSid: endedCall.callSid || null,
          status: endedCall.status,
          context: contextSnapshot,
        });

        await refreshRecentCalls("after-softphone-hangup");
        return;
      } catch (softphoneError) {
        const error = toWebRtcUiErrorFromTwilio(
          "No fue posible finalizar la llamada WebRTC del navegador.",
          softphoneError
        );
        setLastError(error);
        setConnectionStatus("in_call");
        onError?.(error);
        logWebRtcError("call_hangup_softphone", error, {
          context: contextSnapshot,
          callSid: browserCall.parameters?.CallSid ?? activeCall?.callSid ?? null,
        });
        await refreshRecentCalls("hangup-softphone-error");
        return;
      }
    }

    if (!activeCall || !activeCall.id) {
      const warning: WebRtcUiError = {
        message: "No hay una llamada activa para colgar.",
        code: "WebRtc.Hangup.NoActiveCall",
        type: "Validation",
        statusCode: 400,
        errors: [],
      };

      setLastError(warning);
      onError?.(warning);
      logWebRtcWarn("call_hangup_validation", {
        activeCallId: activeCall?.id ?? null,
        activeCallSid: activeCall?.callSid ?? null,
        activeCallStatus: activeCall?.status ?? null,
        context: contextSnapshot,
      });
      return;
    }

    setLastError(null);
    logWebRtcInfo("call_hangup_start", {
      callId: activeCall.id,
      callSid: activeCall.callSid,
      status: activeCall.status,
      context: contextSnapshot,
    });

    const response = await hangupCall(activeCall.id);
    if (response?.success && response.data) {
      setActiveCall(response.data);
      setConnectionStatus("connected");
      setLastError(null);
      notifyCallEnded(response.data);
      void syncAdvisorInternalState(
        "disponible",
        "hangup_backend",
        response.data.callSid ?? null,
        "backend_hangup"
      );

      logWebRtcSuccess("call_hangup", {
        callId: response.data.id,
        callSid: response.data.callSid,
        status: response.data.status,
        endedAt: response.data.endedAt ?? null,
        context: contextSnapshot,
      });

      await refreshRecentCalls("after-hangup");
      return;
    }

    const error = buildWebRtcUiError(response, "No fue posible colgar la llamada.");
    setLastError(error);
    setConnectionStatus(activeCall ? "in_call" : "connected");
    onError?.(error);
    logWebRtcError("call_hangup", error, {
      callId: activeCall.id,
      callSid: activeCall.callSid,
      status: activeCall.status,
      context: contextSnapshot,
    });

    await refreshRecentCalls("hangup-error");
  }, [
    activeCall,
    contextSnapshot,
    destination,
    fromNumber,
    hangupCall,
    isCompanionTab,
    notifyCallEnded,
    notifyOwnerOnlyBlocked,
    onError,
    refreshRecentCalls,
    setActiveCall,
    setConnectionStatus,
    setLastError,
    softphoneEnabled,
    syncAdvisorInternalState,
    syncPresenceAvailability,
    twilioCallRef,
  ]);

  const handleAcceptIncoming = useCallback(() => {
    if (isCompanionTab) {
      notifyOwnerOnlyBlocked("incoming_accept");
      return;
    }

    const incomingBrowserCall = incomingCallRef.current;
    if (!incomingBrowserCall) {
      return;
    }

    try {
      incomingBrowserCall.accept();
      setConnectionStatus("dialing");
      logWebRtcInfo("call_softphone_incoming_accept_click", {
        context: contextSnapshot,
        callSid:
          incomingBrowserCall.parameters?.CallSid ?? incomingCall?.callSid ?? null,
      });
    } catch (acceptError) {
      const uiError = toWebRtcUiErrorFromTwilio(
        "No fue posible aceptar la llamada entrante.",
        acceptError
      );
      setLastError(uiError);
      onError?.(uiError);
      logWebRtcError("call_softphone_incoming_accept_click", uiError, {
        context: contextSnapshot,
        callSid:
          incomingBrowserCall.parameters?.CallSid ?? incomingCall?.callSid ?? null,
      });
    }
  }, [
    contextSnapshot,
    incomingCall?.callSid,
    incomingCallRef,
    isCompanionTab,
    notifyOwnerOnlyBlocked,
    onError,
    setConnectionStatus,
    setLastError,
  ]);

  const handleRejectIncoming = useCallback(() => {
    if (isCompanionTab) {
      notifyOwnerOnlyBlocked("incoming_reject");
      return;
    }

    const incomingBrowserCall = incomingCallRef.current;
    if (!incomingBrowserCall) {
      return;
    }

    try {
      incomingBrowserCall.reject();
      logWebRtcInfo("call_softphone_incoming_reject_click", {
        context: contextSnapshot,
        callSid:
          incomingBrowserCall.parameters?.CallSid ?? incomingCall?.callSid ?? null,
      });
    } catch (rejectError) {
      const uiError = toWebRtcUiErrorFromTwilio(
        "No fue posible rechazar la llamada entrante.",
        rejectError
      );
      setLastError(uiError);
      onError?.(uiError);
      logWebRtcError("call_softphone_incoming_reject_click", uiError, {
        context: contextSnapshot,
        callSid:
          incomingBrowserCall.parameters?.CallSid ?? incomingCall?.callSid ?? null,
      });
    }
  }, [
    contextSnapshot,
    incomingCall?.callSid,
    incomingCallRef,
    isCompanionTab,
    notifyOwnerOnlyBlocked,
    onError,
    setLastError,
  ]);

  const handleToggleMute = useCallback(async (): Promise<WebRtcCallControlResult> => {
    if (isCompanionTab) {
      notifyOwnerOnlyBlocked("toggle_mute");
      return {
        ok: false,
        message: "Solo la pestana duena puede controlar el audio de la llamada.",
      };
    }

    const browserCall = twilioCallRef.current;
    if (!browserCall) {
      return {
        ok: false,
        message: "No hay una llamada WebRTC activa para silenciar.",
      };
    }

    try {
      const nextMuted = !isMuted;
      browserCall.mute(nextMuted);
      setIsMuted(nextMuted);
      return {
        ok: true,
        muted: nextMuted,
      };
    } catch (muteError) {
      const uiError = toWebRtcUiErrorFromTwilio(
        "No fue posible cambiar el estado de silencio del microfono.",
        muteError
      );
      setLastError(uiError);
      onError?.(uiError);
      logWebRtcError("call_toggle_mute", uiError, {
        context: contextSnapshot,
        callSid: browserCall.parameters?.CallSid ?? activeCall?.callSid ?? null,
      });
      return {
        ok: false,
        error: uiError,
      };
    }
  }, [
    activeCall?.callSid,
    contextSnapshot,
    isCompanionTab,
    isMuted,
    notifyOwnerOnlyBlocked,
    onError,
    setIsMuted,
    setLastError,
    twilioCallRef,
  ]);

  const callControlHandler = useCallback(async (
    action: WebRtcCallControlAction
  ): Promise<WebRtcCallControlResult> => {
    switch (action) {
      case "accept_incoming": {
        if (!incomingCallRef.current) {
          return {
            ok: false,
            message: "No hay llamada entrante para aceptar.",
          };
        }
        handleAcceptIncoming();
        return { ok: true };
      }
      case "reject_incoming": {
        if (!incomingCallRef.current) {
          return {
            ok: false,
            message: "No hay llamada entrante para rechazar.",
          };
        }
        handleRejectIncoming();
        return { ok: true };
      }
      case "hangup": {
        if (!twilioCallRef.current && !activeCall) {
          return {
            ok: false,
            message: "No hay llamada activa para colgar.",
          };
        }
        await handleHangup();
        return { ok: true };
      }
      case "toggle_mute":
        return handleToggleMute();
      default:
        return {
          ok: false,
          message: "Accion de llamada no soportada.",
        };
    }
  }, [
    activeCall,
    handleAcceptIncoming,
    handleHangup,
    handleRejectIncoming,
    handleToggleMute,
    incomingCallRef,
    twilioCallRef,
  ]);

  const outboundDialHandler = useCallback(async (
    request: WebRtcOutboundDialRequest
  ) => {
    const destinationInput = normalizeDialInput(request.destination ?? "");
    const fromInput =
      request.from == null ? null : normalizeDialInput(request.from ?? "");

    if (!destinationInput) {
      return {
        ok: false,
        message: "Debes indicar un numero destino para llamar.",
      };
    }

    setDestination(destinationInput);
    if (fromInput != null) {
      setFromNumber(fromInput);
    }

    return dial(destinationInput, request.source ?? "external", fromInput);
  }, [dial, setDestination, setFromNumber]);

  return {
    callControlHandler,
    dial,
    handleAcceptIncoming,
    handleHangup,
    handleRejectIncoming,
    handleToggleMute,
    outboundDialHandler,
  };
}
