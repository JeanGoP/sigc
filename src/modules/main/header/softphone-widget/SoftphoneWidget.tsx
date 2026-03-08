import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
  faPhone,
  faPhoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import WebRtcDialer from "@app/components/WebRtcDialer/WebRtcDialer";
import { useWebRtcTabOwnership } from "@app/hooks/useWebRtcTabOwnership";
import { AdvisorInternalState, WebRtcCallDto } from "@app/services/WebRtc/webrtcService";
import {
  AdvisorInternalStateOrder,
  getAdvisorInternalStateLabel,
  getCallGestionSessionBinding,
  removeCallGestionSessionBinding,
  upsertPendingInboundCall,
} from "@app/services/GestionLlamadas";
import {
  getGlobalWebRtcRuntimeSnapshot,
  requestGlobalWebRtcAdvisorStateChange,
  requestGlobalWebRtcCallControl,
  subscribeGlobalWebRtcCallStarted,
  subscribeGlobalWebRtcCallEnded,
  subscribeGlobalWebRtcCallStatusChanged,
  subscribeGlobalWebRtcRuntimeSnapshot,
} from "@app/services/WebRtc/webrtcBridge";
import { toast } from "react-toastify";
import {
  GestionLlamadaEventType,
  useGestionLlamadaService,
} from "@app/services/GestionLlamadaService";
import { useGestionSessionContext } from "@app/modules/main/gestion-session/GestionSessionContext";
import { features } from "@app/config/features";

const OWNER_CHANNEL_KEY = "consulta_cartera_webrtc_owner";
const CALL_SUMMARY_AUTO_HIDE_MS = 16000;
const EXPERIMENTAL_CALL_HUD_ENABLED = features.experimentalCallHudEnabled;

interface EndedCallSummary {
  callSid: string;
  from: string;
  to: string;
  status: string;
  durationText: string;
}

function formatElapsedClock(startedAt?: string | null, fallbackAt?: string | null): string {
  const reference = startedAt || fallbackAt;
  if (!reference) {
    return "00:00:00";
  }

  const startedMs = Date.parse(reference);
  if (Number.isNaN(startedMs)) {
    return "00:00:00";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
  const hh = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const mm = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(safe / 3600).toString().padStart(2, "0");
  const mm = Math.floor((safe % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function getStatusLabel(statusRaw: string): string {
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

function buildEndedCallSummary(call: WebRtcCallDto): EndedCallSummary {
  const startedMs = Date.parse(call.startedAt ?? "");
  const endedMs = Date.parse(call.endedAt ?? "");

  const durationSec = typeof call.durationSec === "number" && Number.isFinite(call.durationSec)
    ? Math.max(0, Math.floor(call.durationSec))
    : !Number.isNaN(startedMs) && !Number.isNaN(endedMs) && endedMs >= startedMs
      ? Math.floor((endedMs - startedMs) / 1000)
      : 0;

  return {
    callSid: String(call.callSid ?? "").trim(),
    from: String(call.from ?? "").trim() || "-",
    to: String(call.to ?? "").trim() || "-",
    status: getStatusLabel(call.status),
    durationText: formatDuration(durationSec),
  };
}

function resolveActiveContactName(call: WebRtcCallDto | null): string {
  if (!call) {
    return "-";
  }

  const direction = String(call.direction ?? "").trim().toLowerCase();
  const isInbound = direction.includes("inbound") || direction.includes("incoming");
  if (isInbound) {
    return String(call.from ?? "").trim() || String(call.to ?? "").trim() || "-";
  }

  return String(call.to ?? "").trim() || String(call.from ?? "").trim() || "-";
}

function buildContactInitials(value: string): string {
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

function isInboundCallDirection(directionRaw?: string | null): boolean {
  const direction = String(directionRaw ?? "").trim().toLowerCase();
  return direction.includes("inbound") || direction.includes("incoming");
}

function shouldTrackPendingInboundCall(
  eventType: GestionLlamadaEventType,
  statusRaw?: string | null
): boolean {
  const status = String(statusRaw ?? "").trim().toLowerCase();
  if (!status) {
    return eventType === "end";
  }

  if (eventType === "status") {
    return status === "in-progress" || status === "in_progress" || status === "answered";
  }

  if (eventType === "start") {
    return status === "in-progress" || status === "in_progress" || status === "answered";
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

export default function SoftphoneWidget() {
  const [open, setOpen] = useState(false);
  const [runtimeSnapshot, setRuntimeSnapshot] = useState(
    getGlobalWebRtcRuntimeSnapshot()
  );
  const [callClockText, setCallClockText] = useState("00:00:00");
  const [endedCallSummary, setEndedCallSummary] = useState<EndedCallSummary | null>(null);
  const { registrarEventoLlamada } = useGestionLlamadaService();
  const { activeSession } = useGestionSessionContext();

  const ownership = useWebRtcTabOwnership({
    channelKey: OWNER_CHANNEL_KEY,
    enabled: true,
    ttlSeconds: 45,
    debug: true,
  });

  useEffect(() => {
    return subscribeGlobalWebRtcRuntimeSnapshot((snapshot) => {
      setRuntimeSnapshot(snapshot);
    });
  }, []);

  useEffect(() => {
    return subscribeGlobalWebRtcCallEnded((call) => {
      if (!call) {
        return;
      }
      setEndedCallSummary(buildEndedCallSummary(call));
    });
  }, []);

  useEffect(() => {
    const registerCallEvent = async (
      eventType: GestionLlamadaEventType,
      call: WebRtcCallDto | null
    ) => {
      if (!call?.callSid) {
        return;
      }

      const callSid = String(call.callSid).trim();
      if (!callSid) {
        return;
      }

      if (!isInboundCallDirection(call.direction)) {
        const binding = getCallGestionSessionBinding(callSid);
        if (!binding?.sessionRef) {
          return;
        }

        const response = await registrarEventoLlamada({
          idGestionSession: binding.idGestionSession ?? undefined,
          sessionRef: binding.sessionRef,
          callSid,
          eventType,
          direction: call.direction ?? "outbound-client",
          status: call.status ?? null,
          finalStatus: eventType === "end" ? call.status ?? null : null,
          startedAt: call.startedAt ?? null,
          endedAt:
            eventType === "end"
              ? call.endedAt ?? new Date().toISOString()
              : call.endedAt ?? null,
          durationSec: call.durationSec ?? null,
          costFinal: call.costFinal ?? null,
          currency: call.currency ?? null,
          recordingSid: call.recordingSid ?? null,
          source: `softphone_widget_outbound_${eventType}`,
        });

        if (!response?.success) {
          console.warn("[SoftphoneWidget] No se pudo registrar outbound ligado", {
            eventType,
            callSid,
            message: response?.message ?? "sin respuesta",
            statusCode: response?.statusCode ?? null,
          });
        }

        if (eventType === "end") {
          removeCallGestionSessionBinding(callSid);
        }
        return;
      }

      const payload = {
        callSid,
        eventType,
        direction: call.direction ?? "inbound-client",
        status: call.status ?? null,
        finalStatus: eventType === "end" ? call.status ?? null : null,
        startedAt: call.startedAt ?? null,
        endedAt:
          eventType === "end"
            ? call.endedAt ?? new Date().toISOString()
            : call.endedAt ?? null,
        durationSec: call.durationSec ?? null,
        costFinal: call.costFinal ?? null,
        currency: call.currency ?? null,
        recordingSid: call.recordingSid ?? null,
        source: `softphone_widget_inbound_${eventType}`,
      };

      const response = await registrarEventoLlamada(payload);
      if (!response?.success) {
        console.warn("[SoftphoneWidget] No se pudo registrar inbound provisional", {
          eventType,
          callSid,
          message: response?.message ?? "sin respuesta",
          statusCode: response?.statusCode ?? null,
        });
      }

      if (shouldTrackPendingInboundCall(eventType, payload.status)) {
        upsertPendingInboundCall({
          callSid,
          direction: payload.direction,
          status: payload.status,
          from: call.from ?? null,
          to: call.to ?? null,
          startedAt: payload.startedAt,
          endedAt: payload.endedAt,
        });
      }
    };

    const unsubscribeStarted = subscribeGlobalWebRtcCallStarted((call) => {
      void registerCallEvent("start", call);
    });
    const unsubscribeStatus = subscribeGlobalWebRtcCallStatusChanged((call) => {
      void registerCallEvent("status", call);
    });
    const unsubscribeEnded = subscribeGlobalWebRtcCallEnded((call) => {
      void registerCallEvent("end", call);
    });

    return () => {
      unsubscribeStarted();
      unsubscribeStatus();
      unsubscribeEnded();
    };
  }, [registrarEventoLlamada]);

  useEffect(() => {
    if (!endedCallSummary) {
      return;
    }

    const timer = window.setTimeout(() => {
      setEndedCallSummary(null);
    }, CALL_SUMMARY_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [endedCallSummary]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCallClockText(
        formatElapsedClock(
          runtimeSnapshot.activeCall?.startedAt ?? null,
          runtimeSnapshot.incomingCall?.receivedAt ?? null
        )
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [runtimeSnapshot.activeCall?.startedAt, runtimeSnapshot.incomingCall?.receivedAt]);

  const ownershipLabel = useMemo(() => {
    if (ownership.isOwner) {
      return "owner";
    }

    if (ownership.hasOwner) {
      return "acom";
    }

    return "sync";
  }, [ownership.hasOwner, ownership.isOwner]);

  const isAvailableAdvisorState = runtimeSnapshot.advisorInternalState === "disponible";
  const advisorStateDotColor = isAvailableAdvisorState ? "#16a34a" : "#dc2626";
  const advisorStateDotTitle = isAvailableAdvisorState
    ? "Asesor disponible"
    : "Asesor no disponible";
  const stateSelectorDisabled = !ownership.isOwner
    || runtimeSnapshot.connectionStatus === "connecting"
    || runtimeSnapshot.connectionStatus === "dialing"
    || runtimeSnapshot.connectionStatus === "in_call";

  const hasIncomingCall = Boolean(runtimeSnapshot.incomingCall?.callSid);
  const hasCallInProgress = Boolean(
    runtimeSnapshot.inProgress
    || runtimeSnapshot.connectionStatus === "dialing"
    || runtimeSnapshot.connectionStatus === "in_call"
  );
  const hasLiveCall = hasCallInProgress && !hasIncomingCall;
  const isInConnectedCall = runtimeSnapshot.connectionStatus === "in_call";

  const activeContactName = resolveActiveContactName(runtimeSnapshot.activeCall);
  const activeContactInitials = buildContactInitials(activeContactName);

  const showIncomingCard = EXPERIMENTAL_CALL_HUD_ENABLED && hasIncomingCall;
  const showLiveHeaderCard = EXPERIMENTAL_CALL_HUD_ENABLED && hasLiveCall;
  const showCallSummaryCard = EXPERIMENTAL_CALL_HUD_ENABLED
    && !hasIncomingCall
    && !hasCallInProgress
    && Boolean(endedCallSummary);

  const handleAdvisorStateChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const nextState = event.target.value as AdvisorInternalState;
    if (!AdvisorInternalStateOrder.includes(nextState)) {
      return;
    }

    const result = await requestGlobalWebRtcAdvisorStateChange(nextState);
    if (result.ok) {
      return;
    }

    toast.warning(
      result.error?.message
      || result.message
      || "No fue posible cambiar el estado del asesor."
    );
  };

  const runCallControlAction = async (
    action: Parameters<typeof requestGlobalWebRtcCallControl>[0]
  ) => {
    const result = await requestGlobalWebRtcCallControl(action);
    if (result.ok) {
      return;
    }

    toast.warning(
      result.error?.message
      || result.message
      || "No fue posible ejecutar la accion de llamada."
    );
  };

  const incomingFrom = runtimeSnapshot.incomingCall?.from || "-";
  const incomingTo = runtimeSnapshot.incomingCall?.to || "-";

  return (
    <>
      <li className="nav-item d-flex align-items-center">
        {showLiveHeaderCard && (
          <div
            className="d-flex align-items-center me-2 px-2 py-1 border rounded"
            style={{
              minWidth: 250,
              maxWidth: 320,
              background: "#f8fafc",
              borderColor: "rgba(0,0,0,0.12)",
              height: 40,
            }}
            title={activeContactName}
          >
            <span
              style={{
                width: 24,
                height: 24,
                minWidth: 24,
                borderRadius: "50%",
                background: "#e5e7eb",
                color: "#4b5563",
                fontSize: 10,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              {activeContactInitials}
            </span>

            <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
              <span
                className="text-truncate"
                style={{ fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.05 }}
              >
                {activeContactName}
              </span>
              <span style={{ fontSize: "0.74rem", color: "#6b7280", lineHeight: 1.1 }}>
                {callClockText}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-link btn-sm px-1 text-danger"
              onClick={() => {
                void runCallControlAction("toggle_mute");
              }}
              disabled={!isInConnectedCall}
              title={runtimeSnapshot.isMuted ? "Activar microfono" : "Silenciar microfono"}
            >
              <FontAwesomeIcon
                icon={runtimeSnapshot.isMuted ? faMicrophoneSlash : faMicrophone}
                style={{ fontSize: "0.85rem" }}
              />
            </button>

            <button
              type="button"
              className="btn btn-link btn-sm px-1 text-success"
              onClick={() => {
                void runCallControlAction("hangup");
              }}
              title="Colgar"
            >
              <FontAwesomeIcon icon={faPhoneSlash} style={{ fontSize: "0.9rem" }} />
            </button>
          </div>
        )}

        <div className="d-flex align-items-center me-2" title={advisorStateDotTitle}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: advisorStateDotColor,
              display: "inline-block",
              marginRight: 8,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
            }}
          />
          <select
            className="form-control form-control-sm"
            style={{ width: 170 }}
            value={runtimeSnapshot.advisorInternalState || "disponible"}
            onChange={(event) => {
              void handleAdvisorStateChange(event);
            }}
            disabled={stateSelectorDisabled}
            title={
              ownership.isOwner
                ? "Cambiar estado del asesor"
                : "Solo la pestana duena puede cambiar el estado"
            }
          >
            {AdvisorInternalStateOrder.map((state) => (
              <option key={state} value={state}>
                {getAdvisorInternalStateLabel(state)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="nav-link"
          onClick={() => setOpen((previous) => !previous)}
          title="Softphone"
          aria-label="Softphone"
          style={{ position: "relative" }}
        >
          <FontAwesomeIcon icon={faPhone} />
          <Badge
            variant={runtimeSnapshot.inProgress ? "danger" : "success"}
            className="ms-1"
            style={{ fontSize: "0.62rem", verticalAlign: "middle" }}
          >
            {runtimeSnapshot.inProgress ? "busy" : "ready"}
          </Badge>
          <Badge
            variant={ownership.isOwner ? "primary" : "secondary"}
            className="ms-1"
            style={{ fontSize: "0.58rem", verticalAlign: "middle" }}
          >
            {ownershipLabel}
          </Badge>
        </button>
      </li>

      {showIncomingCard && (
        <div
          style={{
            position: "fixed",
            top: 60,
            right: 16,
            width: "min(360px, calc(100vw - 20px))",
            zIndex: 1095,
            borderRadius: 12,
            background: "#111827",
            color: "#fff",
            boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
            padding: "12px 14px",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong style={{ fontSize: "0.95rem" }}>Llamada entrante</strong>
            <span style={{ fontSize: "0.8rem", opacity: 0.9 }}>{callClockText}</span>
          </div>
          <div style={{ fontSize: "0.82rem", opacity: 0.95 }}>
            <div><strong>Desde:</strong> {incomingFrom}</div>
            <div><strong>Hacia:</strong> {incomingTo}</div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              type="button"
              className="btn btn-success btn-sm flex-fill"
              onClick={() => {
                void runCallControlAction("accept_incoming");
              }}
            >
              Contestar
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm flex-fill"
              onClick={() => {
                void runCallControlAction("reject_incoming");
              }}
            >
              Rechazar
            </button>
          </div>
        </div>
      )}

      {showCallSummaryCard && endedCallSummary && (
        <div
          style={{
            position: "fixed",
            top: 60,
            right: 16,
            width: "min(360px, calc(100vw - 20px))",
            zIndex: 1092,
            borderRadius: 12,
            background: "#f9fafb",
            color: "#111827",
            boxShadow: "0 16px 36px rgba(0,0,0,0.20)",
            border: "1px solid rgba(0,0,0,0.12)",
            padding: "12px 14px",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong style={{ fontSize: "0.95rem" }}>Resumen de llamada</strong>
            <button
              type="button"
              className="btn btn-link btn-sm p-0"
              onClick={() => setEndedCallSummary(null)}
            >
              Cerrar
            </button>
          </div>
          <div style={{ fontSize: "0.82rem" }}>
            <div><strong>Estado:</strong> {endedCallSummary.status}</div>
            <div><strong>Duracion:</strong> {endedCallSummary.durationText}</div>
            <div><strong>Desde:</strong> {endedCallSummary.from}</div>
            <div><strong>Hacia:</strong> {endedCallSummary.to}</div>
          </div>
          {endedCallSummary.callSid && (
            <div className="mt-2" style={{ fontSize: "0.72rem", color: "#6b7280" }}>
              SID: {endedCallSummary.callSid}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          position: "fixed",
          top: 60,
          right: 16,
          width: "min(440px, calc(100vw - 24px))",
          zIndex: 1080,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transform: open ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 140ms ease, transform 140ms ease",
        }}
      >
        <WebRtcDialer
          className="mb-0"
          runtime={{
            sessionRef: activeSession?.sessionRef ?? null,
            idGestionSession: activeSession?.idGestionSession ?? null,
            tabId: ownership.tabId,
            ownerTabId: ownership.ownerTabId,
            isOwnerTab: ownership.isOwner,
          }}
          showOutboundControls={false}
          showRecentCalls={false}
          enableGlobalBridge
          showAdvisorStateControl={false}
          canStartOutboundCall
          startOutboundBlockedReason={null}
        />
      </div>
    </>
  );
}
