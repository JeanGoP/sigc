import React from "react";
import { Button, Card, Form, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faEnvelope,
  faExclamationTriangle,
  faPhone,
  faPhoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import type { ClienteInfo } from "@app/services/ClienteService";
import { StickyNote } from "./StickyNote/StickyNote";
import { useAppSelector } from "@app/store/store";

interface MailTemplateOption {
  key: string;
  nombre: string;
}

interface SelectedClientSummaryProps {
  clienteInfo: ClienteInfo;
  loadingCliente: boolean;
  selectedValue: string;
  currentUserId: number;
  currentUserName: string;
  isAdmin: boolean;
  telephonyEnabled: boolean;
  canStartOutboundCall: boolean;
  isCallInProgress: boolean;
  startCallBlockedReason: string;
  plantillaSeleccionadaKey: string;
  plantillasApi: MailTemplateOption[];
  hasPendingInboundCalls: boolean;
  nextPendingInboundFrom?: string;
  gestionOperativaActiva: boolean;
  isAssociatingInboundCall: boolean;
  isSaveRequestInFlight: boolean;
  loadingTransitionGestionSession: boolean;
  wrongNumHovered: boolean;
  onOpenOutboundCallModal: () => void;
  onOpenWhatsApp: (telefono: string) => void;
  onPlantillaChange: (key: string) => void;
  onPreviewCorreo: () => void;
  onAttachPendingInboundToActiveSession: () => void | Promise<void>;
  onDismissWrongNumberInbound: () => void | Promise<void>;
  onWrongNumHoverChange: (hovered: boolean) => void;
}

export function SelectedClientSummary({
  clienteInfo,
  loadingCliente,
  selectedValue,
  currentUserId,
  currentUserName,
  isAdmin,
  telephonyEnabled,
  canStartOutboundCall,
  isCallInProgress,
  startCallBlockedReason,
  plantillaSeleccionadaKey,
  plantillasApi,
  hasPendingInboundCalls,
  nextPendingInboundFrom,
  gestionOperativaActiva,
  isAssociatingInboundCall,
  isSaveRequestInFlight,
  loadingTransitionGestionSession,
  wrongNumHovered,
  onOpenOutboundCallModal,
  onOpenWhatsApp,
  onPlantillaChange,
  onPreviewCorreo,
  onAttachPendingInboundToActiveSession,
  onDismissWrongNumberInbound,
  onWrongNumHoverChange,
}: SelectedClientSummaryProps) {
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const isMobile = screenSize === "xs";
  const words = (clienteInfo.razonSocial || "").trim().split(/\s+/);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  const palette = [
    "#4f86c6",
    "#3a7d44",
    "#c65f4f",
    "#8e5ea2",
    "#c67c4f",
    "#4f9da6",
  ];
  const hash = String(clienteInfo.cliente)
    .split("")
    .reduce((accumulator, currentValue) => {
      return (accumulator * 31 + currentValue.charCodeAt(0)) & 0xffffff;
    }, 0);
  const avatarBg = palette[Math.abs(hash) % palette.length];
  const labelStyle: React.CSSProperties = {
    fontSize: "0.68rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <Card
      className="mb-3 border-0 shadow-sm"
      style={{ borderLeft: `3px solid ${avatarBg}`, borderRadius: 8 }}
    >
      <Card.Body className="py-2 px-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              flexShrink: 0,
              background: avatarBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 1,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="fw-bold text-truncate"
              style={{ fontSize: "0.88rem" }}
              title={clienteInfo.razonSocial ?? ""}
            >
              {clienteInfo.razonSocial || "—"}
            </div>
            <div className="text-muted" style={{ fontSize: "0.7rem" }}>
              ID {clienteInfo.cliente}
            </div>
          </div>
          {loadingCliente && (
            <Spinner animation="border" size="sm" className="text-muted flex-shrink-0" />
          )}
          <StickyNote
            clienteId={selectedValue}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            isAdmin={isAdmin}
          />
        </div>

        <div
          className={`d-flex gap-3 py-2 ${isMobile ? "flex-column align-items-stretch" : "align-items-center"}`}
          style={{
            borderTop: "1px solid #f0f0f0",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div className="d-flex flex-wrap gap-3" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ flex: "2 1 130px", minWidth: 0 }}>
              <div className="text-muted" style={labelStyle}>
                Dirección
              </div>
              <div
                className="small fw-semibold text-truncate"
                title={clienteInfo.direccion ?? ""}
              >
                {clienteInfo.direccion || "—"}
              </div>
            </div>
            <div style={{ flex: "1 1 70px" }}>
              <div className="text-muted" style={labelStyle}>
                Ciudad
              </div>
              <div className="small fw-semibold">{clienteInfo.ciudad || "—"}</div>
            </div>
            <div style={{ flex: "1 1 80px" }}>
              <div className="text-muted" style={labelStyle}>
                Teléfono
              </div>
              <div className="small fw-semibold">{clienteInfo.telefono || "—"}</div>
            </div>
            <div style={{ flex: "2 1 130px", minWidth: 0 }}>
              <div className="text-muted" style={labelStyle}>
                Email
              </div>
              <div
                className="small fw-semibold text-truncate"
                title={clienteInfo.email ?? ""}
              >
                {clienteInfo.email || "—"}
              </div>
            </div>
          </div>
          <div
            className="d-flex align-items-center gap-2 flex-wrap"
            style={isMobile ? undefined : { flexShrink: 0 }}
          >
            {telephonyEnabled && (
              <Button
                variant="outline-primary"
                onClick={onOpenOutboundCallModal}
                disabled={!canStartOutboundCall || isCallInProgress}
                title={
                  isCallInProgress
                    ? "Ya existe una llamada en curso."
                    : canStartOutboundCall
                      ? "Llamar cliente"
                      : startCallBlockedReason
                }
                aria-label="Llamar cliente"
                style={{
                  minWidth: "48px",
                  width: "48px",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <FontAwesomeIcon icon={faPhone} size="lg" />
              </Button>
            )}
            <Button
              variant="success"
              onClick={() => onOpenWhatsApp(clienteInfo.telefono)}
              disabled={!clienteInfo.telefono}
              style={{
                minWidth: "48px",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <FontAwesomeIcon icon={faWhatsapp} size="lg" />
            </Button>
            <Form.Group controlId="plantillaCorreo" className="mb-0 ms-2">
              <Form.Control
                as="select"
                value={plantillaSeleccionadaKey}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  onPlantillaChange(event.target.value)
                }
                style={{
                  minWidth: isMobile ? 130 : 180,
                  display: "inline-block",
                }}
              >
                {plantillasApi.map((plantilla) => (
                  <option key={plantilla.key} value={plantilla.key}>
                    {plantilla.nombre}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Button
              variant="primary"
              className="ms-2"
              onClick={onPreviewCorreo}
              disabled={!plantillaSeleccionadaKey}
              style={{
                minWidth: "48px",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <FontAwesomeIcon icon={faEnvelope} size="lg" />
            </Button>
          </div>
        </div>

        <div className="mt-2">
          {telephonyEnabled && (!canStartOutboundCall || isCallInProgress) && (
            <div className="d-flex align-items-center gap-2 small text-muted">
              <FontAwesomeIcon icon={isCallInProgress ? faPhone : faClock} />
              <span>
                {isCallInProgress
                  ? "Ya existe una llamada en curso."
                  : startCallBlockedReason}
              </span>
            </div>
          )}
          {hasPendingInboundCalls && (
            <div
              className={!canStartOutboundCall || isCallInProgress ? "mt-3" : ""}
              style={{
                borderLeft: "4px solid #f59e0b",
                background: "rgba(255,243,205,0.55)",
                borderRadius: "0 8px 8px 0",
                padding: "8px 10px",
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  style={{ color: "#d97706", fontSize: 12, flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#7c3504",
                  }}
                >
                  Llamada pendiente
                </span>
                {nextPendingInboundFrom && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#b45309",
                      fontFamily: "monospace",
                    }}
                  >
                    · {nextPendingInboundFrom}
                  </span>
                )}
              </div>
              <div className="d-flex align-items-center flex-wrap" style={{ gap: 10 }}>
                <Button
                  size="sm"
                  variant="warning"
                  style={{ fontSize: "0.75rem", padding: "2px 10px" }}
                  onClick={() => void onAttachPendingInboundToActiveSession()}
                  disabled={
                    !gestionOperativaActiva ||
                    isAssociatingInboundCall ||
                    isSaveRequestInFlight ||
                    loadingTransitionGestionSession
                  }
                >
                  {isAssociatingInboundCall ? "Asociando..." : "Asociar"}
                </Button>
                <button
                  onClick={() => void onDismissWrongNumberInbound()}
                  disabled={isAssociatingInboundCall || loadingTransitionGestionSession}
                  onMouseEnter={() => onWrongNumHoverChange(true)}
                  onMouseLeave={() => onWrongNumHoverChange(false)}
                  style={{
                    background: wrongNumHovered ? "rgba(220,53,69,0.07)" : "none",
                    border: `1px dashed ${wrongNumHovered ? "#dc3545" : "#adb5bd"}`,
                    borderRadius: 4,
                    padding: "2px 8px",
                    color: wrongNumHovered ? "#dc3545" : "#6c757d",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.15s",
                  }}
                >
                  <FontAwesomeIcon icon={faPhoneSlash} />
                  Número equivocado
                </button>
              </div>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
