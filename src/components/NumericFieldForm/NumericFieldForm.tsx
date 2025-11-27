import { Form } from "react-bootstrap";
import { useState, useEffect } from "react";

interface NumericFilterProps {
  tittle?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
}

export const NumericFilter: React.FC<NumericFilterProps> = ({
    tittle = null,
  value,
  onChange,
  min = 1,
  max = 9999,
}) => {
  const [internalValue, setInternalValue] = useState<string>("");

  // Sincroniza prop → estado interno
  useEffect(() => {
    if (value === null) setInternalValue("");
    else setInternalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;

    // Permite vacío (equivale a null)
    if (v === "") {
      setInternalValue("");
      onChange(null);
      return;
    }

    // Validación de números
    const num = Number(v);
    if (!Number.isNaN(num) && num >= min && num <= max) {
      setInternalValue(v);
      onChange(num);
    }
  };

  const handleDoubleClick = () => {
    setInternalValue("");
    onChange(null);
  };

  return (
    <Form.Group className="mb-3">
        {tittle ? <Form.Label>{tittle}</Form.Label> : null}

      {/* <Form.Label>Filtrar por edad</Form.Label> */}

      <Form.Control
        type="number"
        placeholder="Todas"
        min={min}
        max={max}
        value={internalValue}
        onChange={handleChange}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: "pointer" }}
      />
    </Form.Group>
  );
};
