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
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "@app/store/store";
import type { DataCreditoPrefijoItem } from "@app/services/Maestros/dataCreditoPrefijosTypes";

interface PrefijosTableCardProps {
  loading: boolean;
  items: DataCreditoPrefijoItem[];
  totalCount: number;
  pagina: number;
  filasPorPagina: number;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  onPaginaChange: (nuevaPagina: number) => void;
  onFilasPorPaginaChange: (nuevasFilas: number) => void;
  onEditar: (item: DataCreditoPrefijoItem) => void;
  onToggleEstado: (item: DataCreditoPrefijoItem) => void;
  onEliminar: (item: DataCreditoPrefijoItem) => void;
}

export const PrefijosTableCard: React.FC<PrefijosTableCardProps> = ({
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
}) => {
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const isMobile = screenSize === "xs";

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPaginaChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilasPorPaginaChange(parseInt(event.target.value, 10));
    onPaginaChange(0);
  };

  const renderBadgeManejo = (item: DataCreditoPrefijoItem) => {
    switch (item.manejoNumero) {
      case "ULTIMOS_4":
        return (
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
            Últimos 4 dígitos
          </span>
        );
      case "QUITAR_CEROS":
        return (
          <span
            style={{
              fontSize: "0.75rem",
              padding: "3px 8px",
              borderRadius: "4px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              fontWeight: 600,
            }}
          >
            Sin ceros izq.
          </span>
        );
      case "PAD_LEFT":
        return (
          <span
            style={{
              fontSize: "0.75rem",
              padding: "3px 8px",
              borderRadius: "4px",
              backgroundColor: "#fff8e1",
              color: "#b78103",
              fontWeight: 600,
            }}
          >
            Relleno {item.longitudPadding || 4} dígitos
          </span>
        );
      case "MANTENER":
        return (
          <span
            style={{
              fontSize: "0.75rem",
              padding: "3px 8px",
              borderRadius: "4px",
              backgroundColor: "#f8f9fa",
              color: "#495057",
              fontWeight: 600,
              border: "1px solid #dee2e6",
            }}
          >
            Tal cual
          </span>
        );
      default:
        return (
          <span
            style={{
              fontSize: "0.75rem",
              padding: "3px 8px",
              borderRadius: "4px",
              backgroundColor: "#f8f9fa",
              color: "#495057",
              fontWeight: 600,
            }}
          >
            {item.manejoNumero}
          </span>
        );
    }
  };

  return (
    <Card.Body className="pt-1">
      {loading && items.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" /> Cargando catálogo de prefijos...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FontAwesomeIcon icon={faInfoCircle} className="fa-2x mb-2 text-secondary d-block mx-auto" />
          <div>No se encontraron configuraciones de cuentas con los criterios de búsqueda.</div>
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
                <span style={{ fontWeight: 700, color: "#1976d2", fontSize: 16, fontFamily: "monospace" }}>
                  {item.cuenta}
                </span>
                <Badge pill variant={item.activo ? "success" : "secondary"}>
                  {item.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="mb-1">
                <strong>Sucursal:</strong> {item.descripcionCuenta || "Sin descripción"}
              </div>

              <div className="d-flex align-items-center flex-wrap mb-2" style={{ gap: 8 }}>
                <div>
                  <span className="text-muted small me-1">Prefijo:</span>
                  <span className="badge badge-primary font-weight-bold px-2 py-1">
                    {item.prefijo}
                  </span>
                </div>
                <div>{renderBadgeManejo(item)}</div>
              </div>

              <div className="mb-2 p-2 bg-light rounded border d-flex justify-content-between align-items-center">
                <span className="text-muted small">Ejemplo Obligación:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#1f8b4c",
                    fontFamily: "monospace",
                    letterSpacing: "0.5px",
                  }}
                >
                  {item.ejemploObligacion || `${item.prefijo}4314`}
                </span>
              </div>

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
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 700,
                    backgroundColor: "#f8f9fa",
                    color: "#495057",
                  },
                }}
              >
                <TableCell style={{ width: "135px" }}>Cuenta</TableCell>
                <TableCell>Sucursal / Línea</TableCell>
                <TableCell style={{ width: "110px" }} align="center">
                  Prefijo
                </TableCell>
                <TableCell style={{ width: "95px" }} align="center">
                  Separador
                </TableCell>
                <TableCell style={{ width: "160px" }} align="center">
                  Regla Consecutivo
                </TableCell>
                <TableCell style={{ width: "170px" }} align="center">
                  Ejemplo Obligación
                </TableCell>
                <TableCell style={{ width: "95px" }} align="center">
                  Estado
                </TableCell>
                <TableCell style={{ width: "190px" }} align="center">
                  Acciones
                </TableCell>
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
                  {/* Cuenta */}
                  <TableCell>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#1976d2",
                        fontFamily: "monospace",
                        fontSize: "0.95rem",
                      }}
                    >
                      {item.cuenta}
                    </span>
                  </TableCell>

                  {/* Sucursal / Descripción */}
                  <TableCell>
                    <div style={{ fontWeight: 600 }}>
                      {item.descripcionCuenta || "Sin descripción"}
                    </div>
                    {item.sufijo && (
                      <small className="text-muted">
                        Sufijo: <code className="text-dark">{item.sufijo}</code>
                      </small>
                    )}
                  </TableCell>

                  {/* Prefijo */}
                  <TableCell align="center">
                    <span
                      className="badge badge-primary px-2 py-1 font-weight-bold"
                      style={{ fontSize: "0.95rem", letterSpacing: "1px" }}
                    >
                      {item.prefijo}
                    </span>
                  </TableCell>

                  {/* Separador */}
                  <TableCell align="center">
                    {item.separador ? (
                      <code style={{ fontSize: "0.9rem" }}>"{item.separador}"</code>
                    ) : (
                      <span className="text-muted small">Ninguno</span>
                    )}
                  </TableCell>

                  {/* Regla Número */}
                  <TableCell align="center">{renderBadgeManejo(item)}</TableCell>

                  {/* Ejemplo Obligación */}
                  <TableCell align="center">
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#1f8b4c",
                        fontFamily: "monospace",
                        letterSpacing: "0.5px",
                        fontSize: "0.95rem",
                      }}
                      title={`Factura: ${item.ejemploFactura} ➔ Obligación: ${item.ejemploObligacion}`}
                    >
                      {item.ejemploObligacion || `${item.prefijo}4314`}
                    </span>
                  </TableCell>

                  {/* Estado */}
                  <TableCell align="center">
                    <Badge pill variant={item.activo ? "success" : "secondary"}>
                      {item.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="center">
                    <ButtonGroup size="sm">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => onEditar(item)}
                        disabled={!puedeEditar}
                        title="Editar regla"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant={item.activo ? "outline-secondary" : "outline-success"}
                        onClick={() => onToggleEstado(item)}
                        disabled={!puedeEditar}
                        title={item.activo ? "Desactivar cuenta" : "Activar cuenta"}
                      >
                        {item.activo ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => onEliminar(item)}
                        disabled={!puedeEliminar}
                        title="Eliminar regla"
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
        rowsPerPageOptions={[10, 15, 25, 50, 100]}
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
};

export default PrefijosTableCard;
