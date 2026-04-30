import { useMemo } from "react";
import { Badge, Button, ButtonGroup, Card, Spinner } from "react-bootstrap";
import type { ParametrizacionUser } from "@app/services/Parametrizacion/types";
import {
  DynamicTablePagination,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacion";

interface UsuariosTableCardProps {
  loading: boolean;
  usuarios: ParametrizacionUser[];
  usuariosFiltrados: ParametrizacionUser[];
  textoBusqueda: string;
  usuarioSeleccionadoId: number | null;
  filasPorPagina: number;
  pagina: number;
  puedeEditar: boolean;
  puedeCambiarContrasena: boolean;
  onTextoBusquedaChange: (valor: string) => void;
  onFilasPorPaginaChange: (valor: number) => void;
  onPaginaChange: (valor: number) => void;
  onEditarUsuario: (usuario: ParametrizacionUser) => void;
  onCambiarEstado: (usuario: ParametrizacionUser) => void;
  onAbrirModalCambioContrasena: (usuario: ParametrizacionUser) => void;
}

export default function UsuariosTableCard({
  loading,
  usuarios,
  usuariosFiltrados,
  textoBusqueda,
  usuarioSeleccionadoId,
  filasPorPagina,
  pagina,
  puedeEditar,
  puedeCambiarContrasena,
  onTextoBusquedaChange,
  onFilasPorPaginaChange,
  onPaginaChange,
  onEditarUsuario,
  onCambiarEstado,
  onAbrirModalCambioContrasena,
}: UsuariosTableCardProps) {
  const columnasTabla = useMemo<TableColumn[]>(
    () => [
      {
        id: "username",
        label: "Usuario",
        format: (valor: string) => <span style={{ fontWeight: 600 }}>{valor}</span>,
      },
      {
        id: "fullName",
        label: "Nombre completo",
        format: (valor: string) => valor || "-",
      },
      {
        id: "email",
        label: "Correo electronico",
        format: (valor: string) => <span className="text-muted">{valor || "-"}</span>,
      },
      {
        id: "roleName",
        label: "Rol",
        format: (valor: string) => valor || "Sin rol",
      },
      {
        id: "isActive",
        label: "Estado",
        format: (valor: boolean) => (
          <Badge pill variant={valor ? "success" : "secondary"}>
            {valor ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
      {
        id: "acciones",
        label: "Acciones",
        format: (_valor: unknown, fila: ParametrizacionUser) => (
          <ButtonGroup size="sm">
            <Button
              variant="outline-primary"
              onClick={() => onEditarUsuario(fila)}
              disabled={!puedeEditar}
            >
              Editar
            </Button>
            <Button
              variant={fila.isActive ? "outline-secondary" : "outline-success"}
              onClick={() => {
                void onCambiarEstado(fila);
              }}
              disabled={!puedeEditar}
            >
              {fila.isActive ? "Desactivar" : "Activar"}
            </Button>
            <Button
              variant="outline-dark"
              onClick={() => onAbrirModalCambioContrasena(fila)}
              disabled={!puedeCambiarContrasena}
            >
              Contrasena
            </Button>
          </ButtonGroup>
        ),
      },
    ],
    [
      onAbrirModalCambioContrasena,
      onCambiarEstado,
      onEditarUsuario,
      puedeCambiarContrasena,
      puedeEditar,
    ]
  );

  return (
    <Card.Body className="pt-1">
      {loading && usuarios.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" /> Cargando usuarios...
        </div>
      ) : (
        <DynamicTablePagination
          columns={columnasTabla}
          rows={usuariosFiltrados}
          searchText={textoBusqueda}
          onSearchChange={onTextoBusquedaChange}
          rowsPerPage={filasPorPagina}
          onRowsPerPageChange={onFilasPorPaginaChange}
          page={pagina}
          onPageChange={onPaginaChange}
          withSearch={false}
          maxHeight="520px"
          selectedPredicate={(fila) => usuarioSeleccionadoId === fila.userId}
        />
      )}
    </Card.Body>
  );
}
