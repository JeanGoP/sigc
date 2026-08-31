import { Button, Col, Form, Modal, Row, Table } from "react-bootstrap";
import { Tooltip } from "@mui/material";
import {
  extractDatePart,
  extractTimePart,
  formatFechaHora,
  formatMonto,
} from "../domain/helpers";
import type { EventoGestion, GestionModificacion } from "../domain/types";

interface GestionDetalleModalProps {
  show: boolean;
  drawerGestion: GestionModificacion | null;
  editandoDescripcion: boolean;
  descripcionEdit: string;
  savingDescripcion: boolean;
  onClose: () => void;
  onEliminarGestion: () => void;
  onIniciarEditarDescripcion: () => void;
  onCancelarDescripcion: () => void;
  onDescripcionChange: (value: string) => void;
  onGuardarDescripcion: () => void;
  onOpenModalAgregar: () => void;
  onEditarEvento: (evento: EventoGestion) => void;
  onEliminarEvento: (evento: EventoGestion) => void;
  onIrSeguimientoEvento: (evento: EventoGestion) => void;
  resolverNombreTipo: (id: number) => string;
  resolverNombreUsuario: (id: number) => string;
}

export function GestionDetalleModal({
  show,
  drawerGestion,
  editandoDescripcion,
  descripcionEdit,
  savingDescripcion,
  onClose,
  onEliminarGestion,
  onIniciarEditarDescripcion,
  onCancelarDescripcion,
  onDescripcionChange,
  onGuardarDescripcion,
  onOpenModalAgregar,
  onEditarEvento,
  onEliminarEvento,
  onIrSeguimientoEvento,
  resolverNombreTipo,
  resolverNombreUsuario,
}: GestionDetalleModalProps) {
  const renderFechaEvento = (evento: EventoGestion) => {
    if (!evento.fechaHoraProgramada) return "-";
    return (
      extractDatePart(evento.fechaHoraProgramada) +
      (evento.requiereHora ? ` ${extractTimePart(evento.fechaHoraProgramada)}` : "")
    );
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="xl"
      scrollable
      enforceFocus={false}
      centered
    >
      {drawerGestion && (
        <>
          <Modal.Header
            closeButton
            placeholder=""
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            <Modal.Title
              className="d-flex align-items-center"
              style={{ marginRight: "1rem" }}
            >
              Gestion #{drawerGestion.idGestion}
              <Tooltip title="Eliminar gestion">
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={onEliminarGestion}
                  type="button"
                  style={{ marginLeft: "1rem" }}
                >
                  <i className="fas fa-trash-alt" />
                </button>
              </Tooltip>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row>
              <Col xs={12} sm={6} md={3}>
                <Form.Group>
                  <Form.Label>Usuario</Form.Label>
                  <Form.Control
                    type="text"
                    value={drawerGestion.Username}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Form.Group>
                  <Form.Label>Fecha / Hora</Form.Label>
                  <Form.Control
                    type="text"
                    value={formatFechaHora(drawerGestion.FechaHora)}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Form.Group>
                  <Form.Label>Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    value={drawerGestion.cliente}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Form.Group>
                  <Form.Label>Factura</Form.Label>
                  <Form.Control
                    type="text"
                    value={drawerGestion.factura}
                    readOnly
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col xs={12} sm={6} md={3}>
                <Form.Group>
                  <Form.Label>Cuenta</Form.Label>
                  <Form.Control type="text" value={drawerGestion.cuenta} readOnly />
                </Form.Group>
              </Col>
            </Row>

            <hr />

            <Row>
              <Col>
                <Form.Group>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="mb-0">Descripcion</Form.Label>
                    {!editandoDescripcion ? (
                      <Tooltip title="Editar descripcion">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={onIniciarEditarDescripcion}
                          type="button"
                        >
                          <i className="fas fa-edit" />
                        </button>
                      </Tooltip>
                    ) : (
                      <div className="d-flex" style={{ gap: "0.5rem" }}>
                        <Tooltip title="Cancelar">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={onCancelarDescripcion}
                            type="button"
                          >
                            <i className="fas fa-times" />
                          </button>
                        </Tooltip>
                        <Tooltip title="Guardar">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={onGuardarDescripcion}
                            disabled={savingDescripcion}
                            type="button"
                          >
                            {savingDescripcion ? (
                              <i className="fas fa-spinner fa-spin" />
                            ) : (
                              <i className="fas fa-check" />
                            )}
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={descripcionEdit}
                    onChange={(event) => onDescripcionChange(event.target.value)}
                    placeholder="Sin descripcion"
                    style={{ resize: "vertical" }}
                    readOnly={!editandoDescripcion}
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr />

            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">
                Eventos ({drawerGestion.eventos.length})
              </Form.Label>
              <Button size="sm" variant="success" onClick={onOpenModalAgregar}>
                <i className="fas fa-plus mr-1" />
                Anadir
              </Button>
            </div>

            {drawerGestion.eventos.length === 0 ? (
              <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                Sin eventos registrados.
              </p>
            ) : (
              <Table size="sm" bordered hover responsive style={{ fontSize: 13 }}>
                <thead className="thead-light">
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Tipo</th>
                    <th>Fecha / Hora</th>
                    <th className="text-right">Monto</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {drawerGestion.eventos.map((evento) => (
                    <tr key={evento.id}>
                      <td>{evento.id}</td>
                      <td>{resolverNombreUsuario(evento.idUsuarioAsignado)}</td>
                      <td>{resolverNombreTipo(evento.idTipoEvento)}</td>
                      <td>{renderFechaEvento(evento)}</td>
                      <td className="text-right">
                        {formatMonto(evento.montoCompromiso)}
                      </td>
                      <td className="text-center">
                        <div
                          className="d-flex justify-content-center"
                          style={{ gap: 4 }}
                        >
                          <Tooltip title="Editar">
                            <Button
                              size="sm"
                              variant="light"
                              onClick={() => onEditarEvento(evento)}
                              style={{
                                padding: "2px 6px",
                                border: "1px solid #d0d7de",
                              }}
                            >
                              <i className="fas fa-edit" />
                            </Button>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <Button
                              size="sm"
                              variant="light"
                              onClick={() => onEliminarEvento(evento)}
                              style={{
                                padding: "2px 6px",
                                border: "1px solid #d0d7de",
                              }}
                            >
                              <i className="fas fa-trash-alt" />
                            </Button>
                          </Tooltip>
                          <Tooltip title="Ir a seguimiento">
                            <Button
                              size="sm"
                              variant="light"
                              onClick={() => onIrSeguimientoEvento(evento)}
                              style={{
                                padding: "2px 6px",
                                border: "1px solid #d0d7de",
                              }}
                            >
                              <i className="fas fa-external-link-alt" />
                            </Button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
