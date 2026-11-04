import React from "react";
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import type { Festivo } from "@app/services/Parametrizacion/controlHorarioTypes";

interface Props {
  festivos: Festivo[];
  canEdit: boolean;
  modalAbierto: boolean;
  setModalAbierto: (open: boolean) => void;
  fecha: string;
  setFecha: (f: string) => void;
  descripcion: string;
  setDescripcion: (d: string) => void;
  esLaboral: boolean;
  setEsLaboral: (l: boolean) => void;
  isSubmitting: boolean;
  onGuardarFestivo: () => void;
  onEliminarFestivo: (fecha: string) => void;
  onRecargar?: () => void;
}

const modalHeaderProps = { closeButton: true, className: "border-bottom" } as any;

export const FestivosCard: React.FC<Props> = ({
  festivos,
  canEdit,
  modalAbierto,
  setModalAbierto,
  fecha,
  setFecha,
  descripcion,
  setDescripcion,
  esLaboral,
  setEsLaboral,
  isSubmitting,
  onGuardarFestivo,
  onEliminarFestivo,
  onRecargar,
}) => {
  const [busqueda, setBusqueda] = React.useState("");

  const festivosFiltrados = React.useMemo(() => {
    if (!busqueda.trim()) return festivos;
    const q = busqueda.toLowerCase();
    return festivos.filter(
      (f) =>
        f.fecha.toLowerCase().includes(q) ||
        f.descripcion.toLowerCase().includes(q)
    );
  }, [festivos, busqueda]);

  return (
    <>
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 font-weight-bold">
              <i className="fas fa-calendar-day text-danger mr-2" /> Días Festivos e Inhábiles
            </h5>
            <small className="text-muted">
              Fechas en las que no se permite el acceso al sistema sin un permiso especial.
            </small>
          </div>
          <div>
            {onRecargar && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={onRecargar}
                className="mr-2 px-2"
                title="Recargar datos desde el servidor"
              >
                <i className="fas fa-sync-alt" />
              </Button>
            )}
            {canEdit && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  setFecha(new Date().toISOString().split("T")[0]);
                  setDescripcion("");
                  setEsLaboral(false);
                  setModalAbierto(true);
                }}
                className="px-3"
              >
                <i className="fas fa-plus mr-1" /> Registrar Día Festivo
              </Button>
            )}
          </div>
        </Card.Header>

        <Card.Body className="p-3">
          <Row className="mb-3">
            <Col md={6}>
              <Form.Control
                type="text"
                size="sm"
                placeholder="Buscar festivo por nombre o fecha (ej: 2026-12-25 o Navidad)..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </Col>
          </Row>

          <div className="table-responsive" style={{ maxHeight: "350px", overflowY: "auto" }}>
            <Table hover size="sm" className="mb-0 align-middle">
              <thead
                style={{
                  backgroundColor: "#f8f9fa",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  fontSize: "0.85rem",
                  color: "#6c757d",
                }}
              >
                <tr>
                  <th style={{ width: "25%" }}>FECHA</th>
                  <th style={{ width: "45%" }}>DESCRIPCIÓN</th>
                  <th style={{ width: "18%" }}>ESTADO</th>
                  <th style={{ width: "12%", textAlign: "right" }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {festivosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">
                      No se encontraron días festivos registrados.
                    </td>
                  </tr>
                ) : (
                  festivosFiltrados.map((f) => (
                    <tr key={f.fecha}>
                      <td className="font-weight-600">
                        <i className="far fa-calendar text-danger mr-2" />
                        {f.fecha}
                      </td>
                      <td>{f.descripcion}</td>
                      <td>
                        {f.esLaboral ? (
                          <Badge variant="success" className="px-2 py-1">
                            Laboral
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="px-2 py-1">
                            No Laboral (Inhábil)
                          </Badge>
                        )}
                      </td>
                      <td className="text-right">
                        {canEdit && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="btn-icon p-1"
                            title="Eliminar Festivo"
                            onClick={() => onEliminarFestivo(f.fecha)}
                          >
                            <i className="fas fa-trash-alt text-danger" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modal para Agregar Festivo */}
      <Modal show={modalAbierto} onHide={() => setModalAbierto(false)} centered>
        <Modal.Header {...modalHeaderProps}>
          <Modal.Title className="h6 font-weight-bold">
            <i className="fas fa-calendar-plus text-danger mr-2" /> Registrar Día Festivo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group className="mb-3">
            <Form.Label className="font-weight-600" style={{ fontSize: "0.88rem" }}>
              Fecha del Festivo *
            </Form.Label>
            <Form.Control
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="font-weight-600" style={{ fontSize: "0.88rem" }}>
              Descripción o Motivo *
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: Día de la Independencia, Cierre Cívico, etc."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Check
              type="checkbox"
              id="check-festivo-laboral"
              label="Habilitar como día laboral para este Tenant (permitir acceso)"
              checked={esLaboral}
              onChange={(e) => setEsLaboral(e.target.checked)}
            />
            <small className="text-muted d-block mt-1">
              Si se desmarca (recomendado), ningún usuario podrá ingresar en esta fecha sin una
              excepción temporal.
            </small>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" size="sm" onClick={() => setModalAbierto(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={isSubmitting}
            onClick={onGuardarFestivo}
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="mr-2" /> Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-1" /> Guardar Festivo
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
