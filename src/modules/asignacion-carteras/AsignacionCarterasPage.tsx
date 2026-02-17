import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useAppSelector } from "@app/store/store";
import { can } from "@app/utils/security";
import {
  CarteraAsesor,
  CarteraAsignacionActual,
  CarteraAsignacionHistorial,
  useAsignacionCarterasService,
} from "@app/services/AsignacionCarteras/asignacionCarterasService";
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";

const TRAMOS = [
  { value: "PV", label: "Por vencer" },
  { value: "30", label: "30" },
  { value: "60", label: "60" },
  { value: "90", label: "90" },
  { value: "+90", label: "+90" },
];

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildRowKey = (item: CarteraAsignacionActual) => `${item.cuenta}|${item.tramoCodigo}`;

const AsignacionCarterasPage: React.FC = () => {
  const permisos = useAppSelector((state) => state.security.permissions);
  const puedeAsignar = can(permisos, "asignacion_carteras.assign");
  const puedeReasignar = can(permisos, "asignacion_carteras.reassign");

  const {
    loading,
    listarAsignaciones,
    listarAsesores,
    listarHistorial,
    guardarAsignacion,
    reasignarMasivo,
  } = useAsignacionCarterasService();

  const [asignaciones, setAsignaciones] = useState<CarteraAsignacionActual[]>([]);
  const [asesores, setAsesores] = useState<CarteraAsesor[]>([]);
  const [historial, setHistorial] = useState<CarteraAsignacionHistorial[]>([]);

  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoReasignacion, setGuardandoReasignacion] = useState(false);
  const [guardandoMasivo, setGuardandoMasivo] = useState(false);

  const [filtroCuenta, setFiltroCuenta] = useState("");
  const [filtroTramo, setFiltroTramo] = useState("");
  const [filtroAsesorId, setFiltroAsesorId] = useState("");

  const hoy = new Date();
  const haceTreintaDias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [fechaInicio, setFechaInicio] = useState(formatDateInput(haceTreintaDias));
  const [fechaFin, setFechaFin] = useState(formatDateInput(hoy));

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const [modalNuevaOpen, setModalNuevaOpen] = useState(false);
  const [nuevaCuenta, setNuevaCuenta] = useState("");
  const [nuevosTramos, setNuevosTramos] = useState<string[]>([]);
  const [nuevoAsesorId, setNuevoAsesorId] = useState("");
  const [nuevoMotivo, setNuevoMotivo] = useState("");

  const [filaReasignar, setFilaReasignar] = useState<CarteraAsignacionActual | null>(null);
  const [reasignarAsesorId, setReasignarAsesorId] = useState("");
  const [reasignarMotivo, setReasignarMotivo] = useState("");

  const [modalMasivoOpen, setModalMasivoOpen] = useState(false);
  const [masivoAsesorId, setMasivoAsesorId] = useState("");
  const [masivoMotivo, setMasivoMotivo] = useState("");

  const initializedRef = useRef(false);

  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const filasSeleccionadas = useMemo(
    () => asignaciones.filter((item) => selectedSet.has(buildRowKey(item))),
    [asignaciones, selectedSet]
  );

  const allSelected = useMemo(() => {
    return asignaciones.length > 0 && selectedKeys.length === asignaciones.length;
  }, [asignaciones.length, selectedKeys.length]);

  const cargarAsesoresData = useCallback(async () => {
    const response = await listarAsesores(true);
    if (response?.success) {
      setAsesores(response.data ?? []);
      return;
    }

    toast.error(response?.message || "No fue posible cargar los asesores");
  }, [listarAsesores]);

  const cargarAsignacionesData = useCallback(async () => {
    const response = await listarAsignaciones({
      cuenta: filtroCuenta.trim() || undefined,
      tramoCodigo: filtroTramo || undefined,
      asesorUserId: filtroAsesorId ? Number(filtroAsesorId) : undefined,
      soloTramosActivos: true,
    });

    if (response?.success) {
      setAsignaciones(response.data ?? []);
      return;
    }

    toast.error(response?.message || "No fue posible cargar las asignaciones");
  }, [filtroAsesorId, filtroCuenta, filtroTramo, listarAsignaciones]);

  const cargarHistorialData = useCallback(async () => {
    const response = await listarHistorial({
      cuenta: filtroCuenta.trim() || undefined,
      tramoCodigo: filtroTramo || undefined,
      asesorUserId: filtroAsesorId ? Number(filtroAsesorId) : undefined,
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
    });

    if (response?.success) {
      setHistorial(response.data ?? []);
      return;
    }

    toast.error(response?.message || "No fue posible cargar el historial");
  }, [fechaFin, fechaInicio, filtroAsesorId, filtroCuenta, filtroTramo, listarHistorial]);

  const consultarAsignacionesEHistorial = useCallback(async () => {
    setCargandoInicial(true);
    try {
      await Promise.all([cargarAsignacionesData(), cargarHistorialData()]);
    } finally {
      setCargandoInicial(false);
    }
  }, [cargarAsignacionesData, cargarHistorialData]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    const inicializar = async () => {
      setCargandoInicial(true);
      try {
        await cargarAsesoresData();
        await Promise.all([cargarAsignacionesData(), cargarHistorialData()]);
      } finally {
        setCargandoInicial(false);
      }
    };

    void inicializar();
  }, [cargarAsesoresData, cargarAsignacionesData, cargarHistorialData]);

  useEffect(() => {
    const validKeys = new Set(asignaciones.map((item) => buildRowKey(item)));
    setSelectedKeys((prev) => {
      const next = prev.filter((key) => validKeys.has(key));
      if (next.length === prev.length) {
        return prev;
      }

      return next;
    });
  }, [asignaciones]);

  const clearFiltros = () => {
    setFiltroCuenta("");
    setFiltroTramo("");
    setFiltroAsesorId("");
  };

  const handleSetFiltroCuenta = (cuenta: string | null) => {
    setFiltroCuenta(cuenta ?? "");
  };

  const handleSetNuevaCuenta = (cuenta: string | null) => {
    setNuevaCuenta(cuenta ?? "");
  };

  const handleToggleRow = (row: CarteraAsignacionActual) => {
    const key = buildRowKey(row);
    setSelectedKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedKeys([]);
      return;
    }

    setSelectedKeys(asignaciones.map((item) => buildRowKey(item)));
  };

  const openNuevaModal = () => {
    setNuevaCuenta("");
    setNuevosTramos([]);
    setNuevoAsesorId("");
    setNuevoMotivo("");
    setModalNuevaOpen(true);
  };

  const handleToggleNuevoTramo = (tramoCodigo: string) => {
    setNuevosTramos((prev) => {
      if (prev.includes(tramoCodigo)) {
        return prev.filter((item) => item !== tramoCodigo);
      }
      return [...prev, tramoCodigo];
    });
  };

  const handleGuardarAsignacion = async () => {
    if (!puedeAsignar) {
      toast.error("No tienes permisos para asignar carteras");
      return;
    }

    if (!nuevaCuenta.trim()) {
      toast.error("La cuenta es obligatoria");
      return;
    }

    if (!nuevoAsesorId) {
      toast.error("Debe seleccionar un asesor");
      return;
    }

    if (nuevosTramos.length === 0) {
      toast.error("Debe seleccionar al menos un tramo");
      return;
    }

    try {
      setGuardando(true);
      const response = await guardarAsignacion({
        cuenta: nuevaCuenta.trim(),
        tramos: nuevosTramos,
        asesorNuevoUserId: Number(nuevoAsesorId),
        motivo: nuevoMotivo.trim() || null,
      });

      if (response?.success) {
        toast.success(response.message || "Asignacion guardada exitosamente");
        setModalNuevaOpen(false);
        await consultarAsignacionesEHistorial();
        return;
      }

      toast.error(response?.message || "No fue posible guardar la asignacion");
    } finally {
      setGuardando(false);
    }
  };

  const openReasignarModal = (row: CarteraAsignacionActual) => {
    setFilaReasignar(row);
    setReasignarAsesorId(String(row.asesorUserId));
    setReasignarMotivo("");
  };

  const handleReasignarFila = async () => {
    if (!filaReasignar) {
      return;
    }

    if (!puedeReasignar) {
      toast.error("No tienes permisos para reasignar carteras");
      return;
    }

    if (!reasignarAsesorId) {
      toast.error("Debe seleccionar un asesor");
      return;
    }

    try {
      setGuardandoReasignacion(true);
      const response = await reasignarMasivo({
        cambios: [
          {
            cuenta: filaReasignar.cuenta,
            tramoCodigo: filaReasignar.tramoCodigo,
            asesorNuevoUserId: Number(reasignarAsesorId),
            motivo: reasignarMotivo.trim() || null,
          },
        ],
      });

      if (response?.success) {
        toast.success(response.message || "Reasignacion aplicada exitosamente");
        setFilaReasignar(null);
        await consultarAsignacionesEHistorial();
        return;
      }

      toast.error(response?.message || "No fue posible aplicar la reasignacion");
    } finally {
      setGuardandoReasignacion(false);
    }
  };

  const openMasivoModal = () => {
    if (filasSeleccionadas.length === 0) {
      toast.info("Seleccione al menos una fila para reasignar");
      return;
    }

    setMasivoAsesorId("");
    setMasivoMotivo("");
    setModalMasivoOpen(true);
  };

  const handleReasignarMasivo = async () => {
    if (!puedeReasignar) {
      toast.error("No tienes permisos para reasignar carteras");
      return;
    }

    if (!masivoAsesorId) {
      toast.error("Debe seleccionar un asesor");
      return;
    }

    if (filasSeleccionadas.length === 0) {
      toast.info("No hay filas seleccionadas");
      return;
    }

    try {
      setGuardandoMasivo(true);
      const response = await reasignarMasivo({
        cambios: filasSeleccionadas.map((item) => ({
          cuenta: item.cuenta,
          tramoCodigo: item.tramoCodigo,
          asesorNuevoUserId: Number(masivoAsesorId),
          motivo: masivoMotivo.trim() || null,
        })),
      });

      if (response?.success) {
        toast.success(response.message || "Reasignacion masiva aplicada exitosamente");
        setModalMasivoOpen(false);
        setSelectedKeys([]);
        await consultarAsignacionesEHistorial();
        return;
      }

      toast.error(response?.message || "No fue posible aplicar la reasignacion masiva");
    } finally {
      setGuardandoMasivo(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Asignacion de Carteras</h1>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <Card className="shadow-sm mb-3">
            <Card.Header className="bg-white border-0">
              <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 10 }}>
                <div>
                  <strong>Filtros</strong>
                </div>
                <div className="d-flex" style={{ gap: 8 }}>
                  <Button variant="outline-secondary" onClick={clearFiltros}>
                    Limpiar
                  </Button>
                  <Button variant="primary" onClick={() => void consultarAsignacionesEHistorial()}>
                    Aplicar filtros
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-2 mb-md-0">
                  <BuscadorCuentas
                    opcion="CU"
                    op="CLIENTE"
                    label="Cuenta"
                    placeholder="Buscar cuenta..."
                    value={filtroCuenta || undefined}
                    onChange={handleSetFiltroCuenta}
                    onSelect={() => {}}
                  />
                </Col>
                <Col md={4} className="mb-2 mb-md-0">
                  <Form.Group>
                    <Form.Label>Tramo</Form.Label>
                    <Form.Control
                      as="select"
                      value={filtroTramo}
                      onChange={(event) => setFiltroTramo(event.target.value)}
                    >
                      <option value="">Todos</option>
                      {TRAMOS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Asesor</Form.Label>
                    <Form.Control
                      as="select"
                      value={filtroAsesorId}
                      onChange={(event) => setFiltroAsesorId(event.target.value)}
                    >
                      <option value="">Todos</option>
                      {asesores.map((asesor) => (
                        <option key={asesor.userId} value={asesor.userId}>
                          {asesor.fullName}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 8 }}>
                  <div className="d-flex align-items-center" style={{ gap: 8 }}>
                    <Badge variant="secondary">Asignaciones: {asignaciones.length}</Badge>
                    <Badge variant="dark">Seleccionadas: {selectedKeys.length}</Badge>
                  </div>
                  <div className="d-flex" style={{ gap: 8 }}>
                    <Button variant="outline-primary" onClick={openMasivoModal} disabled={!puedeReasignar || selectedKeys.length === 0}>
                      Reasignar seleccionadas
                    </Button>
                    <Button variant="primary" onClick={openNuevaModal} disabled={!puedeAsignar}>
                      + Nueva asignacion
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="shadow-sm mb-3">
            <Card.Header className="bg-white border-0">
              <strong>Asignaciones actuales</strong>
            </Card.Header>
            <Card.Body>
              {cargandoInicial ? (
                <div className="text-center py-4 text-muted">
                  <Spinner animation="border" size="sm" /> Cargando asignaciones...
                </div>
              ) : (
                <Table responsive bordered hover>
                  <thead className="thead-light">
                    <tr>
                      <th style={{ width: 40 }}>
                        <Form.Check type="checkbox" checked={allSelected} onChange={handleToggleAll} />
                      </th>
                      <th>Cuenta</th>
                      <th>Tramo</th>
                      <th>Asesor actual</th>
                      <th>Fecha asignacion</th>
                      <th>Actualizado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asignaciones.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No hay asignaciones para los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      asignaciones.map((item) => {
                        const rowKey = buildRowKey(item);
                        return (
                          <tr key={rowKey}>
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={selectedSet.has(rowKey)}
                                onChange={() => handleToggleRow(item)}
                              />
                            </td>
                            <td>{item.cuenta}</td>
                            <td>
                              <Badge variant="info">{item.tramoNombre || item.tramoCodigo}</Badge>
                            </td>
                            <td>{item.asesorNombre}</td>
                            <td>{formatDateTime(item.fechaAsignacion)}</td>
                            <td>{formatDateTime(item.updatedAt)}</td>
                            <td>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => openReasignarModal(item)}
                                disabled={!puedeReasignar}
                              >
                                Reasignar
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 8 }}>
              <strong>Historial</strong>
              <div className="d-flex align-items-center flex-wrap" style={{ gap: 8 }}>
                <Form.Control
                  type="date"
                  value={fechaInicio}
                  onChange={(event) => setFechaInicio(event.target.value)}
                  style={{ width: 160 }}
                />
                <Form.Control
                  type="date"
                  value={fechaFin}
                  onChange={(event) => setFechaFin(event.target.value)}
                  style={{ width: 160 }}
                />
                <Button variant="outline-dark" onClick={() => void consultarAsignacionesEHistorial()}>
                  Actualizar historial
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {cargandoInicial ? (
                <div className="text-center py-4 text-muted">
                  <Spinner animation="border" size="sm" /> Cargando historial...
                </div>
              ) : (
                <Table responsive bordered hover size="sm">
                  <thead className="thead-light">
                    <tr>
                      <th>Fecha cambio</th>
                      <th>Cuenta</th>
                      <th>Tramo</th>
                      <th>Asesor anterior</th>
                      <th>Asesor nuevo</th>
                      <th>Cambiado por</th>
                      <th>Origen</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-4">
                          No hay historial para el rango seleccionado.
                        </td>
                      </tr>
                    ) : (
                      historial.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDateTime(item.fechaCambio)}</td>
                          <td>{item.cuenta}</td>
                          <td>{item.tramoNombre || item.tramoCodigo}</td>
                          <td>{item.asesorAnteriorNombre || "-"}</td>
                          <td>{item.asesorNuevoNombre}</td>
                          <td>{item.cambiadoPorNombre}</td>
                          <td>{item.origen}</td>
                          <td>{item.motivo || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </div>
      </section>

      <Modal show={modalNuevaOpen} onHide={() => !guardando && setModalNuevaOpen(false)} centered>
        <Modal.Header {...({ closeButton: true } as any)}>
          <Modal.Title>Nueva asignacion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <BuscadorCuentas
              opcion="CU"
              op="CLIENTE"
              label="Cuenta"
              placeholder="Buscar cuenta..."
              value={nuevaCuenta || undefined}
              onChange={handleSetNuevaCuenta}
              onSelect={() => {}}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Asesor</Form.Label>
            <Form.Control
              as="select"
              value={nuevoAsesorId}
              onChange={(event) => setNuevoAsesorId(event.target.value)}
              disabled={guardando}
            >
              <option value="">Seleccione un asesor</option>
              {asesores.map((asesor) => (
                <option key={asesor.userId} value={asesor.userId}>
                  {asesor.fullName}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tramos</Form.Label>
            <Row>
              {TRAMOS.map((tramo) => (
                <Col xs={6} key={tramo.value}>
                  <Form.Check
                    type="checkbox"
                    id={`tramo_${tramo.value}`}
                    label={tramo.label}
                    checked={nuevosTramos.includes(tramo.value)}
                    onChange={() => handleToggleNuevoTramo(tramo.value)}
                    disabled={guardando}
                  />
                </Col>
              ))}
            </Row>
          </Form.Group>

          <Form.Group>
            <Form.Label>Motivo (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={nuevoMotivo}
              onChange={(event) => setNuevoMotivo(event.target.value)}
              disabled={guardando}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalNuevaOpen(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => void handleGuardarAsignacion()} disabled={guardando || !puedeAsignar}>
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(filaReasignar)} onHide={() => !guardandoReasignacion && setFilaReasignar(null)} centered>
        <Modal.Header {...({ closeButton: true } as any)}>
          <Modal.Title>Reasignar cartera</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {filaReasignar && (
            <>
              <p className="mb-2">
                <strong>Cuenta:</strong> {filaReasignar.cuenta}
              </p>
              <p className="mb-3">
                <strong>Tramo:</strong> {filaReasignar.tramoNombre || filaReasignar.tramoCodigo}
              </p>
            </>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Nuevo asesor</Form.Label>
            <Form.Control
              as="select"
              value={reasignarAsesorId}
              onChange={(event) => setReasignarAsesorId(event.target.value)}
              disabled={guardandoReasignacion}
            >
              <option value="">Seleccione un asesor</option>
              {asesores.map((asesor) => (
                <option key={asesor.userId} value={asesor.userId}>
                  {asesor.fullName}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group>
            <Form.Label>Motivo (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={reasignarMotivo}
              onChange={(event) => setReasignarMotivo(event.target.value)}
              disabled={guardandoReasignacion}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setFilaReasignar(null)} disabled={guardandoReasignacion}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleReasignarFila()}
            disabled={guardandoReasignacion || !puedeReasignar}
          >
            {guardandoReasignacion ? "Aplicando..." : "Aplicar reasignacion"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={modalMasivoOpen} onHide={() => !guardandoMasivo && setModalMasivoOpen(false)} centered>
        <Modal.Header {...({ closeButton: true } as any)}>
          <Modal.Title>Reasignar seleccionadas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Se reasignaran <strong>{filasSeleccionadas.length}</strong> filas seleccionadas.
          </p>

          <Form.Group className="mb-3">
            <Form.Label>Nuevo asesor</Form.Label>
            <Form.Control
              as="select"
              value={masivoAsesorId}
              onChange={(event) => setMasivoAsesorId(event.target.value)}
              disabled={guardandoMasivo}
            >
              <option value="">Seleccione un asesor</option>
              {asesores.map((asesor) => (
                <option key={asesor.userId} value={asesor.userId}>
                  {asesor.fullName}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group>
            <Form.Label>Motivo (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={masivoMotivo}
              onChange={(event) => setMasivoMotivo(event.target.value)}
              disabled={guardandoMasivo}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalMasivoOpen(false)} disabled={guardandoMasivo}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleReasignarMasivo()}
            disabled={guardandoMasivo || !puedeReasignar}
          >
            {guardandoMasivo ? "Aplicando..." : "Aplicar reasignacion masiva"}
          </Button>
        </Modal.Footer>
      </Modal>

      {loading && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 9999,
            background: "rgba(33, 37, 41, 0.9)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          Procesando...
        </div>
      )}
    </div>
  );
};

export default AsignacionCarterasPage;
