import React, { useEffect, useState } from "react";
import { Button, Modal, Form, Col, Row } from "react-bootstrap";
import styled from "styled-components";
import { Box } from "@mui/material";
import { toast } from "react-toastify";
import {
  DynamicTablePagination,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacion";
import { useListarTiposContacto } from "@app/services/Maestros/TiposContactos/ListarTipoContactos";
  import {useGuardarTipoContacto } from "@app/services/Maestros/TiposContactos/GuardarTipoContacto";
  import {useEliminarTipoContacto } from "@app/services/Maestros/TiposContactos/EliminarTipoContacto";


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

const EstadosEventos: React.FC = () => {
  const [tiposContacto, setTiposContacto] = useState<TipoContacto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    estado: true,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<TipoContacto | null>(null);

  const { listarTiposContacto, loading: loadingList } = useListarTiposContacto();
  const { guardarTipoContacto, loading: loadingSave } = useGuardarTipoContacto();
  const { eliminarTipoContacto, loading: loadingDelete } = useEliminarTipoContacto();

  const fetchData = async () => {
    const result = await listarTiposContacto({
      nombre: searchText,
      page: page + 1,
      pageSize: rowsPerPage,
    });

    if (result && result.success) {
      setTiposContacto(result.data);
    } else {
      toast.error(result?.message || "Error al cargar los tipos de contacto");
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
    setSelected(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? target.checked : value,
    }));
  };

  const handleSubmit = async () => {
    const payload = {
      id: selected?.id || 0,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      estado: formData.estado,
      idUser: 2, // Ajustar dinámicamente si es necesario
    };

    const result = await guardarTipoContacto(payload);

    if (result && result.success) {
      toast.success("Guardado exitosamente");
      fetchData();
      handleCloseModal();
    } else {
      toast.error(result?.message || "Error al guardar el tipo de contacto");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar este tipo de contacto?")) return;

    const result = await eliminarTipoContacto(id);

    if (result && result.success) {
      toast.success("Eliminado correctamente");
      fetchData();
    } else {
      toast.error(result?.message || "Error al eliminar el tipo de contacto");
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
        <Modal.Header closeButton={true} {...({} as any)}>
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
            {loadingSave ? "Guardando..." : selected ? "Actualizar" : "Guardar"}
          </StyledButton>
        </Modal.Footer>
      </StyledModal>
    </div>
  );
};

export default EstadosEventos;
