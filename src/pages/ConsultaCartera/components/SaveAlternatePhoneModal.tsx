import React from "react";
import { Button, Form, Modal } from "react-bootstrap";

interface PendingSaveAlternatePhonePromptViewModel {
  cliente: string;
  telefono: string;
}

interface SaveAlternatePhoneModalProps {
  show: boolean;
  loadingGuardarTelefonoAlterno: boolean;
  pendingSaveAlternatePhonePrompt: PendingSaveAlternatePhonePromptViewModel | null;
  alternatePhoneLabel: string;
  alternatePhoneObservation: string;
  onHide: () => void;
  onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onAlternatePhoneLabelChange: (value: string) => void;
  onAlternatePhoneObservationChange: (value: string) => void;
}

export function SaveAlternatePhoneModal({
  show,
  loadingGuardarTelefonoAlterno,
  pendingSaveAlternatePhonePrompt,
  alternatePhoneLabel,
  alternatePhoneObservation,
  onHide,
  onSubmit,
  onAlternatePhoneLabelChange,
  onAlternatePhoneObservationChange,
}: SaveAlternatePhoneModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header
        {...({ closeButton: !loadingGuardarTelefonoAlterno } as any)}
      >
        <Modal.Title>Guardar numero alterno</Modal.Title>
      </Modal.Header>
      <Form onSubmit={(event) => void onSubmit(event)}>
        <Modal.Body>
          <div className="small text-muted mb-3">
            {pendingSaveAlternatePhonePrompt
              ? `Cliente ${pendingSaveAlternatePhonePrompt.cliente}`
              : "Cliente actual"}
          </div>
          <Form.Group controlId="alternatePhoneValue" className="mb-3">
            <Form.Label>Numero</Form.Label>
            <Form.Control
              type="text"
              value={pendingSaveAlternatePhonePrompt?.telefono ?? ""}
              readOnly
            />
          </Form.Group>
          <Form.Group controlId="alternatePhoneLabel" className="mb-3">
            <Form.Label>Etiqueta</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej. Celular trabajo"
              value={alternatePhoneLabel}
              onChange={(event) =>
                onAlternatePhoneLabelChange(event.target.value)
              }
              autoFocus
            />
          </Form.Group>
          <Form.Group controlId="alternatePhoneObservation">
            <Form.Label>Observacion</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Opcional"
              value={alternatePhoneObservation}
              onChange={(event) =>
                onAlternatePhoneObservationChange(event.target.value)
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={onHide}
            disabled={loadingGuardarTelefonoAlterno}
          >
            Omitir
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loadingGuardarTelefonoAlterno}
          >
            {loadingGuardarTelefonoAlterno ? "Guardando..." : "Guardar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
