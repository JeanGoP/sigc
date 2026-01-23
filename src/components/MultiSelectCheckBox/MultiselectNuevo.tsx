import React from "react";
import Select, { MultiValue } from "react-select";

/* ===== Tipos ===== */

export interface SelectOption {
  label: string;
  value: string;
}

interface Props {
  options: SelectOption[];
  value: MultiValue<SelectOption>;
  onChange: (value: MultiValue<SelectOption>) => void;
  placeholder?: string;
}

/* ===== Componente ===== */

const MultiSelectSimple: React.FC<Props> = ({
  options,
  value,
  onChange,
  placeholder = "Seleccione opciones...",
}) => {
  return (
    <Select<SelectOption, true>
      isMulti
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      closeMenuOnSelect={false}
    />
  );
};

export default MultiSelectSimple;
