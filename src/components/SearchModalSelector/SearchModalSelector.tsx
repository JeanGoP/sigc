// SearchModalSelector.tsx
import { useState } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { DataGrid, GridColDef, GridPaginationModel, GridRowParams } from '@mui/x-data-grid';
import { FormGroup } from '@mui/material';

interface SearchModalSelectorProps {
  label?: string;
  placeholder?: string;
  selectedLabel: string;
  columns: GridColDef[];
  rows: any[];
  selectedId: string | null;
  onSelect: (id: string, label: string) => void;
  paginationModel: GridPaginationModel;
  onPaginationChange: (model: GridPaginationModel) => void;
  onSearchChange: (value: string) => void;
  searchTerm: string;
}

const SearchModalSelector = ({
  label = "Buscar",
  placeholder = "Seleccione un registro...",
  selectedLabel,
  columns,
  rows,
  selectedId,
  onSelect,
  paginationModel,
  onPaginationChange,
  onSearchChange,
  searchTerm,
}: SearchModalSelectorProps) => {
  const [show, setShow] = useState(false);

  const handleRowClick = (params: GridRowParams) => {
    onSelect(params.id.toString(), params.row?.nombre || params.row?.label || '');
    setShow(false);
  };

  const handleClear = () => {
    onSelect('', '');
  };

  return (
    <>
      <FormGroup className="mb-3">
        {label && <Form.Label>{label}</Form.Label>}
        <InputGroup>
          <Form.Control
            placeholder={placeholder}
            value={selectedLabel}
            onDoubleClick={handleClear}
            readOnly
          />
          <Button variant="primary" onClick={() => setShow(true)}>
            <FontAwesomeIcon icon={faSearch} />
          </Button>
        </InputGroup>
      </FormGroup>

      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Body>
          <Form.Control
            placeholder="Buscar..."
            className="mb-3"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              rowHeight={40}
              paginationModel={paginationModel}
              onPaginationModelChange={onPaginationChange}
              pageSizeOptions={[20, 50, 100]}
              onRowClick={handleRowClick}
              getRowId={(row) => row.id}
              columnHeaderHeight={40}
              sx={{ cursor: 'pointer' }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SearchModalSelector;
