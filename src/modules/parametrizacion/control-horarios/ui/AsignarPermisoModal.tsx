import React from "react";
import { Badge, Button, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import type { ParametrizacionUser } from "@app/services/Parametrizacion/types";

interface Props {
  show: boolean;
  onHide: () => void;
  usuarios: ParametrizacionUser[];
  selectedUserIds: Set<number>;
  fecha: string;
  setFecha: (f: string) => void;
  horaInicio: string;
  setHoraInicio: (h: string) => void;
  horaFin: string;
  setHoraFin: (h: string) => void;
  motivo: string;
  setMotivo: (m: string) => void;
  busquedaUsuario: string;
  setBusquedaUsuario: (b: string) => void;
  isSubmitting: boolean;
  onToggleUser: (userId: number) => void;
  onSelectAll: (usuarios: ParametrizacionUser[]) => void;
  onSubmit: () => void;
}

const modalHeaderProps = { closeButton: true, className: "border-bottom" } as any;

export const AsignarPermisoModal: React.FC<Props> = ({
  show,
  onHide,
  usuarios,
  selectedUserIds,
  fecha,
  setFecha,
  horaInicio,
  setHoraInicio,
  horaFin,
  setHoraFin,
  motivo,
  setMotivo,
  busquedaUsuario,
  setBusquedaUsuario,
  isSubmitting,
  onToggleUser,
  onSelectAll,
  onSubmit,
}) => {
  const allFilteredSelected =
    usuarios.length > 0 && usuarios.every((u) => selectedUserIds.has(u.userId));

  const aplicarPreset = (inicio: string, fin: string, motivoSug: string) => {
    setHoraInicio(inicio);
    setHoraFin(fin);
    if (!motivo.trim()) {
      setMotivo(motivoSug);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header {...modalHeaderProps}>
        <Modal.Title className="h6 font-weight-bold">
          <i className="fas fa-user-shield text-success mr-2" />
          Otorgar Permisos de Acceso / Horas Extras
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        <Row>
          {/* Columna Izquierda: Parámetros del Permiso */}
          <Col md={6} className="border-right pr-md-4">
            <h6 className="font-weight-bold text-primary mb-3" style={{ fontSize: "0.95rem" }}>
              1. Horario y Fecha Autorizada
            </h6>

            {/* Presets Rápidos */}
            <div className="mb-3">
              <small className="text-muted d-block mb-1 font-weight-600">
                Atajos rápidos de horario:
              </small>
              <div className="d-flex flex-wrap gap-1">
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="mr-1 mb-1 py-0 px-2"
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => aplicarPreset("17:00", "20:00", "Horas extras (5 PM a 8 PM)")}
                >
                  ⚡ 5:00 PM - 8:00 PM (3h)
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="mr-1 mb-1 py-0 px-2"
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => aplicarPreset("17:00", "19:00", "Horas extras (5 PM a 7 PM)")}
                >
                  ⚡ 5:00 PM - 7:00 PM (2h)
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="mr-1 mb-1 py-0 px-2"
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => aplicarPreset("08:00", "13:00", "Jornada Sábado extendida")}
                >
                  ⚡ Sábado 8 AM - 1 PM
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="mb-1 py-0 px-2"
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => aplicarPreset("08:00", "17:00", "Labor en día festivo")}
                >
                  ⚡ Festivo Completo (8 AM - 5 PM)
                </Button>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="font-weight-600" style={{ fontSize: "0.85rem" }}>
                Fecha del Permiso *
              </Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </Form.Group>

            <Row className="mb-3">
              <Col xs={6}>
                <Form.Group className="mb-0">
                  <Form.Label className="font-weight-600" style={{ fontSize: "0.85rem" }}>
                    Hora Inicio *
                  </Form.Label>
                  <Form.Control
                    type="time"
                    size="sm"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-0">
                  <Form.Label className="font-weight-600" style={{ fontSize: "0.85rem" }}>
                    Hora Fin *
                  </Form.Label>
                  <Form.Control
                    type="time"
                    size="sm"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label className="font-weight-600" style={{ fontSize: "0.85rem" }}>
                Motivo / Justificación
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                size="sm"
                placeholder="Ej: Cierre de facturación, campaña de cobranza, etc."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </Form.Group>
          </Col>

          {/* Columna Derecha: Selección de Asesores (Individual o Masivo) */}
          <Col md={6} className="pl-md-4 mt-3 mt-md-0">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="font-weight-bold text-primary mb-0" style={{ fontSize: "0.95rem" }}>
                2. Seleccionar Asesores
              </h6>
              <Badge variant="primary" className="px-2 py-1">
                {selectedUserIds.size} seleccionados
              </Badge>
            </div>

            <Form.Control
              type="text"
              size="sm"
              placeholder="Filtrar por nombre o usuario..."
              className="mb-2"
              value={busquedaUsuario}
              onChange={(e) => setBusquedaUsuario(e.target.value)}
            />

            <div
              className="border rounded p-2 mb-2 d-flex justify-content-between align-items-center bg-light"
              style={{ fontSize: "0.82rem" }}
            >
              <Form.Check
                type="checkbox"
                id="check-select-all"
                label={<strong>Seleccionar todos ({usuarios.length})</strong>}
                checked={allFilteredSelected}
                onChange={() => onSelectAll(usuarios)}
              />
              {selectedUserIds.size > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-danger"
                  style={{ fontSize: "0.8rem" }}
                  onClick={() => onSelectAll([])}
                >
                  Limpiar selección
                </Button>
              )}
            </div>

            <div
              className="border rounded"
              style={{ maxHeight: "240px", overflowY: "auto", fontSize: "0.85rem" }}
            >
              <Table hover size="sm" className="mb-0">
                <tbody>
                  {usuarios.length === 0 ? (
                    <tr>
                      <td className="text-center py-3 text-muted">No se encontraron usuarios.</td>
                    </tr>
                  ) : (
                    usuarios.map((u) => {
                      const isSelected = selectedUserIds.has(u.userId);
                      return (
                        <tr
                          key={u.userId}
                          onClick={() => onToggleUser(u.userId)}
                          style={{
                            cursor: "pointer",
                            backgroundColor: isSelected ? "#e8f5e9" : "transparent",
                          }}
                        >
                          <td style={{ width: "35px" }} className="text-center">
                            <Form.Check
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleUser(u.userId)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td>
                            <div className="font-weight-600 text-truncate" style={{ maxWidth: "210px" }}>
                              {u.fullName || u.username}
                            </div>
                            <small className="text-muted">
                              @{u.username} • {u.roleName || "Asesor"}
                            </small>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="border-top justify-content-between">
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>
          {selectedUserIds.size === 0 ? (
            <span>Seleccione al menos un usuario</span>
          ) : (
            <span>
              Se otorgará permiso a <strong>{selectedUserIds.size}</strong> usuario(s) el{" "}
              <strong>{fecha}</strong> de <strong>{horaInicio}</strong> a <strong>{horaFin}</strong>.
            </span>
          )}
        </div>

        <div>
          <Button variant="secondary" size="sm" className="mr-2" onClick={onHide}>
            Cancelar
          </Button>
          <Button
            variant="success"
            size="sm"
            disabled={isSubmitting || selectedUserIds.size === 0}
            onClick={onSubmit}
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="mr-2" /> Asignando...
              </>
            ) : (
              <>
                <i className="fas fa-check mr-1" /> Otorgar Permisos ({selectedUserIds.size})
              </>
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
