import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretDown,
  faMicrophone,
  faMicrophoneSlash,
  faPhone,
  faPhoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import WebRtcDialer from "@app/components/WebRtcDialer/WebRtcDialer";
import { useWebRtcSoftphoneOwnership } from "@app/hooks/useWebRtcSoftphoneOwnership";
import type { AdvisorInternalState } from "@app/services/WebRtc/webrtcService";
import {
  AdvisorInternalStateOrder,
  getAdvisorInternalStateLabel,
} from "@app/services/GestionLlamadas";
import {
  getGlobalWebRtcRuntimeSnapshot,
  requestGlobalWebRtcAdvisorStateChange,
  requestGlobalWebRtcCallControl,
  subscribeGlobalWebRtcCallEnded,
  subscribeGlobalWebRtcRuntimeSnapshot,
} from "@app/services/WebRtc/webrtcBridge";
import { toast } from "react-toastify";
import { useGestionSessionContext } from "@app/modules/main/gestion-session/GestionSessionContext";
import { features } from "@app/config/features";
import { useAppSelector } from "@app/store/store";
import { useSoftphoneCallEventRegistration } from "./hooks/useSoftphoneCallEventRegistration";
import {
  buildEndedCallSummary,
  buildSoftphoneCallDisplayState,
  formatElapsedClock,
  isAdministratorRole,
} from "@app/services/WebRtc/softphoneWidgetHelpers";
import type { EndedCallSummary } from "@app/services/WebRtc/softphoneWidgetHelpers";
import { WEBRTC_CALL_SUMMARY_AUTO_HIDE_MS } from "@app/services/WebRtc/runtimeContracts";

const EXPERIMENTAL_CALL_HUD_ENABLED = features.experimentalCallHudEnabled;

export default function SoftphoneWidget() {
  const [open, setOpen] = useState(false);
  const [runtimeSnapshot, setRuntimeSnapshot] = useState(
    getGlobalWebRtcRuntimeSnapshot()
  );
  const [callClockText, setCallClockText] = useState("00:00:00");
  const [endedCallSummary, setEndedCallSummary] = useState<EndedCallSummary | null>(null);
  const { activeSession } = useGestionSessionContext();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const isMobile = useAppSelector((state) => state.ui.screenSize) === "xs";
  const canViewSoftphoneButton = isAdministratorRole(currentUser?.role);

  const ownership = useWebRtcSoftphoneOwnership({
    enabled: true,
    ttlSeconds: 45,
    debug: true,
  });

  useSoftphoneCallEventRegistration({
    activeSession,
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
    if (!canViewSoftphoneButton && open) {
      setOpen(false);
    }
  }, [canViewSoftphoneButton, open]);

  useEffect(() => {
    if (!endedCallSummary) {
      return;
    }

    const timer = window.setTimeout(() => {
      setEndedCallSummary(null);
    }, WEBRTC_CALL_SUMMARY_AUTO_HIDE_MS);

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

  const ownershipLabel = ownership.ownershipLabel;

  const isAvailableAdvisorState = runtimeSnapshot.advisorInternalState === "disponible";
  const advisorStateDotColor = isAvailableAdvisorState ? "#16a34a" : "#dc2626";
  const advisorStateDotTitle = isAvailableAdvisorState
    ? "Asesor disponible"
    : "Asesor no disponible";
  const stateSelectorDisabled = !ownership.canControlSoftphone
    || runtimeSnapshot.connectionStatus === "connecting"
    || runtimeSnapshot.connectionStatus === "dialing"
    || runtimeSnapshot.connectionStatus === "in_call";

  const callDisplayState = useMemo(
    () =>
      buildSoftphoneCallDisplayState(runtimeSnapshot, {
        experimentalCallHudEnabled: EXPERIMENTAL_CALL_HUD_ENABLED,
        hasEndedCallSummary: Boolean(endedCallSummary),
      }),
    [endedCallSummary, runtimeSnapshot]
  );

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

  return (
    <>
      <li className="nav-item d-flex align-items-center">
        {callDisplayState.showLiveHeaderCard && (
          <div
            className="d-flex align-items-center mr-2 px-2 py-1 border rounded"
            style={{
              /* En móvil la tarjeta se compacta a ícono + cronómetro + controles:
                 con el nombre y el avatar (minWidth 250) desbordaba el header en 375px. */
              minWidth: isMobile ? 0 : 250,
              maxWidth: isMobile ? 150 : 320,
              background: "#f8fafc",
              borderColor: "rgba(0,0,0,0.12)",
              height: 40,
            }}
            title={callDisplayState.activeContactName}
          >
            {!isMobile && (
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
                {callDisplayState.activeContactInitials}
              </span>
            )}

            {isMobile ? (
              <span
                className="d-flex align-items-center flex-grow-1"
                style={{
                  fontSize: "0.74rem",
                  color: "#374151",
                  fontWeight: 600,
                  minWidth: 0,
                  gap: 4,
                }}
              >
                <FontAwesomeIcon
                  icon={faPhone}
                  style={{ fontSize: "0.7rem", color: "#16a34a" }}
                />
                {callClockText}
              </span>
            ) : (
              <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
                <span
                  className="text-truncate"
                  style={{ fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.05 }}
                >
                  {callDisplayState.activeContactName}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#6b7280", lineHeight: 1.1 }}>
                  {callClockText}
                </span>
              </div>
            )}

            <button
              type="button"
              className="btn btn-link btn-sm px-1 text-danger"
              onClick={() => {
                void runCallControlAction("toggle_mute");
              }}
              disabled={!callDisplayState.isInConnectedCall}
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

        {/* Selector de estado del asesor.
            En móvil se colapsa a una pastilla de solo punto + caret: el <select> nativo
            sigue siendo el control real (conserva el picker del sistema operativo), pero
            se superpone invisible sobre la pastilla, porque un <select> siempre pinta el
            texto de la opción elegida y "Desconectado"/"En pausa" ensanchaban el header. */}
        <div
          className="d-flex align-items-center mr-2"
          style={
            isMobile
              ? {
                  position: "relative",
                  /* Sin esto el área tocable serían solo el punto y el caret (~24x11px). */
                  justifyContent: "center",
                  minWidth: 42,
                  minHeight: 32,
                  padding: "0 8px",
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: 4,
                  background: "#fff",
                }
              : undefined
          }
          title={advisorStateDotTitle}
        >
          <span
            style={{
              width: 10,
              height: 10,
              minWidth: 10,
              borderRadius: "50%",
              backgroundColor: advisorStateDotColor,
              display: "inline-block",
              marginRight: isMobile ? 4 : 8,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
            }}
          />

          {isMobile && (
            <FontAwesomeIcon
              icon={faCaretDown}
              style={{
                fontSize: "0.7rem",
                color: stateSelectorDisabled ? "#adb5bd" : "#6c757d",
              }}
            />
          )}

          <select
            className="form-control form-control-sm"
            style={
              isMobile
                ? {
                    /* Invisible pero encima de la pastilla: el toque abre el picker nativo. */
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    padding: 0,
                    border: "none",
                    cursor: stateSelectorDisabled ? "default" : "pointer",
                  }
                : { width: 170 }
            }
            value={runtimeSnapshot.advisorInternalState || "disponible"}
            onChange={(event) => {
              void handleAdvisorStateChange(event);
            }}
            disabled={stateSelectorDisabled}
            aria-label={advisorStateDotTitle}
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

        {canViewSoftphoneButton && (
          <button
            type="button"
            className="nav-link"
            onClick={() => setOpen((previous) => !previous)}
            title="Softphone"
            aria-label="Softphone"
            style={{ position: "relative" }}
          >
            <FontAwesomeIcon icon={faPhone} />
            {/* Badges de estado 'ready/busy' y 'owner': ocultos en móvil (<768px), visibles en tablet/desktop. */}
            <Badge
              variant={runtimeSnapshot.inProgress ? "danger" : "success"}
              className="ml-1 d-none d-md-inline-block"
              style={{ fontSize: "0.62rem", verticalAlign: "middle" }}
            >
              {runtimeSnapshot.inProgress ? "busy" : "ready"}
            </Badge>
            <Badge
              variant={ownership.isOwner ? "primary" : "secondary"}
              className="ml-1 d-none d-md-inline-block"
              style={{ fontSize: "0.58rem", verticalAlign: "middle" }}
            >
              {ownershipLabel}
            </Badge>
          </button>
        )}
      </li>

      {callDisplayState.showIncomingCard && (
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
            <div><strong>Desde:</strong> {callDisplayState.incomingFrom}</div>
            <div><strong>Hacia:</strong> {callDisplayState.incomingTo}</div>
          </div>

          <div className="d-flex mt-3" style={{ gap: 8 }}>
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

      {callDisplayState.showCallSummaryCard && endedCallSummary && (
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
