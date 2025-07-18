import React, { useState, useRef, useEffect } from 'react';

export interface CustomOption {
  value: string;
  label: string;
}

interface CustomMultiSelectProps {
  options: CustomOption[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Filtrar opciones por búsqueda
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = () => setOpen(o => !o);

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="position-relative" ref={ref} style={{ minWidth: 220 }}>
      <div
        className="form-control d-flex align-items-center justify-content-between"
        style={{ cursor: 'pointer', minHeight: 38, background: '#fff' }}
        onClick={handleToggle}
      >
        <span className="text-truncate" style={{ maxWidth: '80%' }}>
          {value.length === 0
            ? <span className="text-muted">{placeholder || 'Seleccione...'}</span>
            : options.filter(o => value.includes(o.value)).map(o => o.label).join(', ')
          }
        </span>
        {value.length > 0 && (
          <button className="btn btn-sm btn-link text-danger p-0 ms-2" tabIndex={-1} onClick={handleClear} title="Limpiar selección">
            ×
          </button>
        )}
        <span className="ms-auto ps-2"><i className="bi bi-chevron-down" /></span>
      </div>
      {open && (
        <div
          className="shadow border bg-white rounded position-absolute w-100 mt-1"
          style={{ zIndex: 1050, maxHeight: 220, overflowY: 'auto' }}
        >
          <div className="p-2 border-bottom">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ maxHeight: 170, overflowY: 'auto' }}>
            {filteredOptions.length === 0 && (
              <div className="text-muted p-2">Sin resultados</div>
            )}
            {filteredOptions.map(opt => (
              <label key={opt.value} className="d-flex align-items-center px-3 py-2 mb-0" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  onChange={() => handleSelect(opt.value)}
                  className="form-check-input me-2"
                />
                <span className="flex-grow-1">{opt.label}</span>
                {value.includes(opt.value) && <i className="bi bi-check2 ms-2 text-primary" />}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomMultiSelect; 