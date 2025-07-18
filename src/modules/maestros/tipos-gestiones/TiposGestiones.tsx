// EstadosEventos.tsx
import React, { useEffect, useState } from "react";
import { Button, Modal, Form, Col, Row } from "react-bootstrap";
import styled from "styled-components";
import { Box } from "@mui/material";
import { toast } from "react-toastify";
import {
  DynamicTablePagination,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacion";

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

interface TipoContacto {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
}

const API_URL = "https://localhost:7013/api/TiposContacto";

const EstadosEventos: React.FC = () => {
  const [tiposContacto, setTiposContacto] = useState<TipoContacto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    estado: true,
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<TipoContacto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        nombre: searchText,
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString(),
      });

      const url = `${API_URL}?${queryParams.toString()}`;
      console.log("URL generada:", url); // Opcional: para debug

      const response = await fetch(url, {
        headers: {
          accept: "*/*", // igual al curl
        },
      });

      if (!response.ok)
        throw new Error("Error al cargar los tipos de contacto");

      const result = await response.json();

      if (result.success) {
        setTiposContacto(result.data);
      } else {
        throw new Error(result.message || "Error en la respuesta del servidor");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchData, 400);
    return () => clearTimeout(timeout);
  }, [searchText]);

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage]);

  const handleOpenModal = (tipo?: TipoContacto) => {
    if (tipo) {
      setSelected(tipo);
      setFormData({
        nombre: tipo.nombre,
        descripcion: tipo.descripcion,
        estado: tipo.estado,
      });
    } else {
      setSelected(null);
      setFormData({ nombre: "", descripcion: "", estado: true });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setError(null);
    setSelected(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
        id: selected?.id || 0,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        estado: formData.estado,
        idUser: 2, // ⚠️ Ajusta esto dinámicamente si usas autenticación
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*", // igual que en el curl
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Error al guardar el tipo de contacto"
        );
      }

      toast.success("Guardado exitosamente");
      fetchData();
      handleCloseModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar este tipo de contacto?")) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          accept: "*/*", // Como en el curl
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Error al eliminar el tipo de contacto"
        );
      }

      toast.success("Eliminado correctamente");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn[] = [
    { id: "id", label: "ID" },
    { id: "nombre", label: "Nombre" },
    { id: "descripcion", label: "Descripción" },
    {
      id: "estado",
      label: "Estado",
      format: (val: boolean) => (
        <span className={`badge badge-${val ? "success" : "secondary"}`}>
          {val ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      id: "acciones",
      label: "Acciones",
      format: (_: any, row: TipoContacto) => (
        <Box>
          <Button variant="info" size="sm" onClick={() => handleOpenModal(row)}>
            <i className="fas fa-edit"></i>
          </Button>{" "}
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
    <div className="content-wrapper">
      <div className="content-header">
        <h1 className="m-0">Tipos de Contacto</h1>
      </div>

      <section className="content">
        <div className="container-fluid">
          <StyledCard>
            <div className="card-header d-flex">
              <Row>
                <Col xs={12} lg={12} md={12}>
                  <Button variant="primary" onClick={() => handleOpenModal()}>
                    <i className="fas fa-plus mr-2"></i>Nuevo Tipo de Contacto
                  </Button>
                </Col>
              </Row>
              {/* <h3 className="card-title">Listado de Tipos de Contacto</h3> */}
            </div>
            <div className="card-body">
              <DynamicTablePagination
                columns={columns}
                rows={tiposContacto}
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
        <Modal.Header closeButton>
          <Modal.Title>
            {selected ? "Editar Tipo de Contacto" : "Nuevo Tipo de Contacto"}
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
                maxLength={100}
                placeholder="Ej: WhatsApp, Llamada, Email..."
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                maxLength={255}
                placeholder="Descripción opcional del tipo de contacto"
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <Form.Check
                type="switch"
                id="estado"
                // label="Activo"
                name="estado"
                checked={formData.estado}
                onChange={handleInputChange}
              />
            </StyledFormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <StyledButton variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </StyledButton>
          <StyledButton variant="primary" onClick={handleSubmit}>
            {loading ? "Guardando..." : selected ? "Actualizar" : "Guardar"}
          </StyledButton>
        </Modal.Footer>
      </StyledModal>
    </div>
  );
};

export default EstadosEventos;
