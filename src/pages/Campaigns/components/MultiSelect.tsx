import React from 'react';
import Select, { MultiValue, Options } from 'react-select';

export interface OptionType {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: OptionType[];
  value: OptionType[];
  onChange: (selected: OptionType[]) => void;
  placeholder?: string;
  isMulti?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange, placeholder, isMulti = true }) => {
  return (
    <Select
      options={options}
      value={value}
      onChange={val => onChange(val as OptionType[])}
      isMulti={isMulti}
      isSearchable
      placeholder={placeholder}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      classNamePrefix="react-select"
      styles={{
        menu: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
};

export default MultiSelect; 