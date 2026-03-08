import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Dropdown, Form, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  GestionSession,
  calculateGestionSessionElapsedSeconds,
  useGestionSessionService,
} from "@app/services/GestionSessionService";
import { useGestionSessionContext } from "@app/modules/main/gestion-session/GestionSessionContext";
import { buildConsultaCarteraUrl } from "@app/utils/consultaCarteraNavigation";

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(safe / 3600).toString().padStart(2, "0");
  const mm = Math.floor((safe % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function buildSessionTitle(session: GestionSession): string {
  const factura = String(session.factura || "").trim();
  const cuenta = String(session.cuenta || "").trim();
  if (factura && cuenta) {
    return `${session.cliente} | F${factura} | C${cuenta}`;
  }

  return session.cliente || session.sessionRef;
}

type SessionActionButtonProps = {
  iconClassName: string;
  label: string;
  variant: string;
  onClick: () => void;
  disabled?: boolean;
};

function SessionActionButton({
  iconClassName,
  label,
  variant,
  onClick,
  disabled = false,
}: SessionActionButtonProps) {
  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id={`tooltip-${label.replace(/\s+/g, "-").toLowerCase()}`}>{label}</Tooltip>}
    >
      <span className="d-inline-flex">
        <Button
          size="sm"
          variant={variant}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="d-inline-flex align-items-center justify-content-center"
          style={{ width: 34, height: 34, padding: 0 }}
        >
          <i className={iconClassName} />
        </Button>
      </span>
    </OverlayTrigger>
  );
}

export default function GestionSessionWidget() {
  const navigate = useNavigate();
  const {
    sessions,
    activeSession,
    pausedSessions,
    switchBlockedReason,
    switchActiveSession,
    refreshSessions,
    loading,
  } = useGestionSessionContext();
  const { transitionGestionSession } = useGestionSessionService();
  const [show, setShow] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [switchingSessionRef, setSwitchingSessionRef] = useState<string | null>(null);
  const [cancelModalSession, setCancelModalSession] = useState<GestionSession | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelingSessionRef, setCancelingSessionRef] = useState<string | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const activeElapsedText = useMemo(() => {
    if (!activeSession) {
      return "00:00:00";
    }

    return formatElapsed(calculateGestionSessionElapsedSeconds(activeSession, nowMs));
  }, [activeSession, nowMs]);

  const navigateToSession = (session: GestionSession) => {
    navigate(
      buildConsultaCarteraUrl({
        cuenta: session.cuenta,
        factura: session.factura,
        identificacionCliente: session.cliente,
      })
    );
    setShow(false);
  };

  const handleActivateSession = async (session: GestionSession) => {
    if (switchBlockedReason) {
      toast.warning(switchBlockedReason);
      return;
    }

    setSwitchingSessionRef(session.sessionRef);
    try {
      const result = await switchActiveSession({
        idGestionSession: session.idGestionSession,
        sessionRef: session.sessionRef,
        reason: "quick_switch_from_header",
        source: "navbar_gestion_session_widget",
      });
      const outcome = String(result.operation?.outcomeCode ?? "").trim().toLowerCase();

      if (!result.success && outcome !== "already_active") {
        toast.warning(result.message || "No se pudo activar la gestion seleccionada.");
        return;
      }

      navigateToSession(session);
    } finally {
      setSwitchingSessionRef(null);
    }
  };

  const openCancelModal = (session: GestionSession) => {
    setCancelModalSession(session);
    setCancelReason("");
  };

  const closeCancelModal = () => {
    if (cancelingSessionRef) {
      return;
    }

    setCancelModalSession(null);
    setCancelReason("");
  };

  const handleCancelSession = async () => {
    if (!cancelModalSession) {
      return;
    }

    const reason = cancelReason.trim();
    if (!reason) {
      toast.warning("Debes indicar la razon de la cancelacion.");
      return;
    }

    setCancelingSessionRef(cancelModalSession.sessionRef);
    try {
      const result = await transitionGestionSession({
        idGestionSession: cancelModalSession.idGestionSession,
        sessionRef: cancelModalSession.sessionRef,
        newState: "cancelada",
        reason,
        source: "navbar_gestion_session_widget_cancel",
        idempotencyKey: `cancel_${cancelModalSession.sessionRef}_${Date.now()}`,
      });

      await refreshSessions();

      if (!result.success) {
        toast.warning(result.message || "No se pudo cancelar la gestion seleccionada.");
        return;
      }

      toast.success(result.message || "Gestion cancelada correctamente.");
      setCancelModalSession(null);
      setCancelReason("");
      setShow(false);
    } finally {
      setCancelingSessionRef(null);
    }
  };

  const hasSessions = sessions.length > 0;
  const activeTitle = activeSession ? buildSessionTitle(activeSession) : "Sin gestion activa";

  return (
    <li className="nav-item d-flex align-items-center">
      <Dropdown show={show} onToggle={(nextShow) => setShow(nextShow)}>
        <Dropdown.Toggle
          as="button"
          type="button"
          className="nav-link btn btn-link d-flex align-items-center px-2"
          style={{
            textDecoration: "none",
            minWidth: 220,
            maxWidth: 320,
            color: "inherit",
          }}
        >
          <span
            className="d-flex flex-column align-items-start"
            style={{ minWidth: 0, lineHeight: 1.1 }}
          >
            <span
              className="text-truncate"
              style={{ fontSize: "0.78rem", fontWeight: 700, maxWidth: 250 }}
              title={activeTitle}
            >
              {activeTitle}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
              {activeSession ? activeElapsedText : "Sin gestiones en curso"}
            </span>
          </span>
          <Badge
            variant={activeSession ? "success" : "secondary"}
            className="ms-2"
            style={{ fontSize: "0.62rem" }}
          >
            {activeSession ? "Activa" : "Idle"}
          </Badge>
          {pausedSessions.length > 0 && (
            <Badge
              variant="warning"
              className="ms-1 text-dark"
              style={{ fontSize: "0.62rem" }}
            >
              +{pausedSessions.length}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu
          alignRight
          style={{
            width: 380,
            padding: "0.75rem",
            borderRadius: 12,
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong style={{ fontSize: "0.9rem" }}>Gestiones en proceso</strong>
            {loading && <span className="small text-muted">Actualizando...</span>}
          </div>

          {switchBlockedReason && (
            <div className="alert alert-warning py-2 px-3 small mb-3">
              {switchBlockedReason}
            </div>
          )}

          {!hasSessions && (
            <div className="text-muted small py-2">
              No tienes gestiones activas ni pausadas.
            </div>
          )}

          {activeSession && (
            <div className="mb-3">
              <div className="small text-uppercase text-muted mb-2">Activa</div>
              <div className="border rounded p-2">
                <div style={{ fontWeight: 700, fontSize: "0.86rem" }}>
                  {buildSessionTitle(activeSession)}
                </div>
                <div className="small text-muted mt-1">
                  Ultima actividad: {formatDateTime(activeSession.lastActivityAt)}
                </div>
                <div className="small text-muted">
                  Tiempo activo: {activeElapsedText}
                </div>
                <div className="d-flex justify-content-end mt-2 gap-2">
                  <SessionActionButton
                    iconClassName={
                      cancelingSessionRef === activeSession.sessionRef
                        ? "fas fa-spinner fa-spin"
                        : "fas fa-ban"
                    }
                    label={
                      cancelingSessionRef === activeSession.sessionRef
                        ? "Cancelando..."
                        : "Cancelar gestion"
                    }
                    variant="outline-danger"
                    onClick={() => openCancelModal(activeSession)}
                    disabled={Boolean(cancelingSessionRef)}
                  />
                  <SessionActionButton
                    iconClassName="fas fa-arrow-right"
                    label="Ir a la gestion"
                    variant="outline-primary"
                    onClick={() => navigateToSession(activeSession)}
                  />
                </div>
              </div>
            </div>
          )}

          {pausedSessions.length > 0 && (
            <div>
              <div className="small text-uppercase text-muted mb-2">En pausa</div>
              <div className="d-flex flex-column gap-2">
                {pausedSessions.map((session) => {
                  const isSwitching = switchingSessionRef === session.sessionRef;
                  return (
                    <div key={session.sessionRef} className="border rounded p-2">
                      <div style={{ fontWeight: 700, fontSize: "0.84rem" }}>
                        {buildSessionTitle(session)}
                      </div>
                      <div className="small text-muted mt-1">
                        Ultima actividad: {formatDateTime(session.lastActivityAt)}
                      </div>
                      <div className="small text-muted">
                        Tiempo acumulado: {formatElapsed(
                          calculateGestionSessionElapsedSeconds(session, nowMs)
                        )}
                      </div>
                      <div className="d-flex justify-content-end mt-2 gap-2">
                        <SessionActionButton
                          iconClassName={
                            cancelingSessionRef === session.sessionRef
                              ? "fas fa-spinner fa-spin"
                              : "fas fa-ban"
                          }
                          label={
                            cancelingSessionRef === session.sessionRef
                              ? "Cancelando..."
                              : "Cancelar gestion"
                          }
                          variant="outline-danger"
                          onClick={() => openCancelModal(session)}
                          disabled={isSwitching || Boolean(cancelingSessionRef)}
                        />
                        <SessionActionButton
                          iconClassName={isSwitching ? "fas fa-spinner fa-spin" : "fas fa-play"}
                          label={isSwitching ? "Activando..." : "Activar gestion"}
                          variant="primary"
                          onClick={() => void handleActivateSession(session)}
                          disabled={Boolean(switchBlockedReason) || isSwitching}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Dropdown.Menu>
      </Dropdown>

      <Modal
        show={Boolean(cancelModalSession)}
        onHide={closeCancelModal}
        centered
      >
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1f2937" }}>
                Cancelar gestion
              </div>
              <div className="small text-muted mt-2">
                Vas a cancelar la gestion en curso:
              </div>
              <div className="small mt-1" style={{ fontWeight: 700, color: "#111827" }}>
                {cancelModalSession ? buildSessionTitle(cancelModalSession) : "-"}
              </div>
            </div>
            <Button
              variant="light"
              onClick={closeCancelModal}
              disabled={Boolean(cancelingSessionRef)}
            >
              Cerrar
            </Button>
          </div>
          <Form.Group>
            <Form.Label>Razon de cancelacion</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Escribe la razon de la cancelacion"
              autoFocus
              disabled={Boolean(cancelingSessionRef)}
            />
            <Form.Text className="text-muted">
              Este campo es obligatorio.
            </Form.Text>
          </Form.Group>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={closeCancelModal}
              disabled={Boolean(cancelingSessionRef)}
            >
              Volver
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleCancelSession()}
              disabled={!cancelReason.trim() || Boolean(cancelingSessionRef)}
            >
              {cancelingSessionRef ? "Cancelando..." : "Confirmar cancelacion"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </li>
  );
}
