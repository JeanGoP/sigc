import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Row, Col } from "react-bootstrap";
import styled from "styled-components";
import { toast } from "react-toastify";
import ColorPickerModal from "@app/modules/maestros/tipos-eventos/components/ColorPickerTipoEventos";
import { Box } from "@mui/material";
import {
  DynamicTablePagination,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacion";
import { useAppSelector } from "@app/store/store";
import {
  useListarEtiquetasClientes,
  useGuardarEtiquetaCliente,
  useEliminarEtiquetaCliente,
} from "@app/services/Maestros/EtiquetasClientes/EtiquetasClienteService";

interface EtiquetaCliente {
  id: number;
  nombre: string;
  color: string;
  estado: boolean;
}

const StyledCard = styled.div`
  margin-bottom: 1rem;
  background: white;
  border-radius: 0.25rem;
  box-shadow:
    0 0 1px rgba(0, 0, 0, 0.125),
    0 1px 3px rgba(0, 0, 0, 0.2);
`;

const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 0.5rem;
    border: none;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  }
`;

const StyledFormGroup = styled(Form.Group)`
  margin-bottom: 1.5rem;
`;

const StyledButton = styled(Button)`
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  border-radius: 0.375rem;
`;

const EtiquetasClientes: React.FC = () => {
  const [etiquetas, setEtiquetas] = useState<EtiquetaCliente[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [formData, setFormData] = useState({
    nombre: "",
    color: "#2ecc71",
    estado: true,
  });
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<EtiquetaCliente | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");

  const { listarEtiquetasClientes } = useListarEtiquetasClientes();
  const { guardarEtiquetaCliente, loading: saving } = useGuardarEtiquetaCliente();
  const { eliminarEtiquetaCliente, loading: deleting } = useEliminarEtiquetaCliente();

  const fetchEtiquetas = async (filter: string = "") => {
    const result = await listarEtiquetasClientes(filter);
    if (result && result.success) {
      setEtiquetas(result.data);
    } else {
      toast.error(result?.message || "Error al cargar las etiquetas");
    }
  };

  useEffect(() => {
    fetchEtiquetas(searchText);
  }, [searchText]);

  const handleOpenModal = (etiqueta?: EtiquetaCliente) => {
    if (etiqueta) {
      setSelectedEtiqueta(etiqueta);
      setFormData({
        nombre: etiqueta.nombre,
        color: etiqueta.color,
        estado: etiqueta.estado,
      });
    } else {
      setSelectedEtiqueta(null);
      setFormData({ nombre: "", color: "#2ecc71", estado: true });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEtiqueta(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!currentUser?.id) {
      toast.error("Usuario no válido");
      return;
    }
    const payload = {
      id: selectedEtiqueta?.id || 0,
      nombre: formData.nombre,
      color: formData.color,
      estado: formData.estado,
      iduser: Number(currentUser.id),
    };

    const result = await guardarEtiquetaCliente(payload);
    if (result && result.success) {
      toast.success(selectedEtiqueta ? "Etiqueta actualizada" : "Etiqueta creada");
      fetchEtiquetas(searchText);
      handleCloseModal();
    } else {
      toast.error(result?.message || "Error al guardar la etiqueta");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar esta etiqueta?")) return;

    const result = await eliminarEtiquetaCliente(id);
    if (result && result.success) {
      fetchEtiquetas(searchText);
    } else {
      toast.error(result?.message || "Error al eliminar");
    }
  };

  const columns: TableColumn[] = [
    { id: "id", label: "ID" },
    { id: "nombre", label: "Nombre", format: (_: any, row: EtiquetaCliente) => <span>{row.nombre}</span> },
    { id: "estado", label: "Estado", format: (estado: boolean) => (
      <span className={`badge badge-${estado ? "success" : "secondary"}`}>{estado ? "Activa" : "Inactiva"}</span>
    ) },
    { id: "acciones", label: "Acciones", format: (_value: any, row: EtiquetaCliente) => (
      <Box>
        <Button variant="info" size="sm" className="mr-2" onClick={() => handleOpenModal(row)}>
          <i className="fas fa-edit"></i>
        </Button>
        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
          <i className="fas fa-trash"></i>
        </Button>
      </Box>
    ) },
  ];

  return (
    <div className="container-wrapper" style={{ marginLeft: "80px" }}>
      <div className="container-wrapper">
        <div className="container-header">
          <h1 className="m-0">Etiquetas de Cliente</h1>
        </div>

        <section className="content">
          <div className="container-fluid">
            <StyledCard>
              <div className="card-header d-flex">
                <Row>
                  <Col xs={12} lg={12} md={12}>
                    <Button className="float-end" variant="primary" onClick={() => handleOpenModal()}>
                      <i className="fas fa-plus mr-2"></i>Nueva etiqueta de cliente
                    </Button>
                  </Col>
                </Row>
              </div>
              <div className="card-body">
                <DynamicTablePagination
                  columns={columns}
                  rows={etiquetas}
                  searchText={searchText}
                  onSearchChange={setSearchText}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={setRowsPerPage}
                  page={page}
                  onPageChange={setPage}
                />
              </div>
            </StyledCard>
          </div>
        </section>

        <StyledModal show={modalOpen} onHide={handleCloseModal} centered>
          <Modal.Header {...({ closeButton: true } as any)}>
            <Modal.Title>{selectedEtiqueta ? "Editar" : "Nueva"} Etiqueta</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <StyledFormGroup>
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </StyledFormGroup>

              <StyledFormGroup>
                <Form.Label>Color</Form.Label>
                <ColorPickerModal
                  value={formData.color}
                  onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
                />
              </StyledFormGroup>

              <StyledFormGroup>
                <Form.Label>Estado</Form.Label>
                <Form.Check
                  type="switch"
                  id="estado"
                  name="estado"
                  checked={formData.estado}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </StyledFormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <StyledButton variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </StyledButton>
            <StyledButton variant="primary" onClick={handleSubmit} disabled={saving}>
              {selectedEtiqueta ? "Actualizar" : "Guardar"}
            </StyledButton>
          </Modal.Footer>
        </StyledModal>
      </div>
    </div>
  );
};

export default EtiquetasClientes;
