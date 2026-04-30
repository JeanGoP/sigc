import React from 'react';
import { Form } from 'react-bootstrap';

interface Props {
  value: string;
  onChange: (formattedValue: string) => void;
}

export const NumericField: React.FC<Props> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    const numeric = parseFloat(value);
    if (!isNaN(numeric)) {
      onChange(numeric.toFixed(2)); // Formato 0.00
    }
  };

  return (
    <Form.Group controlId="interesMora">
      <Form.Label>Interés mora</Form.Label>
      <Form.Control
        type="number"
        placeholder="Interés mora"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </Form.Group>
  );
};
