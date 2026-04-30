import { useMemo } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { Box } from "@mui/material";
import {
  DynamicTablePagination,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacion";
import type { TipoGestion } from "../domain/types";
import { StyledCard } from "./styled";

interface TiposGestionesTableCardProps {
  tiposGestiones: TipoGestion[];
  textoBusqueda: string;
  filasPorPagina: number;
  pagina: number;
  onTextoBusquedaChange: (value: string) => void;
  onFilasPorPaginaChange: (value: number) => void;
  onPaginaChange: (value: number) => void;
  onNuevoTipoGestion: () => void;
  onEditarTipoGestion: (tipoGestion: TipoGestion) => void;
  onEliminarTipoGestion: (id: number) => void;
}

export default function TiposGestionesTableCard({
  tiposGestiones,
  textoBusqueda,
  filasPorPagina,
  pagina,
  onTextoBusquedaChange,
  onFilasPorPaginaChange,
  onPaginaChange,
  onNuevoTipoGestion,
  onEditarTipoGestion,
  onEliminarTipoGestion,
}: TiposGestionesTableCardProps) {
  const columns = useMemo<TableColumn[]>(
    () => [
      { id: "id", label: "ID" },
      { id: "nombre", label: "Nombre" },
      { id: "descripcion", label: "Descripcion" },
      { id: "formaContacto", label: "Tipo" },
      {
        id: "estado",
        label: "Estado",
        format: (value: boolean) => (
          <span className={`badge badge-${value ? "success" : "secondary"}`}>
            {value ? "Activo" : "Inactivo"}
          </span>
        ),
      },
      {
        id: "acciones",
        label: "Acciones",
        format: (_value: unknown, row: TipoGestion) => (
          <Box>
            <Button
              variant="info"
              size="sm"
              onClick={() => onEditarTipoGestion(row)}
            >
              <i className="fas fa-edit"></i>
            </Button>{" "}
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                void onEliminarTipoGestion(row.id);
              }}
            >
              <i className="fas fa-trash"></i>
            </Button>
          </Box>
        ),
      },
    ],
    [onEditarTipoGestion, onEliminarTipoGestion]
  );

  return (
    <StyledCard>
      <div className="card-header d-flex">
        <Row>
          <Col xs={12} lg={12} md={12}>
            <Button variant="primary" onClick={onNuevoTipoGestion}>
              <i className="fas fa-plus mr-2"></i>Nuevo Tipo de Contacto
            </Button>
          </Col>
        </Row>
      </div>
      <div className="card-body">
        <DynamicTablePagination
          columns={columns}
          rows={tiposGestiones}
          searchText={textoBusqueda}
          onSearchChange={onTextoBusquedaChange}
          rowsPerPage={filasPorPagina}
          onRowsPerPageChange={onFilasPorPaginaChange}
          page={pagina}
          onPageChange={onPaginaChange}
        />
      </div>
    </StyledCard>
  );
}
