import { Button, Modal } from "react-bootstrap";
import type { CarteraAsesor } from "@app/services/AsignacionCarteras/asignacionCarterasService";
import type { MasivoReasignacionFormState } from "../domain/types";
import {
  AsignacionAsesorField,
  AsignacionMotivoField,
} from "./AsignacionModalFields";

interface ReasignacionMasivaModalProps {
  asesores: CarteraAsesor[];
  form: MasivoReasignacionFormState;
  guardando: boolean;
  open: boolean;
  puedeReasignar: boolean;
  selectedCount: number;
  onClose: () => void;
  onGuardar: () => void;
  onUpdateForm: (
    field: keyof MasivoReasignacionFormState,
    value: string,
  ) => void;
}

export function ReasignacionMasivaModal({
  asesores,
  form,
  guardando,
  open,
  puedeReasignar,
  selectedCount,
  onClose,
  onGuardar,
  onUpdateForm,
}: ReasignacionMasivaModalProps) {
  return (
    <Modal show={open} onHide={onClose} centered>
      <Modal.Header {...({ closeButton: true } as any)}>
        <Modal.Title>Reasignar seleccionadas</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">
          Se reasignaran <strong>{selectedCount}</strong> filas seleccionadas.
        </p>

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
          {guardando ? "Aplicando..." : "Aplicar reasignacion masiva"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
