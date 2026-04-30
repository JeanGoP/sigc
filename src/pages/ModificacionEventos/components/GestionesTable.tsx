import { Card, Form, Spinner, Table } from "react-bootstrap";
import { Chip, TablePagination } from "@mui/material";
import { formatFechaHora } from "../domain/helpers";
import type { FiltrosConsultaGestiones, GestionModificacion } from "../domain/types";

interface GestionesTableProps {
  busquedaGestion: string;
  onBusquedaGestionChange: (value: string) => void;
  loadingConsulta: boolean;
  rows: GestionModificacion[];
  filtrosConsulta: FiltrosConsultaGestiones | null;
  drawerGestionId: number | null;
  onOpenDrawer: (gestion: GestionModificacion) => void;
  totalRows: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

export function GestionesTable({
  busquedaGestion,
  onBusquedaGestionChange,
  loadingConsulta,
  rows,
  filtrosConsulta,
  drawerGestionId,
  onOpenDrawer,
  totalRows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: GestionesTableProps) {
  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <div className="mb-3" style={{ maxWidth: 280 }}>
          <Form.Control
            type="text"
            placeholder="Buscar por ID Gestion..."
            value={busquedaGestion}
            onChange={(event) => onBusquedaGestionChange(event.target.value)}
          />
        </div>

        {loadingConsulta ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-5 text-muted">
            {filtrosConsulta
              ? "No se encontraron gestiones."
              : "Aplique los filtros para consultar."}
          </div>
        ) : (
          <Table hover responsive style={{ cursor: "pointer", fontSize: 14 }}>
            <thead className="table-light">
              <tr>
                <th>ID Gestion</th>
                <th>Usuario</th>
                <th>Cliente</th>
                <th>Factura</th>
                <th>Cuenta</th>
                <th>Fecha / Hora</th>
                <th className="text-center">Eventos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((gestion) => (
                <tr
                  key={gestion.idGestion}
                  onClick={() => onOpenDrawer(gestion)}
                  style={{
                    backgroundColor:
                      drawerGestionId === gestion.idGestion ? "#eef2ff" : undefined,
                  }}
                >
                  <td>
                    <strong>{gestion.idGestion}</strong>
                  </td>
                  <td>{gestion.Username}</td>
                  <td>{gestion.cliente}</td>
                  <td>{gestion.factura}</td>
                  <td>{gestion.cuenta}</td>
                  <td>{formatFechaHora(gestion.FechaHora)}</td>
                  <td className="text-center">
                    <Chip
                      size="small"
                      label={gestion.eventos.length}
                      color={gestion.eventos.length > 0 ? "primary" : "default"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {filtrosConsulta && !loadingConsulta && (
          <TablePagination
            component="div"
            count={totalRows}
            page={page}
            onPageChange={(_, nextPage) => onPageChange(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) =>
              onRowsPerPageChange(Number(event.target.value))
            }
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Filas por pagina:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `mas de ${to}`}`
            }
          />
        )}
      </Card.Body>
    </Card>
  );
}
