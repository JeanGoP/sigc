import React from 'react';
import { Form } from 'react-bootstrap';

interface Props {
  label: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const CustomDatePicker: React.FC<Props> = ({ label = 'Seleccione la fecha',selectedDate, onDateChange }) => {
  // Convierte de "AAAA/MM/DD" a "AAAA-MM-DD" para que el input pueda mostrarla correctamente
  const formatForInput = (date: string) => date ? date.replaceAll('/', '-') : '';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value; // "AAAA-MM-DD"
    const [year, month, day] = rawValue.split('-');
    const formatted = `${year}/${month}/${day}`;
    onDateChange(formatted); // ahora en formato AAAA/MM/DD
  };

  return (
    <Form.Group controlId="formDate">
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="date"
        value={formatForInput(selectedDate)}
        onChange={handleChange}
      />
    </Form.Group>
  );
};
