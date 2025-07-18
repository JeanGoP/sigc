import React from 'react';
import { Form } from 'react-bootstrap';

interface Option {
  label: string;
  value: string | number;
}

interface SingleSelectProps {
  options: Option[];
  selectedValue: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  placeholder?: string;
}

export const SingleSelect: React.FC<SingleSelectProps> = ({
  options,
  selectedValue,
  onChange,
  label,
}) => {
  return (
    <Form.Group controlId="singleSelect">
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control
        as="select"
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Control>
    </Form.Group>
  );
};
