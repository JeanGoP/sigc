import React from "react";
import { Button, Form, Modal } from "react-bootstrap";

interface MailConfirmationModalProps {
  show: boolean;
  enviandoCorreo: boolean;
  onHide: () => void;
  onConfirm: () => void | Promise<void>;
}

export function MailConfirmationModal({
  show,
  enviandoCorreo,
  onHide,
  onConfirm,
}: MailConfirmationModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header {...({ closeButton: true } as any)}>
        <Modal.Title>Confirmar el envio del correo.</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>¿Está seguro que desea enviar este correo?</Form.Label>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={enviandoCorreo}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={enviandoCorreo}>
          {enviandoCorreo ? "Enviando..." : "Enviar correo"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
