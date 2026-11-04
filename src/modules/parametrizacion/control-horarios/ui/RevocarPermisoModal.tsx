import React from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import type { PermisoHorario } from "@app/services/Parametrizacion/controlHorarioTypes";

interface Props {
  permiso: PermisoHorario | null;
  onHide: () => void;
  motivoRevocacion: string;
  setMotivoRevocacion: (m: string) => void;
  isRevoking: boolean;
  onConfirmar: () => void;
}

const modalHeaderProps = { closeButton: true, className: "border-bottom" } as any;

export const RevocarPermisoModal: React.FC<Props> = ({
  permiso,
  onHide,
  motivoRevocacion,
  setMotivoRevocacion,
  isRevoking,
  onConfirmar,
}) => {
  if (!permiso) return null;

  return (
    <Modal show={!!permiso} onHide={onHide} centered>
      <Modal.Header {...modalHeaderProps}>
        <Modal.Title className="h6 font-weight-bold text-danger">
          <i className="fas fa-exclamation-triangle mr-2" /> Revocar Permiso de Acceso
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        <p style={{ fontSize: "0.9rem" }}>
          ¿Está seguro de que desea revocar el permiso de acceso para el usuario{" "}
          <strong>{permiso.fullName || permiso.username}</strong>?
        </p>

        <div
          className="p-3 mb-3 rounded bg-light border"
          style={{ fontSize: "0.85rem" }}
        >
          <div>
            <strong>Fecha:</strong> {permiso.fecha}
          </div>
          <div>
            <strong>Franja:</strong> {permiso.horaInicio?.substring(0, 5)} -{" "}
            {permiso.horaFin?.substring(0, 5)}
          </div>
          {permiso.motivo && (
            <div>
              <strong>Motivo original:</strong> {permiso.motivo}
            </div>
          )}
        </div>

        <p className="text-danger small mb-3">
          <i className="fas fa-info-circle mr-1" />
          Si el usuario se encuentra conectado en este momento, su sesión será
          interrumpida inmediatamente en su siguiente petición al servidor.
        </p>

        <Form.Group className="mb-0">
          <Form.Label className="font-weight-600" style={{ fontSize: "0.85rem" }}>
            Motivo de la Revocación (opcional):
          </Form.Label>
          <Form.Control
            type="text"
            size="sm"
            placeholder="Ej: Finalizó sus labores antes de lo previsto"
            value={motivoRevocacion}
            onChange={(e) => setMotivoRevocacion(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer className="border-top">
        <Button variant="secondary" size="sm" onClick={onHide}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={isRevoking}
          onClick={onConfirmar}
        >
          {isRevoking ? (
            <>
              <Spinner animation="border" size="sm" className="mr-2" /> Revocando...
            </>
          ) : (
            <>
              <i className="fas fa-ban mr-1" /> Confirmar Revocación
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
