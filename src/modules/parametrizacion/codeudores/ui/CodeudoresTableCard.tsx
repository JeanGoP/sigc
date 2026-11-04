import React from "react";
import { Badge, Button, ButtonGroup, Card, Spinner } from "react-bootstrap";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faMapMarkerAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "@app/store/store";
import type { CodeudorItem } from "@app/services/Parametrizacion/codeudoresTypes";

interface CodeudoresTableCardProps {
  loading: boolean;
  items: CodeudorItem[];
  totalCount: number;
  pagina: number;
  filasPorPagina: number;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  onPaginaChange: (nuevaPagina: number) => void;
  onFilasPorPaginaChange: (nuevasFilas: number) => void;
  onEditar: (item: CodeudorItem) => void;
  onToggleEstado: (item: CodeudorItem) => void;
  onEliminar: (item: CodeudorItem) => void;
}

export default function CodeudoresTableCard({
  loading,
  items,
  totalCount,
  pagina,
  filasPorPagina,
  puedeEditar,
  puedeEliminar,
  onPaginaChange,
  onFilasPorPaginaChange,
  onEditar,
  onToggleEstado,
  onEliminar,
}: CodeudoresTableCardProps) {
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const isMobile = screenSize === "xs";

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPaginaChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilasPorPaginaChange(parseInt(event.target.value, 10));
    onPaginaChange(0);
  };

  return (
    <Card.Body className="pt-1">
      {loading && items.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" /> Cargando codeudores...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FontAwesomeIcon icon={faInfoCircle} className="fa-2x mb-2 text-secondary d-block mx-auto" />
          <div>No se encontraron registros de codeudores con los criterios de búsqueda.</div>
        </div>
      ) : isMobile ? (
        /* Tarjetas apiladas para vista móvil (Patrón SIGC) */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #e6e8ec",
                borderRadius: 10,
                padding: "12px 14px",
                background: "#fff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontWeight: 700, color: "#1976d2", fontSize: 15 }}>
                  {item.numefac}
                </span>
                <Badge pill variant={item.activo ? "success" : "secondary"}>
                  {item.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="mb-1">
                <strong>Titular:</strong> {item.nombreTitular || "-"}
                {item.cliente && (
                  <span className="text-muted small ms-1">({item.cliente})</span>
                )}
              </div>

              <div className="mb-1">
                <strong>Codeudor:</strong> {item.nombre}
                <div className="text-muted small">
                  {item.tipoIdentificacion}: {item.identificacion}
                </div>
              </div>

              {(item.telefono || item.email) && (
                <div className="text-muted small mb-1">
                  {item.telefono && (
                    <span className="me-2">
                      <FontAwesomeIcon icon={faPhone} className="text-success me-1" />
                      {item.telefono}
                    </span>
                  )}
                  {item.email && <span>{item.email}</span>}
                </div>
              )}

              {item.ciudad && (
                <div className="text-muted small mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger me-1" />
                  {item.ciudad} {item.direccion ? `- ${item.direccion}` : ""}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => onEditar(item)}
                  disabled={!puedeEditar}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant={item.activo ? "outline-secondary" : "outline-success"}
                  onClick={() => onToggleEstado(item)}
                  disabled={!puedeEditar}
                >
                  {item.activo ? "Desactivar" : "Activar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onEliminar(item)}
                  disabled={!puedeEliminar}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Tabla Desktop Estándar MUI */
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, backgroundColor: "#f8f9fa", color: "#495057" } }}>
                <TableCell style={{ width: "110px" }}>Obligación</TableCell>
                <TableCell>Titular Principal</TableCell>
                <TableCell style={{ width: "140px" }}>Doc. Codeudor</TableCell>
                <TableCell>Nombre Codeudor</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell style={{ width: "100px" }} align="center">Relación</TableCell>
                <TableCell style={{ width: "90px" }} align="center">Estado</TableCell>
                <TableCell style={{ width: "180px" }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    "&:hover": { backgroundColor: "#f1f7fd !important" },
                    "& td": { py: 1 },
                  }}
                >
                  <TableCell>
                    <span style={{ fontWeight: 700, color: "#1976d2" }}>
                      {item.numefac}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 600 }}>{item.nombreTitular || "-"}</div>
                    {item.cliente && (
                      <small className="text-muted d-block">
                        Cédula: {item.cliente}
                      </small>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="badge badge-light border text-dark me-1">
                      {item.tipoIdentificacion}
                    </span>
                    <span style={{ fontWeight: 600 }}>{item.identificacion}</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontWeight: 600 }}>{item.nombre}</span>
                  </TableCell>
                  <TableCell>
                    {item.telefono ? (
                      <div className="small">
                        <FontAwesomeIcon icon={faPhone} className="text-success me-1" />
                        {item.telefono}
                      </div>
                    ) : (
                      <span className="text-muted small">-</span>
                    )}
                    {item.email && (
                      <div className="text-muted small text-truncate" style={{ maxWidth: 160 }}>
                        {item.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="small font-weight-bold">{item.ciudad || "-"}</div>
                    {item.direccion && (
                      <div className="text-muted small text-truncate" style={{ maxWidth: 170 }}>
                        {item.direccion}
                      </div>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        backgroundColor: "#e8f4fd",
                        color: "#0b5ed7",
                        fontWeight: 600,
                      }}
                    >
                      {item.tipoRelacion}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <Badge pill variant={item.activo ? "success" : "secondary"}>
                      {item.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell align="center">
                    <ButtonGroup size="sm">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => onEditar(item)}
                        disabled={!puedeEditar}
                        title="Editar datos"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant={item.activo ? "outline-secondary" : "outline-success"}
                        onClick={() => onToggleEstado(item)}
                        disabled={!puedeEditar}
                        title={item.activo ? "Desactivar codeudor" : "Activar codeudor"}
                      >
                        {item.activo ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => onEliminar(item)}
                        disabled={!puedeEliminar}
                        title="Eliminar codeudor"
                      >
                        Eliminar
                      </Button>
                    </ButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Paginación MUI */}
      <TablePagination
        rowsPerPageOptions={[10, 20, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={filasPorPagina}
        page={pagina}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count.toLocaleString() : `más de ${to}`}`
        }
        sx={{
          borderTop: "1px solid #e0e0e0",
          mt: 1,
          "& .MuiTablePagination-toolbar": { minHeight: 48 },
        }}
      />
    </Card.Body>
  );
}
