import React from "react";
import { Badge, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import type { ControlHorarioConfig } from "@app/services/Parametrizacion/controlHorarioTypes";

interface Props {
  config: ControlHorarioConfig;
  canEdit: boolean;
  isSaving: boolean;
  diasLaboralesCount: number;
  festivosCount: number;
  permisosActivosCount: number;
  onSaveGeneral: (
    nuevoEstado: boolean,
    nuevaTolerancia: number,
    nuevoBloqueoAgendamiento: boolean,
    nuevoAdminBypass: boolean
  ) => void;
}

export const HorariosOverviewCard: React.FC<Props> = ({
  config,
  canEdit,
  isSaving,
  diasLaboralesCount,
  festivosCount,
  permisosActivosCount,
  onSaveGeneral,
}) => {
  const [estadoActivo, setEstadoActivo] = React.useState(config.controlHorarioActivo);
  const [tolerancia, setTolerancia] = React.useState(config.minutosToleranciaSalida);
  const [bloquearAgendamiento, setBloquearAgendamiento] = React.useState(
    config.bloquearAgendamientoFueraHorario ?? true
  );
  const [adminPuedeAgendar, setAdminPuedeAgendar] = React.useState(
    config.adminPuedeAgendarFueraHorario ?? true
  );

  React.useEffect(() => {
    setEstadoActivo(config.controlHorarioActivo);
    setTolerancia(config.minutosToleranciaSalida);
    setBloquearAgendamiento(config.bloquearAgendamientoFueraHorario ?? true);
    setAdminPuedeAgendar(config.adminPuedeAgendarFueraHorario ?? true);
  }, [config]);

  const hasChanges =
    estadoActivo !== config.controlHorarioActivo ||
    tolerancia !== config.minutosToleranciaSalida ||
    bloquearAgendamiento !== (config.bloquearAgendamientoFueraHorario ?? true) ||
    adminPuedeAgendar !== (config.adminPuedeAgendarFueraHorario ?? true);

  return (
    <Card className="shadow-sm border-0 mb-3">
      <Card.Body>
        <div
          className="d-flex justify-content-between align-items-center flex-wrap"
          style={{ gap: 12 }}
        >
          <div>
            <h5 className="mb-1" style={{ fontWeight: 700 }}>
              Control de horarios y accesos
            </h5>
            <small className="text-muted">
              Controla jornadas laborales, días festivos y excepciones de horario para usuarios del sistema.
            </small>
          </div>
          <div>
            {estadoActivo ? (
              <Badge variant="success" className="px-3 py-2 font-weight-normal">
                <i className="fas fa-shield-alt mr-1" /> Restricción Horaria Activa
              </Badge>
            ) : (
              <Badge variant="secondary" className="px-3 py-2 font-weight-normal">
                <i className="fas fa-door-open mr-1" /> Acceso Libre (24/7)
              </Badge>
            )}
          </div>
        </div>

        {/* Indicadores KPI */}
        <Row className="mt-3">
          <Col md={3} sm={6}>
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Estado de acceso</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: estadoActivo ? "#1f8b4c" : "#6c757d" }}>
                <i className={`fas ${estadoActivo ? "fa-lock text-success" : "fa-lock-open text-muted"} mr-2`} />
                {estadoActivo ? "Restringido" : "Libre (Sin corte)"}
              </div>
            </div>
          </Col>
          <Col md={3} sm={6} className="mt-2 mt-sm-0">
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Días laborales</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {diasLaboralesCount}{" "}
                <span className="text-muted font-weight-normal" style={{ fontSize: 14 }}>
                  / 7 días
                </span>
              </div>
            </div>
          </Col>
          <Col md={3} sm={6} className="mt-2 mt-md-0">
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Días festivos registrados</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {festivosCount}
              </div>
            </div>
          </Col>
          <Col md={3} sm={6} className="mt-2 mt-md-0">
            <div className="border rounded bg-light px-3 py-2">
              <div className="text-muted small">Permisos activos hoy</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1f8b4c" }}>
                {permisosActivosCount}
              </div>
            </div>
          </Col>
        </Row>

        {/* Parámetros de Operación */}
        <div className="mt-3 pt-3 border-top">
          <Row className="align-items-center">
            <Col lg={3} sm={6} className="mb-2 mb-lg-0">
              <Form.Check
                type="switch"
                id="switch-control-horario"
                label={<span className="font-weight-600">Restricción activa</span>}
                checked={estadoActivo}
                disabled={!canEdit || isSaving}
                onChange={(e) => setEstadoActivo(e.target.checked)}
              />
              <small className="text-muted d-block pl-4 ml-1">
                Cierra sesión fuera de jornada
              </small>
            </Col>

            <Col lg={3} sm={6} className="mb-2 mb-lg-0">
              <Form.Group className="mb-0">
                <Form.Label className="small font-weight-600 mb-1">
                  Tolerancia tras hora salida
                </Form.Label>
                <Form.Control
                  as="select"
                  size="sm"
                  value={tolerancia}
                  disabled={!canEdit || isSaving}
                  onChange={(e) => setTolerancia(Number(e.target.value))}
                >
                  <option value={0}>Sin tolerancia (0 min)</option>
                  <option value={5}>5 minutos de gracia</option>
                  <option value={10}>10 minutos de gracia</option>
                  <option value={15}>15 minutos de gracia</option>
                  <option value={30}>30 minutos de gracia</option>
                </Form.Control>
              </Form.Group>
            </Col>

            <Col lg={3} sm={6} className="mb-2 mb-lg-0">
              <Form.Check
                type="switch"
                id="switch-bloqueo-agendamiento"
                label={<span className="font-weight-600">Bloquear agendamiento</span>}
                checked={bloquearAgendamiento}
                disabled={!canEdit || isSaving}
                onChange={(e) => setBloquearAgendamiento(e.target.checked)}
              />
              <small className="text-muted d-block pl-4 ml-1">
                No agendar en horas no hábiles
              </small>
            </Col>

            <Col lg={3} sm={6} className="mb-2 mb-lg-0">
              <Form.Check
                type="switch"
                id="switch-admin-agendamiento"
                label={<span className="font-weight-600">Bypass administradores</span>}
                checked={adminPuedeAgendar}
                disabled={!canEdit || isSaving || !bloquearAgendamiento}
                onChange={(e) => setAdminPuedeAgendar(e.target.checked)}
              />
              <small className="text-muted d-block pl-4 ml-1">
                Admin puede agendar fuera de horario
              </small>
            </Col>
          </Row>

          {hasChanges && (
            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
              <Button
                variant="primary"
                size="sm"
                disabled={!canEdit || isSaving}
                onClick={() => onSaveGeneral(estadoActivo, tolerancia, bloquearAgendamiento, adminPuedeAgendar)}
                className="px-4 font-weight-600"
              >
                {isSaving ? (
                  <>
                    <Spinner animation="border" size="sm" className="mr-2" /> Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-1" /> Guardar Parámetros de Horario
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};
