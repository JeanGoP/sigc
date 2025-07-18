import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Row, Col, Toast } from "react-bootstrap";
import styled from "styled-components";
import {
  DynamicTablePagination,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacion";
import { Box } from "@mui/material";
import IconPickerModal from "./components/IconPicker";
import ColorPickerModal from "./components/ColorPickerTipoEventos";
import { toast } from "react-toastify";

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
    transition:
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;

    &:focus {
      border-color: #80bdff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
  }

  .form-check {
    margin-top: 0.5rem;

    .form-check-input {
      margin-top: 0.25rem;
    }

    .form-check-label {
      color: #2c3e50;
      font-weight: 500;
    }
  }
`;

const StyledButton = styled(Button)`
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: all 0.2s ease-in-out;

  &.btn-primary {
    background-color: #007bff;
    border-color: #007bff;

    &:hover {
      background-color: #0069d9;
      border-color: #0062cc;
    }
  }

  &.btn-secondary {
    background-color: #6c757d;
    border-color: #6c757d;

    &:hover {
      background-color: #5a6268;
      border-color: #545b62;
    }
  }
`;

interface TipoEvento {
  id: number;
  nombre: string;
  descripcion: string;
  color?: string;
  Icon?: string;
  requiereMonto: boolean;
  requiereFecha: boolean;
  requiereHora: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: TipoEvento[];
  statusCode: number;
  errors: string[];
}

const API_URL = "https://localhost:7013/api/TipoEvento";

const TiposEventos: React.FC = () => {
  const [tiposEventos, setTiposEventos] = useState<TipoEvento[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoEventoSeleccionado, setTipoEventoSeleccionado] =
    useState<TipoEvento | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    color: "",
    icono: "",
    requiereMonto: false,
    requiereFecha: false,
    requiereHora: false,
  });
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [icon, setIcon] = useState<string>("");
  const [color, setColor] = useState<string>("black"); // Color por defecto

  // Efecto para sincronizar el color cuando cambie
  useEffect(() => {
    console.log("TiposEventos - Color actualizado:", color);
  }, [color]);

  // Función para manejar el cambio de color
  const handleColorChange = (newColor: string) => {
    console.log("TiposEventos - handleColorChange llamado con:", newColor);
    setColor(newColor);
  };

  // Estados para la paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");

  const fetchTiposEventos = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString(),
        nombre: searchText,
      });

      const response = await fetch(`${API_URL}?${queryParams}`);
      if (!response.ok) {
        throw new Error("Error al cargar los tipos de evento");
      }
      const result: ApiResponse = await response.json();

      console.log("Result:", result);

      if (result.success) {
        setTiposEventos(result.data);
        setTotalItems(result.data.length);
      } else {
        // setError(result.message || "Error al cargar los tipos de evento");
        throw new Error(
          result.message || "Error al cargar los tipos de evento"
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al cargar los tipos de evento"
      );
      // setError(
      //   error instanceof Error
      //     ? error.message
      //     : "Error al cargar los tipos de evento"
      // );
      console.error("Error al cargar tipos de eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTiposEventos();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  useEffect(() => {
    fetchTiposEventos();
  }, [page, rowsPerPage]);

  const handleOpenModal = (tipoEvento?: TipoEvento) => {
    if (tipoEvento) {
      setTipoEventoSeleccionado(tipoEvento);
      setFormData({
        nombre: tipoEvento.nombre,
        descripcion: tipoEvento.descripcion,
        color: tipoEvento.color || "#2ecc71",
        icono: tipoEvento.Icon || "",
        requiereMonto: tipoEvento.requiereMonto,
        requiereFecha: tipoEvento.requiereFecha,
        requiereHora: tipoEvento.requiereHora,
      });
      // Sincronizar los estados separados
      setColor(tipoEvento.color || "#2ecc71");
      setIcon(tipoEvento.Icon || "");
    } else {
      setTipoEventoSeleccionado(null);
      setFormData({
        nombre: "",
        descripcion: "",
        color: "#2ecc71",
        icono: "",
        requiereMonto: false,
        requiereFecha: false,
        requiereHora: false,
      });
      // Resetear estados separados
      setColor("#2ecc71");
      setIcon("");
    }
    setModalOpen(true);
    console.log("Color actual:", color);
    console.log("Icono actual:", icon);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTipoEventoSeleccionado(null);
    setError(null);
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
      setError(null);

      const payload = {
        id: tipoEventoSeleccionado?.id || 0,
        ...formData,
      };

      console.log("Payload enviado:", payload);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        console.log("Error en la respuesta:", payload);
        throw new Error(result.message || "Error al guardar el tipo de evento");
      }

      console.log("Response:", result);
      if (result.success) {
        await fetchTiposEventos();
        handleCloseModal();
      } else {
        setError(result.message || "Error al guardar el tipo de evento");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar el tipo de evento"
      );

    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Está seguro de eliminar este tipo de evento?")) {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers: {
            accept: "*/*",
          },
        });

        if (!response.ok) {
          throw new Error("Error al eliminar el tipo de evento");
        }

        const result = await response.json();

        if (result.success) {
          await fetchTiposEventos();
        } else {
          setError(result.message || "Error al eliminar el tipo de evento");
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Error al eliminar el tipo de evento"
        );
        console.error("Error al eliminar tipo de evento:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const columns: TableColumn[] = [
    { id: "id", label: "ID" },
    { id: "nombre", label: "Nombre" },
    { id: "descripcion", label: "Descripción" },
    {
      id: "requiereMonto",
      label: "Requiere Monto",
      format: (value: boolean) => (
        <span className={`badge badge-${value ? "success" : "secondary"}`}>
          {value ? "Sí" : "No"}
        </span>
      ),
    },
    {
      id: "requiereFecha",
      label: "Requiere Fecha",
      format: (value: boolean) => (
        <span className={`badge badge-${value ? "success" : "secondary"}`}>
          {value ? "Sí" : "No"}
        </span>
      ),
    },
    {
      id: "requiereHora",
      label: "Requiere Hora",
      format: (value: boolean) => (
        <span className={`badge badge-${value ? "success" : "secondary"}`}>
          {value ? "Sí" : "No"}
        </span>
      ),
    },
    {
      id: "acciones",
      label: "Acciones",
      format: (_value: any, row: TipoEvento) => (
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
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Tipos de Eventos</h1>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <StyledCard>
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="card-title">Lista de Tipos de Eventos</h3>
                <Button
                  variant="primary"
                  onClick={() => handleOpenModal()}
                  disabled={loading}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Nuevo Tipo de Evento
                </Button>
              </div>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <DynamicTablePagination
                columns={columns}
                rows={tiposEventos}
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
            {tipoEventoSeleccionado
              ? "Editar Tipo de Evento"
              : "Nuevo Tipo de Evento"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <Form>
            <StyledFormGroup>
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                maxLength={100}
                placeholder="Ingrese el nombre del tipo de evento"
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Máximo 100 caracteres
              </Form.Text>
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
                placeholder="Ingrese una descripción detallada"
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Máximo 255 caracteres
              </Form.Text>
            </StyledFormGroup>
            <StyledFormGroup>
              <Row>
                <Col xs={6} md={6}>
                  <Form.Label>Color</Form.Label>
                  <br />
                  <ColorPickerModal
                    value={formData.color}
                    onChange={(newColor) => {
                      setFormData(prev => ({ ...prev, color: newColor }));
                      setColor(newColor);
                    }}
                  />
                </Col>
                <Col xs={6} md={6}>
                  <Form.Label>Ícono</Form.Label>
                  <br />
                  <IconPickerModal
                    value={formData.icono}
                    onChange={(newIcon) => {
                      setFormData(prev => ({ ...prev, icono: newIcon }));
                      setIcon(newIcon);
                    }}
                    selectedColor={formData.color}
                  />
                </Col>
              </Row>
            </StyledFormGroup>

            <StyledFormGroup>
              <Form.Check
                type="switch"
                id="requiereMonto"
                label="Requiere Monto"
                name="requiereMonto"
                checked={formData.requiereMonto}
                onChange={handleInputChange}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Active esta opción si el tipo de evento requiere un monto
                asociado
              </Form.Text>
            </StyledFormGroup>
            <StyledFormGroup>
              <Form.Check
                type="switch"
                id="requiereFecha"
                label="Requiere Fecha"
                name="requiereFecha"
                checked={formData.requiereFecha}
                onChange={handleInputChange}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Active esta opción si el tipo de evento requiere una fecha
                asociada
              </Form.Text>
            </StyledFormGroup>
            <StyledFormGroup>
              <Form.Check
                type="switch"
                id="requiereHora"
                label="Requiere Hora"
                name="requiereHora"
                checked={formData.requiereHora}
                onChange={handleInputChange}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Active esta opción si el tipo de evento requiere una hora
                asociada
              </Form.Text>
            </StyledFormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <StyledButton
            variant="secondary"
            onClick={handleCloseModal}
            disabled={loading}
          >
            <i className="fas fa-times mr-2"></i>
            Cancelar
          </StyledButton>
          <StyledButton
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm mr-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Procesando...
              </>
            ) : (
              <>
                <i
                  className={`fas fa-${tipoEventoSeleccionado ? "save" : "plus"} mr-2`}
                ></i>
                {tipoEventoSeleccionado ? "Actualizar" : "Guardar"}
              </>
            )}
          </StyledButton>
        </Modal.Footer>
      </StyledModal>
    </div>
  );
};

export default TiposEventos;