import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Row, Col } from "react-bootstrap";
import styled from "styled-components";
import {
  DynamicTablePagination,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacion";
import { Box } from "@mui/material";
import IconPickerModal from "./components/IconPicker";
import ColorPickerModal from "./components/ColorPickerTipoEventos";
import { toast } from "react-toastify";
import { useAppSelector } from "@app/store/store";
import { useGuardarTipoEvento } from "@app/services/Maestros/TiposEventos/CrearTipoEvento";
import { useListarTiposEventos } from "@app/services/Maestros/TiposEventos/ListarTipoEventos";
import { useEliminarTipoEvento } from "@app/services/Maestros/TiposEventos/EliminarTipoEvento";

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

interface TipoEvento {
  id: number;
  nombre: string;
  descripcion: string;
  color?: string;
  icono?: string;
  minutos: number;
  requiereMonto: boolean;
  requiereFecha: boolean;
  requiereHora: boolean;
}

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
    minutos: 0,
    requiereMonto: false,
    requiereFecha: false,
    requiereHora: false,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [icon, setIcon] = useState<string>("");
  const [color, setColor] = useState<string>("black");

  const currentUser = useAppSelector((state) => state.auth.currentUser);

  // Hooks API
  const { loading: savingLoading, guardarTipoEvento } = useGuardarTipoEvento();
  const { loading: loadingList, listarTiposEventos } = useListarTiposEventos();
  const { loading: deletingLoading, eliminarTipoEvento } = useEliminarTipoEvento();

  // Paginación y búsqueda
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");

  const fetchTiposEventos = async () => {
    try {
      setError(null);
      const result = await listarTiposEventos({
        page: page + 1,
        pageSize: rowsPerPage,
        nombre: searchText,
      });

      if (result && result.success) {
        setTiposEventos(result.data);
        setTotalItems(result.data.length);
      } else {
        throw new Error(result?.message || "Error al cargar los tipos de evento");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al cargar los tipos de evento"
      );
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
        icono: tipoEvento.icono || "",
        minutos: tipoEvento.minutos,
        requiereMonto: tipoEvento.requiereMonto,
        requiereFecha: tipoEvento.requiereFecha,
        requiereHora: tipoEvento.requiereHora,
      });
      setColor(tipoEvento.color || "#2ecc71");
      setIcon(tipoEvento.icono || "");
    } else {
      setTipoEventoSeleccionado(null);
      setFormData({
        nombre: "",
        descripcion: "",
        color: "#2ecc71",
        icono: "",
        minutos: 0,
        requiereMonto: false,
        requiereFecha: false,
        requiereHora: false,
      });
      setColor("#2ecc71");
      setIcon("");
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTipoEventoSeleccionado(null);
    setError(null);
  };

  const handleOnBlurMinutos = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 10) {
      toast.warning("El tiempo no puede ser menor a 10 minutos.");
      setFormData((prev) => ({ ...prev, minutos: 10 }));
      return;
    }
    if (value > 30) {
      toast.warning("El tiempo no puede ser mayor a 30 minutos.");
      setFormData((prev) => ({ ...prev, minutos: 30 }));
      return;
    }
    setFormData((prev) => ({ ...prev, minutos: value }));
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
      setError(null);
      const payload = {
        id: tipoEventoSeleccionado?.id || 0,
        idUser: Number(currentUser?.id) || 0,
        ...formData,
      };
      const response = await guardarTipoEvento(payload);
      if (response && response.success) {
        await fetchTiposEventos();
        handleCloseModal();
        toast.success("Tipo de evento guardado exitosamente");
      } else {
        const errorMessage = response?.message || "Error al guardar el tipo de evento";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar el tipo de evento"
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Está seguro de eliminar este tipo de evento?")) {
      try {
        setError(null);
        const result = await eliminarTipoEvento(id);
        if (result && result.success) {
          await fetchTiposEventos();
        } else {
          throw new Error(result?.message || "Error al eliminar el tipo de evento");
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Error al eliminar el tipo de evento"
        );
      }
    }
  };

  const columns: TableColumn[] = [
    { id: "id", label: "ID" },
    { id: "nombre", label: "Nombre" },
    { id: "descripcion", label: "Descripción" },
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
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title">Lista de Tipos de Eventos</h3>
              <Button
                variant="primary"
                onClick={() => handleOpenModal()}
                disabled={savingLoading || loadingList}
              >
                <i className="fas fa-plus mr-2"></i>
                Nuevo Tipo de Evento
              </Button>
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
        <Modal.Header {...({ closeButton: true } as any)}>
          <Modal.Title>
            {tipoEventoSeleccionado ? "Editar Tipo de Evento" : "Nuevo Tipo de Evento"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Nombre */}
            <StyledFormGroup>
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                maxLength={100}
                placeholder="Ingrese el nombre"
                disabled={savingLoading}
              />
            </StyledFormGroup>

            {/* Descripción */}
            <StyledFormGroup>
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                maxLength={255}
                placeholder="Ingrese una descripción"
                disabled={savingLoading}
              />
            </StyledFormGroup>

            {/* Minutos */}
            <StyledFormGroup>
              <Form.Label>Duración (min)</Form.Label>
              <Form.Control
                type="number"
                name="minutos"
                value={formData.minutos}
                onChange={handleInputChange}
                onBlur={handleOnBlurMinutos}
                min={10}
                max={30}
                placeholder="Minutos"
                disabled={savingLoading}
              />
            </StyledFormGroup>

            {/* Color e icono */}
            <Row>
              <Col>
                <Form.Label>Color</Form.Label>
                <ColorPickerModal
                  value={formData.color}
                  onChange={(newColor) => {
                    setFormData(prev => ({ ...prev, color: newColor }));
                    setColor(newColor);
                  }}
                />
              </Col>
              <Col>
                <Form.Label>Ícono</Form.Label>
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

            {/* Switches */}
            <Form.Check
              type="switch"
              id="requiereMonto"
              label="Requiere Monto"
              name="requiereMonto"
              checked={formData.requiereMonto}
              onChange={handleInputChange}
              disabled={savingLoading}
            />
            <Form.Check
              type="switch"
              id="requiereFecha"
              label="Requiere Fecha"
              name="requiereFecha"
              checked={formData.requiereFecha}
              onChange={handleInputChange}
              disabled={savingLoading}
            />
            <Form.Check
              type="switch"
              id="requiereHora"
              label="Requiere Hora"
              name="requiereHora"
              checked={formData.requiereHora}
              onChange={handleInputChange}
              disabled={savingLoading}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={savingLoading}
          >
            {savingLoading ? "Procesando..." : tipoEventoSeleccionado ? "Actualizar" : "Guardar"}
          </Button>
        </Modal.Footer>
      </StyledModal>
    </div>
  );
};

export default TiposEventos;
