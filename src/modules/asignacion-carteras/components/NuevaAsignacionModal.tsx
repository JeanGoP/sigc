import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";
import type { CarteraAsesor } from "@app/services/AsignacionCarteras/asignacionCarterasService";
import { TRAMOS } from "../domain/helpers";
import type { NuevaAsignacionFormState } from "../domain/types";
import {
  AsignacionAsesorField,
  AsignacionMotivoField,
} from "./AsignacionModalFields";

interface NuevaAsignacionModalProps {
  asesores: CarteraAsesor[];
  form: NuevaAsignacionFormState;
  guardando: boolean;
  open: boolean;
  puedeAsignar: boolean;
  onClose: () => void;
  onGuardar: () => void;
  onToggleTramo: (tramoCodigo: string) => void;
  onUpdateForm: (field: keyof NuevaAsignacionFormState, value: string | string[]) => void;
}

export function NuevaAsignacionModal({
  asesores,
  form,
  guardando,
  open,
  puedeAsignar,
  onClose,
  onGuardar,
  onToggleTramo,
  onUpdateForm,
}: NuevaAsignacionModalProps) {
  return (
    <Modal show={open} onHide={onClose} centered>
      <Modal.Header {...({ closeButton: true } as any)}>
        <Modal.Title>Nueva asignacion</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <BuscadorCuentas
            opcion="CU"
            op="CLIENTE"
            label="Cuenta"
            placeholder="Buscar cuenta..."
            value={form.cuenta || undefined}
            onChange={(cuenta) => onUpdateForm("cuenta", cuenta ?? "")}
            onSelect={() => {}}
          />
        </Form.Group>

        <AsignacionAsesorField
          asesores={asesores}
          disabled={guardando}
          value={form.asesorId}
          onChange={(value) => onUpdateForm("asesorId", value)}
        />

        <Form.Group className="mb-3">
          <Form.Label>Tramos</Form.Label>
          <Row>
            {TRAMOS.map((tramo) => (
              <Col xs={6} key={tramo.value}>
                <Form.Check
                  type="checkbox"
                  id={`tramo_${tramo.value}`}
                  label={tramo.label}
                  checked={form.tramos.includes(tramo.value)}
                  onChange={() => onToggleTramo(tramo.value)}
                  disabled={guardando}
                />
              </Col>
            ))}
          </Row>
        </Form.Group>

        <AsignacionMotivoField
          disabled={guardando}
          value={form.motivo}
          onChange={(value) => onUpdateForm("motivo", value)}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={onGuardar}
          disabled={guardando || !puedeAsignar}
        >
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
