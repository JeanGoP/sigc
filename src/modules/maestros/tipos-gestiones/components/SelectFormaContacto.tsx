import React from "react";
import Form from "react-bootstrap/Form";

export type TipoContactoValue = "CD" | "CI" | "NC";

interface Props {
  value: TipoContactoValue;
  onChange: (value: TipoContactoValue) => void;
}

export const SelectFormaContacto: React.FC<Props> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as TipoContactoValue);
  };

  return (
    <Form.Group>
      <Form.Label>Tipo de Contacto</Form.Label>

      <Form.Control
        as="select"
        value={value}
        onChange={handleChange}
      >
        <option value="CD">Contacto Directo</option>
        <option value="CI">Contacto Indirecto</option>
        <option value="NC">No Contacto</option>
      </Form.Control>
    </Form.Group>
  );
};
