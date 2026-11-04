import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEdit,
  faHeadset,
  faKey,
  faPhone,
  faSearch,
  faSync,
  faTimes,
  faUser,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import {
  AsteriskUserExtensionDto,
  useWebRtcService,
} from "@app/services/WebRtc/webrtcService";

export default function GestionExtensionesAsterisk() {
  const { listUserExtensions, assignUserExtension } = useWebRtcService();
  const [extensions, setExtensions] = useState<AsteriskUserExtensionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AsteriskUserExtensionDto | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newExtension, setNewExtension] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchExtensions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listUserExtensions();
      if (response?.success && Array.isArray(response.data)) {
        setExtensions(response.data);
      } else {
        toast.error(response?.message || "No se pudieron obtener las extensiones");
      }
    } catch (err: any) {
      toast.error("Error al cargar extensiones: " + (err?.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, [listUserExtensions]);

  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  const filteredExtensions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return extensions;
    return extensions.filter(
      (item) =>
        item.username.toLowerCase().includes(term) ||
        item.fullName.toLowerCase().includes(term) ||
        item.extension.toLowerCase().includes(term)
    );
  }, [extensions, searchTerm]);

  const stats = useMemo(() => {
    const total = extensions.length;
    const assignedSpecific = extensions.filter(
      (e) => e.extension && e.extension !== "200"
    ).length;
    const default200 = total - assignedSpecific;
    return { total, assignedSpecific, default200 };
  }, [extensions]);

  const handleOpenEdit = (user: AsteriskUserExtensionDto) => {
    setSelectedUser(user);
    setNewExtension(user.extension || "");
    setNewPassword(user.password || "");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (!saving) {
      setShowModal(false);
      setSelectedUser(null);
      setNewExtension("");
      setNewPassword("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const cleanExt = newExtension.trim();
    if (!cleanExt) {
      toast.warn("Debes ingresar un número de extensión");
      return;
    }

    if (!/^\d{2,6}$/.test(cleanExt)) {
      toast.warn("La extensión debe contener solo números (ej: 201, 202)");
      return;
    }

    setSaving(true);
    try {
      const response = await assignUserExtension({
        userId: selectedUser.userId,
        username: selectedUser.username,
        extension: cleanExt,
        password: newPassword.trim() || undefined,
      });

      if (response?.success) {
        toast.success(`Extensión ${cleanExt} asignada a ${selectedUser.username}`);
        setShowModal(false);
        fetchExtensions();
      } else {
        toast.error(response?.message || "Error al asignar la extensión");
      }
    } catch (err: any) {
      toast.error("Error al guardar: " + (err?.message || "Error de red"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gestion-extensiones-asterisk">
      {/* Overview Cards */}
      <Row className="mb-3 g-2">
        <Col xs={12} sm={4}>
          <Card className="shadow-sm border-0 bg-primary text-white h-100">
            <Card.Body className="d-flex align-items-center justify-content-between p-3">
              <div>
                <div className="small text-uppercase opacity-75 fw-bold">Total Asesores / Usuarios</div>
                <h3 className="mb-0 fw-bold">{stats.total}</h3>
              </div>
              <FontAwesomeIcon icon={faUserTie} size="2x" className="opacity-50" />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={4}>
          <Card className="shadow-sm border-0 bg-success text-white h-100">
            <Card.Body className="d-flex align-items-center justify-content-between p-3">
              <div>
                <div className="small text-uppercase opacity-75 fw-bold">Extensiones Individuales</div>
                <h3 className="mb-0 fw-bold">{stats.assignedSpecific}</h3>
              </div>
              <FontAwesomeIcon icon={faHeadset} size="2x" className="opacity-50" />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={4}>
          <Card className="shadow-sm border-0 bg-secondary text-white h-100">
            <Card.Body className="d-flex align-items-center justify-content-between p-3">
              <div>
                <div className="small text-uppercase opacity-75 fw-bold">Extensión 200 (Default)</div>
                <h3 className="mb-0 fw-bold">{stats.default200}</h3>
              </div>
              <FontAwesomeIcon icon={faPhone} size="2x" className="opacity-50" />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white py-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
              style={{ width: "36px", height: "36px" }}
            >
              <FontAwesomeIcon icon={faHeadset} />
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark">Directorio de Extensiones Asterisk</h6>
              <small className="text-muted">
                Asigna a cada usuario la extensión SIP que operará en la PBX y en las colas de atención
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <InputGroup style={{ maxWidth: "260px" }}>
              <InputGroup.Text className="bg-light border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar por asesor o extensión..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0 bg-light"
              />
              {searchTerm && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
              )}
            </InputGroup>

            <Button
              variant="outline-primary"
              size="sm"
              onClick={fetchExtensions}
              disabled={loading}
              title="Refrescar lista"
            >
              <FontAwesomeIcon icon={faSync} spin={loading} />
            </Button>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {loading && extensions.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Spinner animation="border" variant="primary" className="mb-2" />
              <div>Cargando directorio de extensiones...</div>
            </div>
          ) : filteredExtensions.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FontAwesomeIcon icon={faSearch} size="2x" className="mb-2 opacity-50" />
              <div>No se encontraron usuarios que coincidan con la búsqueda.</div>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="table-light text-uppercase small text-muted">
                  <tr>
                    <th style={{ width: "70px" }}>ID</th>
                    <th>Asesor / Usuario</th>
                    <th>Nombre Completo</th>
                    <th style={{ width: "160px" }}>Extensión Asterisk</th>
                    <th style={{ width: "120px" }}>Estado</th>
                    <th style={{ width: "180px" }}>Última Asignación</th>
                    <th style={{ width: "120px" }} className="text-center">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExtensions.map((item) => {
                    const isCustom = item.extension && item.extension !== "200";
                    return (
                      <tr key={item.userId}>
                        <td className="text-muted fw-bold">#{item.userId}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <FontAwesomeIcon icon={faUser} className="text-muted opacity-50" />
                            <span className="fw-semibold text-dark">{item.username}</span>
                          </div>
                        </td>
                        <td>{item.fullName || <span className="text-muted">-</span>}</td>
                        <td>
                          {isCustom ? (
                            <Badge variant="success" className="px-2 py-1 fs-6">
                              <FontAwesomeIcon icon={faPhone} className="me-1 small" />
                              Ext. {item.extension}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="px-2 py-1 fs-6 opacity-75">
                              <FontAwesomeIcon icon={faPhone} className="me-1 small" />
                              Ext. 200 (Default)
                            </Badge>
                          )}
                        </td>
                        <td>
                          {item.isActive ? (
                            <Badge variant="success" pill>
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="danger" pill>
                              Inactivo
                            </Badge>
                          )}
                        </td>
                        <td className="small text-muted">
                          {item.updatedAtUtc ? (
                            new Date(item.updatedAtUtc).toLocaleString("es-CO", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          ) : (
                            <span className="text-muted fst-italic">Por defecto</span>
                          )}
                        </td>
                        <td className="text-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="px-2 py-1 d-inline-flex align-items-center gap-1"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            <span>Editar</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal for Assigning Extension */}
      <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
        <Form onSubmit={handleSave}>
          <Modal.Header {...({ closeButton: !saving } as any)} className="bg-primary text-white">
            <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faHeadset} />
              <span>Configurar Extensión Asterisk</span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {selectedUser && (
              <Alert variant="info" className="d-flex align-items-center gap-2 py-2 mb-3">
                <FontAwesomeIcon icon={faUserTie} size="lg" />
                <div>
                  <div className="fw-bold">{selectedUser.fullName || selectedUser.username}</div>
                  <small className="text-muted">Usuario de sistema: @{selectedUser.username}</small>
                </div>
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Número de Extensión SIP <span className="text-danger">*</span>
              </Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faPhone} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Ej: 201, 202, 203..."
                  value={newExtension}
                  onChange={(e) => setNewExtension(e.target.value.replace(/[^\d]/g, ""))}
                  autoFocus
                  required
                  disabled={saving}
                />
              </InputGroup>
              <Form.Text className="text-muted small">
                Debe coincidir con el endpoint creado en la PBX Asterisk y asignado a la cola 600.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Contraseña SIP (Opcional)</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faKey} />
                </InputGroup.Text>
                <Form.Control
                  type="password"
                  placeholder="Dejar en blanco para usar la clave por defecto"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={saving}
                />
              </InputGroup>
              <Form.Text className="text-muted small">
                Si no se especifica, el sistema usará la contraseña configurada en el servidor.
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={handleCloseModal} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  Guardando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                  Guardar Extensión
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
