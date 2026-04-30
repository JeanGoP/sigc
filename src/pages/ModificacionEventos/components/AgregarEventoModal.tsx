import { Button, Modal } from "react-bootstrap";
import type { HoraDispItem } from "@app/services/ConsultaCartera/HorasDispDiaService";
import { EventoFormFields } from "./EventoFormFields";
import type { EdicionEventoForm } from "../domain/types";

interface SelectOption {
  label: string;
  value: string | number;
}

interface AgregarEventoModalProps {
  show: boolean;
  gestionId?: number;
  form: EdicionEventoForm;
  usuarioOptions: SelectOption[];
  tipoEventoOptions: SelectOption[];
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
  horasDisponibles: HoraDispItem[];
  loadingHoras: boolean;
  saving: boolean;
  onClose: () => void;
  onGuardar: () => void;
  onUsuarioChange: (value: string | number) => void;
  onTipoEventoChange: (value: string | number) => void;
  onFechaEventoChange: (value: string) => void;
  onHoraEventoChange: (value: string) => void;
  onMontoChange: (value: string) => void;
}

export function AgregarEventoModal({
  show,
  gestionId,
  form,
  usuarioOptions,
  tipoEventoOptions,
  requiereFecha,
  requiereHora,
  requiereMonto,
  horasDisponibles,
  loadingHoras,
  saving,
  onClose,
  onGuardar,
  onUsuarioChange,
  onTipoEventoChange,
  onFechaEventoChange,
  onHoraEventoChange,
  onMontoChange,
}: AgregarEventoModalProps) {
  return (
    <Modal show={show} onHide={onClose} size="xl" centered style={{ zIndex: 1060 }}>
      <Modal.Header
        closeButton
        placeholder=""
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
      >
        <Modal.Title>Agregar evento - Gestion #{gestionId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <EventoFormFields
          form={form}
          usuarioOptions={usuarioOptions}
          tipoEventoOptions={tipoEventoOptions}
          requiereFecha={requiereFecha}
          requiereHora={requiereHora}
          requiereMonto={requiereMonto}
          horasDisponibles={horasDisponibles}
          loadingHoras={loadingHoras}
          onUsuarioChange={onUsuarioChange}
          onTipoEventoChange={onTipoEventoChange}
          onFechaEventoChange={onFechaEventoChange}
          onHoraEventoChange={onHoraEventoChange}
          onMontoChange={onMontoChange}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="success" onClick={onGuardar} disabled={saving}>
          {saving ? "Guardando..." : "Agregar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
