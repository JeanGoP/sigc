import React from "react";
import { Button, Form, Modal } from "react-bootstrap";
import styled from "styled-components";
import ColorPickerModal from "@app/modules/maestros/tipos-eventos/components/ColorPickerTipoEventos";
import { getEtiquetaClienteModalTitle } from "../domain/helpers";
import type {
  EtiquetaCliente,
  EtiquetaClienteFormState,
} from "../domain/types";

const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 0.5rem;
    border: none;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  }
`;

const StyledFormGroup = styled(Form.Group)`
  margin-bottom: 1.5rem;
`;

const StyledButton = styled(Button)`
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  border-radius: 0.375rem;
`;

interface EtiquetaClienteModalProps {
  formData: EtiquetaClienteFormState;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onColorChange: (color: string) => void;
  onSubmit: () => void;
  open: boolean;
  saving: boolean;
  selectedEtiqueta: EtiquetaCliente | null;
}

export function EtiquetaClienteModal({
  formData,
  onChange,
  onClose,
  onColorChange,
  onSubmit,
  open,
  saving,
  selectedEtiqueta,
}: EtiquetaClienteModalProps) {
  return (
    <StyledModal show={open} onHide={onClose} centered>
      <Modal.Header {...({ closeButton: true } as any)}>
        <Modal.Title>{getEtiquetaClienteModalTitle(selectedEtiqueta)}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <StyledFormGroup>
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={onChange}
              disabled={saving}
            />
          </StyledFormGroup>

          <StyledFormGroup>
            <Form.Label>Color</Form.Label>
            <ColorPickerModal value={formData.color} onChange={onColorChange} />
          </StyledFormGroup>

          <StyledFormGroup>
            <Form.Label>Estado</Form.Label>
            <Form.Check
              type="switch"
              id="estado"
              name="estado"
              checked={formData.estado}
              onChange={onChange}
              disabled={saving}
            />
          </StyledFormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <StyledButton variant="secondary" onClick={onClose}>
          Cancelar
        </StyledButton>
        <StyledButton variant="primary" onClick={onSubmit} disabled={saving}>
          {selectedEtiqueta ? "Actualizar" : "Guardar"}
        </StyledButton>
      </Modal.Footer>
    </StyledModal>
  );
}
