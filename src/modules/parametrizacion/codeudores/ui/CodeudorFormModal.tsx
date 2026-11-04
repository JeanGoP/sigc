import React from "react";
import { Modal, Button, Form, Row, Col, Spinner, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTag,
  faFileInvoice,
  faAddressCard,
  faMapMarkerAlt,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import type { FormularioCodeudorState } from "../hooks/useCodeudoresPage";
import type { FacturaLookupItem } from "@app/services/Parametrizacion/codeudoresTypes";

interface CodeudorFormModalProps {
  show: boolean;
  guardando: boolean;
  esEdicion: boolean;
  formulario: FormularioCodeudorState;
  facturaSuggestions: FacturaLookupItem[];
  buscandoFacturas: boolean;
  onHide: () => void;
  onSubmit: () => void;
  onCampoChange: (campo: keyof FormularioCodeudorState, valor: any) => void;
  onBuscarObligacion: (query: string) => void;
  onSeleccionarFactura: (fac: FacturaLookupItem) => void;
}

export default function CodeudorFormModal({
  show,
  guardando,
  esEdicion,
  formulario,
  facturaSuggestions,
  buscandoFacturas,
  onHide,
  onSubmit,
  onCampoChange,
  onBuscarObligacion,
  onSeleccionarFactura,
}: CodeudorFormModalProps) {
  const modalHeaderProps = { closeButton: true } as any;

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered>
      <Modal.Header {...modalHeaderProps}>
        <Modal.Title style={{ fontSize: "1.15rem", fontWeight: 700 }}>
          <FontAwesomeIcon icon={faUserTag} className="me-2 text-primary" />
          {esEdicion ? "Editar Datos del Codeudor" : "Registrar Nuevo Codeudor"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 py-3">
        {/* SECCIÓN 1: OBLIGACIÓN Y TITULAR */}
        <div className="mb-3">
          <h6 className="text-primary font-weight-bold mb-2 d-flex align-items-center">
            <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
            1. Obligación y Titular Principal
          </h6>

          {esEdicion ? (
            <div className="border rounded bg-light p-3">
              <Row>
                <Col md={4}>
                  <div className="text-muted small">Número de Obligación:</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1976d2" }}>
                    {formulario.numefac}
                  </div>
                </Col>
                <Col md={5}>
                  <div className="text-muted small">Titular:</div>
                  <div style={{ fontWeight: 600 }}>
                    {formulario.nombreTitular || "-"}
                  </div>
                  <small className="text-muted">Cédula: {formulario.cliente || "N/A"}</small>
                </Col>
                <Col md={3}>
                  <div className="text-muted small">Cuenta Contable:</div>
                  <div style={{ fontWeight: 600 }}>{formulario.cuenta || "-"}</div>
                </Col>
              </Row>
            </div>
          ) : (
            <div>
              <Form.Group className="mb-2 position-relative">
                <Form.Label className="small font-weight-bold">
                  Buscar Obligación / Factura <span className="text-danger">*</span>
                </Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    {buscandoFacturas ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FontAwesomeIcon icon={faSearch} className="text-muted" />
                    )}
                  </span>
                  <Form.Control
                    type="text"
                    value={formulario.numefac}
                    onChange={(e) => {
                      onCampoChange("numefac", e.target.value);
                      onBuscarObligacion(e.target.value);
                    }}
                    placeholder="Escriba el número de factura o cédula (ej. 004314)..."
                  />
                </div>

                {/* Dropdown de Sugerencias */}
                {facturaSuggestions.length > 0 && (
                  <div
                    className="position-absolute w-100 bg-white border rounded shadow-lg mt-1"
                    style={{ zIndex: 1050, maxHeight: "210px", overflowY: "auto" }}
                  >
                    {facturaSuggestions.map((fac, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 border-bottom cursor-pointer hover-bg-light d-flex justify-content-between align-items-center"
                        style={{ cursor: "pointer" }}
                        onClick={() => onSeleccionarFactura(fac)}
                      >
                        <div>
                          <strong className="text-primary">{fac.numefac}</strong> - {fac.nombreTitular}
                          <div className="text-muted small">
                            Cédula: {fac.cliente} | Cuenta: {fac.cuenta || "Sin cuenta"}
                          </div>
                        </div>
                        <Badge variant="primary">Seleccionar</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Form.Group>

              {formulario.nombreTitular && (
                <div className="alert alert-info py-2 px-3 mb-2 small">
                  <strong>Titular Encontrado:</strong> {formulario.nombreTitular} (Cédula: {formulario.cliente}) - Cuenta: {formulario.cuenta || "N/A"}
                </div>
              )}
            </div>
          )}
        </div>

        <hr className="my-3 text-muted" />

        {/* SECCIÓN 2: DATOS DEL CODEUDOR */}
        <div className="mb-3">
          <h6 className="text-primary font-weight-bold mb-2 d-flex align-items-center">
            <FontAwesomeIcon icon={faAddressCard} className="me-2" />
            2. Datos del Codeudor
          </h6>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-2">
                <Form.Label className="small font-weight-bold">
                  Tipo Doc. <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="select"
                  value={formulario.tipoIdentificacion}
                  onChange={(e) => onCampoChange("tipoIdentificacion", e.target.value)}
                >
                  <option value="CC">Cédula (CC)</option>
                  <option value="CE">Cédula Ext. (CE)</option>
                  <option value="NIT">NIT</option>
                  <option value="PAS">Pasaporte (PAS)</option>
                  <option value="TI">Tarjeta Ident. (TI)</option>
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label className="small font-weight-bold">
                  Número de Documento <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formulario.identificacion}
                  onChange={(e) => onCampoChange("identificacion", e.target.value)}
                  placeholder="Número de cédula o NIT"
                />
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group className="mb-2">
                <Form.Label className="small font-weight-bold">
                  Nombre Completo <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => onCampoChange("nombre", e.target.value.toUpperCase())}
                  placeholder="NOMBRES Y APELLIDOS"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>

        <hr className="my-3 text-muted" />

        {/* SECCIÓN 3: CONTACTO Y UBICACIÓN */}
        <div className="mb-3">
          <h6 className="text-primary font-weight-bold mb-2 d-flex align-items-center">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
            3. Contacto y Residencia
          </h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small font-weight-bold">Teléfono / Celular</Form.Label>
                <Form.Control
                  type="text"
                  value={formulario.telefono}
                  onChange={(e) => onCampoChange("telefono", e.target.value)}
                  placeholder="300 123 4567"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small font-weight-bold">Correo Electrónico</Form.Label>
                <Form.Control
                  type="email"
                  value={formulario.email}
                  onChange={(e) => onCampoChange("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group className="mb-2">
                <Form.Label className="small font-weight-bold">Dirección de Residencia</Form.Label>
                <Form.Control
                  type="text"
                  value={formulario.direccion}
                  onChange={(e) => onCampoChange("direccion", e.target.value.toUpperCase())}
                  placeholder="Calle, Carrera, Barrio..."
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label className="small font-weight-bold">Ciudad / Municipio</Form.Label>
                <Form.Control
                  type="text"
                  value={formulario.ciudad}
                  onChange={(e) => onCampoChange("ciudad", e.target.value.toUpperCase())}
                  placeholder="MONTELIBANO"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>

        <hr className="my-3 text-muted" />

        {/* SECCIÓN 4: OBSERVACIONES Y ESTADO */}
        <div>
          <Row>
            <Col md={esEdicion ? 8 : 12}>
              <Form.Group className="mb-2">
                <Form.Label className="small font-weight-bold">Observaciones (Opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formulario.observacion}
                  onChange={(e) => onCampoChange("observacion", e.target.value)}
                  placeholder="Notas adicionales o referencias del codeudor..."
                />
              </Form.Group>
            </Col>
            {esEdicion && (
              <Col md={4} className="d-flex align-items-center">
                <Form.Group className="mb-2">
                  <Form.Label className="small font-weight-bold d-block">Estado</Form.Label>
                  <Form.Check
                    type="switch"
                    id="custom-switch-activo"
                    label={formulario.activo ? "Activo (Vigente)" : "Inactivo"}
                    checked={formulario.activo}
                    onChange={(e) => onCampoChange("activo", e.target.checked)}
                  />
                </Form.Group>
              </Col>
            )}
          </Row>
        </div>
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <Button variant="light" onClick={onHide} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onSubmit} disabled={guardando} style={{ minWidth: 150 }}>
          {guardando ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" /> Guardando...
            </>
          ) : esEdicion ? (
            "Actualizar Codeudor"
          ) : (
            "Guardar Codeudor"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
