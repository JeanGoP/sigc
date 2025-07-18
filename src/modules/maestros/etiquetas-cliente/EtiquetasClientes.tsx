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

interface EtiquetaCliente {
  id: number;
  nombre: string;
  color: string;
  estado: boolean;
}

const API_URL = "https://localhost:7013/api/EtiquetaCliente";

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

  .modal-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    border-radius: 0.5rem 0.5rem 0 0;
    padding: 1rem 1.5rem;

    .modal-title {
      font-weight: 600;
      color: #2c3e50;
    }
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-footer {
    background-color: #f8f9fa;
    border-top: 1px solid #e9ecef;
    border-radius: 0 0 0.5rem 0.5rem;
    padding: 1rem 1.5rem;
  }
`;

const StyledFormGroup = styled(Form.Group)`
  margin-bottom: 1.5rem;
  .form-label {
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }
  .form-control {
    border-radius: 0.375rem;
    border: 1px solid #ced4da;
    padding: 0.5rem 0.75rem;
  }
`;

const StyledButton = styled(Button)`
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  border-radius: 0.375rem;
`;

const EtiquetasClientes: React.FC = () => {
  const [etiquetas, setEtiquetas] = useState<EtiquetaCliente[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
const [formData, setFormData] = useState({
  nombre: "",
  color: "#2ecc71",
  estado: true,
});
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<EtiquetaCliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");

  const fetchEtiquetas = async (filter: string = "") => {
    try {
      const url = `${API_URL}?filter=${encodeURIComponent(filter)}`;
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) setEtiquetas(result.data);
    } catch (e) {
      toast.error("Error al cargar las etiquetas");
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
  try {
    setLoading(true);

    const payload = {
      id: selectedEtiqueta?.id || 0, // 0 para nuevo, id existente para editar
      nombre: formData.nombre,
      color: formData.color,
      estado: formData.estado,
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result.success) {
      toast.success(selectedEtiqueta ? "Etiqueta actualizada" : "Etiqueta creada");
      fetchEtiquetas(searchText);
      handleCloseModal();
    } else {
      toast.error(result.message || "Error al guardar la etiqueta");
    }
  } catch (e) {
    toast.error("Error al guardar la etiqueta");
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar esta etiqueta?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Accept: "*/*" },
      });
      const result = await res.json();
      if (result.success) {
        fetchEtiquetas(searchText);
      } else {
        toast.error(result.message || "Error al eliminar");
      }
    } catch (e) {
      toast.error("Error al eliminar la etiqueta");
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn[] = [
    { id: "id", label: "ID" },
    {
      id: "nombre",
      label: "Nombre",
      format: (_: any, row: EtiquetaCliente) => (
        <span>{row.nombre}</span>
      ),
    },
    {
      id: "estado",
      label: "Estado",
      format: (estado: boolean) => (
        <span className={`badge badge-${estado ? "success" : "secondary"}`}>
          {estado ? "Activa" : "Inactiva"}
        </span>
      ),
    },
    {
      id: "acciones",
      label: "Acciones",
      format: (_value: any, row: EtiquetaCliente) => (
        <Box>
          <Button
            variant="info"
            size="sm"
            className="mr-2"
            onClick={() => handleOpenModal(row)}
          >
            <i className="fas fa-edit"></i>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            <i className="fas fa-trash"></i>
          </Button>
        </Box>
      ),
    },
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
                    <Button
                      className="float-end"
                      variant="primary"
                      onClick={() => handleOpenModal()}
                    >
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
          <Modal.Header>
            <Modal.Title>
              {selectedEtiqueta ? "Editar" : "Nueva"} Etiqueta
            </Modal.Title>
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
                  disabled={loading}
                />
              </StyledFormGroup>

              <StyledFormGroup>
                <Form.Label>Color</Form.Label>
                <ColorPickerModal
                  value={formData.color}
                  onChange={(color) =>
                    setFormData((prev) => ({ ...prev, color }))
                  }
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
                  disabled={loading}
                />
              </StyledFormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <StyledButton variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </StyledButton>
            <StyledButton
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {selectedEtiqueta ? "Actualizar" : "Guardar"}
            </StyledButton>
          </Modal.Footer>
        </StyledModal>
      </div>
    </div>
  );
};

export default EtiquetasClientes;
