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
  compact?: boolean;
}

export const SingleSelect: React.FC<SingleSelectProps> = ({
  options,
  selectedValue,
  onChange,
  label,
  compact = false,
}) => {
  return (
    <Form.Group controlId="singleSelect" style={compact ? { marginBottom: 0 } : undefined}>
      {label && (
        <Form.Label style={compact ? { fontSize: 12, marginBottom: 4 } : undefined}>
          {label}
        </Form.Label>
      )}
      <Form.Control
        as="select"
        size={compact ? "sm" : undefined}
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
