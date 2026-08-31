import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Card, Col, Dropdown, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faTimes, faRedo } from "@fortawesome/free-solid-svg-icons";
import { Call, Device } from "@twilio/voice-sdk";
import {
  AdvisorInternalState,
  WebRtcCallDto,
  useWebRtcService,
} from "@app/services/WebRtc/webrtcService";
import {
  AdvisorInternalStateOrder,
  getAdvisorInternalStateLabel,
  getStoredAdvisorInternalState,
  mapAdvisorInternalStateToCommsAvailability,
  setStoredAdvisorInternalState,
} from "@app/services/GestionLlamadas";
import {
  WebRtcUiError,
  buildWebRtcUiError,
  logWebRtcError,
  logWebRtcInfo,
  logWebRtcSuccess,
  logWebRtcWarn,
} from "@app/services/WebRtc/webrtcLogger";
import { features } from "@app/config/features";
import {
  COUNTRY_DIAL_OPTIONS,
  DEFAULT_COUNTRY_ISO2,
  buildWebRtcContextSnapshot,
  extractTenantIdFromVoiceToken,
  formatWebRtcDate,
  getConnectionBadgeVariant,
  getConnectionLabel,
  getPresenceBadgeVariant,
  getPresenceLabel,
  isEndedCallStatus,
  normalizeCallSystemTenantId,
  normalizeDialInput,
  toWebRtcUiErrorFromTwilio,
  type CountryDialOption,
  type WebRtcDialerContext,
} from "@app/services/WebRtc/runtimeHelpers";
import {
  type ConnectionStatus,
  type GlobalWebRtcIncomingCallSnapshot,
  type PresenceAvailability,
} from "@app/services/WebRtc/runtimeContracts";
import { useWebRtcCallControls } from "./hooks/useWebRtcCallControls";
import { useWebRtcPresenceSync } from "./hooks/useWebRtcPresenceSync";
import { useWebRtcRuntimeBridge } from "./hooks/useWebRtcRuntimeBridge";

const SoftphoneEnabled = features.webRtcSoftphoneEnabled;

export type { WebRtcDialerContext } from "@app/services/WebRtc/runtimeHelpers";

export interface WebRtcDialerRuntimeHints {
  sessionRef?: string | null;
  idGestionSession?: number | null;
  tabId?: string | null;
  ownerTabId?: string | null;
  isOwnerTab?: boolean | null;
}
interface WebRtcDialerProps {
  initialPhone?: string | null;
  initialFrom?: string | null;
  context?: WebRtcDialerContext;
  runtime?: WebRtcDialerRuntimeHints;
  defaultDirection?: string;
  className?: string;
  showOutboundControls?: boolean;
  showRecentCalls?: boolean;
  enableGlobalBridge?: boolean;
  showAdvisorStateControl?: boolean;
  canStartOutboundCall?: boolean;
  startOutboundBlockedReason?: string | null;
  onCallStarted?: (call: WebRtcCallDto) => void;
  onCallEnded?: (call: WebRtcCallDto | null) => void;
  onCallStatusChanged?: (call: WebRtcCallDto) => void;
  onCallActivityChanged?: (inProgress: boolean) => void;
  onError?: (error: WebRtcUiError) => void;
}

function buildIncomingSoftphoneCallDto(call: Call): WebRtcCallDto {
  const callSid = call.parameters?.CallSid ?? "";
  return {
    id: 0,
    callSid,
    direction: "inbound-client",
    from: call.parameters?.From ?? null,
    to: call.parameters?.To ?? null,
    status: "ringing",
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

export default function WebRtcDialer({
  initialPhone,
  initialFrom,
  context,
  runtime,
  defaultDirection = "outbound-api",
  className,
  showOutboundControls = true,
  showRecentCalls = true,
  enableGlobalBridge = false,
  showAdvisorStateControl = true,
  canStartOutboundCall = true,
  startOutboundBlockedReason = null,
  onCallStarted,
  onCallEnded,
  onCallStatusChanged,
  onCallActivityChanged,
  onError,
}: WebRtcDialerProps) {
  const {
    loading,
    getVoiceToken,
    createCall,
    hangupCall,
    connectPresence,
    heartbeatPresence,
    setPresenceAvailability,
    disconnectPresence,
    getAdvisorInternalState,
    setAdvisorInternalState,
  } = useWebRtcService();
  const [selectedCountryIso2, setSelectedCountryIso2] = useState<string>(
    DEFAULT_COUNTRY_ISO2
  );
  const [destination, setDestination] = useState<string>(normalizeDialInput(initialPhone ?? ""));
  const [fromNumber, setFromNumber] = useState<string>(normalizeDialInput(initialFrom ?? ""));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [softphoneStatus, setSoftphoneStatus] = useState<"disabled" | "initializing" | "registered" | "error">(
    SoftphoneEnabled ? "initializing" : "disabled"
  );
  const [agentId, setAgentId] = useState<string>("");
  const [tokenExpiresAtUtc, setTokenExpiresAtUtc] = useState<string>("");
  const [activeCall, setActiveCall] = useState<WebRtcCallDto | null>(null);
  const [lastDialedNumber, setLastDialedNumber] = useState<string>("");
  const [lastError, setLastError] = useState<WebRtcUiError | null>(null);
  const [incomingCall, setIncomingCall] = useState<GlobalWebRtcIncomingCallSnapshot | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [presenceStatus, setPresenceStatus] = useState<"offline" | "online" | "busy" | "error">("offline");
  const [advisorInternalState, setAdvisorInternalStateValue] =
    useState<AdvisorInternalState>(
      () => getStoredAdvisorInternalState() ?? "disponible"
    );
  const [advisorStateChangedAt, setAdvisorStateChangedAt] = useState<string>("");
  const connectionStatusRef = useRef<ConnectionStatus>("disconnected");
  const softphoneStatusRef = useRef<"disabled" | "initializing" | "registered" | "error">(
    SoftphoneEnabled ? "initializing" : "disabled"
  );
  const twilioDeviceRef = useRef<Device | null>(null);
  const twilioCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);
  const callSystemTenantIdRef = useRef<string | null>(null);
  const latestVoiceTokenRef = useRef<string>("");
  const presenceSessionRef = useRef<string>(`sigc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const presenceConnectedRef = useRef(false);
  const autoRegisterAttemptedRef = useRef(false);
  const autoRegisterInFlightRef = useRef(false);
  const connectAgentPromiseRef = useRef<Promise<boolean> | null>(null);
  const selectedCountry = useMemo(
    () =>
      COUNTRY_DIAL_OPTIONS.find(
        (country) => country.iso2 === selectedCountryIso2
      ) ?? COUNTRY_DIAL_OPTIONS[0],
    [selectedCountryIso2]
  );

  useEffect(() => {
    setStoredAdvisorInternalState(advisorInternalState);
  }, [advisorInternalState]);

  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  useEffect(() => {
    softphoneStatusRef.current = softphoneStatus;
  }, [softphoneStatus]);

  const contextSnapshot = useMemo(
    () => buildWebRtcContextSnapshot(context),
    [context?.cliente, context?.factura, context?.cuenta]
  );
  const runtimeSessionRef = runtime?.sessionRef ?? null;
  const runtimeGestionSessionId = runtime?.idGestionSession ?? null;
  const runtimeTabId = runtime?.tabId ?? null;
  const runtimeOwnerTabId = runtime?.ownerTabId ?? null;
  const runtimeIsOwnerTab = runtime?.isOwnerTab ?? null;
  const hasKnownOwner = Boolean(runtimeOwnerTabId);
  const isCompanionTab = Boolean(
    SoftphoneEnabled
    && hasKnownOwner
    && runtimeTabId
    && runtimeOwnerTabId !== runtimeTabId
    && runtimeIsOwnerTab === false
  );
  const ownerBlockMessage = isCompanionTab
    ? "Esta pestaña está en modo acompañante. Usa la pestaña dueña para operar el softphone."
    : "";
  const outboundCallBlocked = !canStartOutboundCall;
  const outboundCallBlockedMessage = (startOutboundBlockedReason ?? "").trim()
    || "Debes iniciar una gestión activa para poder llamar.";
  const effectiveOutboundCallBlocked = outboundCallBlocked || isCompanionTab;
  const effectiveOutboundBlockedMessage = isCompanionTab
    ? ownerBlockMessage
    : outboundCallBlockedMessage;
  const hasActiveCall = useMemo(
    () =>
      Boolean(twilioCallRef.current) ||
      (Boolean(activeCall) && !isEndedCallStatus(activeCall?.status)),
    [activeCall, softphoneStatus]
  );
  const refreshRecentCalls = useCallback(async (_reason: string) => {
    return;
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const bindRuntimeCall = useCallback((_callSid?: string | null) => {
    // La asociación llamada-sesión es manejada por el backend.
  }, []);
  const notifyOwnerOnlyBlocked = useCallback(
    (action: string) => {
      const message = ownerBlockMessage || "Esta pestaña no es dueña del softphone.";
      const warning: WebRtcUiError = {
        message,
        statusCode: 409,
        code: "WEBRTC_OWNER_REQUIRED",
        type: "Validation",
        errors: [`action=${action}`, "blocked=true", `tabId=${runtimeTabId ?? "unknown"}`],
      };

      setLastError(warning);
      onError?.(warning);
      logWebRtcWarn("softphone_owner_required", {
        action,
        context: contextSnapshot,
        runtime: {
          tabId: runtimeTabId,
          ownerTabId: runtimeOwnerTabId,
          isOwnerTab: runtimeIsOwnerTab,
        },
      });
    },
    [contextSnapshot, onError, ownerBlockMessage, runtimeIsOwnerTab, runtimeOwnerTabId, runtimeTabId]
  );

  useEffect(() => {
    const normalized = normalizeDialInput(initialPhone ?? "");
    setDestination(normalized);
  }, [initialPhone]);

  useEffect(() => {
    const normalized = normalizeDialInput(initialFrom ?? "");
    setFromNumber(normalized);
  }, [initialFrom]);

  const {
    notifyCallStatusChanged,
    notifyCallStarted,
    notifyCallEnded,
  } = useWebRtcRuntimeBridge({
    activeCall,
    advisorInternalState,
    connectionStatus,
    enableGlobalBridge,
    hasActiveCall,
    incomingCall,
    onCallActivityChanged,
    onCallEnded,
    onCallStarted,
    onCallStatusChanged,
    presenceStatus,
    runtimeIsMuted: Boolean(twilioCallRef.current) ? isMuted : false,
    softphoneStatus,
  });

  const {
    applyAdvisorStateChange,
    syncAdvisorInternalState,
    syncPresenceAvailability,
    syncPresenceConnect,
    syncPresenceDisconnect,
  } = useWebRtcPresenceSync({
    activeCallSid: activeCall?.callSid ?? null,
    advisorInternalState,
    connectionStatus,
    contextSnapshot,
    connectPresence,
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
    setAdvisorInternalStateRequest: setAdvisorInternalState,
    setAdvisorInternalStateValue,
    setAdvisorStateChangedAt,
    setLastError,
    setPresenceAvailabilityRequest: setPresenceAvailability,
    setPresenceStatus,
    setSoftphoneStatus,
    softphoneEnabled: SoftphoneEnabled,
    softphoneStatus,
    twilioCallRef,
  });


  const teardownSoftphone = useCallback((reason: string) => {
    void syncPresenceDisconnect(reason);

    const activeCallRef = twilioCallRef.current;
    if (activeCallRef) {
      try {
        activeCallRef.disconnect();
      } catch {
        // ignore teardown disconnect errors
      }

      twilioCallRef.current = null;
    }

    incomingCallRef.current = null;
    setIncomingCall(null);

    const activeDevice = twilioDeviceRef.current;
    if (activeDevice) {
      try {
        activeDevice.disconnectAll();
        activeDevice.destroy();
      } catch {
        // ignore teardown destroy errors
      }

      twilioDeviceRef.current = null;
    }

    callSystemTenantIdRef.current = null;
    latestVoiceTokenRef.current = "";
    presenceConnectedRef.current = false;
    setIsMuted(false);
    setPresenceStatus("offline");

    if (SoftphoneEnabled) {
      autoRegisterAttemptedRef.current = false;
      autoRegisterInFlightRef.current = false;
      setSoftphoneStatus("initializing");
      logWebRtcInfo("softphone_teardown", { reason });
    }
  }, [syncPresenceDisconnect]);

  const teardownSoftphoneRef = useRef(teardownSoftphone);
  useEffect(() => {
    teardownSoftphoneRef.current = teardownSoftphone;
  }, [teardownSoftphone]);

  useEffect(() => {
    return () => {
      teardownSoftphoneRef.current("component_unmount");
    };
  }, []);

  useEffect(() => {
    if (!SoftphoneEnabled || !isCompanionTab) {
      return;
    }

    if (twilioCallRef.current || incomingCallRef.current) {
      logWebRtcWarn("softphone_owner_lost_call_in_progress", {
        context: contextSnapshot,
      });
      return;
    }

    teardownSoftphone("ownership_lost_companion");
  }, [contextSnapshot, isCompanionTab, teardownSoftphone]);

  const connectAgent = useCallback(async (): Promise<boolean> => {
    if (connectAgentPromiseRef.current) {
      return connectAgentPromiseRef.current;
    }

    const task = (async (): Promise<boolean> => {
      if (isCompanionTab) {
        setConnectionStatus("disconnected");
        setPresenceStatus("offline");
        if (SoftphoneEnabled) {
          setSoftphoneStatus("disabled");
        }
        notifyOwnerOnlyBlocked("connect_agent");
        return false;
      }

      const currentConnectionStatus = connectionStatusRef.current;
      const currentSoftphoneStatus = softphoneStatusRef.current;
      const hasReadySoftphone = Boolean(
        SoftphoneEnabled
        && twilioDeviceRef.current
        && callSystemTenantIdRef.current
        && currentSoftphoneStatus === "registered"
      );

      if (hasReadySoftphone) {
        if (currentConnectionStatus !== "connected") {
          setConnectionStatus("connected");
        }
        setLastError(null);
        return true;
      }

      setConnectionStatus("connecting");
      setLastError(null);

      logWebRtcInfo("agent_connect_start", {
        context: contextSnapshot,
        currentStatus: currentConnectionStatus,
        softphoneEnabled: SoftphoneEnabled,
      });

      const response = await getVoiceToken();
      if (response?.success && response.data) {
        const voiceToken = response.data.token ?? "";
        const tenantIdFromResponse = normalizeCallSystemTenantId(response.data.callSystemTenantId);
        const tenantId = tenantIdFromResponse ?? extractTenantIdFromVoiceToken(voiceToken);

        setAgentId(response.data.agentId || "");
        setTokenExpiresAtUtc(response.data.expiresAtUtc || "");
        latestVoiceTokenRef.current = voiceToken;
        callSystemTenantIdRef.current = tenantId;

        if (!SoftphoneEnabled) {
          setConnectionStatus("connected");
          setLastError(null);
          setSoftphoneStatus("disabled");

          logWebRtcSuccess("agent_connect", {
            context: contextSnapshot,
            agentId: response.data.agentId,
            tokenExpiresAtUtc: response.data.expiresAtUtc,
            softphoneEnabled: false,
          });
          return true;
        }

        if (!voiceToken) {
          const tokenError: WebRtcUiError = {
            message: "No se recibio token de voz para inicializar WebRTC en navegador. Se habilita fallback por backend.",
            code: "WebRtc.Token.Empty",
            type: "Failure",
            statusCode: 500,
            errors: [],
          };

          setSoftphoneStatus("error");
          setConnectionStatus("connected");
          setLastError(tokenError);
          onError?.(tokenError);
          logWebRtcError("agent_connect_softphone_token_missing", tokenError, {
            context: contextSnapshot,
            agentId: response.data.agentId,
          });
          return true;
        }

        if (!Device.isSupported) {
          const unsupportedError: WebRtcUiError = {
            message: "Este navegador no soporta el SDK de voz WebRTC. Se habilita fallback por backend.",
            code: "WebRtc.Softphone.UnsupportedBrowser",
            type: "Failure",
            statusCode: 500,
            errors: [],
          };

          setSoftphoneStatus("error");
          setConnectionStatus("connected");
          setLastError(unsupportedError);
          onError?.(unsupportedError);
          logWebRtcError("agent_connect_softphone_unsupported", unsupportedError, {
            context: contextSnapshot,
            userAgent: navigator.userAgent,
          });
          return true;
        }

        try {
          const existingDevice = twilioDeviceRef.current;
          if (existingDevice) {
            existingDevice.updateToken(voiceToken);
            await existingDevice.register();
            setSoftphoneStatus("registered");
            setConnectionStatus("connected");
            setLastError(null);
            await syncPresenceConnect(
              mapAdvisorInternalStateToCommsAvailability(advisorInternalState) === "available"
            );
            await syncAdvisorInternalState(advisorInternalState, "softphone_ready", null, "softphone_connect");

            logWebRtcSuccess("agent_connect_softphone_reuse", {
              context: contextSnapshot,
              agentId: response.data.agentId,
              tenantId,
            });
            return true;
          }

          setSoftphoneStatus("initializing");
          const device = new Device(voiceToken, { logLevel: "error" });
          twilioDeviceRef.current = device;

        device.on("registered", () => {
          setSoftphoneStatus("registered");
          logWebRtcInfo("softphone_registered", {
            context: contextSnapshot,
            tenantId: callSystemTenantIdRef.current,
            identity: device.identity,
          });
        });

        device.on("unregistered", () => {
          if (SoftphoneEnabled) {
            setSoftphoneStatus("initializing");
          }

          logWebRtcWarn("softphone_unregistered", {
            context: contextSnapshot,
          });
        });

        device.on("incoming", (incomingBrowserCall) => {
          if (incomingCallRef.current) {
            try {
              incomingBrowserCall.reject();
            } catch {
              // ignore reject errors for concurrent incoming calls
            }

            logWebRtcWarn("softphone_incoming_ignored", {
              context: contextSnapshot,
              reason: "active_incoming_call_exists",
              callSid: incomingBrowserCall.parameters?.CallSid ?? null,
            });
            return;
          }

          if (isCompanionTab) {
            try {
              incomingBrowserCall.reject();
            } catch {
              // ignore reject errors for companion tabs
            }

            logWebRtcWarn("softphone_incoming_ignored_non_owner", {
              context: contextSnapshot,
              reason: "companion_tab",
              callSid: incomingBrowserCall.parameters?.CallSid ?? null,
              tabId: runtimeTabId,
              ownerTabId: runtimeOwnerTabId,
            });
            return;
          }

          incomingCallRef.current = incomingBrowserCall;
          const provisionalCall = buildIncomingSoftphoneCallDto(incomingBrowserCall);
          setIncomingCall({
            callSid: provisionalCall.callSid || "",
            from: provisionalCall.from,
            to: provisionalCall.to,
            receivedAt: new Date().toISOString(),
          });
          setActiveCall(provisionalCall);
          notifyCallStatusChanged(provisionalCall);
          setConnectionStatus("dialing");
          void syncPresenceAvailability("busy", provisionalCall.callSid || null);
          void syncAdvisorInternalState(
            "ocupado_llamada",
            "incoming_call_ring",
            provisionalCall.callSid || null,
            "softphone_incoming_ring"
          );

          logWebRtcWarn("softphone_incoming", {
            context: contextSnapshot,
            callSid: incomingBrowserCall.parameters?.CallSid ?? null,
            from: incomingBrowserCall.parameters?.From ?? null,
            to: incomingBrowserCall.parameters?.To ?? null,
          });

          incomingBrowserCall.on("accept", (acceptedCall: Call) => {
            const acceptedCallSid = acceptedCall.parameters?.CallSid ?? provisionalCall.callSid ?? "";
            twilioCallRef.current = acceptedCall;
            setIsMuted(false);
            incomingCallRef.current = null;
            setIncomingCall(null);
            setConnectionStatus("in_call");
            setActiveCall((previous) => ({
              ...(previous ?? provisionalCall),
              callSid: acceptedCallSid,
              status: "in-progress",
              startedAt: previous?.startedAt ?? provisionalCall.startedAt,
            }));
            notifyCallStarted({
              ...(provisionalCall),
              callSid: acceptedCallSid,
              status: "in-progress",
            });
            void syncPresenceAvailability("busy", acceptedCallSid || null);
            void syncAdvisorInternalState(
              "ocupado_llamada",
              "incoming_call_accepted",
              acceptedCallSid || null,
              "softphone_incoming_accept"
            );
            logWebRtcInfo("call_softphone_incoming_accept", {
              callSid: acceptedCallSid,
              context: contextSnapshot,
            });
          });

          incomingBrowserCall.on("disconnect", (disconnectedCall: Call) => {
            twilioCallRef.current = null;
            incomingCallRef.current = null;
            setIncomingCall(null);
            const endedCall: WebRtcCallDto = {
              ...provisionalCall,
              callSid: disconnectedCall.parameters?.CallSid ?? provisionalCall.callSid,
              status: "completed",
              endedAt: new Date().toISOString(),
            };
            setActiveCall(endedCall);
            setConnectionStatus("connected");
            notifyCallEnded(endedCall);
            void syncPresenceAvailability("available");
            void syncAdvisorInternalState(
              "disponible",
              "incoming_call_disconnected",
              endedCall.callSid || null,
              "softphone_incoming_disconnect"
            );
            void refreshRecentCalls("after-softphone-incoming-disconnect");
          });

          incomingBrowserCall.on("cancel", () => {
            twilioCallRef.current = null;
            incomingCallRef.current = null;
            setIncomingCall(null);
            const canceledCall: WebRtcCallDto = {
              ...provisionalCall,
              callSid: incomingBrowserCall.parameters?.CallSid ?? provisionalCall.callSid,
              status: "canceled",
              endedAt: new Date().toISOString(),
            };
            setActiveCall(canceledCall);
            setConnectionStatus("connected");
            notifyCallEnded(canceledCall);
            void syncPresenceAvailability("available");
            void syncAdvisorInternalState(
              "disponible",
              "incoming_call_canceled",
              canceledCall.callSid || null,
              "softphone_incoming_cancel"
            );
            void refreshRecentCalls("after-softphone-incoming-cancel");
          });

          incomingBrowserCall.on("reject", () => {
            twilioCallRef.current = null;
            incomingCallRef.current = null;
            setIncomingCall(null);
            const rejectedCall: WebRtcCallDto = {
              ...provisionalCall,
              callSid: incomingBrowserCall.parameters?.CallSid ?? provisionalCall.callSid,
              status: "rejected",
              endedAt: new Date().toISOString(),
            };
            setActiveCall(rejectedCall);
            setConnectionStatus("connected");
            notifyCallEnded(rejectedCall);
            void syncPresenceAvailability("available");
            void syncAdvisorInternalState(
              "disponible",
              "incoming_call_rejected",
              rejectedCall.callSid || null,
              "softphone_incoming_reject"
            );
            void refreshRecentCalls("after-softphone-incoming-reject");
          });

          incomingBrowserCall.on("error", (twilioError: unknown) => {
            twilioCallRef.current = null;
            incomingCallRef.current = null;
            setIncomingCall(null);
            setConnectionStatus("connected");
            const uiError = toWebRtcUiErrorFromTwilio("Error en llamada entrante WebRTC.", twilioError);
            setLastError(uiError);
            onError?.(uiError);
            void syncPresenceAvailability("available");
            void syncAdvisorInternalState(
              "disponible",
              "incoming_call_error",
              incomingBrowserCall.parameters?.CallSid ?? provisionalCall.callSid ?? null,
              "softphone_incoming_error"
            );
            logWebRtcError("call_softphone_incoming", uiError, {
              callSid: incomingBrowserCall.parameters?.CallSid ?? provisionalCall.callSid ?? null,
              context: contextSnapshot,
            });
          });
        });

        device.on("error", (twilioError: unknown) => {
          const softphoneError = toWebRtcUiErrorFromTwilio(
            "Error en sesion WebRTC del navegador.",
            twilioError
          );

          setSoftphoneStatus("error");
          setConnectionStatus("connected");
          setLastError(softphoneError);
          onError?.(softphoneError);
          logWebRtcError("softphone_device_error", softphoneError, {
            context: contextSnapshot,
          });
        });

        device.on("tokenWillExpire", async () => {
          logWebRtcWarn("softphone_token_will_expire", {
            context: contextSnapshot,
            currentExpiresAtUtc: tokenExpiresAtUtc,
          });

          const refresh = await getVoiceToken();
          if (!refresh?.success || !refresh.data?.token) {
            const refreshError = buildWebRtcUiError(
              refresh,
              "No fue posible refrescar el token de voz antes de expirar."
            );
            setLastError(refreshError);
            onError?.(refreshError);
            logWebRtcError("softphone_token_refresh", refreshError, {
              context: contextSnapshot,
            });
            return;
          }

          try {
            device.updateToken(refresh.data.token);
            latestVoiceTokenRef.current = refresh.data.token;
            const refreshedTenantId = normalizeCallSystemTenantId(refresh.data.callSystemTenantId)
              ?? extractTenantIdFromVoiceToken(refresh.data.token);
            callSystemTenantIdRef.current = refreshedTenantId;
            setTokenExpiresAtUtc(refresh.data.expiresAtUtc || "");
            logWebRtcSuccess("softphone_token_refresh", {
              context: contextSnapshot,
              tokenExpiresAtUtc: refresh.data.expiresAtUtc,
              tenantId: callSystemTenantIdRef.current,
            });
          } catch (updateError) {
            const uiError = toWebRtcUiErrorFromTwilio(
              "No fue posible aplicar el nuevo token del softphone.",
              updateError
            );
            setLastError(uiError);
            onError?.(uiError);
            logWebRtcError("softphone_token_refresh_apply", uiError, {
              context: contextSnapshot,
            });
          }
        });

          await device.register();

          if (navigator.mediaDevices?.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach((track) => track.stop());
              logWebRtcInfo("softphone_microphone_ready", { context: contextSnapshot });
            } catch (permissionError) {
              logWebRtcWarn("softphone_microphone_denied", {
                context: contextSnapshot,
                error: (permissionError as { message?: string })?.message ?? "unknown",
              });
            }
          }

          setSoftphoneStatus("registered");
          setConnectionStatus("connected");
          setLastError(null);
          await syncPresenceConnect(
            mapAdvisorInternalStateToCommsAvailability(advisorInternalState) === "available"
          );
          await syncAdvisorInternalState(advisorInternalState, "softphone_ready", null, "softphone_connect");

          logWebRtcSuccess("agent_connect", {
            context: contextSnapshot,
            agentId: response.data.agentId,
            tokenExpiresAtUtc: response.data.expiresAtUtc,
            softphoneEnabled: true,
            tenantId,
          });
          return true;
        } catch (setupError) {
          const softphoneError = toWebRtcUiErrorFromTwilio(
            "No fue posible inicializar WebRTC en navegador. Se habilita fallback por backend.",
            setupError
          );

          teardownSoftphone("connect_failed");
          setSoftphoneStatus("error");
          setConnectionStatus("connected");
          setLastError(softphoneError);
          onError?.(softphoneError);
          logWebRtcError("agent_connect_softphone_setup", softphoneError, {
            context: contextSnapshot,
          });
          return true;
        }

      }

      const responseError = buildWebRtcUiError(response, "No fue posible conectar el agente.");
      const isAuthSessionError = responseError.statusCode === 401 || responseError.statusCode === 403;
      const error: WebRtcUiError = isAuthSessionError
        ? {
            ...responseError,
            message: "La sesion del agente vencio o no tiene permisos vigentes para llamadas. Inicia sesion nuevamente.",
            code: responseError.code ?? "WebRtc.Agent.AuthExpired",
          }
        : responseError;
      setConnectionStatus("error");
      setSoftphoneStatus(SoftphoneEnabled ? "error" : "disabled");
      setLastError(error);
      onError?.(error);
      logWebRtcError("agent_connect", error, { context: contextSnapshot });

      return false;
    })();

    connectAgentPromiseRef.current = task;
    try {
      return await task;
    } finally {
      if (connectAgentPromiseRef.current === task) {
        connectAgentPromiseRef.current = null;
      }
    }
  }, [
    advisorInternalState,
    contextSnapshot,
    getVoiceToken,
    notifyCallEnded,
    notifyCallStarted,
    notifyCallStatusChanged,
    onError,
    refreshRecentCalls,
    isCompanionTab,
    notifyOwnerOnlyBlocked,
    runtimeOwnerTabId,
    runtimeTabId,
    syncAdvisorInternalState,
    syncPresenceAvailability,
    syncPresenceConnect,
    teardownSoftphone,
    tokenExpiresAtUtc,
  ]);

  useEffect(() => {
    if (!SoftphoneEnabled) {
      return;
    }

    if (isCompanionTab) {
      autoRegisterAttemptedRef.current = false;
      autoRegisterInFlightRef.current = false;
      return;
    }

    if (softphoneStatus === "registered") {
      autoRegisterAttemptedRef.current = true;
      return;
    }

    if (autoRegisterAttemptedRef.current || autoRegisterInFlightRef.current) {
      return;
    }

    autoRegisterAttemptedRef.current = true;
    autoRegisterInFlightRef.current = true;

    void (async () => {
      try {
        await connectAgent();
      } finally {
        autoRegisterInFlightRef.current = false;
      }
    })();
  }, [connectAgent, isCompanionTab, softphoneStatus]);

  const {
    callControlHandler,
    dial,
    handleAcceptIncoming,
    handleHangup,
    handleRejectIncoming,
    handleToggleMute,
    outboundDialHandler,
  } = useWebRtcCallControls({
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
    softphoneEnabled: SoftphoneEnabled,
    softphoneStatusRef,
    syncAdvisorInternalState,
    syncPresenceAvailability,
    twilioCallRef,
    twilioDeviceRef,
  });

  useWebRtcRuntimeBridge({
    activeCall,
    advisorInternalState,
    advisorStateChangeHandler: applyAdvisorStateChange,
    callControlHandler,
    connectionStatus,
    enableGlobalBridge,
    hasActiveCall,
    incomingCall,
    onCallActivityChanged,
    onCallEnded,
    onCallStarted,
    onCallStatusChanged,
    outboundDialHandler,
    presenceStatus,
    publishSnapshot: false,
    runtimeIsMuted: Boolean(twilioCallRef.current) ? isMuted : false,
    softphoneStatus,
  });

  const notifyOutboundCallBlocked = useCallback(() => {
    const blockedByCompanionMode = isCompanionTab;
    const warning: WebRtcUiError = {
      message: effectiveOutboundBlockedMessage,
      statusCode: 409,
      code: blockedByCompanionMode ? "WEBRTC_OWNER_REQUIRED" : "GESTION_REQUIRED",
      type: "Validation",
      errors: [
        "action=outbound_call",
        "blocked=true",
        `owner_required=${blockedByCompanionMode ? "true" : "false"}`,
      ],
    };

    setLastError(warning);
    onError?.(warning);
    logWebRtcWarn(blockedByCompanionMode
      ? "call_blocked_companion_tab"
      : "call_blocked_without_active_gestion", {
      reason: effectiveOutboundBlockedMessage,
      context: contextSnapshot,
      runtime: {
        sessionRef: runtimeSessionRef,
        tabId: runtimeTabId,
        ownerTabId: runtimeOwnerTabId,
        isOwnerTab: runtimeIsOwnerTab,
      },
    });
  }, [
    contextSnapshot,
    effectiveOutboundBlockedMessage,
    isCompanionTab,
    onError,
    runtimeIsOwnerTab,
    runtimeOwnerTabId,
    runtimeSessionRef,
    runtimeTabId,
  ]);

  const handleCallClick = useCallback(async () => {
    if (effectiveOutboundCallBlocked) {
      notifyOutboundCallBlocked();
      return;
    }

    await dial(destination, "manual");
  }, [destination, dial, effectiveOutboundCallBlocked, notifyOutboundCallBlocked]);

  const handleRetryClick = useCallback(async () => {
    if (effectiveOutboundCallBlocked) {
      notifyOutboundCallBlocked();
      return;
    }

    if (!lastDialedNumber) {
      return;
    }

    await dial(lastDialedNumber, "retry");
  }, [dial, effectiveOutboundCallBlocked, lastDialedNumber, notifyOutboundCallBlocked]);

  const handleAdvisorStateChange = useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextState = event.target.value as AdvisorInternalState;
      await applyAdvisorStateChange(nextState);
    },
    [applyAdvisorStateChange]
  );

  const callButtonDisabled = effectiveOutboundCallBlocked
    || loading
    || connectionStatus === "connecting"
    || connectionStatus === "dialing"
    || hasActiveCall;
  const retryButtonDisabled = effectiveOutboundCallBlocked
    || loading
    || !lastDialedNumber
    || connectionStatus === "connecting"
    || connectionStatus === "dialing"
    || hasActiveCall;

  return (
    <Card className={`shadow-sm border-0 ${className ?? ""}`}>
      <Card.Header className="bg-white border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0" style={{ fontWeight: 700 }}>
            Llamadas WebRTC
          </h6>
          <Badge variant={getConnectionBadgeVariant(connectionStatus)}>
            {getConnectionLabel(connectionStatus)}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        {SoftphoneEnabled && (
          <Alert
            variant={isCompanionTab ? "secondary" : "success"}
            className="py-2 px-3 mb-3"
          >
            <div
              className="d-flex flex-wrap justify-content-between align-items-start"
              style={{ gap: 8 }}
            >
              <div className="small">
                <strong>{isCompanionTab ? "Modo acompañante" : "Pestaña dueña"}</strong>
                <div>
                  {isCompanionTab
                    ? "Solo visualiza estado. Las acciones de softphone se ejecutan en la pestaña dueña."
                    : "Esta pestaña controla conexión, llamadas entrantes y presencia WebRTC."}
                </div>
              </div>
              <div className="small text-muted text-right">
                <div>
                  <strong>Tab actual:</strong> {runtimeTabId || "-"}
                </div>
                <div>
                  <strong>Tab dueña:</strong> {runtimeOwnerTabId || "-"}
                </div>
              </div>
            </div>
          </Alert>
        )}
        {showOutboundControls && (
          <>
            <Row className="mb-2" style={{ rowGap: 8 }}>
              <Col xs={12} md={4}>
                <Form.Group controlId="webrtcDialerCountryCode">
                  <Form.Label className="mb-1">Extension</Form.Label>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" id="webrtcDialerCountryPicker">
                      {selectedCountry.flag} {selectedCountry.dialCode}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {COUNTRY_DIAL_OPTIONS.map((country) => (
                        <Dropdown.Item
                          key={country.iso2}
                          active={country.iso2 === selectedCountry.iso2}
                          onClick={() => setSelectedCountryIso2(country.iso2)}
                        >
                          {country.flag} {country.name} ({country.dialCode})
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                  <Form.Text className="text-muted">{selectedCountry.name}</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row style={{ rowGap: 8 }}>
              <Col xs={12} md={7}>
                <Form.Group controlId="webrtcDialerDestination">
                  <Form.Label className="mb-1">Destino</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    placeholder={selectedCountry.exampleLocal}
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Se enviara como {selectedCountry.dialCode} + numero nacional.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col xs={12} md={5}>
                <Form.Group controlId="webrtcDialerFrom">
                  <Form.Label className="mb-1">Origen opcional</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    placeholder={selectedCountry.exampleLocal}
                    value={fromNumber}
                    onChange={(event) => setFromNumber(event.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Si lo dejas vacio, se usa el numero origen configurado para el tenant.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex flex-wrap mt-3" style={{ gap: 8 }}>
              {effectiveOutboundCallBlocked ? (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id="tooltip-webrtc-call-blocked">
                      {effectiveOutboundBlockedMessage}
                    </Tooltip>
                  }
                >
                  <span className="d-inline-block">
                    <Button
                      variant="primary"
                      onClick={handleCallClick}
                      disabled={callButtonDisabled}
                      title="Llamar"
                      aria-label="Llamar"
                    >
                      <FontAwesomeIcon icon={faPhone} />
                    </Button>
                  </span>
                </OverlayTrigger>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleCallClick}
                  disabled={callButtonDisabled}
                  title="Llamar"
                  aria-label="Llamar"
                >
                  <FontAwesomeIcon icon={faPhone} />
                </Button>
              )}
              {effectiveOutboundCallBlocked ? (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id="tooltip-webrtc-retry-blocked">
                      {effectiveOutboundBlockedMessage}
                    </Tooltip>
                  }
                >
                  <span className="d-inline-block">
                    <Button
                      variant="secondary"
                      onClick={handleRetryClick}
                      disabled={retryButtonDisabled}
                      title="Reintentar"
                      aria-label="Reintentar"
                    >
                      <FontAwesomeIcon icon={faRedo} />
                    </Button>
                  </span>
                </OverlayTrigger>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleRetryClick}
                  disabled={retryButtonDisabled}
                  title="Reintentar"
                  aria-label="Reintentar"
                >
                  <FontAwesomeIcon icon={faRedo} />
                </Button>
              )}
            </div>
          </>
        )}

        <div className="d-flex flex-wrap mt-3" style={{ gap: 8 }}>
          <Button
            variant="danger"
            onClick={handleHangup}
            disabled={isCompanionTab || loading || !hasActiveCall || Boolean(incomingCall)}
            title="Colgar"
            aria-label="Colgar"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>

        <div className="mt-3 small text-muted">
          <div>
            <strong>Softphone:</strong>{" "}
            {!SoftphoneEnabled
              ? "Deshabilitado"
              : softphoneStatus === "registered"
                ? "Registrado en navegador"
                : softphoneStatus === "initializing"
                  ? "Inicializando"
                : "Con error"}
          </div>
          <div>
            <strong>Presencia:</strong>{" "}
            <Badge variant={getPresenceBadgeVariant(presenceStatus)}>
              {getPresenceLabel(presenceStatus)}
            </Badge>
          </div>
          {showAdvisorStateControl && (
            <Form.Group controlId="webrtcInternalState" className="mt-2">
              <Form.Label className="mb-1 fw-semibold">Estado interno asesor</Form.Label>
              <Form.Control
                as="select"
                size="sm"
                value={advisorInternalState}
                onChange={handleAdvisorStateChange}
                disabled={
                  isCompanionTab
                  || connectionStatus === "connecting"
                  || connectionStatus === "dialing"
                  || connectionStatus === "in_call"
                  || loading
                }
              >
                {AdvisorInternalStateOrder.map((state) => (
                  <option key={state} value={state}>
                    {getAdvisorInternalStateLabel(state)}
                  </option>
                ))}
              </Form.Control>
              <Form.Text className="text-muted">
                Mapeo Comms: {mapAdvisorInternalStateToCommsAvailability(advisorInternalState)}
                {advisorStateChangedAt
                  ? ` | Auditado: ${formatWebRtcDate(advisorStateChangedAt)}`
                  : ""}
              </Form.Text>
            </Form.Group>
          )}
          <div>
            <strong>AgentId:</strong> {agentId || "-"}
          </div>
          <div>
            <strong>Token expira:</strong> {formatWebRtcDate(tokenExpiresAtUtc)}
          </div>
          <div>
            <strong>Ultimo destino:</strong> {lastDialedNumber || "-"}
          </div>
          {activeCall && (
            <div>
              <strong>Llamada activa:</strong> #{activeCall.id} ({activeCall.status})
            </div>
          )}
        </div>

        {incomingCall && (
          <Alert variant="warning" className="mt-3 mb-0">
            <div style={{ fontWeight: 700 }}>Llamada entrante</div>
            <div className="small mt-1">
              <div>
                <strong>CallSid:</strong> {incomingCall.callSid || "-"}
              </div>
              <div>
                <strong>Desde:</strong> {incomingCall.from || "-"}
              </div>
              <div>
                <strong>Hacia:</strong> {incomingCall.to || "-"}
              </div>
              <div>
                <strong>Recibida:</strong> {formatWebRtcDate(incomingCall.receivedAt)}
              </div>
            </div>
            <div className="d-flex flex-wrap mt-2" style={{ gap: 8 }}>
              <Button
                variant="success"
                size="sm"
                onClick={handleAcceptIncoming}
                disabled={isCompanionTab || loading || connectionStatus === "connecting"}
              >
                Aceptar
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleRejectIncoming}
                disabled={isCompanionTab || loading || connectionStatus === "connecting"}
              >
                Rechazar
              </Button>
            </div>
          </Alert>
        )}

        {lastError && (
          <Alert variant="danger" className="mt-3 mb-0">
            <div style={{ fontWeight: 600 }}>Error operativo</div>
            <div>{lastError.message}</div>
            <div className="small mt-1">
              <div>
                <strong>Status:</strong> {lastError.statusCode ?? "-"}
              </div>
              <div>
                <strong>Code:</strong> {lastError.code ?? "-"}
              </div>
              <div>
                <strong>Type:</strong> {lastError.type ?? "-"}
              </div>
              <div>
                <strong>CorrelationId:</strong> {lastError.correlationId ?? "-"}
              </div>
            </div>
          </Alert>
        )}

        {showRecentCalls && (
          <div className="mt-3 small text-muted">
            El listado embebido de llamadas se oculto temporalmente.
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
