import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import BuscadoClientes from "@app/pages/ConsultaClientes/components/BuscadoClientes";
import type { FechaConsultaErrors } from "../domain/types";

interface SelectOption {
  label: string;
  value: string | number;
}

interface ModificacionEventosFiltersProps {
  fechaInicio: string;
  fechaFin: string;
  erroresFechas: FechaConsultaErrors;
  usuarioFiltro: string | number;
  usuarios: SelectOption[];
  cuentaFiltro: string;
  clienteFiltro: string;
  loadingConsulta: boolean;
  onFechaInicioChange: (value: string) => void;
  onFechaFinChange: (value: string) => void;
  onClearFechaInicioError: () => void;
  onClearFechaFinError: () => void;
  onUsuarioFiltroChange: (value: string | number) => void;
  onCuentaFiltroChange: (value: string) => void;
  onOpenModalCliente: () => void;
  onClearCliente: () => void;
  onConsultar: () => void;
}

export function ModificacionEventosFilters({
  fechaInicio,
  fechaFin,
  erroresFechas,
  usuarioFiltro,
  usuarios,
  cuentaFiltro,
  clienteFiltro,
  loadingConsulta,
  onFechaInicioChange,
  onFechaFinChange,
  onClearFechaInicioError,
  onClearFechaFinError,
  onUsuarioFiltroChange,
  onCuentaFiltroChange,
  onOpenModalCliente,
  onClearCliente,
  onConsultar,
}: ModificacionEventosFiltersProps) {
  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Body>
        <Form>
          <Row>
            <Col md={2}>
              <Form.Group controlId="fechaInicio">
                <Form.Label>Fecha inicio</Form.Label>
                <Form.Control
                  type="date"
                  value={fechaInicio}
                  isInvalid={Boolean(erroresFechas.fechaInicio)}
                  onChange={(event) => {
                    onFechaInicioChange(event.target.value);
                    onClearFechaInicioError();
                  }}
                />
                <Form.Control.Feedback type="invalid">
                  {erroresFechas.fechaInicio}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group controlId="fechaFin">
                <Form.Label>Fecha fin</Form.Label>
                <Form.Control
                  type="date"
                  value={fechaFin}
                  isInvalid={Boolean(erroresFechas.fechaFin)}
                  onChange={(event) => {
                    onFechaFinChange(event.target.value);
                    onClearFechaFinError();
                  }}
                />
                <Form.Control.Feedback type="invalid">
                  {erroresFechas.fechaFin}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={2}>
              <SingleSelect
                label="Usuario"
                options={usuarios}
                selectedValue={usuarioFiltro}
                onChange={onUsuarioFiltroChange}
              />
            </Col>
            <Col md={3}>
              <BuscadorCuentas
                opcion="CU"
                op="CLIENTE"
                placeholder="Buscar cuenta..."
                label="Cuenta"
                value={cuentaFiltro || undefined}
                onChange={(cuenta) => onCuentaFiltroChange(cuenta ?? "")}
                onSelect={() => {}}
              />
            </Col>
            <Col md={2}>
              <BuscadoClientes
                selectedValue={clienteFiltro}
                onOpenModal={onOpenModalCliente}
                onClear={onClearCliente}
              />
            </Col>
            <Col md={1} className="d-flex align-items-center">
              <Button
                variant="primary"
                onClick={onConsultar}
                style={{ marginTop: 14 }}
                disabled={loadingConsulta}
              >
                {loadingConsulta ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2"
                    />
                    Consultando...
                  </>
                ) : (
                  "Consultar"
                )}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
}
