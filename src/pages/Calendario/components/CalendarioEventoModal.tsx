import React from "react";
import moment from "moment";
import { Button, ListGroup, Modal } from "react-bootstrap";
import { StringToMoney } from "@app/utils/formattersFunctions";
import type { Evento } from "@app/services/Calendario/CalendarioService";
import { BotonGestionCartera } from "./BotonGestionCartera";

interface CalendarioEventoModalProps {
  show: boolean;
  eventoSeleccionado: Evento | null;
  onClose: () => void;
}

export const CalendarioEventoModal: React.FC<CalendarioEventoModalProps> = ({
  show,
  eventoSeleccionado,
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
        <Modal.Title>Detalle del evento</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {eventoSeleccionado && (
          <div className="p-2">
            <h5 className="mb-3 text-primary">
              <i className="fas fa-calendar-alt mr-2" />
              {" " + eventoSeleccionado.tipoEvento}
            </h5>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Descripcion:</strong> {eventoSeleccionado.descripcion}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Usuario:</strong> {eventoSeleccionado.usuario}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Cliente:</strong> {eventoSeleccionado.title}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Identificacion:</strong>{" "}
                {eventoSeleccionado.identificacionCliente}
              </ListGroup.Item>
              {eventoSeleccionado.monto === "0" ? null : (
                <ListGroup.Item>
                  <strong>Monto:</strong>{" "}
                  <span className="text-success">
                    ${StringToMoney(eventoSeleccionado.monto)}
                  </span>
                </ListGroup.Item>
              )}
              <ListGroup.Item>
                <strong>Estado:</strong>{" "}
                <span
                  className={
                    eventoSeleccionado.estado === "Activo"
                      ? "text-success"
                      : "text-muted"
                  }
                >
                  {eventoSeleccionado.estado}
                </span>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Inicio:</strong>{" "}
                {moment(eventoSeleccionado.start).format("YYYY-MM-DD HH:mm")}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Fin:</strong>{" "}
                {moment(eventoSeleccionado.end).format("YYYY-MM-DD HH:mm")}
              </ListGroup.Item>
            </ListGroup>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {eventoSeleccionado && (
          <BotonGestionCartera type="A" evento={eventoSeleccionado} />
        )}
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
