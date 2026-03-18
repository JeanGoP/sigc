import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Card, Col, Dropdown, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faTimes, faRedo } from "@fortawesome/free-solid-svg-icons";
import { Call, Device } from "@twilio/voice-sdk";
import {
  AdvisorInternalState,
  ConnectWebRtcPresencePayload,
  CreateWebRtcCallPayload,
  HeartbeatWebRtcPresencePayload,
  SetWebRtcPresenceAvailabilityPayload,
  WebRtcCallDto,
  useWebRtcService,
} from "@app/services/WebRtc/webrtcService";
import {
  AdvisorInternalStateOrder,
  getAdvisorInternalStateLabel,
  mapAdvisorInternalStateToCommsAvailability,
} from "@app/services/GestionLlamadas";
import {
  WebRtcUiError,
  buildWebRtcUiError,
  logWebRtcError,
  logWebRtcInfo,
  logWebRtcSuccess,
  logWebRtcWarn,
} from "@app/services/WebRtc/webrtcLogger";
import {
  emitGlobalWebRtcCallActivityChanged,
  emitGlobalWebRtcCallEnded,
  emitGlobalWebRtcCallStarted,
  emitGlobalWebRtcCallStatusChanged,
  registerGlobalWebRtcCallControlHandler,
  registerGlobalWebRtcAdvisorStateChangeHandler,
  registerGlobalWebRtcOutboundDialHandler,
  setGlobalWebRtcRuntimeSnapshot,
  WebRtcCallControlResult,
  WebRtcAdvisorStateChangeResult,
  WebRtcOutboundDialResult,
} from "@app/services/WebRtc/webrtcBridge";
import { features } from "@app/config/features";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "dialing" | "in_call" | "error";
type PresenceAvailability = "available" | "busy" | "offline";

const EndedCallStatuses = new Set([
  "completed",
  "failed",
  "canceled",
  "cancelled",
  "busy",
  "no-answer",
  "rejected",
  "disconnected",
]);
const ActiveCallStatuses = new Set([
  "in-progress",
  "in_progress",
  "inprogress",
  "answered",
  "active",
]);
const DialingCallStatuses = new Set([
  "queued",
  "initiated",
  "ringing",
  "processing",
  "connecting",
  "dialing",
  "created",
]);
const SoftphoneEnabled = features.webRtcSoftphoneEnabled;

export interface WebRtcDialerContext {
  cliente?: string | number | null;
  factura?: string | number | null;
  cuenta?: string | number | null;
}

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

interface IncomingCallState {
  callSid: string;
  from?: string | null;
  to?: string | null;
  receivedAt: string;
}

interface CountryDialOption {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
  minNationalDigits: number;
  maxNationalDigits: number;
  exampleLocal: string;
}

const CountryDialOptions: readonly CountryDialOption[] = [
  {
    iso2: "CO",
    name: "Colombia",
    dialCode: "+57",
    flag: "\uD83C\uDDE8\uD83C\uDDF4",
    minNationalDigits: 10,
    maxNationalDigits: 10,
    exampleLocal: "3218446041",
  },
  {
    iso2: "MX",
    name: "Mexico",
    dialCode: "+52",
    flag: "\uD83C\uDDF2\uD83C\uDDFD",
    minNationalDigits: 10,
    maxNationalDigits: 10,
    exampleLocal: "5512345678",
  },
  {
    iso2: "PE",
    name: "Peru",
    dialCode: "+51",
    flag: "\uD83C\uDDF5\uD83C\uDDEA",
    minNationalDigits: 9,
    maxNationalDigits: 9,
    exampleLocal: "912345678",
  },
  {
    iso2: "EC",
    name: "Ecuador",
    dialCode: "+593",
    flag: "\uD83C\uDDEA\uD83C\uDDE8",
    minNationalDigits: 9,
    maxNationalDigits: 9,
    exampleLocal: "991234567",
  },
  {
    iso2: "CL",
    name: "Chile",
    dialCode: "+56",
    flag: "\uD83C\uDDE8\uD83C\uDDF1",
    minNationalDigits: 9,
    maxNationalDigits: 9,
    exampleLocal: "912345678",
  },
  {
    iso2: "AR",
    name: "Argentina",
    dialCode: "+54",
    flag: "\uD83C\uDDE6\uD83C\uDDF7",
    minNationalDigits: 10,
    maxNationalDigits: 10,
    exampleLocal: "1123456789",
  },
  {
    iso2: "US",
    name: "Estados Unidos",
    dialCode: "+1",
    flag: "\uD83C\uDDFA\uD83C\uDDF8",
    minNationalDigits: 10,
    maxNationalDigits: 10,
    exampleLocal: "3055551234",
  },
  {
    iso2: "ES",
    name: "Espana",
    dialCode: "+34",
    flag: "\uD83C\uDDEA\uD83C\uDDF8",
    minNationalDigits: 9,
    maxNationalDigits: 9,
    exampleLocal: "612345678",
  },
];

const DefaultCountryIso2 = "CO";
const GlobalE164Pattern = /^\+[1-9]\d{7,14}$/;

type PhoneNormalizationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

function normalizeDialInput(value: string): string {
  return value.replace(/[^\d+]/g, "").trim();
}

function normalizePhoneByCountry(
  value: string,
  fieldLabel: string,
  country: CountryDialOption,
  allowEmpty = false
): PhoneNormalizationResult {
  const normalizedInput = normalizeDialInput(value);
  if (!normalizedInput) {
    if (allowEmpty) {
      return { ok: true, value: "" };
    }

    return { ok: false, message: `Numero ${fieldLabel} requerido.` };
  }

  const dialDigits = country.dialCode.replace("+", "");
  let candidate = normalizedInput;
  if (normalizedInput.startsWith("+")) {
    candidate = `+${normalizedInput.slice(1).replace(/\D/g, "")}`;
  } else {
    const digits = normalizedInput.replace(/\D/g, "");
    const hasDialPrefix = digits.startsWith(dialDigits);
    const localDigits = hasDialPrefix ? digits.slice(dialDigits.length) : digits;
    if (
      localDigits.length < country.minNationalDigits
      || localDigits.length > country.maxNationalDigits
    ) {
      return {
        ok: false,
        message: `Numero ${fieldLabel} invalido para ${country.name}. Usa ${country.exampleLocal} como referencia.`,
      };
    }

    candidate = `${country.dialCode}${localDigits}`;
  }

  if (!candidate.startsWith(country.dialCode)) {
    return {
      ok: false,
      message: `Numero ${fieldLabel} invalido. Selecciona una extension que coincida con el numero digitado.`,
    };
  }

  if (!GlobalE164Pattern.test(candidate)) {
    return {
      ok: false,
      message: `Numero ${fieldLabel} invalido. Debe quedar en formato internacional (${country.dialCode}).`,
    };
  }

  const finalDigits = candidate.slice(1 + dialDigits.length);
  if (
    finalDigits.length < country.minNationalDigits
    || finalDigits.length > country.maxNationalDigits
  ) {
    return {
      ok: false,
      message: `Numero ${fieldLabel} invalido para ${country.name}. Debe tener entre ${country.minNationalDigits} y ${country.maxNationalDigits} digitos locales.`,
    };
  }

  return { ok: true, value: candidate };
}

function isEndedStatus(status: string | null | undefined): boolean {
  return EndedCallStatuses.has((status ?? "").trim().toLowerCase());
}

function mapCallStatusToConnectionStatus(status: string | null | undefined): ConnectionStatus {
  const normalized = (status ?? "").trim().toLowerCase();
  if (!normalized) {
    return "dialing";
  }

  if (isEndedStatus(normalized)) {
    return "connected";
  }

  if (ActiveCallStatuses.has(normalized)) {
    return "in_call";
  }

  if (DialingCallStatuses.has(normalized)) {
    return "dialing";
  }

  return "dialing";
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function getConnectionBadgeVariant(status: ConnectionStatus): string {
  switch (status) {
    case "connected":
      return "success";
    case "dialing":
      return "warning";
    case "in_call":
      return "primary";
    case "error":
      return "danger";
    case "connecting":
      return "info";
    default:
      return "secondary";
  }
}

function getConnectionLabel(status: ConnectionStatus): string {
  switch (status) {
    case "connected":
      return "Conectado";
    case "dialing":
      return "Llamando";
    case "in_call":
      return "En llamada";
    case "error":
      return "Error";
    case "connecting":
      return "Conectando";
    default:
      return "Desconectado";
  }
}

function getPresenceBadgeVariant(status: "offline" | "online" | "busy" | "error"): string {
  switch (status) {
    case "online":
      return "success";
    case "busy":
      return "warning";
    case "error":
      return "danger";
    default:
      return "secondary";
  }
}

function getPresenceLabel(status: "offline" | "online" | "busy" | "error"): string {
  switch (status) {
    case "online":
      return "Disponible";
    case "busy":
      return "Ocupado";
    case "error":
      return "Error";
    default:
      return "Offline";
  }
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `dial-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function buildContextSnapshot(context?: WebRtcDialerContext): Record<string, unknown> {
  return {
    cliente: context?.cliente ?? null,
    factura: context?.factura ?? null,
    cuenta: context?.cuenta ?? null,
  };
}

function decodeBase64Url(input: string): string | null {
  if (!input) {
    return null;
  }

  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(padLength);
    return atob(padded);
  } catch {
    return null;
  }
}

function extractTenantIdFromVoiceToken(token: string): string | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  const payloadJson = decodeBase64Url(parts[1]);
  if (!payloadJson) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadJson) as {
      grants?: { identity?: string };
    };

    const identity = payload?.grants?.identity ?? "";
    const match = identity.match(/tenant:(\d+)/i);
    if (match?.[1]) {
      return match[1];
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeCallSystemTenantId(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function buildSoftphoneCallDto(call: Call, to: string, from?: string | null): WebRtcCallDto {
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

function toWebRtcUiErrorFromTwilio(reason: string, error: unknown): WebRtcUiError {
  const source = (error ?? {}) as {
    code?: number | string;
    message?: string;
    explanation?: string;
    causes?: string[];
  };

  const details = Array.isArray(source.causes)
    ? source.causes
    : [];

  return {
    message: source.explanation || source.message || reason,
    statusCode: 500,
    code: source.code ? `Twilio.${source.code}` : "Twilio.Error",
    type: "Failure",
    errors: details,
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
  const [selectedCountryIso2, setSelectedCountryIso2] = useState<string>(DefaultCountryIso2);
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
  const [incomingCall, setIncomingCall] = useState<IncomingCallState | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [presenceStatus, setPresenceStatus] = useState<"offline" | "online" | "busy" | "error">("offline");
  const [advisorInternalState, setAdvisorInternalStateValue] =
    useState<AdvisorInternalState>("disponible");
  const [advisorStateChangedAt, setAdvisorStateChangedAt] = useState<string>("");
  const twilioDeviceRef = useRef<Device | null>(null);
  const twilioCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);
  const callSystemTenantIdRef = useRef<string | null>(null);
  const latestVoiceTokenRef = useRef<string>("");
  const presenceSessionRef = useRef<string>(`sigc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const presenceConnectedRef = useRef(false);
  const autoRegisterAttemptedRef = useRef(false);
  const autoRegisterInFlightRef = useRef(false);
  const selectedCountry = useMemo(
    () => CountryDialOptions.find((country) => country.iso2 === selectedCountryIso2) ?? CountryDialOptions[0],
    [selectedCountryIso2]
  );

  const contextSnapshot = useMemo(
    () => buildContextSnapshot(context),
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
    () => Boolean(twilioCallRef.current) || (Boolean(activeCall) && !isEndedStatus(activeCall?.status)),
    [activeCall, softphoneStatus]
  );
  const refreshRecentCalls = useCallback(async (_reason: string) => {
    return;
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const bindRuntimeCall = useCallback((_callSid?: string | null) => {
    // La asociación llamada-sesión es manejada por el backend.
  }, []);
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
  const syncAdvisorInternalState = useCallback(
    async (
      nextState: AdvisorInternalState,
      reason: string,
      currentCallSid?: string | null,
      source = "webrtc_dialer"
    ): Promise<boolean> => {
      if (!SoftphoneEnabled || isCompanionTab) {
        return false;
      }

      const response = await setAdvisorInternalState({
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
        setAdvisorStateChangedAt(response.data.changedAtUtc ?? new Date().toISOString());
        setPresenceStatus(availability === "available" ? "online" : "busy");

        logWebRtcInfo("advisor_internal_state_synced", {
          context: contextSnapshot,
          internalState: resolvedState,
          presenceAvailability: availability || mapAdvisorInternalStateToCommsAvailability(resolvedState),
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
      setAdvisorInternalState,
    ]
  );
  const hydrateAdvisorInternalState = useCallback(async () => {
    if (!SoftphoneEnabled || isCompanionTab) {
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
  }, [getAdvisorInternalState, isCompanionTab]);

  useEffect(() => {
    if (!SoftphoneEnabled) {
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
  }, [hydrateAdvisorInternalState, isCompanionTab, softphoneStatus]);

  useEffect(() => {
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
      isMuted: Boolean(twilioCallRef.current) ? isMuted : false,
      activeCall: activeCall ?? null,
      incomingCall: incomingCall ?? null,
    });
  }, [
    activeCall,
    advisorInternalState,
    connectionStatus,
    hasActiveCall,
    incomingCall,
    isMuted,
    onCallActivityChanged,
    presenceStatus,
    softphoneStatus,
  ]);

  useEffect(() => {
    const normalized = normalizeDialInput(initialPhone ?? "");
    setDestination(normalized);
  }, [initialPhone]);

  useEffect(() => {
    const normalized = normalizeDialInput(initialFrom ?? "");
    setFromNumber(normalized);
  }, [initialFrom]);

  const syncPresenceConnect = useCallback(
    async (isAvailable: boolean, currentCallSid?: string | null): Promise<boolean> => {
      if (!SoftphoneEnabled) {
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
        logWebRtcSuccess("presence_connect", {
          context: contextSnapshot,
          availability: response.data.availability,
          sessionRef: response.data.sessionRef ?? payload.sessionRef,
          expiresAtUtc: response.data.expiresAtUtc ?? null,
        });
        return true;
      }

      presenceConnectedRef.current = false;
      setPresenceStatus("error");
      const error = buildWebRtcUiError(response, "No fue posible registrar presencia del agente.");
      logWebRtcWarn("presence_connect_failed", {
        context: contextSnapshot,
        error,
      });
      return false;
    },
    [connectPresence, contextSnapshot, isCompanionTab]
  );

  const syncPresenceHeartbeat = useCallback(
    async (isAvailable: boolean): Promise<void> => {
      if (!SoftphoneEnabled || isCompanionTab || !presenceConnectedRef.current) {
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

      const error = buildWebRtcUiError(response, "No fue posible refrescar heartbeat de presencia.");
      logWebRtcWarn("presence_heartbeat_failed", {
        context: contextSnapshot,
        error,
      });
    },
    [contextSnapshot, heartbeatPresence, isCompanionTab]
  );

  const syncPresenceAvailability = useCallback(
    async (availability: PresenceAvailability, currentCallSid?: string | null): Promise<void> => {
      if (!SoftphoneEnabled || isCompanionTab || !presenceConnectedRef.current) {
        return;
      }

      const payload: SetWebRtcPresenceAvailabilityPayload = {
        availability,
        currentCallSid: currentCallSid ?? undefined,
        ttlSeconds: availability === "offline" ? undefined : 60,
      };

      const response = await setPresenceAvailability(payload);
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

      const error = buildWebRtcUiError(response, "No fue posible actualizar disponibilidad del agente.");
      logWebRtcWarn("presence_availability_failed", {
        context: contextSnapshot,
        availability,
        error,
      });
    },
    [contextSnapshot, isCompanionTab, setPresenceAvailability]
  );

  const syncPresenceDisconnect = useCallback(
    async (reason: string): Promise<void> => {
      if (!SoftphoneEnabled || isCompanionTab || !presenceConnectedRef.current) {
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

      const error = buildWebRtcUiError(response, "No fue posible desconectar presencia.");
      logWebRtcWarn("presence_disconnect_failed", {
        context: contextSnapshot,
        reason,
        error,
      });
    },
    [contextSnapshot, disconnectPresence, isCompanionTab]
  );

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

  useEffect(() => {
    if (!SoftphoneEnabled || !presenceConnectedRef.current) {
      return;
    }

    if (connectionStatus === "disconnected" || connectionStatus === "connecting" || connectionStatus === "error") {
      return;
    }

    const send = () => {
      const isAvailable = connectionStatus === "connected"
        && advisorInternalState === "disponible"
        && !Boolean(twilioCallRef.current)
        && !Boolean(incomingCallRef.current);
      void syncPresenceHeartbeat(isAvailable);
    };

    send();
    const interval = window.setInterval(send, 20000);
    return () => window.clearInterval(interval);
  }, [advisorInternalState, connectionStatus, syncPresenceHeartbeat]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!presenceConnectedRef.current) {
        return;
      }

      void disconnectPresence();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [disconnectPresence]);

  const connectAgent = useCallback(async (): Promise<boolean> => {
    if (isCompanionTab) {
      setConnectionStatus("disconnected");
      setPresenceStatus("offline");
      if (SoftphoneEnabled) {
        setSoftphoneStatus("disabled");
      }
      notifyOwnerOnlyBlocked("connect_agent");
      return false;
    }

    setConnectionStatus("connecting");
    setLastError(null);

    logWebRtcInfo("agent_connect_start", {
      context: contextSnapshot,
      currentStatus: connectionStatus,
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
  }, [
    advisorInternalState,
    connectionStatus,
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
          message: "Esta pestaña esta en modo acompañante. Usa la pestaña dueña del softphone.",
        };
      }

      const normalizedToResult = normalizePhoneByCountry(targetNumber, "destino", selectedCountry);
      let activeDevice = twilioDeviceRef.current;
      let callSystemTenantId = callSystemTenantIdRef.current;
      let useSoftphonePath = Boolean(SoftphoneEnabled && activeDevice && callSystemTenantId);
      const shouldEnsureSoftphoneReady = SoftphoneEnabled
        && (!activeDevice || !callSystemTenantId || softphoneStatus !== "registered");

      if (connectionStatus !== "connected" || shouldEnsureSoftphoneReady) {
        logWebRtcInfo("call_auto_connect_start", {
          source,
          context: contextSnapshot,
          currentStatus: connectionStatus,
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
        useSoftphonePath = Boolean(SoftphoneEnabled && activeDevice && callSystemTenantId);
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
          code: useSoftphonePath ? "WebRtc.Validation.FromInvalidSoftphone" : "WebRtc.Validation.FromInvalid",
          type: "Validation",
          statusCode: 400,
          errors: [],
        };
        setLastError(error);
        onError?.(error);
        logWebRtcWarn(useSoftphonePath ? "call_validation_from_softphone" : "call_validation_from", {
          source,
          from: normalizeDialInput(effectiveFromInput ?? ""),
          context: contextSnapshot,
        });
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

      if (SoftphoneEnabled && !useSoftphonePath) {
        logWebRtcWarn("call_softphone_fallback_backend", {
          source,
          hasDevice: Boolean(activeDevice),
          hasTenantId: Boolean(callSystemTenantId),
          softphoneStatus,
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

          const provisionalCall = buildSoftphoneCallDto(browserCall, normalizedTo, normalizedFrom || null);
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
            const acceptedCallSid = acceptedCall.parameters?.CallSid ?? provisionalCall.callSid ?? "";
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
              callSid: browserCall.parameters?.CallSid ?? provisionalCall.callSid ?? null,
              context: contextSnapshot,
            });
          });

          browserCall.on("audio", (remoteAudio: HTMLAudioElement) => {
            logWebRtcInfo("call_softphone_audio_ready", {
              callSid: browserCall.parameters?.CallSid ?? provisionalCall.callSid ?? null,
              hasRemoteAudio: Boolean(remoteAudio),
              context: contextSnapshot,
            });
          });

          browserCall.on("disconnect", (disconnectedCall: Call) => {
            twilioCallRef.current = null;
            const endedCall: WebRtcCallDto = {
              ...provisionalCall,
              callSid: disconnectedCall.parameters?.CallSid ?? provisionalCall.callSid,
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
              callSid: browserCall.parameters?.CallSid ?? provisionalCall.callSid,
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
              callSid: browserCall.parameters?.CallSid ?? provisionalCall.callSid,
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
            const uiError = toWebRtcUiErrorFromTwilio("Error en llamada WebRTC del navegador.", twilioError);
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
              callSid: browserCall.parameters?.CallSid ?? provisionalCall.callSid ?? null,
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
        idempotencyKey: createIdempotencyKey(),
        sessionRef: runtimeSessionRef ?? undefined,
      };
      if (normalizedFrom) {
        payload.from = normalizedFrom;
      }

      const response = await createCall(payload);
      if (response?.success && response.data) {
        const call = response.data;
        const connectionStatusFromCall = mapCallStatusToConnectionStatus(call.status);
        bindRuntimeCall(call.callSid);
        setActiveCall(call);
        setLastDialedNumber(normalizedTo);
        setDestination(normalizedTo);
        setConnectionStatus(connectionStatusFromCall);
        setLastError(null);

        notifyCallStarted(call);
        void syncAdvisorInternalState(
          connectionStatusFromCall === "connected" ? "disponible" : "ocupado_llamada",
          connectionStatusFromCall === "connected"
            ? "backend_call_ended"
            : connectionStatusFromCall === "in_call"
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

      const error = buildWebRtcUiError(response, "No fue posible crear la llamada.");
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
      connectionStatus,
      contextSnapshot,
      createCall,
      defaultDirection,
      fromNumber,
      bindRuntimeCall,
      isCompanionTab,
      selectedCountry,
      softphoneStatus,
      connectAgent,
      notifyOwnerOnlyBlocked,
      notifyCallStarted,
      notifyCallEnded,
      notifyCallStatusChanged,
      onError,
      refreshRecentCalls,
      syncAdvisorInternalState,
      syncPresenceAvailability,
      runtimeSessionRef,
    ]
  );

  useEffect(() => {
    if (!enableGlobalBridge) {
      return;
    }

    registerGlobalWebRtcOutboundDialHandler(async (request) => {
      const destinationInput = normalizeDialInput(request.destination ?? "");
      const fromInput = request.from == null ? null : normalizeDialInput(request.from ?? "");

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
    });

    return () => {
      registerGlobalWebRtcOutboundDialHandler(null);
    };
  }, [dial, enableGlobalBridge]);

  const applyAdvisorStateChange = useCallback(async (
    nextState: AdvisorInternalState
  ): Promise<WebRtcAdvisorStateChangeResult> => {
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
        message: "Solo la pestaña dueña puede cambiar el estado del asesor.",
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
      activeCall?.callSid ?? null,
      "manual_status_change"
    );

    if (!synced) {
      return {
        ok: false,
        message: "No fue posible cambiar el estado del asesor.",
      };
    }

    return { ok: true };
  }, [
    activeCall?.callSid,
    advisorInternalState,
    connectionStatus,
    hasActiveCall,
    isCompanionTab,
    notifyOwnerOnlyBlocked,
    onError,
    syncAdvisorInternalState,
  ]);

  useEffect(() => {
    if (!enableGlobalBridge) {
      return;
    }

    registerGlobalWebRtcAdvisorStateChangeHandler(applyAdvisorStateChange);
    return () => {
      registerGlobalWebRtcAdvisorStateChangeHandler(null);
    };
  }, [applyAdvisorStateChange, enableGlobalBridge]);

  const handleHangup = useCallback(async () => {
    if (isCompanionTab) {
      notifyOwnerOnlyBlocked("hangup");
      return;
    }

    const browserCall = twilioCallRef.current;
    if (SoftphoneEnabled && browserCall) {
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
    setConnectionStatus(hasActiveCall ? "in_call" : "connected");
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
    destination,
    fromNumber,
    contextSnapshot,
    hangupCall,
    hasActiveCall,
    isCompanionTab,
    notifyOwnerOnlyBlocked,
    notifyCallEnded,
    onError,
    refreshRecentCalls,
    syncAdvisorInternalState,
    syncPresenceAvailability,
  ]);

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
        callSid: incomingBrowserCall.parameters?.CallSid ?? incomingCall?.callSid ?? null,
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
        callSid: incomingBrowserCall.parameters?.CallSid ?? incomingCall?.callSid ?? null,
      });
    }
  }, [contextSnapshot, incomingCall?.callSid, isCompanionTab, notifyOwnerOnlyBlocked, onError]);

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
        callSid: incomingBrowserCall.parameters?.CallSid ?? incomingCall?.callSid ?? null,
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
        callSid: incomingBrowserCall.parameters?.CallSid ?? incomingCall?.callSid ?? null,
      });
    }
  }, [contextSnapshot, incomingCall?.callSid, isCompanionTab, notifyOwnerOnlyBlocked, onError]);

  const handleToggleMute = useCallback(async (): Promise<WebRtcCallControlResult> => {
    if (isCompanionTab) {
      notifyOwnerOnlyBlocked("toggle_mute");
      return {
        ok: false,
        message: "Solo la pestaña dueña puede controlar el audio de la llamada.",
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
  }, [activeCall?.callSid, contextSnapshot, isCompanionTab, isMuted, notifyOwnerOnlyBlocked, onError]);

  useEffect(() => {
    if (!enableGlobalBridge) {
      return;
    }

    registerGlobalWebRtcCallControlHandler(async (action) => {
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
    });

    return () => {
      registerGlobalWebRtcCallControlHandler(null);
    };
  }, [
    activeCall,
    enableGlobalBridge,
    handleAcceptIncoming,
    handleHangup,
    handleRejectIncoming,
    handleToggleMute,
  ]);

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
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div className="small">
                <strong>{isCompanionTab ? "Modo acompañante" : "Pestaña dueña"}</strong>
                <div>
                  {isCompanionTab
                    ? "Solo visualiza estado. Las acciones de softphone se ejecutan en la pestaña dueña."
                    : "Esta pestaña controla conexión, llamadas entrantes y presencia WebRTC."}
                </div>
              </div>
              <div className="small text-muted text-end">
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
            <Row className="g-2 mb-2">
              <Col md={4}>
                <Form.Group controlId="webrtcDialerCountryCode">
                  <Form.Label className="mb-1">Extension</Form.Label>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" id="webrtcDialerCountryPicker">
                      {selectedCountry.flag} {selectedCountry.dialCode}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {CountryDialOptions.map((country) => (
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

            <Row className="g-2">
              <Col md={7}>
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
              <Col md={5}>
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

            <div className="d-flex flex-wrap gap-2 mt-3">
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

        <div className="d-flex flex-wrap gap-2 mt-3">
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
                  ? ` | Auditado: ${formatDate(advisorStateChangedAt)}`
                  : ""}
              </Form.Text>
            </Form.Group>
          )}
          <div>
            <strong>AgentId:</strong> {agentId || "-"}
          </div>
          <div>
            <strong>Token expira:</strong> {formatDate(tokenExpiresAtUtc)}
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
                <strong>Recibida:</strong> {formatDate(incomingCall.receivedAt)}
              </div>
            </div>
            <div className="d-flex gap-2 mt-2">
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
