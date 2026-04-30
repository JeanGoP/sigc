import React from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
import type { ClienteTelefonoAlternoDto } from "@app/services/ClienteTelefonoAlternoService";

interface OutboundCallModalProps {
  show: boolean;
  dialDestination: string;
  loadingTelefonosAlternos: boolean;
  numeroPrincipalCliente: string;
  telefonosAlternosActivos: ClienteTelefonoAlternoDto[];
  canStartOutboundCall: boolean;
  isCallInProgress: boolean;
  isPhoneSelected: (phone: string) => boolean;
  onHide: () => void;
  onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onDialDestinationChange: (value: string) => void;
  onSelectPhone: (phone: string) => void;
}

export function OutboundCallModal({
  show,
  dialDestination,
  loadingTelefonosAlternos,
  numeroPrincipalCliente,
  telefonosAlternosActivos,
  canStartOutboundCall,
  isCallInProgress,
  isPhoneSelected,
  onHide,
  onSubmit,
  onDialDestinationChange,
  onSelectPhone,
}: OutboundCallModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header {...({ closeButton: true } as any)}>
        <Modal.Title>Llamar cliente</Modal.Title>
      </Modal.Header>
      <Form onSubmit={(event) => void onSubmit(event)}>
        <Modal.Body>
          <Form.Group controlId="modalDialDestination">
            <Form.Label>Numero destino</Form.Label>
            <Form.Control
              type="text"
              inputMode="numeric"
              placeholder="3218446041"
              value={dialDestination}
              onChange={(event) => onDialDestinationChange(event.target.value)}
              autoFocus
            />
            <Form.Text className="text-muted">
              Se usara el numero origen configurado para este tenant.
            </Form.Text>
          </Form.Group>
          <div className="mt-3">
            <div className="small text-muted mb-2">
              Numeros disponibles para este cliente
            </div>
            {loadingTelefonosAlternos ? (
              <div className="small text-muted">Cargando telefonos alternos...</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {numeroPrincipalCliente && (
                  <Button
                    variant={
                      isPhoneSelected(numeroPrincipalCliente)
                        ? "primary"
                        : "outline-secondary"
                    }
                    size="sm"
                    className="text-start"
                    onClick={() => onSelectPhone(numeroPrincipalCliente)}
                  >
                    <div className="fw-semibold">{numeroPrincipalCliente}</div>
                    <div className="small">Principal</div>
                  </Button>
                )}
                {telefonosAlternosActivos.map((item) => (
                  <Button
                    key={item.id}
                    variant={
                      isPhoneSelected(item.telefono) ? "primary" : "outline-secondary"
                    }
                    size="sm"
                    className="text-start"
                    onClick={() => onSelectPhone(item.telefono)}
                  >
                    <div className="fw-semibold">{item.telefono}</div>
                    <div className="small">
                      {item.etiqueta}
                      {item.observacion ? ` | ${item.observacion}` : ""}
                    </div>
                  </Button>
                ))}
                {!numeroPrincipalCliente && telefonosAlternosActivos.length === 0 && (
                  <div className="small text-muted">
                    Este cliente no tiene numeros guardados. Puedes escribir uno
                    manualmente.
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!canStartOutboundCall || isCallInProgress}
          >
            <FontAwesomeIcon icon={faPhone} className="me-2" />
            Llamar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
