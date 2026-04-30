import React, { useMemo } from "react";
import { Button, Col, Row } from "react-bootstrap";
import styled from "styled-components";
import { Box } from "@mui/material";
import {
  DynamicTablePagination,
  type TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacion";
import type { EtiquetaCliente } from "../domain/types";

const StyledCard = styled.div`
  margin-bottom: 1rem;
  background: white;
  border-radius: 0.25rem;
  box-shadow:
    0 0 1px rgba(0, 0, 0, 0.125),
    0 1px 3px rgba(0, 0, 0, 0.2);
`;

interface EtiquetasClientesTableCardProps {
  etiquetas: EtiquetaCliente[];
  onDelete: (id: number) => void;
  onOpenModal: (etiqueta?: EtiquetaCliente) => void;
  page: number;
  rowsPerPage: number;
  searchText: string;
  setPage: (page: number) => void;
  setRowsPerPage: (rowsPerPage: number) => void;
  setSearchText: (searchText: string) => void;
}

export function EtiquetasClientesTableCard({
  etiquetas,
  onDelete,
  onOpenModal,
  page,
  rowsPerPage,
  searchText,
  setPage,
  setRowsPerPage,
  setSearchText,
}: EtiquetasClientesTableCardProps) {
  const columns = useMemo<TableColumn[]>(
    () => [
      { id: "id", label: "ID" },
      {
        id: "nombre",
        label: "Nombre",
        format: (_value: unknown, row: EtiquetaCliente) => <span>{row.nombre}</span>,
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
        format: (_value: unknown, row: EtiquetaCliente) => (
          <Box>
            <Button
              variant="info"
              size="sm"
              className="mr-2"
              onClick={() => onOpenModal(row)}
            >
              <i className="fas fa-edit"></i>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(row.id)}
            >
              <i className="fas fa-trash"></i>
            </Button>
          </Box>
        ),
      },
    ],
    [onDelete, onOpenModal],
  );

  return (
    <StyledCard>
      <div className="card-header d-flex">
        <Row>
          <Col xs={12} lg={12} md={12}>
            <Button
              className="float-end"
              variant="primary"
              onClick={() => onOpenModal()}
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
  );
}
