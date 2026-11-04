import React from "react";
import { Badge, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import type { LogAuditoriaHorario } from "@app/services/Parametrizacion/controlHorarioTypes";

interface Props {
  logs: LogAuditoriaHorario[];
  onRecargar: () => void;
}

export const AuditoriaHorariosCard: React.FC<Props> = ({ logs, onRecargar }) => {
  const [busqueda, setBusqueda] = React.useState("");

  const logsFiltrados = React.useMemo(() => {
    if (!busqueda.trim()) return logs;
    const q = busqueda.toLowerCase();
    return logs.filter(
      (l) =>
        l.fullName.toLowerCase().includes(q) ||
        l.username.toLowerCase().includes(q) ||
        l.realizadoPorNombre.toLowerCase().includes(q) ||
        (l.motivo || "").toLowerCase().includes(q) ||
        l.accion.toLowerCase().includes(q)
    );
  }, [logs, busqueda]);

  const renderBadgeAccion = (accion: string) => {
    switch (accion) {
      case "ASIGNACION_MASIVA":
        return (
          <Badge variant="primary" className="px-2 py-1 font-weight-normal">
            <i className="fas fa-users mr-1" /> Asignación Masiva
          </Badge>
        );
      case "ASIGNACION_INDIVIDUAL":
        return (
          <Badge variant="success" className="px-2 py-1 font-weight-normal">
            <i className="fas fa-user-check mr-1" /> Asignación
          </Badge>
        );
      case "REVOCACION":
        return (
          <Badge variant="danger" className="px-2 py-1 font-weight-normal">
            <i className="fas fa-ban mr-1" /> Revocación
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="px-2 py-1 font-weight-normal">
            {accion}
          </Badge>
        );
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0 font-weight-bold">
            <i className="fas fa-history text-info mr-2" /> Registro de Auditoría de Permisos
          </h5>
          <small className="text-muted">
            Trazabilidad histórica de asignaciones individuales, masivas y revocaciones de acceso.
          </small>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={onRecargar} className="px-3">
          <i className="fas fa-sync-alt mr-1" /> Actualizar
        </Button>
      </Card.Header>

      <Card.Body className="p-3">
        <Row className="mb-3">
          <Col md={6}>
            <Form.Control
              type="text"
              size="sm"
              placeholder="Buscar en el registro por asesor, supervisor o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </Col>
        </Row>

        <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
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
                <th style={{ width: "16%" }}>FECHA Y HORA REGISTRO</th>
                <th style={{ width: "16%" }}>ACCIÓN</th>
                <th style={{ width: "22%" }}>USUARIO AFECTADO</th>
                <th style={{ width: "16%" }}>FRANJA DE FECHA/HORA</th>
                <th style={{ width: "15%" }}>REALIZADO POR</th>
                <th style={{ width: "15%" }}>DETALLE / MOTIVO</th>
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No hay registros de auditoría disponibles.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <small className="text-muted font-weight-600">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                      </small>
                    </td>

                    <td>{renderBadgeAccion(log.accion)}</td>

                    <td>
                      <div className="font-weight-600 text-truncate" style={{ maxWidth: "200px" }}>
                        {log.fullName || log.username}
                      </div>
                      <small className="text-muted">@{log.username}</small>
                    </td>

                    <td>
                      <div>{log.fechaPermiso}</div>
                      <small className="text-muted">
                        {log.horaInicio?.substring(0, 5)} - {log.horaFin?.substring(0, 5)}
                      </small>
                    </td>

                    <td>
                      <div className="font-weight-600">{log.realizadoPorNombre}</div>
                    </td>

                    <td>
                      <span className="text-truncate d-block" style={{ maxWidth: "200px" }} title={log.motivo || ""}>
                        {log.motivo || <em className="text-muted">N/A</em>}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};
