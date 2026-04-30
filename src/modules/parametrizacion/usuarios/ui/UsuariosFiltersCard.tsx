import { Button, Card, Col, Form, Row } from "react-bootstrap";
import type { ParametrizacionRole } from "@app/services/Parametrizacion/types";
import type { FiltroEstado } from "../domain/types";

interface UsuariosFiltersCardProps {
  textoBusqueda: string;
  filtroRol: string;
  filtroEstado: FiltroEstado;
  roles: ParametrizacionRole[];
  filtroEstadoOptions: Array<{ value: FiltroEstado; label: string }>;
  onTextoBusquedaChange: (valor: string) => void;
  onFiltroRolChange: (valor: string) => void;
  onFiltroEstadoChange: (valor: FiltroEstado) => void;
  onLimpiar: () => void;
}

export default function UsuariosFiltersCard({
  textoBusqueda,
  filtroRol,
  filtroEstado,
  roles,
  filtroEstadoOptions,
  onTextoBusquedaChange,
  onFiltroRolChange,
  onFiltroEstadoChange,
  onLimpiar,
}: UsuariosFiltersCardProps) {
  return (
    <Card.Header className="bg-white border-0 pb-2">
      <Row>
        <Col md={5}>
          <Form.Group className="mb-2 mb-md-0">
            <Form.Control
              value={textoBusqueda}
              onChange={(event) => onTextoBusquedaChange(event.target.value)}
              placeholder="Buscar por usuario, nombre o correo"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-2 mb-md-0">
            <Form.Control
              as="select"
              value={filtroRol}
              onChange={(event) => onFiltroRolChange(event.target.value)}
            >
              <option value="">Todos los roles</option>
              {roles.map((rol) => (
                <option key={rol.roleId} value={rol.roleId}>
                  {rol.roleName}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-2 mb-md-0">
            <Form.Control
              as="select"
              value={filtroEstado}
              onChange={(event) => onFiltroEstadoChange(event.target.value as FiltroEstado)}
            >
              {filtroEstadoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
        <Col md={1} className="d-flex justify-content-end">
          <Button variant="light" onClick={onLimpiar} title="Limpiar filtros">
            Limpiar
          </Button>
        </Col>
      </Row>
    </Card.Header>
  );
}
