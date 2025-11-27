import React from 'react';
import { Form } from 'react-bootstrap';

interface Props {
  label: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const CustomDatePicker: React.FC<Props> = ({
  label = 'Seleccione la fecha',
  selectedDate,
  onDateChange,
}) => {
  
  const formatForInput = (date: string) =>
    date ? date.replaceAll('/', '-') : '';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value; // "AAAA-MM-DD"
    if (!rawValue) {
      onDateChange('');
      return;
    }

    const [year, month, day] = rawValue.split('-');
    const formatted = `${year}/${month}/${day}`;
    onDateChange(formatted);
  };

  const handleDoubleClick = () => {
    onDateChange('');
  };

  return (
    <Form.Group controlId="formDate">
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="date"
        value={formatForInput(selectedDate)}
        onChange={handleChange}
        onDoubleClick={handleDoubleClick}
      />
    </Form.Group>
  );
};
