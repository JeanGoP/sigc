import type {
  GestionLlamadaEventRequest,
  GestionLlamadaEventType,
} from "../GestionLlamadaService";
import type { GlobalWebRtcRuntimeSnapshot } from "./runtimeContracts";
import type { WebRtcCallDto } from "./webrtcService";

export interface EndedCallSummary {
  callSid: string;
  from: string;
  to: string;
  status: string;
  durationText: string;
}

export interface SoftphoneCallEventSession {
  idGestionSession?: number | null;
  sessionRef?: string | null;
}

export interface SoftphonePendingInboundCallInput {
  callSid: string;
  direction?: string | null;
  status?: string | null;
  from?: string | null;
  to?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
}

export interface SoftphoneCallEventRegistration {
  request: GestionLlamadaEventRequest;
  isInbound: boolean;
  pendingInboundCall: SoftphonePendingInboundCallInput | null;
}

export interface SoftphoneCallDisplayState {
  activeContactInitials: string;
  activeContactName: string;
  hasCallInProgress: boolean;
  hasIncomingCall: boolean;
  hasLiveCall: boolean;
  incomingFrom: string;
  incomingTo: string;
  isInConnectedCall: boolean;
  showCallSummaryCard: boolean;
  showIncomingCard: boolean;
  showLiveHeaderCard: boolean;
}

export function formatElapsedClock(
  startedAt?: string | null,
  fallbackAt?: string | null,
  nowMs = Date.now()
): string {
  const reference = startedAt || fallbackAt;
  if (!reference) {
    return "00:00:00";
  }

  const startedMs = Date.parse(reference);
  if (Number.isNaN(startedMs)) {
    return "00:00:00";
  }

  const seconds = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
  const hh = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const mm = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function formatCallDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(safe / 3600).toString().padStart(2, "0");
  const mm = Math.floor((safe % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function getCallStatusLabel(statusRaw: string): string {
  const status = String(statusRaw || "").trim().toLowerCase();
  switch (status) {
    case "completed":
      return "Finalizada";
    case "canceled":
      return "Cancelada";
    case "rejected":
      return "Rechazada";
    case "failed":
      return "Fallida";
    case "no-answer":
    case "noanswer":
      return "Sin respuesta";
    case "busy":
      return "Ocupado";
    case "ringing":
      return "Sonando";
    case "in-progress":
      return "En llamada";
    default:
      return statusRaw || "Finalizada";
  }
}

export function buildEndedCallSummary(
  call: WebRtcCallDto
): EndedCallSummary {
  const startedMs = Date.parse(call.startedAt ?? "");
  const endedMs = Date.parse(call.endedAt ?? "");

  const durationSec =
    typeof call.durationSec === "number" && Number.isFinite(call.durationSec)
      ? Math.max(0, Math.floor(call.durationSec))
      : !Number.isNaN(startedMs) &&
          !Number.isNaN(endedMs) &&
          endedMs >= startedMs
        ? Math.floor((endedMs - startedMs) / 1000)
        : 0;

  return {
    callSid: String(call.callSid ?? "").trim(),
    from: String(call.from ?? "").trim() || "-",
    to: String(call.to ?? "").trim() || "-",
    status: getCallStatusLabel(call.status),
    durationText: formatCallDuration(durationSec),
  };
}

export function isInboundCallDirection(
  directionRaw?: string | null
): boolean {
  const direction = String(directionRaw ?? "").trim().toLowerCase();
  return direction.includes("inbound") || direction.includes("incoming");
}

export function resolveActiveContactName(call: WebRtcCallDto | null): string {
  if (!call) {
    return "-";
  }

  if (isInboundCallDirection(call.direction)) {
    return String(call.from ?? "").trim() || String(call.to ?? "").trim() || "-";
  }

  return String(call.to ?? "").trim() || String(call.from ?? "").trim() || "-";
}

export function buildContactInitials(value: string): string {
  const clean = String(value || "").trim();
  if (!clean || clean === "-") {
    return "CL";
  }

  if (/^\+?\d+$/.test(clean)) {
    return clean.slice(-2).toUpperCase();
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function shouldTrackPendingInboundCall(
  eventType: GestionLlamadaEventType,
  statusRaw?: string | null
): boolean {
  const status = String(statusRaw ?? "").trim().toLowerCase();
  if (!status) {
    return eventType === "end";
  }

  if (eventType === "status" || eventType === "start") {
    return (
      status === "in-progress" ||
      status === "in_progress" ||
      status === "answered"
    );
  }

  if (eventType === "end") {
    return ![
      "canceled",
      "cancelled",
      "rejected",
      "no-answer",
      "busy",
      "failed",
      "error",
    ].includes(status);
  }

  return false;
}

export function isAdministratorRole(role?: string | null): boolean {
  return String(role ?? "").trim().toLowerCase() === "administrador";
}

export function buildSoftphoneCallEventRegistration({
  activeSession,
  call,
  eventType,
  nowIso = new Date().toISOString(),
}: {
  activeSession?: SoftphoneCallEventSession | null;
  call: WebRtcCallDto | null | undefined;
  eventType: GestionLlamadaEventType;
  nowIso?: string;
}): SoftphoneCallEventRegistration | null {
  const callSid = String(call?.callSid ?? "").trim();
  if (!call || !callSid) {
    return null;
  }

  const inbound = isInboundCallDirection(call.direction);
  const endedAt =
    eventType === "end"
      ? call.endedAt ?? nowIso
      : call.endedAt ?? null;

  if (!inbound) {
    const sessionRef = activeSession?.sessionRef ?? null;
    if (!sessionRef) {
      return null;
    }

    return {
      isInbound: false,
      pendingInboundCall: null,
      request: {
        idGestionSession: activeSession?.idGestionSession ?? undefined,
        sessionRef,
        callSid,
        eventType,
        direction: call.direction ?? "outbound-client",
        status: call.status ?? null,
        finalStatus: eventType === "end" ? call.status ?? null : null,
        startedAt: call.startedAt ?? null,
        endedAt,
        durationSec: call.durationSec ?? null,
        costFinal: call.costFinal ?? null,
        currency: call.currency ?? null,
        recordingSid: call.recordingSid ?? null,
        source: `softphone_widget_outbound_${eventType}`,
      },
    };
  }

  const request: GestionLlamadaEventRequest = {
    callSid,
    eventType,
    direction: call.direction ?? "inbound-client",
    status: call.status ?? null,
    finalStatus: eventType === "end" ? call.status ?? null : null,
    startedAt: call.startedAt ?? null,
    endedAt,
    durationSec: call.durationSec ?? null,
    costFinal: call.costFinal ?? null,
    currency: call.currency ?? null,
    recordingSid: call.recordingSid ?? null,
    source: `softphone_widget_inbound_${eventType}`,
  };

  const pendingInboundCall = shouldTrackPendingInboundCall(eventType, request.status)
    ? {
      callSid,
      direction: request.direction,
      status: request.status,
      from: call.from ?? null,
      to: call.to ?? null,
      startedAt: request.startedAt,
      endedAt: request.endedAt,
    }
    : null;

  return {
    isInbound: true,
    pendingInboundCall,
    request,
  };
}

export function buildSoftphoneCallDisplayState(
  snapshot: GlobalWebRtcRuntimeSnapshot,
  {
    experimentalCallHudEnabled,
    hasEndedCallSummary,
  }: {
    experimentalCallHudEnabled: boolean;
    hasEndedCallSummary: boolean;
  }
): SoftphoneCallDisplayState {
  const hasIncomingCall = Boolean(snapshot.incomingCall?.callSid);
  const hasCallInProgress = Boolean(
    snapshot.inProgress
      || snapshot.connectionStatus === "dialing"
      || snapshot.connectionStatus === "in_call"
  );
  const hasLiveCall = hasCallInProgress && !hasIncomingCall;
  const activeContactName = resolveActiveContactName(snapshot.activeCall);

  return {
    activeContactInitials: buildContactInitials(activeContactName),
    activeContactName,
    hasCallInProgress,
    hasIncomingCall,
    hasLiveCall,
    incomingFrom: snapshot.incomingCall?.from || "-",
    incomingTo: snapshot.incomingCall?.to || "-",
    isInConnectedCall: snapshot.connectionStatus === "in_call",
    showCallSummaryCard:
      experimentalCallHudEnabled
      && !hasIncomingCall
      && !hasCallInProgress
      && hasEndedCallSummary,
    showIncomingCard: experimentalCallHudEnabled && hasIncomingCall,
    showLiveHeaderCard: experimentalCallHudEnabled && hasLiveCall,
  };
}
