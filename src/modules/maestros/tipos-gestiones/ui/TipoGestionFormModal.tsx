import { Form, Modal } from "react-bootstrap";
import type { ChangeEvent } from "react";
import type {
  TipoContactoValue,
  TipoGestionFormState,
} from "../domain/types";
import SelectFormaContacto from "./SelectFormaContacto";
import {
  StyledButton,
  StyledFormGroup,
  StyledModal,
} from "./styled";

interface TipoGestionFormModalProps {
  show: boolean;
  esEdicion: boolean;
  formulario: TipoGestionFormState;
  tipoContacto: TipoContactoValue;
  guardandoTipoGestion: boolean;
  onHide: () => void;
  onSubmit: () => void;
  onCampoChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onTipoContactoChange: (value: TipoContactoValue) => void;
}

export default function TipoGestionFormModal({
  show,
  esEdicion,
  formulario,
  tipoContacto,
  guardandoTipoGestion,
  onHide,
  onSubmit,
  onCampoChange,
  onTipoContactoChange,
}: TipoGestionFormModalProps) {
  return (
    <StyledModal show={show} onHide={onHide} centered>
      <Modal.Header closeButton={true} {...({} as any)}>
        <Modal.Title>
          {esEdicion ? "Editar Tipo de Contacto" : "Nuevo Tipo de Contacto"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <StyledFormGroup>
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={onCampoChange}
              maxLength={100}
              placeholder="Ej: WhatsApp, Llamada, Email..."
            />
          </StyledFormGroup>

          <StyledFormGroup>
            <Form.Label>Descripcion</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={formulario.descripcion}
              onChange={onCampoChange}
              maxLength={255}
              placeholder="Descripcion opcional del tipo de contacto"
            />
          </StyledFormGroup>

          <StyledFormGroup>
            <Form.Label>Estado</Form.Label>
            <Form.Check
              type="switch"
              id="estado"
              name="estado"
              checked={formulario.estado}
              onChange={onCampoChange}
            />
          </StyledFormGroup>

          <StyledFormGroup>
            <SelectFormaContacto
              value={tipoContacto}
              onChange={onTipoContactoChange}
            />
          </StyledFormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <StyledButton variant="secondary" onClick={onHide}>
          Cancelar
        </StyledButton>
        <StyledButton variant="primary" onClick={onSubmit}>
          {guardandoTipoGestion
            ? "Guardando..."
            : esEdicion
              ? "Actualizar"
              : "Guardar"}
        </StyledButton>
      </Modal.Footer>
    </StyledModal>
  );
}
