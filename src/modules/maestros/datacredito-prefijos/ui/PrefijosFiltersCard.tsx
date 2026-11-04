import React from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import type { FiltroEstadoPrefijo } from "../hooks/useDataCreditoPrefijos";

interface PrefijosFiltersCardProps {
  textoBusqueda: string;
  filtroEstado: FiltroEstadoPrefijo;
  onTextoBusquedaChange: (valor: string) => void;
  onFiltroEstadoChange: (valor: FiltroEstadoPrefijo) => void;
  onLimpiar: () => void;
}

export const PrefijosFiltersCard: React.FC<PrefijosFiltersCardProps> = ({
  textoBusqueda,
  filtroEstado,
  onTextoBusquedaChange,
  onFiltroEstadoChange,
  onLimpiar,
}) => {
  return (
    <Card.Header className="bg-white border-0 pb-2">
      <Row>
        <Col md={7}>
          <Form.Group className="mb-2 mb-md-0">
            <Form.Control
              value={textoBusqueda}
              onChange={(event) => onTextoBusquedaChange(event.target.value)}
              placeholder="Buscar por código de cuenta, sucursal o prefijo (ej: 1305, MON, ZMON)..."
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-2 mb-md-0">
            <Form.Control
              as="select"
              value={filtroEstado}
              onChange={(event) =>
                onFiltroEstadoChange(event.target.value as FiltroEstadoPrefijo)
              }
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo Cuentas Activas</option>
              <option value="inactivos">Solo Cuentas Inactivas</option>
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
};

export default PrefijosFiltersCard;
