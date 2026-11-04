import React from "react";
import { Modal, Button, Form, Row, Col, Spinner, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faBuilding,
  faHashtag,
  faMagic,
  faArrowRight,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { FormularioPrefijoState } from "../hooks/useDataCreditoPrefijos";
import type { CuentaCarteraDisponible } from "@app/services/Maestros/dataCreditoPrefijosTypes";

interface PrefijoFormModalProps {
  abierto: boolean;
  modoEdicion: boolean;
  formulario: FormularioPrefijoState;
  cuentasDisponibles: CuentaCarteraDisponible[];
  guardando: boolean;
  obligacionPreview: string;
  onCerrar: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  onCampoChange: (campo: keyof FormularioPrefijoState, valor: any) => void;
}

export const PrefijoFormModal: React.FC<PrefijoFormModalProps> = ({
  abierto,
  modoEdicion,
  formulario,
  cuentasDisponibles,
  guardando,
  obligacionPreview,
  onCerrar,
  onSubmit,
  onCampoChange,
}) => {
  const handleCuentaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cod = e.target.value;
    const encontrada = cuentasDisponibles.find((c) => c.codigoCuenta === cod);
    onCampoChange("cuenta", cod);
    if (encontrada) {
      onCampoChange("descripcionCuenta", encontrada.nombreCuenta);
    }
  };

  const modalHeaderProps = { closeButton: true } as any;

  return (
    <Modal show={abierto} onHide={onCerrar} size="lg" backdrop="static" centered>
      <form onSubmit={(e) => onSubmit(e)}>
        <Modal.Header {...modalHeaderProps}>
          <Modal.Title style={{ fontSize: "1.15rem", fontWeight: 700 }}>
            <FontAwesomeIcon icon={faCog} className="me-2 text-primary" />
            {modoEdicion
              ? `Editar Regla de Prefijo (${formulario.cuenta})`
              : "Configurar Nueva Cuenta para DataCrédito"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 py-3">
          {/* SECCIÓN 1: CUENTA CONTABLE Y SUCURSAL */}
          <div className="mb-3">
            <h6 className="text-primary font-weight-bold mb-2 d-flex align-items-center">
              <FontAwesomeIcon icon={faBuilding} className="me-2" />
              1. Cuenta Contable y Sucursal
            </h6>

            {modoEdicion ? (
              <div className="border rounded bg-light p-3">
                <Row>
                  <Col md={5}>
                    <div className="text-muted small">Cuenta Contable:</div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#1976d2",
                        fontFamily: "monospace",
                      }}
                    >
                      {formulario.cuenta}
                    </div>
                  </Col>
                  <Col md={7}>
                    <Form.Group className="mb-0">
                      <Form.Label className="small text-muted mb-1">
                        Descripción / Sucursal:
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formulario.descripcionCuenta}
                        onChange={(e) => onCampoChange("descripcionCuenta", e.target.value)}
                        placeholder="Ej: CARTERA MOTOCICLETAS MONTELIBANO"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            ) : (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small font-weight-bold">
                      Cuenta Contable <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="select"
                      value={formulario.cuenta}
                      onChange={handleCuentaSelect}
                      required
                    >
                      <option value="">-- Seleccione una cuenta de cartera --</option>
                      {cuentasDisponibles.map((c) => (
                        <option
                          key={c.codigoCuenta}
                          value={c.codigoCuenta}
                          className={c.yaConfigurada ? "text-muted" : "font-weight-bold"}
                        >
                          {c.codigoCuenta} - {c.nombreCuenta} {c.yaConfigurada ? "(Ya mapeada)" : "⭐"}
                        </option>
                      ))}
                    </Form.Control>
                    <Form.Text className="text-muted small">
                      Código de cuenta de cartera en MAECONT.
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small font-weight-bold">
                      Descripción / Sucursal
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej: CARTERA MOTOCICLETAS MONTELIBANO"
                      value={formulario.descripcionCuenta}
                      onChange={(e) => onCampoChange("descripcionCuenta", e.target.value)}
                    />
                    <Form.Text className="text-muted small">
                      Nombre representativo de la sucursal o línea.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </div>

          <hr className="my-3 text-muted" />

          {/* SECCIÓN 2: PREFIJO Y SEPARADORES */}
          <div className="mb-3">
            <h6 className="text-primary font-weight-bold mb-2 d-flex align-items-center">
              <FontAwesomeIcon icon={faHashtag} className="me-2" />
              2. Prefijo y Separadores
            </h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label className="small font-weight-bold">
                    Prefijo <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    className="font-weight-bold text-uppercase"
                    placeholder="Ej: MON, PTO, ZMON, ZPU-"
                    maxLength={15}
                    value={formulario.prefijo}
                    onChange={(e) => onCampoChange("prefijo", e.target.value.toUpperCase())}
                    required
                  />
                  <Form.Text className="text-muted small">
                    Sigla de la sucursal o línea (ej: MON, ZMON).
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label className="small font-weight-bold">
                    Separador (Opcional)
                  </Form.Label>
                  <Form.Control
                    as="select"
                    value={formulario.separador}
                    onChange={(e) => onCampoChange("separador", e.target.value)}
                  >
                    <option value="">Ninguno (ej: MON4314)</option>
                    <option value="-">Guion - (ej: MON-4314)</option>
                    <option value=".">Punto . (ej: MON.4314)</option>
                    <option value="/">Barra / (ej: MON/4314)</option>
                  </Form.Control>
                  <Form.Text className="text-muted small">
                    Carácter entre el prefijo y el número.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label className="small font-weight-bold">
                    Sufijo (Opcional)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    className="text-uppercase"
                    placeholder="Opcional"
                    maxLength={10}
                    value={formulario.sufijo}
                    onChange={(e) => onCampoChange("sufijo", e.target.value.toUpperCase())}
                  />
                  <Form.Text className="text-muted small">
                    Texto adicional al final de la obligación.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </div>

          <hr className="my-3 text-muted" />

          {/* SECCIÓN 3: REGLA DE CONSECUTIVO */}
          <div className="mb-3">
            <h6 className="text-primary font-weight-bold mb-2 d-flex align-items-center">
              <FontAwesomeIcon icon={faMagic} className="me-2" />
              3. Regla de Armado del Consecutivo (NUMEFAC)
            </h6>
            <Row>
              {/* Opción 1: Últimos 4 dígitos */}
              <Col md={6} className="mb-2">
                <div
                  className="p-3 border rounded h-100"
                  style={{
                    cursor: "pointer",
                    backgroundColor: formulario.manejoNumero === "ULTIMOS_4" ? "#f0f7ff" : "#fff",
                    borderColor: formulario.manejoNumero === "ULTIMOS_4" ? "#1976d2" : "#dee2e6",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => onCampoChange("manejoNumero", "ULTIMOS_4")}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="font-weight-bold text-dark">
                      Últimos 4 Dígitos
                    </span>
                    <Badge pill variant="success">
                      Oficial DataCrédito
                    </Badge>
                  </div>
                  <p className="text-muted small m-0">
                    Toma los 4 dígitos finales de la factura (ej: <code>0005004314</code> ➔ <strong>4314</strong>).
                  </p>
                </div>
              </Col>

              {/* Opción 2: Quitar ceros a la izquierda */}
              <Col md={6} className="mb-2">
                <div
                  className="p-3 border rounded h-100"
                  style={{
                    cursor: "pointer",
                    backgroundColor: formulario.manejoNumero === "QUITAR_CEROS" ? "#f0f7ff" : "#fff",
                    borderColor: formulario.manejoNumero === "QUITAR_CEROS" ? "#1976d2" : "#dee2e6",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => onCampoChange("manejoNumero", "QUITAR_CEROS")}
                >
                  <div className="font-weight-bold text-dark mb-1">
                    Limpiar Ceros a la Izquierda
                  </div>
                  <p className="text-muted small m-0">
                    Convierte el número en valor entero limpio (ej: <code>0000004314</code> ➔ <strong>4314</strong>).
                  </p>
                </div>
              </Col>

              {/* Opción 3: Mantener tal cual */}
              <Col md={6} className="mb-2">
                <div
                  className="p-3 border rounded h-100"
                  style={{
                    cursor: "pointer",
                    backgroundColor: formulario.manejoNumero === "MANTENER" ? "#f0f7ff" : "#fff",
                    borderColor: formulario.manejoNumero === "MANTENER" ? "#1976d2" : "#dee2e6",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => onCampoChange("manejoNumero", "MANTENER")}
                >
                  <div className="font-weight-bold text-dark mb-1">
                    Mantener Número Tal Cual
                  </div>
                  <p className="text-muted small m-0">
                    Deja el texto del campo NUMEFAC sin ninguna alteración.
                  </p>
                </div>
              </Col>

              {/* Opción 4: Relleno con ceros */}
              <Col md={6} className="mb-2">
                <div
                  className="p-3 border rounded h-100"
                  style={{
                    cursor: "pointer",
                    backgroundColor: formulario.manejoNumero === "PAD_LEFT" ? "#f0f7ff" : "#fff",
                    borderColor: formulario.manejoNumero === "PAD_LEFT" ? "#1976d2" : "#dee2e6",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => onCampoChange("manejoNumero", "PAD_LEFT")}
                >
                  <div className="font-weight-bold text-dark mb-1">
                    Rellenar a Longitud Fija
                  </div>
                  <div className="d-flex align-items-center mt-1">
                    <span className="text-muted small me-2">Dígitos:</span>
                    <Form.Control
                      type="number"
                      min={2}
                      max={10}
                      size="sm"
                      style={{ width: "70px" }}
                      value={formulario.longitudPadding}
                      onChange={(e) =>
                        onCampoChange("longitudPadding", parseInt(e.target.value) || 4)
                      }
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <hr className="my-3 text-muted" />

          {/* SECCIÓN 4: VISTA PREVIA EN VIVO */}
          <div
            className="p-3 rounded border mb-3"
            style={{
              backgroundColor: "#f8fafd",
              borderColor: "#b8daff",
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="font-weight-bold text-primary">
                <FontAwesomeIcon icon={faMagic} className="me-1" /> Vista Previa en Vivo de la Obligación DataCrédito
              </span>
              <Badge pill variant="info">
                Cálculo instantáneo
              </Badge>
            </div>

            <Row className="align-items-center">
              <Col md={5} className="mb-2 mb-md-0">
                <Form.Label className="small text-muted mb-1 font-weight-bold">
                  Factura de prueba en el sistema:
                </Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  className="font-monospace"
                  value={formulario.ejemploFactura}
                  onChange={(e) => onCampoChange("ejemploFactura", e.target.value)}
                  placeholder="0005004314"
                />
              </Col>

              <Col md={2} className="text-center d-none d-md-block">
                <FontAwesomeIcon icon={faArrowRight} className="fa-lg text-primary" />
              </Col>

              <Col md={5}>
                <Form.Label className="small text-muted mb-1 font-weight-bold">
                  Cómo quedará en el Reporte DataCrédito:
                </Form.Label>
                <div className="p-2 bg-white rounded border border-success text-center">
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "#1f8b4c",
                      fontFamily: "monospace",
                      letterSpacing: "1px",
                    }}
                  >
                    {obligacionPreview || "(Especifique prefijo)"}
                  </span>
                </div>
              </Col>
            </Row>
          </div>

          {/* SECCIÓN 5: ESTADO */}
          <div className="pt-1">
            <Form.Group className="mb-0">
              <Form.Check
                type="switch"
                id="switch-activo-prefijo"
                label={
                  formulario.activo
                    ? "Cuenta Activa (Habilitada para la generación de reportes)"
                    : "Cuenta Inactiva (Omitida en la generación de reportes)"
                }
                checked={formulario.activo}
                onChange={(e) => onCampoChange("activo", e.target.checked)}
              />
            </Form.Group>
          </div>
        </Modal.Body>

        <Modal.Footer className="bg-light">
          <Button variant="light" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={guardando}
            style={{ minWidth: 160 }}
          >
            {guardando ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" /> Guardando...
              </>
            ) : modoEdicion ? (
              "Actualizar Regla"
            ) : (
              "Guardar Regla"
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default PrefijoFormModal;
