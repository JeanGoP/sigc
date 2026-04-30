import { Button, Col, Form, Row } from "react-bootstrap";
import type { RendimientoAsesoresFilters as RendimientoAsesoresFiltersValues } from "../domain/types";

interface RendimientoAsesoresFiltersProps {
  filters: RendimientoAsesoresFiltersValues;
  onChange: (field: keyof RendimientoAsesoresFiltersValues, value: string) => void;
  onConsultar: () => void;
}

export function RendimientoAsesoresFilters({
  filters,
  onChange,
  onConsultar,
}: RendimientoAsesoresFiltersProps) {
  return (
    <Row className="g-2 align-items-end">
      <Col md={3}>
        <Form.Group>
          <Form.Label>Fecha Inicial</Form.Label>
          <Form.Control
            type="date"
            value={filters.fechaInicial}
            onChange={(event) => onChange("fechaInicial", event.target.value)}
          />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group>
          <Form.Label>Fecha Final</Form.Label>
          <Form.Control
            type="date"
            value={filters.fechaFinal}
            onChange={(event) => onChange("fechaFinal", event.target.value)}
          />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group>
          <Button variant="primary" onClick={onConsultar}>
            Consultar
          </Button>
        </Form.Group>
      </Col>
    </Row>
  );
}
