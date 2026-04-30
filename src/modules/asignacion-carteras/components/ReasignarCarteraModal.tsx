import { Button, Modal } from "react-bootstrap";
import type {
  CarteraAsesor,
  CarteraAsignacionActual,
} from "@app/services/AsignacionCarteras/asignacionCarterasService";
import type { ReasignacionFormState } from "../domain/types";
import {
  AsignacionAsesorField,
  AsignacionMotivoField,
} from "./AsignacionModalFields";

interface ReasignarCarteraModalProps {
  asesores: CarteraAsesor[];
  fila: CarteraAsignacionActual | null;
  form: ReasignacionFormState;
  guardando: boolean;
  puedeReasignar: boolean;
  onClose: () => void;
  onGuardar: () => void;
  onUpdateForm: (field: keyof ReasignacionFormState, value: string) => void;
}

export function ReasignarCarteraModal({
  asesores,
  fila,
  form,
  guardando,
  puedeReasignar,
  onClose,
  onGuardar,
  onUpdateForm,
}: ReasignarCarteraModalProps) {
  return (
    <Modal show={Boolean(fila)} onHide={onClose} centered>
      <Modal.Header {...({ closeButton: true } as any)}>
        <Modal.Title>Reasignar cartera</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {fila && (
          <>
            <p className="mb-2">
              <strong>Cuenta:</strong> {fila.cuenta}
            </p>
            <p className="mb-3">
              <strong>Tramo:</strong> {fila.tramoNombre || fila.tramoCodigo}
            </p>
          </>
        )}

        <AsignacionAsesorField
          asesores={asesores}
          disabled={guardando}
          label="Nuevo asesor"
          value={form.asesorId}
          onChange={(value) => onUpdateForm("asesorId", value)}
        />

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
          disabled={guardando || !puedeReasignar}
        >
          {guardando ? "Aplicando..." : "Aplicar reasignacion"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
