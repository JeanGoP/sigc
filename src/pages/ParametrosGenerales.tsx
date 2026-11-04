import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, Row, Col, Tab, Tabs, Badge, Spinner, Alert } from 'react-bootstrap';
import { NumericField } from '@app/components/InputFields/NumericField';
import GestionExtensionesAsterisk from '@app/components/Asterisk/GestionExtensionesAsterisk';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCogs,
  faHeadset,
  faPhone,
  faPhoneSlash,
  faSync,
  faShieldAlt,
  faExclamationTriangle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import {
  useParametrosSistemaService,
  TelephonyConfig,
} from '@app/services/Parametrizacion/parametrosSistemaService';

const ParametrosGenerales = () => {
  const [activeTab, setActiveTab] = useState<string>('telefonia');
  const [intMora, setIntMora] = useState('3.00');

  const { getTelefoniaConfig, setTelefoniaConfig, loading } = useParametrosSistemaService();
  const [telephonyConfig, setTelephonyConfig] = useState<TelephonyConfig | null>(null);
  const [updatingTelephony, setUpdatingTelephony] = useState(false);

  const fetchTelephonyConfig = useCallback(async () => {
    try {
      const response = await getTelefoniaConfig();
      if (response?.success && response.data) {
        setTelephonyConfig(response.data);
      } else {
        toast.warning(response?.message || 'No se pudo obtener el estado de telefonía');
      }
    } catch (err: any) {
      toast.error('Error al cargar configuración de telefonía: ' + (err?.message || 'Error desconocido'));
    }
  }, [getTelefoniaConfig]);

  useEffect(() => {
    fetchTelephonyConfig();
  }, [fetchTelephonyConfig]);

  const handleToggleTelephony = async () => {
    if (!telephonyConfig) return;
    const targetState = !telephonyConfig.telephonyEnabled;
    const actionText = targetState ? 'habilitar la telefonía' : 'activar el Modo Contingencia';

    if (!window.confirm(`¿Está seguro de que desea ${actionText}?`)) {
      return;
    }

    setUpdatingTelephony(true);
    try {
      const response = await setTelefoniaConfig(targetState);
      if (response?.success && response.data) {
        setTelephonyConfig(response.data);
        toast.success(response.message || 'Estado de telefonía actualizado exitosamente');
      } else {
        toast.error(response?.message || 'No fue posible actualizar el estado de telefonía');
      }
    } catch (err: any) {
      toast.error('Error al actualizar telefonía: ' + (err?.message || 'Error desconocido'));
    } finally {
      setUpdatingTelephony(false);
    }
  };

  const handleGuardarCobro = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Parámetro guardado: ' + intMora + ' %');
  };

  return (
    <div className="container-fluid py-3">
      {/* Encabezado Principal */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-0 fw-bold">
            <FontAwesomeIcon icon={faCogs} className="me-2 text-primary" />
            Parámetros Generales del Sistema
          </h4>
          <small className="text-muted">
            Configuración central de telefonía, extensiones de asesores y reglas de liquidación del tenant.
          </small>
        </div>
        <div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={fetchTelephonyConfig}
            disabled={loading || updatingTelephony}
            className="d-inline-flex align-items-center"
          >
            <FontAwesomeIcon icon={faSync} spin={loading} className="me-2" />
            Actualizar estado
          </Button>
        </div>
      </div>

      {/* Pestañas de Configuración */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || "telefonia")}
        className="mb-3 custom-parametros-tabs"
      >
        {/* PESTAÑA 1: TELEFONÍA Y CONTINGENCIA */}
        <Tab
          eventKey="telefonia"
          title={
            <span>
              <FontAwesomeIcon icon={faShieldAlt} className="me-2 text-primary" />
              Telefonía y Contingencia
            </span>
          }
        >
          <Row className="mt-2">
            <Col xs={12}>
              <Card className="shadow-sm border-0 mb-4">
                <Card.Header className="bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center">
                  <div className="mb-2 mb-sm-0">
                    <h6 className="mb-0 fw-bold">
                      <FontAwesomeIcon icon={faPhone} className="text-primary me-2" />
                      Control Operativo de Telefonía WebRTC
                    </h6>
                    <small className="text-muted">
                      Administre la activación del marcador para los asesores y el protocolo ante caídas de la central.
                    </small>
                  </div>
                  <div>
                    {telephonyConfig?.telephonyEnabled ? (
                      <Badge variant="success" className="px-3 py-2 font-weight-normal">
                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Telefonía Activa
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="px-3 py-2 font-weight-normal">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" /> Modo Contingencia
                      </Badge>
                    )}
                  </div>
                </Card.Header>

                <Card.Body className="p-4">
                  {loading && !telephonyConfig ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2 text-muted">Consultando estado en base de datos...</p>
                    </div>
                  ) : (
                    <Row>
                      {/* Estado y Especificación */}
                      <Col lg={8} md={7} className="mb-3 mb-md-0 border-end pe-md-4">
                        <h6 className="fw-bold mb-3 text-dark">
                          Estado Actual del Servicio
                        </h6>

                        <div className="p-3 rounded border bg-light mb-3">
                          <div className="d-flex align-items-start">
                            <div className="me-3 mt-1">
                              <FontAwesomeIcon
                                icon={telephonyConfig?.telephonyEnabled ? faCheckCircle : faPhoneSlash}
                                className={telephonyConfig?.telephonyEnabled ? "text-success" : "text-danger"}
                                size="2x"
                              />
                            </div>
                            <div>
                              <div className="fw-bold mb-1" style={{ fontSize: 16 }}>
                                {telephonyConfig?.telephonyEnabled
                                  ? "Operación Normal: Marcador WebRTC habilitado"
                                  : "Modo Contingencia: Marcador WebRTC oculto"}
                              </div>
                              <p className="text-muted mb-0 small" style={{ lineHeight: 1.5 }}>
                                {telephonyConfig?.telephonyEnabled
                                  ? "Los asesores pueden realizar y recibir llamadas WebRTC normalmente a través de Asterisk. La barra de softphone está visible en la parte superior del sistema."
                                  : "El marcador WebRTC está deshabilitado en los navegadores de los asesores para evitar popups o bloqueos por fallas de conexión. Los asesores continúan gestionando carteras y registrando compromisos manualmente llamando desde líneas telefónicas externas."}
                              </p>
                            </div>
                          </div>
                        </div>

                        <h6 className="fw-bold mt-4 mb-2 text-dark" style={{ fontSize: "0.9rem" }}>
                          Parámetros del Tenant en Tiempo Real
                        </h6>
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered mb-0 bg-white" style={{ fontSize: "0.85rem" }}>
                            <tbody>
                              <tr>
                                <td className="text-muted fw-semibold" style={{ width: "35%" }}>
                                  Clave de Sistema
                                </td>
                                <td>
                                  <code>SIGC.ParametrosSistema -&gt; Telefonia.Habilitada</code>
                                </td>
                              </tr>
                              <tr>
                                <td className="text-muted fw-semibold">Fuente de Persistencia</td>
                                <td>
                                  <span className="badge badge-light border">
                                    {telephonyConfig?.source === "database"
                                      ? "Base de Datos (Aplica en tiempo real sin reinicios)"
                                      : "Configuración local appsettings"}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="text-muted fw-semibold">Descripción del Parámetro</td>
                                <td>{telephonyConfig?.description || "Control global de telefonía WebRTC / Modo contingencia"}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </Col>

                      {/* Conmutador y Acción */}
                      <Col lg={4} md={5} className="ps-md-4 d-flex flex-column justify-content-between">
                        <div>
                          <h6 className="fw-bold mb-2 text-dark">
                            Conmutador de Servicio
                          </h6>
                          <p className="text-muted small mb-3">
                            En caso de cortes de internet, caídas de la VPN o mantenimiento de Asterisk, use este botón para conmutar el estado del sistema.
                          </p>

                          <Button
                            variant={telephonyConfig?.telephonyEnabled ? "outline-danger" : "outline-success"}
                            className="w-100 py-2 fw-semibold mb-2 shadow-sm d-flex align-items-center justify-content-center"
                            onClick={handleToggleTelephony}
                            disabled={updatingTelephony}
                          >
                            {updatingTelephony ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Actualizando servicio...
                              </>
                            ) : telephonyConfig?.telephonyEnabled ? (
                              <>
                                <FontAwesomeIcon icon={faPhoneSlash} className="me-2" />
                                Activar Modo Contingencia
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faPhone} className="me-2" />
                                Restablecer Telefonía Normal
                              </>
                            )}
                          </Button>

                          <small className="text-muted d-block text-center mt-2" style={{ fontSize: "0.8rem" }}>
                            <FontAwesomeIcon icon={faShieldAlt} className="me-1 text-primary" />
                            No interrumpe cobros, consultas ni liquidaciones.
                          </small>
                        </div>

                        <div className="alert alert-light border small text-muted mb-0 mt-4 p-2">
                          <strong>Garantía operativa:</strong> Las consultas de clientes, cuotas y acuerdos de pago permanecen 100% operativos aún con la telefonía pausada.
                        </div>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* PESTAÑA 2: EXTENSIONES ASTERISK */}
        <Tab
          eventKey="extensiones"
          title={
            <span>
              <FontAwesomeIcon icon={faHeadset} className="me-2 text-secondary" />
              Extensiones Telefónicas (Asterisk)
            </span>
          }
        >
          <div className="mt-2">
            <GestionExtensionesAsterisk />
          </div>
        </Tab>

        {/* PESTAÑA 3: PARÁMETROS DE COBRO */}
        <Tab
          eventKey="general"
          title={
            <span>
              <FontAwesomeIcon icon={faCogs} className="me-2 text-secondary" />
              Parámetros de Cobro
            </span>
          }
        >
          <Row className="mt-2">
            <Col xs={12}>
              <Card className="shadow-sm border-0 mb-4">
                <Card.Header className="bg-white py-3 border-bottom">
                  <h6 className="mb-0 fw-bold">
                    <FontAwesomeIcon icon={faCogs} className="text-primary me-2" />
                    Parámetros Generales de Cartera y Liquidación
                  </h6>
                  <small className="text-muted">
                    Tasas financieras y reglas de cálculo aplicables a las obligaciones del tenant.
                  </small>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handleGuardarCobro}>
                    <Row>
                      <Col xs={12} md={5} lg={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">
                            Tasa de Interés Moratorio Mensual (%)
                          </Form.Label>
                          <NumericField value={intMora} onChange={setIntMora} />
                          <Form.Text className="text-muted">
                            Esta tasa se aplica en los cálculos automáticos de liquidación de mora para todas las carteras.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="pt-2">
                      <Button variant="primary" type="submit" className="px-4 fw-semibold">
                        Guardar Parámetros
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default ParametrosGenerales;
