// ClienteModal.tsx
import { Modal, Button, Form } from 'react-bootstrap';
import { DataGrid, GridColDef, GridPaginationModel, GridRowParams } from '@mui/x-data-grid';

interface ClienteModalProps {
  show: boolean;
  onHide: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  columns: GridColDef[];
  rows: any[];
  selectedRows: string[];
  onSelectRow: (id: string) => void;
  onPaginationChange: (model: GridPaginationModel) => void;
  paginationModel: GridPaginationModel;
  onRowClick: (params: GridRowParams) => void;
}

const ModalTablaClientes = ({
  show,
  onHide,
  searchTerm,
  onSearchChange,
  columns,
  rows,
  selectedRows,
  onSelectRow,
  onPaginationChange,
  paginationModel,
  onRowClick
}: ClienteModalProps) => (
  <Modal show={show} onHide={onHide} size="lg" centered>
    <Modal.Body>
      <Form.Control
        placeholder="Buscar cliente..."
        className="mb-3"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rows.map((row) => ({
            ...row,
            selected: selectedRows.includes(row.id),
          }))}
          columns={columns}
          rowHeight={40}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationChange}
          pageSizeOptions={[20, 50, 100]}
          onRowClick={onRowClick}
          columnHeaderHeight={40}
        />
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Cancelar
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ModalTablaClientes;
