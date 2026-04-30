import type { FormEvent } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import type { ParametrizacionUser } from "@app/services/Parametrizacion/types";

interface CambiarPasswordModalProps {
  usuario: ParametrizacionUser | null;
  nuevaContrasena: string;
  puedeCambiarContrasena: boolean;
  onHide: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNuevaContrasenaChange: (valor: string) => void;
}

const modalHeaderCloseButtonProps = { closeButton: true } as any;

export default function CambiarPasswordModal({
  usuario,
  nuevaContrasena,
  puedeCambiarContrasena,
  onHide,
  onSubmit,
  onNuevaContrasenaChange,
}: CambiarPasswordModalProps) {
  return (
    <Modal show={Boolean(usuario)} onHide={onHide} centered>
      <Modal.Header {...modalHeaderCloseButtonProps}>
        <Modal.Title>Cambiar contrasena</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <p className="mb-2">
            Usuario: <strong>{usuario?.username}</strong>
          </p>
          <Form.Group>
            <Form.Label>Nueva contrasena</Form.Label>
            <Form.Control
              type="password"
              value={nuevaContrasena}
              onChange={(event) => onNuevaContrasenaChange(event.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button type="submit" variant="dark" disabled={!puedeCambiarContrasena}>
            Actualizar contrasena
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
