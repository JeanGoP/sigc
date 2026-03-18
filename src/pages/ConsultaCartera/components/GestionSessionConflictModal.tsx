import { Badge, Button, Modal } from "react-bootstrap";
import { GestionSession } from "@app/services/GestionSessionService";

interface GestionSessionConflictModalProps {
  show: boolean;
  activeSession: GestionSession | null;
  targetCliente: string;
  targetFactura: string;
  targetCuenta: string;
  targetHasExistingSession: boolean;
  blockedReason: string | null;
  switching: boolean;
  onContinueActive: () => void;
  onConfirmSwitch: () => void;
  onHide: () => void;
}

function buildSessionSummary(session: GestionSession | null): string {
  if (!session) {
    return "-";
  }

  return `${session.cliente} | F${session.factura} | C${session.cuenta}`;
}

export default function GestionSessionConflictModal({
  show,
  activeSession,
  targetCliente,
  targetFactura,
  targetCuenta,
  targetHasExistingSession,
  blockedReason,
  switching,
  onContinueActive,
  onConfirmSwitch,
  onHide,
}: GestionSessionConflictModalProps) {
  const confirmLabel = targetHasExistingSession
    ? "Pausar actual y activar esta"
    : "Pausar actual y crear esta";

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header {...({ closeButton: true } as any)}>
        <Modal.Title>Gestion en curso</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">
          Ya tienes una gestion activa. Decide si quieres retomarla o cambiar a la del
          cliente seleccionado.
        </p>

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Gestion activa</strong>
            <Badge variant="success">Activa</Badge>
          </div>
          <div className="small">{buildSessionSummary(activeSession)}</div>
          <div className="small text-muted mt-1">
            Ultima actividad: {activeSession?.lastActivityAt || "-"}
          </div>
        </div>

        <div className="border rounded p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Nuevo contexto</strong>
            <Badge
              variant={targetHasExistingSession ? "warning" : "primary"}
              className={targetHasExistingSession ? "text-dark" : undefined}
            >
              {targetHasExistingSession ? "En pausa" : "Nueva"}
            </Badge>
          </div>
          <div className="small">
            {targetCliente} | F{targetFactura} | C{targetCuenta}
          </div>
        </div>

        {blockedReason && (
          <div className="alert alert-warning py-2 px-3 small mt-3 mb-0">
            {blockedReason}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={switching}>
          Cancelar
        </Button>
        <Button variant="outline-primary" onClick={onContinueActive} disabled={switching}>
          Ir a la activa
        </Button>
        <Button
          variant="primary"
          onClick={onConfirmSwitch}
          disabled={Boolean(blockedReason) || switching}
        >
          {switching ? "Procesando..." : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
