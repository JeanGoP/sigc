import React from "react";
import Select, { components, OptionProps, MultiValue } from "react-select";

// Define el tipo de cada opción del dropdown
export interface SelectOption {
  label: string;
  value: string;
}

// Props del componente
interface MultiSelectCheckboxProps {
  options: SelectOption[];
  value: MultiValue<SelectOption>;
  onChange: (selected: MultiValue<SelectOption>) => void;
  placeholder?: string;
}

// Componente personalizado de opción con checkbox
const Option = (props: OptionProps<SelectOption, true>) => {
  return (
    <components.Option {...props}>
      <input
        type="checkbox"
        checked={props.isSelected}
        onChange={() => null}
        style={{ marginRight: 8 }}
      />
      <label>{props.label}</label>
    </components.Option>
  );
};

// Componente reutilizable
const MultiSelectCheckbox: React.FC<MultiSelectCheckboxProps> = ({
  options,
  value,
  onChange,
  placeholder = "Seleccione opciones...",
}) => {
  return (
    <Select
      options={options}
      isMulti
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      components={{ Option }}
      onChange={onChange}
      value={value}
      placeholder={placeholder}
    />
  );
};

export default MultiSelectCheckbox;
