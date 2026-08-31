import { Badge, Button, Card, Col, Form, Row } from "react-bootstrap";
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";
import type { CarteraAsesor } from "@app/services/AsignacionCarteras/asignacionCarterasService";
import { TRAMOS } from "../domain/helpers";
import type { AsignacionCarterasFilters } from "../domain/types";

interface AsignacionCarterasFiltersCardProps {
  asesores: CarteraAsesor[];
  asignacionesCount: number;
  filters: AsignacionCarterasFilters;
  onApplyFilters: () => void;
  onChangeFilter: (field: keyof AsignacionCarterasFilters, value: string) => void;
  onClearFilters: () => void;
  onOpenMasivoModal: () => void;
  onOpenNuevaModal: () => void;
  puedeAsignar: boolean;
  puedeReasignar: boolean;
  selectedCount: number;
}

export function AsignacionCarterasFiltersCard({
  asesores,
  asignacionesCount,
  filters,
  onApplyFilters,
  onChangeFilter,
  onClearFilters,
  onOpenMasivoModal,
  onOpenNuevaModal,
  puedeAsignar,
  puedeReasignar,
  selectedCount,
}: AsignacionCarterasFiltersCardProps) {
  return (
    <Card className="shadow-sm mb-3">
      <Card.Header className="bg-white border-0">
        <div
          className="d-flex justify-content-between align-items-center flex-wrap"
          style={{ gap: 10 }}
        >
          <div>
            <strong>Filtros</strong>
          </div>
          <div className="d-flex" style={{ gap: 8 }}>
            <Button variant="outline-secondary" onClick={onClearFilters}>
              Limpiar
            </Button>
            <Button variant="primary" onClick={onApplyFilters}>
              Aplicar filtros
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col xs={12} sm={6} md={4} className="mb-2 mb-md-0">
            <BuscadorCuentas
              opcion="CU"
              op="CLIENTE"
              label="Cuenta"
              placeholder="Buscar cuenta..."
              value={filters.filtroCuenta || undefined}
              onChange={(cuenta) => onChangeFilter("filtroCuenta", cuenta ?? "")}
              onSelect={() => {}}
            />
          </Col>
          <Col xs={12} sm={6} md={4} className="mb-2 mb-md-0">
            <Form.Group>
              <Form.Label>Tramo</Form.Label>
              <Form.Control
                as="select"
                value={filters.filtroTramo}
                onChange={(event) =>
                  onChangeFilter("filtroTramo", event.target.value)
                }
              >
                <option value="">Todos</option>
                {TRAMOS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Form.Group>
              <Form.Label>Asesor</Form.Label>
              <Form.Control
                as="select"
                value={filters.filtroAsesorId}
                onChange={(event) =>
                  onChangeFilter("filtroAsesorId", event.target.value)
                }
              >
                <option value="">Todos</option>
                {asesores.map((asesor) => (
                  <option key={asesor.userId} value={asesor.userId}>
                    {asesor.fullName}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col
            className="d-flex justify-content-between align-items-center flex-wrap"
            style={{ gap: 8 }}
          >
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <Badge variant="secondary">Asignaciones: {asignacionesCount}</Badge>
              <Badge variant="dark">Seleccionadas: {selectedCount}</Badge>
            </div>
            <div className="d-flex" style={{ gap: 8 }}>
              <Button
                variant="outline-primary"
                onClick={onOpenMasivoModal}
                disabled={!puedeReasignar || selectedCount === 0}
              >
                Reasignar seleccionadas
              </Button>
              <Button
                variant="primary"
                onClick={onOpenNuevaModal}
                disabled={!puedeAsignar}
              >
                + Nueva asignacion
              </Button>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
