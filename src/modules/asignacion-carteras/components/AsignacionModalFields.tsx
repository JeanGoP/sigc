import { Form } from "react-bootstrap";
import type { CarteraAsesor } from "@app/services/AsignacionCarteras/asignacionCarterasService";

interface AsignacionAsesorFieldProps {
  asesores: CarteraAsesor[];
  disabled: boolean;
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function AsignacionAsesorField({
  asesores,
  disabled,
  label = "Asesor",
  value,
  onChange,
}: AsignacionAsesorFieldProps) {
  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Control
        as="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Seleccione un asesor</option>
        {asesores.map((asesor) => (
          <option key={asesor.userId} value={asesor.userId}>
            {asesor.fullName}
          </option>
        ))}
      </Form.Control>
    </Form.Group>
  );
}

interface AsignacionMotivoFieldProps {
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function AsignacionMotivoField({
  disabled,
  value,
  onChange,
}: AsignacionMotivoFieldProps) {
  return (
    <Form.Group>
      <Form.Label>Motivo (opcional)</Form.Label>
      <Form.Control
        as="textarea"
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </Form.Group>
  );
}
