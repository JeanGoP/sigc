import Form from "react-bootstrap/Form";
import type { TipoContactoValue } from "../domain/types";

interface SelectFormaContactoProps {
  value: TipoContactoValue;
  onChange: (value: TipoContactoValue) => void;
}

export default function SelectFormaContacto({
  value,
  onChange,
}: SelectFormaContactoProps) {
  return (
    <Form.Group>
      <Form.Label>Tipo de Contacto</Form.Label>

      <Form.Control
        as="select"
        value={value}
        onChange={(event) => onChange(event.target.value as TipoContactoValue)}
      >
        <option value="CD">Contacto Directo</option>
        <option value="CI">Contacto Indirecto</option>
        <option value="NC">No Contacto</option>
      </Form.Control>
    </Form.Group>
  );
}
