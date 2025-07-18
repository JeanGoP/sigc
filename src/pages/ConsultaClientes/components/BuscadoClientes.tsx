// ClienteSearch.tsx
import { InputGroup, Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FormGroup } from '@mui/material';

interface ClienteSearchProps {
  selectedValue: string;
  onOpenModal: () => void;
  onClear: () => void;
}

const BuscadorClientes = ({ selectedValue, onOpenModal, onClear }: ClienteSearchProps,props: any) => (
  <FormGroup className="mb-3">
    <Form.Label>Cliente</Form.Label>
    <InputGroup>
    <Form.Control
      placeholder="Seleccione un registro..."
      value={selectedValue}
      onDoubleClick={onClear}
      readOnly
    />
    <Button variant="primary" onClick={onOpenModal}>
      <FontAwesomeIcon icon={faSearch} />
    </Button>
    </InputGroup>
  </FormGroup>
);

export default BuscadorClientes;
