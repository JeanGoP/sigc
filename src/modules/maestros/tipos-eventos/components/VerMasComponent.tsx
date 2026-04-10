import React from "react";
import { Modal, Button, ListGroup, Container, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheck } from "@fortawesome/free-solid-svg-icons";
import {
  getEventoCumplidoLabel,
  getEventoCumplidoState,
} from "../utils/cumplido";

interface Props {
  showModal: boolean;
  handleClose: () => void;
  seguimientoActivo: any;
  parseEventos: (eventosRaw: string | any[]) => any[];
  IconMap: any;
  StringToMoney: (val: number) => string;
}

const ModalSeguimientoDetalle: React.FC<Props> = ({
  showModal,
  handleClose,
  seguimientoActivo,
  parseEventos,
  // iconosEventos,
  IconMap,
  StringToMoney,
}) => {
  return (
    <Modal show={showModal} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton={true} {...({} as any)}>
        <Modal.Title>Detalle del Seguimiento</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {seguimientoActivo && (
          <Container>
            <Row className="mb-3">
              <Col>
                <strong>Usuario:</strong> {seguimientoActivo.usuario}
              </Col>
            </Row>
            <Row className="mb-3">
              <Col>
                <strong>Fecha y hora:</strong> {seguimientoActivo.fecha}{" "}
                {seguimientoActivo.hora}
              </Col>
            </Row>
            <Row className="mb-3">
              <Col>
                <strong>Detalle:</strong>
                <p className="mt-2" style={{ lineHeight: 1.5 }}>
                  {seguimientoActivo.detalle}
                </p>
              </Col>
            </Row>

            <Row>
              <Col>
                <strong>Eventos programados:</strong>
                <div
                  style={{
                    marginTop: 12,
                    maxHeight: 250,
                    overflowY: "auto",
                    paddingRight: 8,
                    border: "1px solid #dee2e6",
                    borderRadius: 4,
                  }}
                >
                  <ListGroup variant="flush">
                    {seguimientoActivo.eventos &&
                      parseEventos(seguimientoActivo.eventos).map(
                        (evento, idx) => {
                          const cumplidoLabel = getEventoCumplidoLabel(
                            evento.cumplido
                          );
                          const cumplidoState = getEventoCumplidoState(
                            evento.cumplido
                          );
                          const esCompromisoPago =
                            typeof evento.valor === "number" &&
                            evento.valor > 0;

                          return (
                            <ListGroup.Item key={idx}>
                              <div className="d-flex align-items-center gap-2" style={{ fontWeight: "bold" }}>
                                <FontAwesomeIcon
                                  icon={IconMap[evento.icono || "home"]}
                                  color={evento.color}
                                  size="lg"
                                />
                                <span style={{ fontWeight: "bold", marginLeft: 10, marginRight: 10 } }>
                                  {' ('+evento.tipo+ ') ' || 'asdasd'}
                                </span>

                                {cumplidoLabel && (
                                  <span
                                    className="d-flex align-items-center gap-1 ms-3"
                                    style={{
                                      color:
                                        cumplidoState === "done"
                                          ? "#388e3c"
                                          : cumplidoState === "pending"
                                            ? "#d32f2f"
                                            : "#495057",
                                    }}
                                  >
                                    {cumplidoState === "done" && (
                                      <FontAwesomeIcon icon={faCheck} />
                                    )}
                                    {cumplidoState === "pending" && (
                                      <FontAwesomeIcon icon={faTimes} />
                                    )}
                                    <span>
                                      {cumplidoLabel}
                                    </span>
                                  </span>
                                )}
                              </div>

                              <div className="ms-4 mt-1">
                                {evento.fecha && <div>Fecha: {evento.fecha}</div>}
                                {evento.hora && (
                                  <div>
                                    Hora:{" "}
                                    {evento.hora !== "00:00"
                                      ? evento.hora
                                      : "Sin hora"}
                                  </div>
                                )}
                                {typeof evento.valor === "number" && (
                                  <div>
                                    Valor: ${StringToMoney(evento.valor)}
                                  </div>
                                )}
                              </div>
                            </ListGroup.Item>
                          );
                        }
                      )}
                  </ListGroup>
                </div>
              </Col>
            </Row>
          </Container>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalSeguimientoDetalle;
