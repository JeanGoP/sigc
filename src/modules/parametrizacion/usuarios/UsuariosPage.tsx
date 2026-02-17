import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { can } from "@app/utils/security";
import { useAppSelector } from "@app/store/store";
import {
  ParametrizacionRole,
  ParametrizacionUser,
  SaveUserPayload,
  useParametrizacionService,
} from "@app/services/Parametrizacion/parametrizacionService";
import {
  DynamicTablePagination,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacion";

interface FormularioUsuarioState {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roleId: string;
  isActive: boolean;
}

const formularioVacio: FormularioUsuarioState = {
  username: "",
  password: "",
  fullName: "",
  email: "",
  roleId: "",
  isActive: true,
};

type FiltroEstado = "todos" | "activos" | "inactivos";

const UsuariosPage = () => {
  const permisos = useAppSelector((state) => state.security.permissions);
  const puedeCrear = can(permisos, "usuarios.create");
  const puedeEditar = can(permisos, "usuarios.edit");
  const puedeCambiarContrasena = can(permisos, "usuarios.change_password");

  const {
    loading,
    listarUsuarios,
    listarRoles,
    crearUsuario,
    actualizarUsuario,
    cambiarEstadoUsuario,
    cambiarPasswordUsuario,
  } = useParametrizacionService();

  const [usuarios, setUsuarios] = useState<ParametrizacionUser[]>([]);
  const [roles, setRoles] = useState<ParametrizacionRole[]>([]);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState<number | null>(null);
  const [formularioUsuario, setFormularioUsuario] = useState<FormularioUsuarioState>(
    formularioVacio
  );
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);

  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  const [usuarioParaContrasena, setUsuarioParaContrasena] =
    useState<ParametrizacionUser | null>(null);
  const [nuevaContrasena, setNuevaContrasena] = useState("");

  const usuarioSeleccionado = useMemo(
    () => usuarios.find((usuario) => usuario.userId === usuarioSeleccionadoId) ?? null,
    [usuarios, usuarioSeleccionadoId]
  );

  const estadisticas = useMemo(() => {
    const activos = usuarios.filter((usuario) => usuario.isActive).length;
    const inactivos = usuarios.length - activos;

    return {
      total: usuarios.length,
      activos,
      inactivos,
    };
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const busqueda = textoBusqueda.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const usuarioTexto = (usuario.username ?? "").toLowerCase();
      const nombreTexto = (usuario.fullName ?? "").toLowerCase();
      const correoTexto = (usuario.email ?? "").toLowerCase();

      const coincideBusqueda =
        busqueda.length === 0 ||
        usuarioTexto.includes(busqueda) ||
        nombreTexto.includes(busqueda) ||
        correoTexto.includes(busqueda);

      const coincideRol = !filtroRol || String(usuario.roleId ?? "") === filtroRol;

      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activos" && usuario.isActive) ||
        (filtroEstado === "inactivos" && !usuario.isActive);

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, textoBusqueda, filtroRol, filtroEstado]);

  const cargarDatos = useCallback(async () => {
    const [respuestaUsuarios, respuestaRoles] = await Promise.all([
      listarUsuarios(),
      listarRoles(),
    ]);

    if (respuestaUsuarios?.success) {
      setUsuarios(respuestaUsuarios.data ?? []);
    } else if (respuestaUsuarios) {
      toast.error(respuestaUsuarios.message || "No fue posible cargar los usuarios");
    }

    if (respuestaRoles?.success) {
      setRoles(respuestaRoles.data ?? []);
    } else if (respuestaRoles) {
      toast.error(respuestaRoles.message || "No fue posible cargar los roles");
    }
  }, [listarRoles, listarUsuarios]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    setPagina(0);
  }, [textoBusqueda, filtroRol, filtroEstado]);

  const limpiarFormularioUsuario = () => {
    setUsuarioSeleccionadoId(null);
    setFormularioUsuario(formularioVacio);
  };

  const abrirModalNuevoUsuario = () => {
    limpiarFormularioUsuario();
    setModalUsuarioAbierto(true);
  };

  const abrirModalEditarUsuario = (usuario: ParametrizacionUser) => {
    setUsuarioSeleccionadoId(usuario.userId);
    setFormularioUsuario({
      username: usuario.username ?? "",
      password: "",
      fullName: usuario.fullName ?? "",
      email: usuario.email ?? "",
      roleId: usuario.roleId ? String(usuario.roleId) : "",
      isActive: usuario.isActive,
    });
    setModalUsuarioAbierto(true);
  };

  const cerrarModalUsuario = () => {
    setModalUsuarioAbierto(false);
    limpiarFormularioUsuario();
  };

  const limpiarFiltros = () => {
    setTextoBusqueda("");
    setFiltroRol("");
    setFiltroEstado("todos");
  };

  const cerrarModalContrasena = () => {
    setUsuarioParaContrasena(null);
    setNuevaContrasena("");
  };

  const construirPayload = (): SaveUserPayload => ({
    username: formularioUsuario.username.trim(),
    password: formularioUsuario.password.trim() || undefined,
    fullName: formularioUsuario.fullName.trim(),
    email: formularioUsuario.email.trim(),
    roleId: formularioUsuario.roleId ? Number(formularioUsuario.roleId) : null,
    isActive: formularioUsuario.isActive,
  });

  const guardarUsuario = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!puedeCrear && !usuarioSeleccionadoId) {
      toast.error("No tienes permisos para crear usuarios");
      return;
    }

    if (!puedeEditar && usuarioSeleccionadoId) {
      toast.error("No tienes permisos para editar usuarios");
      return;
    }

    const payload = construirPayload();
    if (!payload.username || !payload.fullName || !payload.email) {
      toast.error("Usuario, nombre completo y correo electronico son obligatorios");
      return;
    }

    if (!usuarioSeleccionadoId && !payload.password) {
      toast.error("La contrasena es obligatoria para crear el usuario");
      return;
    }

    try {
      setGuardandoUsuario(true);
      const respuesta = usuarioSeleccionadoId
        ? await actualizarUsuario(usuarioSeleccionadoId, payload)
        : await crearUsuario(payload);

      if (respuesta?.success) {
        toast.success(respuesta.message || "Usuario guardado exitosamente");
        await cargarDatos();
        cerrarModalUsuario();
        return;
      }

      toast.error(respuesta?.message || "No fue posible guardar el usuario");
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const cambiarEstado = async (usuario: ParametrizacionUser) => {
    if (!puedeEditar) {
      toast.error("No tienes permisos para cambiar el estado de usuarios");
      return;
    }

    const respuesta = await cambiarEstadoUsuario(usuario.userId, !usuario.isActive);
    if (respuesta?.success) {
      toast.success(respuesta.message || "Estado actualizado");
      await cargarDatos();
      return;
    }

    toast.error(respuesta?.message || "No fue posible cambiar el estado");
  };

  const actualizarContrasena = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!usuarioParaContrasena) {
      return;
    }

    if (!puedeCambiarContrasena) {
      toast.error("No tienes permisos para cambiar contrasenas");
      return;
    }

    if (nuevaContrasena.trim().length < 5) {
      toast.error("La nueva contrasena debe tener al menos 5 caracteres");
      return;
    }

    const respuesta = await cambiarPasswordUsuario(
      usuarioParaContrasena.userId,
      nuevaContrasena.trim()
    );

    if (respuesta?.success) {
      toast.success(respuesta.message || "Contrasena actualizada");
      cerrarModalContrasena();
      return;
    }

    toast.error(respuesta?.message || "No fue posible cambiar la contrasena");
  };

  const columnasTabla: TableColumn[] = [
    {
      id: "username",
      label: "Usuario",
      format: (valor: string) => <span style={{ fontWeight: 600 }}>{valor}</span>,
    },
    {
      id: "fullName",
      label: "Nombre completo",
      format: (valor: string) => valor || "-",
    },
    {
      id: "email",
      label: "Correo electronico",
      format: (valor: string) => <span className="text-muted">{valor || "-"}</span>,
    },
    {
      id: "roleName",
      label: "Rol",
      format: (valor: string) => valor || "Sin rol",
    },
    {
      id: "isActive",
      label: "Estado",
      format: (valor: boolean) => (
        <Badge pill variant={valor ? "success" : "secondary"}>
          {valor ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "acciones",
      label: "Acciones",
      format: (_valor: unknown, fila: ParametrizacionUser) => (
        <ButtonGroup size="sm">
          <Button
            variant="outline-primary"
            onClick={() => abrirModalEditarUsuario(fila)}
            disabled={!puedeEditar}
          >
            Editar
          </Button>
          <Button
            variant={fila.isActive ? "outline-secondary" : "outline-success"}
            onClick={() => cambiarEstado(fila)}
            disabled={!puedeEditar}
          >
            {fila.isActive ? "Desactivar" : "Activar"}
          </Button>
          <Button
            variant="outline-dark"
            onClick={() => setUsuarioParaContrasena(fila)}
            disabled={!puedeCambiarContrasena}
          >
            Contrasena
          </Button>
        </ButtonGroup>
      ),
    },
  ];

  return (
    <Row className="mt-3">
      <Col xl={12}>
        <Card className="shadow-sm border-0">
          <Card.Body>
            <div
              className="d-flex justify-content-between align-items-center flex-wrap"
              style={{ gap: 12 }}
            >
              <div>
                <h5 className="mb-1" style={{ fontWeight: 700 }}>
                  Gestion de usuarios
                </h5>
                <small className="text-muted">
                  Controla usuarios, estado de acceso y rol asignado.
                </small>
              </div>
              <Button
                variant="primary"
                onClick={abrirModalNuevoUsuario}
                disabled={!puedeCrear}
                style={{ minWidth: 140 }}
              >
                + Nuevo usuario
              </Button>
            </div>

            <Row className="mt-3">
              <Col md={4}>
                <div className="border rounded bg-light px-3 py-2">
                  <div className="text-muted small">Total usuarios</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{estadisticas.total}</div>
                </div>
              </Col>
              <Col md={4} className="mt-2 mt-md-0">
                <div className="border rounded bg-light px-3 py-2">
                  <div className="text-muted small">Activos</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1f8b4c" }}>
                    {estadisticas.activos}
                  </div>
                </div>
              </Col>
              <Col md={4} className="mt-2 mt-md-0">
                <div className="border rounded bg-light px-3 py-2">
                  <div className="text-muted small">Inactivos</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#6c757d" }}>
                    {estadisticas.inactivos}
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="shadow-sm border-0 mt-3">
          <Card.Header className="bg-white border-0 pb-2">
            <Row>
              <Col md={5}>
                <Form.Group className="mb-2 mb-md-0">
                  <Form.Control
                    value={textoBusqueda}
                    onChange={(event) => setTextoBusqueda(event.target.value)}
                    placeholder="Buscar por usuario, nombre o correo"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-2 mb-md-0">
                  <Form.Control
                    as="select"
                    value={filtroRol}
                    onChange={(event) => setFiltroRol(event.target.value)}
                  >
                    <option value="">Todos los roles</option>
                    {roles.map((rol) => (
                      <option key={rol.roleId} value={rol.roleId}>
                        {rol.roleName}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-2 mb-md-0">
                  <Form.Control
                    as="select"
                    value={filtroEstado}
                    onChange={(event) => setFiltroEstado(event.target.value as FiltroEstado)}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={1} className="d-flex justify-content-end">
                <Button variant="light" onClick={limpiarFiltros} title="Limpiar filtros">
                  Limpiar
                </Button>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="pt-1">
            {loading && usuarios.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <Spinner animation="border" size="sm" /> Cargando usuarios...
              </div>
            ) : (
              <>
                <DynamicTablePagination
                  columns={columnasTabla}
                  rows={usuariosFiltrados}
                  searchText={textoBusqueda}
                  onSearchChange={setTextoBusqueda}
                  rowsPerPage={filasPorPagina}
                  onRowsPerPageChange={setFilasPorPagina}
                  page={pagina}
                  onPageChange={setPagina}
                  withSearch={false}
                  maxHeight="520px"
                  selectedPredicate={(fila) => usuarioSeleccionadoId === fila.userId}
                />
              </>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Modal
        show={modalUsuarioAbierto}
        onHide={() => {
          if (!guardandoUsuario) {
            cerrarModalUsuario();
          }
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {usuarioSeleccionado ? "Editar usuario" : "Crear usuario"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={guardarUsuario}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Usuario</Form.Label>
                  <Form.Control
                    value={formularioUsuario.username}
                    onChange={(event) =>
                      setFormularioUsuario({ ...formularioUsuario, username: event.target.value })
                    }
                    disabled={guardandoUsuario}
                    placeholder="Ej: jruiz"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nombre completo</Form.Label>
                  <Form.Control
                    value={formularioUsuario.fullName}
                    onChange={(event) =>
                      setFormularioUsuario({ ...formularioUsuario, fullName: event.target.value })
                    }
                    disabled={guardandoUsuario}
                    placeholder="Ej: Juan Ruiz"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Correo electronico</Form.Label>
                  <Form.Control
                    type="email"
                    value={formularioUsuario.email}
                    onChange={(event) =>
                      setFormularioUsuario({ ...formularioUsuario, email: event.target.value })
                    }
                    disabled={guardandoUsuario}
                    placeholder="usuario@correo.com"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Rol</Form.Label>
                  <Form.Control
                    as="select"
                    value={formularioUsuario.roleId}
                    onChange={(event) =>
                      setFormularioUsuario({ ...formularioUsuario, roleId: event.target.value })
                    }
                    disabled={guardandoUsuario}
                  >
                    <option value="">Sin rol</option>
                    {roles.map((rol) => (
                      <option key={rol.roleId} value={rol.roleId}>
                        {rol.roleName}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>
                    {usuarioSeleccionado
                      ? "Nueva contrasena (opcional)"
                      : "Contrasena"}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={formularioUsuario.password}
                    onChange={(event) =>
                      setFormularioUsuario({ ...formularioUsuario, password: event.target.value })
                    }
                    disabled={guardandoUsuario}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-0">
              <Form.Check
                type="checkbox"
                label="Usuario activo"
                checked={formularioUsuario.isActive}
                onChange={(event) =>
                  setFormularioUsuario({
                    ...formularioUsuario,
                    isActive: event.target.checked,
                  })
                }
                disabled={guardandoUsuario}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={cerrarModalUsuario}
              disabled={guardandoUsuario}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                guardandoUsuario ||
                (!usuarioSeleccionado && !puedeCrear) ||
                (Boolean(usuarioSeleccionado) && !puedeEditar)
              }
            >
              {guardandoUsuario
                ? "Guardando..."
                : usuarioSeleccionado
                  ? "Guardar cambios"
                  : "Crear usuario"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={Boolean(usuarioParaContrasena)} onHide={cerrarModalContrasena} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar contrasena</Modal.Title>
        </Modal.Header>
        <Form onSubmit={actualizarContrasena}>
          <Modal.Body>
            <p className="mb-2">
              Usuario: <strong>{usuarioParaContrasena?.username}</strong>
            </p>
            <Form.Group>
              <Form.Label>Nueva contrasena</Form.Label>
              <Form.Control
                type="password"
                value={nuevaContrasena}
                onChange={(event) => setNuevaContrasena(event.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cerrarModalContrasena}>
              Cancelar
            </Button>
            <Button type="submit" variant="dark" disabled={!puedeCambiarContrasena}>
              Actualizar contrasena
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Row>
  );
};

export default UsuariosPage;
