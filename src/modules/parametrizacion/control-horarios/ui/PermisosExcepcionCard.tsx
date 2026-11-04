import React from "react";
import { Badge, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import type { PermisoHorario } from "@app/services/Parametrizacion/controlHorarioTypes";

interface Props {
  permisos: PermisoHorario[];
  canAssign: boolean;
  canRevoke: boolean;
  filtroSoloActivos: boolean;
  setFiltroSoloActivos: (activos: boolean) => void;
  filtroFecha: string;
  setFiltroFecha: (fecha: string) => void;
  busqueda: string;
  setBusqueda: (q: string) => void;
  onAbrirModalAsignar: () => void;
  onAbrirModalRevocar: (permiso: PermisoHorario) => void;
}

export const PermisosExcepcionCard: React.FC<Props> = ({
  permisos,
  canAssign,
  canRevoke,
  filtroSoloActivos,
  setFiltroSoloActivos,
  filtroFecha,
  setFiltroFecha,
  busqueda,
  setBusqueda,
  onAbrirModalAsignar,
  onAbrirModalRevocar,
}) => {
  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center">
        <div className="mb-2 mb-md-0">
          <h5 className="mb-0 font-weight-bold">
            <i className="fas fa-user-clock text-success mr-2" /> Permisos Temporales y Horas Extras
          </h5>
          <small className="text-muted">
            Autorice a usuarios específicos para laborar fuera del horario habitual o en días festivos.
          </small>
        </div>

        {canAssign && (
          <Button
            variant="success"
            size="sm"
            onClick={onAbrirModalAsignar}
            className="px-3 font-weight-600 shadow-sm"
          >
            <i className="fas fa-user-plus mr-1" /> Otorgar Permisos (Individual / Masivo)
          </Button>
        )}
      </Card.Header>

      <Card.Body className="p-3">
        {/* Barra de Filtros */}
        <Row className="mb-3 align-items-center">
          <Col lg={4} md={5} className="mb-2 mb-md-0">
            <Form.Control
              type="text"
              size="sm"
              placeholder="Buscar por asesor, usuario o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </Col>

          <Col lg={3} md={4} className="mb-2 mb-md-0">
            <div className="d-flex align-items-center">
              <small className="text-muted mr-2 text-nowrap">Fecha:</small>
              <Form.Control
                type="date"
                size="sm"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
              />
              {filtroFecha && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="ml-1 p-1 btn-icon"
                  title="Limpiar fecha"
                  onClick={() => setFiltroFecha("")}
                >
                  <i className="fas fa-times" />
                </Button>
              )}
            </div>
          </Col>

          <Col lg={3} md={3} className="mb-2 mb-md-0">
            <Form.Check
              type="switch"
              id="switch-solo-activos"
              label="Solo activos"
              checked={filtroSoloActivos}
              onChange={(e) => setFiltroSoloActivos(e.target.checked)}
            />
          </Col>

          <Col lg={2} className="text-right text-muted" style={{ fontSize: "0.85rem" }}>
            Total: <strong>{permisos.length}</strong>
          </Col>
        </Row>

        {/* Tabla de Permisos */}
        <div className="table-responsive" style={{ maxHeight: "480px", overflowY: "auto" }}>
          <Table hover size="sm" className="mb-0 align-middle">
            <thead
              style={{
                backgroundColor: "#f8f9fa",
                position: "sticky",
                top: 0,
                zIndex: 1,
                fontSize: "0.85rem",
                color: "#6c757d",
              }}
            >
              <tr>
                <th style={{ width: "22%" }}>ASESOR / USUARIO</th>
                <th style={{ width: "12%" }}>FECHA</th>
                <th style={{ width: "16%" }}>FRANJA HORARIA</th>
                <th style={{ width: "22%" }}>MOTIVO</th>
                <th style={{ width: "16%" }}>AUTORIZADO POR</th>
                <th style={{ width: "8%", textAlign: "center" }}>ESTADO</th>
                <th style={{ width: "4%", textAlign: "right" }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {permisos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    No hay permisos especiales que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                permisos.map((p) => {
                  const inicio = p.horaInicio ? p.horaInicio.substring(0, 5) : "";
                  const fin = p.horaFin ? p.horaFin.substring(0, 5) : "";

                  return (
                    <tr
                      key={p.id}
                      style={{
                        backgroundColor: p.isActive ? "transparent" : "#fafafa",
                        opacity: p.isActive ? 1 : 0.7,
                      }}
                    >
                      <td>
                        <div className="font-weight-600 text-truncate" style={{ maxWidth: "200px" }}>
                          {p.fullName || p.username}
                        </div>
                        <small className="text-muted">@{p.username}</small>
                      </td>

                      <td className="font-weight-600 text-nowrap">
                        <i className="far fa-calendar-alt text-muted mr-1" />
                        {p.fecha}
                      </td>

                      <td>
                        <Badge
                          variant={p.isActive ? "info" : "secondary"}
                          className="px-2 py-1 font-weight-normal text-nowrap"
                        >
                          <i className="far fa-clock mr-1" />
                          {inicio} - {fin}
                        </Badge>
                      </td>

                      <td>
                        <span className="text-truncate d-block" style={{ maxWidth: "220px" }} title={p.motivo || ""}>
                          {p.motivo || <em className="text-muted">Sin motivo especificado</em>}
                        </span>
                      </td>

                      <td>
                        <small className="d-block font-weight-600">{p.otorgadoPorNombre}</small>
                        <small className="text-muted">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
                        </small>
                      </td>

                      <td className="text-center">
                        {p.isActive ? (
                          <Badge variant="success" className="px-2 py-1">
                            Vigente
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="px-2 py-1" title={p.motivoRevocacion || "Revocado"}>
                            Revocado
                          </Badge>
                        )}
                      </td>

                      <td className="text-right">
                        {canRevoke && p.isActive && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="btn-icon p-1"
                            title="Revocar este permiso"
                            onClick={() => onAbrirModalRevocar(p)}
                          >
                            <i className="fas fa-ban" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};
