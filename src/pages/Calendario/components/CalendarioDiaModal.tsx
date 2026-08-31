import React from "react";
import moment from "moment";
import { Button, ListGroup, Modal } from "react-bootstrap";
import type { Evento } from "@app/services/Calendario/CalendarioService";
import { BotonGestionCartera } from "./BotonGestionCartera";

interface CalendarioDiaModalProps {
  show: boolean;
  fechaSeleccionada: Date | null;
  eventosDelDia: Evento[];
  onClose: () => void;
}

export const CalendarioDiaModal: React.FC<CalendarioDiaModalProps> = ({
  show,
  fechaSeleccionada,
  eventosDelDia,
  onClose,
}) => {
  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header
        closeButton
        placeholder=""
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
      >
        <Modal.Title>Eventos del dia</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">
          <strong>Fecha:</strong>{" "}
          {fechaSeleccionada ? moment(fechaSeleccionada).format("YYYY-MM-DD") : ""}
        </p>
        {eventosDelDia.length === 0 ? (
          <p className="text-center text-secondary">No hay eventos para este dia.</p>
        ) : (
          <ListGroup variant="flush">
            {eventosDelDia.map((evento, index) => (
              <ListGroup.Item key={index}>
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <div>
                    <div className="d-flex align-items-center flex-wrap" style={{ gap: 6 }}>
                      <strong>{evento.title}</strong>{" "}
                      <span className="text-muted">({evento.usuario})</span>
                      <BotonGestionCartera type="B" evento={evento} />
                    </div>
                    <span className="text-muted">
                      {moment(evento.start).format("HH:mm")} -{" "}
                      {moment(evento.end).format("HH:mm")}
                    </span>
                    <br />
                    <small className="text-secondary">{evento.descripcion}</small>
                  </div>
                  <div className="d-flex flex-column align-items-end" style={{ gap: 8 }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: evento.color,
                        color: "#fff",
                        padding: "0.4em 0.6em",
                        borderRadius: "0.5em",
                      }}
                    >
                      {evento.estado}
                    </span>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
