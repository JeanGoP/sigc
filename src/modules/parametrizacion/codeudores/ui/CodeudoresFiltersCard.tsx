import { Button, Card, Col, Form, Row } from "react-bootstrap";
import type { FiltroEstadoCodeudor } from "../hooks/useCodeudoresPage";

interface CodeudoresFiltersCardProps {
  textoBusqueda: string;
  filtroEstado: FiltroEstadoCodeudor;
  onTextoBusquedaChange: (valor: string) => void;
  onFiltroEstadoChange: (valor: FiltroEstadoCodeudor) => void;
  onLimpiar: () => void;
}

export default function CodeudoresFiltersCard({
  textoBusqueda,
  filtroEstado,
  onTextoBusquedaChange,
  onFiltroEstadoChange,
  onLimpiar,
}: CodeudoresFiltersCardProps) {
  return (
    <Card.Header className="bg-white border-0 pb-2">
      <Row>
        <Col md={7}>
          <Form.Group className="mb-2 mb-md-0">
            <Form.Control
              value={textoBusqueda}
              onChange={(event) => onTextoBusquedaChange(event.target.value)}
              placeholder="Buscar por obligación, titular, nombre de codeudor o documento..."
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-2 mb-md-0">
            <Form.Control
              as="select"
              value={filtroEstado}
              onChange={(event) =>
                onFiltroEstadoChange(event.target.value as FiltroEstadoCodeudor)
              }
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo Activos</option>
              <option value="inactivos">Solo Inactivos</option>
            </Form.Control>
          </Form.Group>
        </Col>
        <Col md={2} className="d-flex justify-content-end">
          <Button
            variant="light"
            onClick={onLimpiar}
            title="Limpiar filtros de búsqueda"
            className="w-100"
          >
            Limpiar
          </Button>
        </Col>
      </Row>
    </Card.Header>
  );
}
