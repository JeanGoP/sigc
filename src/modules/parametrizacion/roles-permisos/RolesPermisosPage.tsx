import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Col, Form, ListGroup, Row, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { can } from "@app/utils/security";
import { useAppSelector } from "@app/store/store";
import {
  ParametrizacionRole,
  ParametrizacionRolePermission,
  useParametrizacionService,
} from "@app/services/Parametrizacion/parametrizacionService";

type FiltroPermisos = "todos" | "activos" | "cambios";
type PresetPermisos = "todos" | "solo_view" | "ninguno";

interface GrupoPermisos {
  menuId: number;
  menuKey: string;
  menuName: string;
  sortOrder: number;
  rows: ParametrizacionRolePermission[];
}

const ORDEN_ACCIONES: Record<string, number> = {
  view: 1,
  create: 2,
  edit: 3,
  delete: 4,
  save: 5,
  manage: 6,
  assign: 7,
  reassign: 8,
  bulk_reassign: 9,
  permissions_edit: 10,
  change_password: 11,
};

const RolesPermisosPage = () => {
  const permissions = useAppSelector((state) => state.security.permissions);
  const canCreate = can(permissions, "roles_permisos.create");
  const canEdit = can(permissions, "roles_permisos.edit");
  const canDelete = can(permissions, "roles_permisos.delete");
  const canEditPermissions = can(permissions, "roles_permisos.permissions_edit");

  const {
    loading,
    listarRoles,
    crearRol,
    actualizarRol,
    eliminarRol,
    obtenerPermisosRol,
    actualizarPermisosRol,
  } = useParametrizacionService();

  const [roles, setRoles] = useState<ParametrizacionRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [roleName, setRoleName] = useState("");

  const [roleSearch, setRoleSearch] = useState("");
  const [permissionsSearch, setPermissionsSearch] = useState("");
  const [permissionsFilter, setPermissionsFilter] = useState<FiltroPermisos>("todos");

  const [rolePermissions, setRolePermissions] = useState<ParametrizacionRolePermission[]>([]);
  const [initialPermissionsMap, setInitialPermissionsMap] = useState<Record<number, boolean>>({});
  const [collapsedMenus, setCollapsedMenus] = useState<Record<number, boolean>>({});

  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.roleId === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const filteredRoles = useMemo(() => {
    const search = roleSearch.trim().toLowerCase();
    if (!search) {
      return roles;
    }

    return roles.filter((role) => role.roleName.toLowerCase().includes(search));
  }, [roles, roleSearch]);

  const isPermissionChanged = useCallback(
    (permission: ParametrizacionRolePermission) => {
      return (initialPermissionsMap[permission.actionId] ?? false) !== permission.isAllowed;
    },
    [initialPermissionsMap]
  );

  const pendingChangesCount = useMemo(
    () => rolePermissions.filter((permission) => isPermissionChanged(permission)).length,
    [rolePermissions, isPermissionChanged]
  );

  const activePermissionsCount = useMemo(
    () => rolePermissions.filter((permission) => permission.isAllowed).length,
    [rolePermissions]
  );

  const groupedPermissions = useMemo(() => {
    const groups: Record<number, GrupoPermisos> = {};
    const search = permissionsSearch.trim().toLowerCase();

    for (const permission of rolePermissions) {
      const matchesSearch =
        !search ||
        permission.menuName.toLowerCase().includes(search) ||
        permission.actionName.toLowerCase().includes(search) ||
        permission.permissionCode.toLowerCase().includes(search);

      if (!matchesSearch) {
        continue;
      }

      const changed = isPermissionChanged(permission);
      const matchesFilter =
        permissionsFilter === "todos" ||
        (permissionsFilter === "activos" && permission.isAllowed) ||
        (permissionsFilter === "cambios" && changed);

      if (!matchesFilter) {
        continue;
      }

      if (!groups[permission.menuId]) {
        groups[permission.menuId] = {
          menuId: permission.menuId,
          menuKey: permission.menuKey,
          menuName: permission.menuName,
          sortOrder: permission.sortOrder,
          rows: [],
        };
      }

      groups[permission.menuId].rows.push(permission);
    }

    return Object.values(groups)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.menuName.localeCompare(b.menuName))
      .map((group) => ({
        ...group,
        rows: [...group.rows].sort((a, b) => {
          const sortA = ORDEN_ACCIONES[a.actionKey] ?? 999;
          const sortB = ORDEN_ACCIONES[b.actionKey] ?? 999;
          if (sortA !== sortB) {
            return sortA - sortB;
          }

          return a.actionName.localeCompare(b.actionName);
        }),
      }));
  }, [rolePermissions, permissionsSearch, permissionsFilter, isPermissionChanged]);

  const loadRoles = useCallback(async () => {
    const response = await listarRoles();
    if (response?.success) {
      const nextRoles: ParametrizacionRole[] = response.data ?? [];
      setRoles(nextRoles);

      if (selectedRoleId) {
        const updatedSelectedRole = nextRoles.find((role) => role.roleId === selectedRoleId);
        if (!updatedSelectedRole) {
          setSelectedRoleId(null);
          setRoleName("");
          setRolePermissions([]);
          setInitialPermissionsMap({});
        } else {
          setRoleName(updatedSelectedRole.roleName);
        }
      }

      return;
    }

    toast.error(response?.message || "No fue posible cargar roles");
  }, [listarRoles, selectedRoleId]);

  const loadPermissions = useCallback(
    async (roleId: number) => {
      try {
        setIsLoadingPermissions(true);
        const response = await obtenerPermisosRol(roleId);

        if (response?.success) {
          const nextPermissions: ParametrizacionRolePermission[] = response.data ?? [];
          setRolePermissions(nextPermissions);
          setInitialPermissionsMap(
            Object.fromEntries(nextPermissions.map((permission) => [permission.actionId, permission.isAllowed]))
          );
          setCollapsedMenus({});
          return;
        }

        toast.error(response?.message || "No fue posible cargar permisos del rol");
      } finally {
        setIsLoadingPermissions(false);
      }
    },
    [obtenerPermisosRol]
  );

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const confirmarDescartarCambios = useCallback(() => {
    if (pendingChangesCount === 0) {
      return true;
    }

    return window.confirm("Tienes cambios sin guardar. Si continuas, se perderan. Deseas continuar?");
  }, [pendingChangesCount]);

  const handleSelectRole = async (role: ParametrizacionRole) => {
    if (role.roleId === selectedRoleId) {
      return;
    }

    if (!confirmarDescartarCambios()) {
      return;
    }

    setSelectedRoleId(role.roleId);
    setRoleName(role.roleName);
    setPermissionsSearch("");
    setPermissionsFilter("todos");
    await loadPermissions(role.roleId);
  };

  const handleNewRole = () => {
    if (!confirmarDescartarCambios()) {
      return;
    }

    setSelectedRoleId(null);
    setRoleName("");
    setRolePermissions([]);
    setInitialPermissionsMap({});
    setPermissionsSearch("");
    setPermissionsFilter("todos");
    setCollapsedMenus({});
  };

  const handleSaveRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!roleName.trim()) {
      toast.error("El nombre del rol es requerido");
      return;
    }

    if (selectedRoleId && !canEdit) {
      toast.error("No tienes permisos para editar roles");
      return;
    }

    if (!selectedRoleId && !canCreate) {
      toast.error("No tienes permisos para crear roles");
      return;
    }

    try {
      setIsSubmittingRole(true);

      const response = selectedRoleId
        ? await actualizarRol(selectedRoleId, roleName.trim())
        : await crearRol(roleName.trim());

      if (response?.success) {
        toast.success(response.message || "Rol guardado exitosamente");
        await loadRoles();

        const responseRole = response.data as ParametrizacionRole | undefined;
        if (responseRole?.roleId) {
          await handleSelectRole(responseRole);
        }

        return;
      }

      toast.error(response?.message || "No fue posible guardar el rol");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRoleId) {
      return;
    }

    if (!canDelete) {
      toast.error("No tienes permisos para eliminar roles");
      return;
    }

    const confirmed = window.confirm("Esta accion eliminara el rol seleccionado. Deseas continuar?");
    if (!confirmed) {
      return;
    }

    const response = await eliminarRol(selectedRoleId);
    if (response?.success) {
      toast.success(response.message || "Rol eliminado exitosamente");
      handleNewRole();
      await loadRoles();
      return;
    }

    toast.error(response?.message || "No fue posible eliminar el rol");
  };

  const togglePermission = (targetPermission: ParametrizacionRolePermission) => {
    setRolePermissions((prev) => {
      const isTurningOn = !targetPermission.isAllowed;

      if (targetPermission.actionKey === "view") {
        if (isTurningOn) {
          return prev.map((permission) =>
            permission.actionId === targetPermission.actionId
              ? { ...permission, isAllowed: true }
              : permission
          );
        }

        return prev.map((permission) =>
          permission.menuId === targetPermission.menuId
            ? { ...permission, isAllowed: false }
            : permission
        );
      }

      if (isTurningOn) {
        return prev.map((permission) => {
          if (permission.actionId === targetPermission.actionId) {
            return { ...permission, isAllowed: true };
          }

          if (permission.menuId === targetPermission.menuId && permission.actionKey === "view") {
            return { ...permission, isAllowed: true };
          }

          return permission;
        });
      }

      return prev.map((permission) =>
        permission.actionId === targetPermission.actionId
          ? { ...permission, isAllowed: false }
          : permission
      );
    });
  };

  const aplicarPresetMenu = (menuId: number, preset: PresetPermisos) => {
    setRolePermissions((prev) =>
      prev.map((permission) => {
        if (permission.menuId !== menuId) {
          return permission;
        }

        if (preset === "todos") {
          return { ...permission, isAllowed: true };
        }

        if (preset === "ninguno") {
          return { ...permission, isAllowed: false };
        }

        return { ...permission, isAllowed: permission.actionKey === "view" };
      })
    );
  };

  const aplicarPresetGlobal = (preset: PresetPermisos) => {
    setRolePermissions((prev) =>
      prev.map((permission) => {
        if (preset === "todos") {
          return { ...permission, isAllowed: true };
        }

        if (preset === "ninguno") {
          return { ...permission, isAllowed: false };
        }

        return { ...permission, isAllowed: permission.actionKey === "view" };
      })
    );
  };

  const descartarCambios = () => {
    setRolePermissions((prev) =>
      prev.map((permission) => ({
        ...permission,
        isAllowed: initialPermissionsMap[permission.actionId] ?? false,
      }))
    );
  };

  const toggleMenuCollapsed = (menuId: number) => {
    setCollapsedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) {
      toast.error("Selecciona un rol para actualizar permisos");
      return;
    }

    if (!canEditPermissions) {
      toast.error("No tienes permisos para actualizar permisos de rol");
      return;
    }

    const actionIds = rolePermissions
      .filter((permission) => permission.isAllowed)
      .map((permission) => permission.actionId);

    try {
      setIsSavingPermissions(true);
      const response = await actualizarPermisosRol(selectedRoleId, actionIds);
      if (response?.success) {
        toast.success(response.message || "Permisos actualizados exitosamente");
        await loadPermissions(selectedRoleId);
        return;
      }

      toast.error(response?.message || "No fue posible actualizar los permisos");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  return (
    <Row className="mt-3">
      <Col lg={4}>
        <Card className="shadow-sm border-0" style={{ minHeight: "72vh" }}>
          <Card.Header className="bg-white border-0 pb-2">
            <div className="d-flex justify-content-between align-items-center" style={{ gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700 }}>Roles</div>
                <small className="text-muted">{roles.length} registrados</small>
              </div>
              <Button variant="primary" size="sm" onClick={handleNewRole}>
                Nuevo rol
              </Button>
            </div>
            <Form.Control
              className="mt-2"
              value={roleSearch}
              onChange={(event) => setRoleSearch(event.target.value)}
              placeholder="Buscar rol"
            />
          </Card.Header>

          <Card.Body className="pt-2 d-flex flex-column" style={{ gap: 12 }}>
            <div style={{ maxHeight: "42vh", overflowY: "auto" }}>
              <ListGroup>
                {filteredRoles.map((role) => (
                  <ListGroup.Item
                    key={role.roleId}
                    action
                    active={role.roleId === selectedRoleId}
                    onClick={() => void handleSelectRole(role)}
                    style={{ cursor: "pointer" }}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>{role.roleName}</span>
                    {role.roleId === selectedRoleId && <Badge variant="light">Actual</Badge>}
                  </ListGroup.Item>
                ))}

                {loading && roles.length === 0 && (
                  <ListGroup.Item className="text-muted text-center">
                    <Spinner animation="border" size="sm" /> Cargando roles...
                  </ListGroup.Item>
                )}

                {!loading && filteredRoles.length === 0 && (
                  <ListGroup.Item className="text-muted">No hay roles para este filtro</ListGroup.Item>
                )}
              </ListGroup>
            </div>

            <Form className="border-top pt-3" onSubmit={handleSaveRole}>
              <Form.Group>
                <Form.Label>Nombre del rol</Form.Label>
                <Form.Control
                  value={roleName}
                  onChange={(event) => setRoleName(event.target.value)}
                  placeholder="Ej: Supervisor"
                  disabled={isSubmittingRole}
                />
              </Form.Group>

              <div className="d-flex justify-content-between" style={{ gap: 8 }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingRole || (selectedRoleId ? !canEdit : !canCreate)}
                >
                  {isSubmittingRole ? "Guardando..." : selectedRoleId ? "Actualizar" : "Crear"}
                </Button>

                <Button
                  type="button"
                  variant="outline-danger"
                  onClick={handleDeleteRole}
                  disabled={!selectedRoleId || !canDelete}
                >
                  Eliminar
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={8} className="mt-3 mt-lg-0">
        <Card className="shadow-sm border-0" style={{ minHeight: "72vh" }}>
          <Card.Header className="bg-white border-0 pb-2">
            <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700 }}>Permisos del rol</div>
                {selectedRole ? (
                  <small className="text-muted">
                    Configurando: <strong>{selectedRole.roleName}</strong>
                  </small>
                ) : (
                  <small className="text-muted">Selecciona un rol para empezar</small>
                )}
              </div>

              <div className="d-flex align-items-center flex-wrap" style={{ gap: 6 }}>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={!selectedRoleId || !canEditPermissions}
                  onClick={() => aplicarPresetGlobal("todos")}
                >
                  Todo
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={!selectedRoleId || !canEditPermissions}
                  onClick={() => aplicarPresetGlobal("solo_view")}
                >
                  Solo ver
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={!selectedRoleId || !canEditPermissions}
                  onClick={() => aplicarPresetGlobal("ninguno")}
                >
                  Ninguno
                </Button>
              </div>
            </div>

            <Row className="mt-2">
              <Col md={8}>
                <Form.Control
                  value={permissionsSearch}
                  onChange={(event) => setPermissionsSearch(event.target.value)}
                  placeholder="Buscar por modulo, accion o codigo"
                  disabled={!selectedRoleId}
                />
              </Col>
              <Col md={4} className="mt-2 mt-md-0">
                <Form.Control
                  as="select"
                  value={permissionsFilter}
                  onChange={(event) => setPermissionsFilter(event.target.value as FiltroPermisos)}
                  disabled={!selectedRoleId}
                >
                  <option value="todos">Todos</option>
                  <option value="activos">Solo activos</option>
                  <option value="cambios">Solo cambios</option>
                </Form.Control>
              </Col>
            </Row>
          </Card.Header>

          <Card.Body style={{ maxHeight: "52vh", overflowY: "auto" }}>
            {!selectedRoleId ? (
              <div className="text-muted">Selecciona un rol para configurar permisos.</div>
            ) : isLoadingPermissions ? (
              <div className="text-center py-4 text-muted">
                <Spinner animation="border" size="sm" /> Cargando permisos...
              </div>
            ) : groupedPermissions.length === 0 ? (
              <div className="text-muted">No hay permisos para los filtros seleccionados.</div>
            ) : (
              groupedPermissions.map((group) => {
                const allowedCount = group.rows.filter((permission) => permission.isAllowed).length;
                const changedCount = group.rows.filter((permission) => isPermissionChanged(permission)).length;
                const isCollapsed = collapsedMenus[group.menuId] ?? false;

                return (
                  <div key={group.menuId} className="border rounded mb-3 overflow-hidden">
                    <div
                      className="px-3 py-2 bg-light d-flex justify-content-between align-items-center flex-wrap"
                      style={{ gap: 8 }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{group.menuName}</div>
                        <small className="text-muted">
                          {allowedCount}/{group.rows.length} activos
                          {changedCount > 0 && <> | {changedCount} cambios</>}
                        </small>
                      </div>

                      <div className="d-flex align-items-center flex-wrap" style={{ gap: 6 }}>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          disabled={!canEditPermissions}
                          onClick={() => aplicarPresetMenu(group.menuId, "todos")}
                        >
                          Todo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          disabled={!canEditPermissions}
                          onClick={() => aplicarPresetMenu(group.menuId, "solo_view")}
                        >
                          Solo ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          disabled={!canEditPermissions}
                          onClick={() => aplicarPresetMenu(group.menuId, "ninguno")}
                        >
                          Ninguno
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => toggleMenuCollapsed(group.menuId)}
                        >
                          {isCollapsed ? "Mostrar" : "Ocultar"}
                        </Button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="p-3">
                        {group.rows.map((permission) => {
                          const changed = isPermissionChanged(permission);

                          return (
                            <div
                              key={permission.actionId}
                              className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
                              style={
                                changed
                                  ? { borderColor: "#ffc107", backgroundColor: "#fffaf0" }
                                  : undefined
                              }
                            >
                              <div>
                                <div className="d-flex align-items-center" style={{ gap: 6 }}>
                                  <span style={{ fontWeight: 600 }}>{permission.actionName}</span>
                                  {permission.actionKey === "view" && <Badge variant="secondary">Base</Badge>}
                                  {changed && <Badge variant="warning">Cambio</Badge>}
                                </div>
                                <small className="text-muted">
                                  <code>{permission.permissionCode}</code>
                                </small>
                              </div>

                              <Form.Check
                                type="switch"
                                id={`perm_${permission.actionId}`}
                                label={permission.isAllowed ? "Activo" : "Inactivo"}
                                checked={permission.isAllowed}
                                onChange={() => togglePermission(permission)}
                                disabled={!canEditPermissions}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </Card.Body>

          <Card.Footer className="bg-white border-top">
            <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>
                  Activos: {activePermissionsCount}/{rolePermissions.length} | Cambios pendientes: {pendingChangesCount}
                </div>
                <small className="text-muted">
                  Al guardar permisos se cerraran las sesiones activas de usuarios con este rol.
                </small>
              </div>

              <div className="d-flex" style={{ gap: 6 }}>
                <Button
                  variant="outline-secondary"
                  onClick={descartarCambios}
                  disabled={!selectedRoleId || pendingChangesCount === 0 || !canEditPermissions}
                >
                  Descartar
                </Button>
                <Button
                  variant="dark"
                  onClick={handleSavePermissions}
                  disabled={
                    !selectedRoleId ||
                    isSavingPermissions ||
                    !canEditPermissions ||
                    pendingChangesCount === 0
                  }
                >
                  {isSavingPermissions ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </Card.Footer>
        </Card>
      </Col>
    </Row>
  );
};

export default RolesPermisosPage;
