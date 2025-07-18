import React from 'react';
import MultiSelectCheckBox, { SelectOption } from '@app/components/MultiSelectCheckBox/MultiSelectCheckBox';
import { MultiValue } from 'react-select';

interface Props {
  onSearch: (filters: { edad: string[]; cuenta: string[] }) => void;
}

const edades: SelectOption[] = [
  { value: 'PV', label: 'PV' },
  { value: '30', label: '30' },
  { value: '60', label: '60' },
  { value: '90', label: '90' },
  { value: '+90', label: '+90' },
];

const cuentas: SelectOption[] = [
  { value: '1105', label: 'Cuenta 1105' },
  { value: '1305', label: 'Cuenta 1305' },
  { value: '1405', label: 'Cuenta 1405' },
];

const PortfolioFilters: React.FC<Props> = ({ onSearch }) => {
  const [edad, setEdad] = React.useState<MultiValue<SelectOption>>([]);
  const [cuenta, setCuenta] = React.useState<MultiValue<SelectOption>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      edad: edad.map(e => e.value),
      cuenta: cuenta.map(c => c.value),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="container-fluid p-3 border rounded bg-light mb-3">
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-4 mb-3 mb-md-0">
          <label className="form-label fw-bold">Filtro de Edad</label>
          <MultiSelectCheckBox
            options={edades}
            value={edad}
            onChange={setEdad}
            placeholder="Todas"
          />
        </div>
        <div className="col-12 col-md-4 mb-3 mb-md-0">
          <label className="form-label fw-bold">Cuenta</label>
          <MultiSelectCheckBox
            options={cuentas}
            value={cuenta}
            onChange={setCuenta}
            placeholder="Todas"
          />
        </div>
        <div className="col-12 col-md-4 d-grid">
          <button type="submit" className="btn btn-primary btn-block">Buscar</button>
        </div>
      </div>
    </form>
  );
};

export default PortfolioFilters; 