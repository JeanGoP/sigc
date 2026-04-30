import type { FormEvent } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import type { ParametrizacionRole } from "@app/services/Parametrizacion/types";
import type { FormularioUsuarioState } from "../domain/types";

interface UsuarioFormModalProps {
  show: boolean;
  guardandoUsuario: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  esEdicion: boolean;
  roles: ParametrizacionRole[];
  formularioUsuario: FormularioUsuarioState;
  onHide: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCampoChange: <K extends keyof FormularioUsuarioState>(
    campo: K,
    valor: FormularioUsuarioState[K]
  ) => void;
}

const modalHeaderCloseButtonProps = { closeButton: true } as any;

export default function UsuarioFormModal({
  show,
  guardandoUsuario,
  puedeCrear,
  puedeEditar,
  esEdicion,
  roles,
  formularioUsuario,
  onHide,
  onSubmit,
  onCampoChange,
}: UsuarioFormModalProps) {
  return (
    <Modal
      show={show}
      onHide={() => {
        if (!guardandoUsuario) {
          onHide();
        }
      }}
      centered
      size="lg"
    >
      <Modal.Header {...modalHeaderCloseButtonProps}>
        <Modal.Title>{esEdicion ? "Editar usuario" : "Crear usuario"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Usuario</Form.Label>
                <Form.Control
                  value={formularioUsuario.username}
                  onChange={(event) => onCampoChange("username", event.target.value)}
                  disabled={guardandoUsuario}
                  placeholder="Ej: jruiz"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Nombre completo</Form.Label>
                <Form.Control
                  value={formularioUsuario.fullName}
                  onChange={(event) => onCampoChange("fullName", event.target.value)}
                  disabled={guardandoUsuario}
                  placeholder="Ej: Juan Ruiz"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Correo electronico</Form.Label>
                <Form.Control
                  type="email"
                  value={formularioUsuario.email}
                  onChange={(event) => onCampoChange("email", event.target.value)}
                  disabled={guardandoUsuario}
                  placeholder="usuario@correo.com"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Rol</Form.Label>
                <Form.Control
                  as="select"
                  value={formularioUsuario.roleId}
                  onChange={(event) => onCampoChange("roleId", event.target.value)}
                  disabled={guardandoUsuario}
                >
                  <option value="">Sin rol</option>
                  {roles.map((rol) => (
                    <option key={rol.roleId} value={rol.roleId}>
                      {rol.roleName}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group>
                <Form.Label>
                  {esEdicion ? "Nueva contrasena (opcional)" : "Contrasena"}
                </Form.Label>
                <Form.Control
                  type="password"
                  value={formularioUsuario.password}
                  onChange={(event) => onCampoChange("password", event.target.value)}
                  disabled={guardandoUsuario}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-0">
            <Form.Check
              type="checkbox"
              label="Usuario activo"
              checked={formularioUsuario.isActive}
              onChange={(event) => onCampoChange("isActive", event.target.checked)}
              disabled={guardandoUsuario}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={guardandoUsuario}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={guardandoUsuario || (!esEdicion && !puedeCrear) || (esEdicion && !puedeEditar)}
          >
            {guardandoUsuario
              ? "Guardando..."
              : esEdicion
                ? "Guardar cambios"
                : "Crear usuario"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
