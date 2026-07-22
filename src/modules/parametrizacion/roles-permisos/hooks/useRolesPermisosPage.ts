import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { can } from "@app/utils/security";
import { useAppSelector } from "@app/store/store";
import { useParametrizacionService } from "@app/services/Parametrizacion/parametrizacionService";
import type {
  ParametrizacionRole,
  ParametrizacionRolePermission,
  ReporteRolePermission,
} from "@app/services/Parametrizacion/types";
import {
  FILTRO_PERMISOS_OPTIONS,
  PRESET_PERMISOS_OPTIONS,
} from "../domain/constants";
import {
  applyGlobalPreset,
  applyPresetToMenu,
  buildInitialPermissionsMap,
  countActivePermissions,
  countPendingPermissionChanges,
  discardPermissionChanges,
  filterRoles,
  groupPermissions,
  isPermissionChanged,
  togglePermissionAccess,
} from "../domain/helpers";
import type { FiltroPermisos, PresetPermisos } from "../domain/types";

export function useRolesPermisosPage() {
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
    obtenerPermisosReportesRol,
    actualizarPermisosReportesRol,
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

  // Estado para permisos de reportes
  const [roleReportPermissions, setRoleReportPermissions] = useState<ReporteRolePermission[]>([]);
  const [initialReportPermissionsMap, setInitialReportPermissionsMap] = useState<Record<number, boolean>>({});
  const [reportSearch, setReportSearch] = useState(""); // Búsqueda para reportes
  const [isLoadingReportPermissions, setIsLoadingReportPermissions] = useState(false);
  const [isSavingReportPermissions, setIsSavingReportPermissions] = useState(false);

  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState<'permisos' | 'reportes'>('permisos'); // Pestaña activa

  const selectedRole = useMemo(
    () => roles.find((role) => role.roleId === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const filteredRoles = useMemo(
    () => filterRoles(roles, roleSearch),
    [roles, roleSearch]
  );

  const pendingChangesCount = useMemo(
    () => countPendingPermissionChanges(rolePermissions, initialPermissionsMap),
    [initialPermissionsMap, rolePermissions]
  );

  const activePermissionsCount = useMemo(
    () => countActivePermissions(rolePermissions),
    [rolePermissions]
  );

  const groupedPermissions = useMemo(
    () =>
      groupPermissions({
        rolePermissions,
        permissionsSearch,
        permissionsFilter,
        initialPermissionsMap,
      }),
    [initialPermissionsMap, permissionsFilter, permissionsSearch, rolePermissions]
  );

  // Helper para construir el mapa inicial de permisos de reportes
  const buildInitialReportPermissionsMap = useCallback(
    (permissions: ReporteRolePermission[]) => {
      return Object.fromEntries(
        permissions.map((permission) => [permission.reporteId, permission.hasAccess])
      );
    },
    []
  );

  // Helper para verificar si un permiso de reporte ha cambiado
  const isReportPermissionChanged = useCallback(
    (permission: ReporteRolePermission, initialMap: Record<number, boolean>) => {
      return (initialMap[permission.reporteId] ?? false) !== permission.hasAccess;
    },
    []
  );

  // Helper para contar cambios pendientes en permisos de reportes
  const countPendingReportPermissionChanges = useCallback(
    (permissions: ReporteRolePermission[], initialMap: Record<number, boolean>) => {
      return permissions.filter((permission) =>
        isReportPermissionChanged(permission, initialMap)
      ).length;
    },
    [isReportPermissionChanged]
  );

  // Filtrar reportes por búsqueda
  const filteredReportPermissions = useMemo(() => {
    const search = reportSearch.trim().toLowerCase();
    if (!search) return roleReportPermissions;

    return roleReportPermissions.filter(
      (report) =>
        report.nombre.toLowerCase().includes(search) ||
        report.descripcion?.toLowerCase().includes(search) ||
        report.tipo.toLowerCase().includes(search)
    );
  }, [roleReportPermissions, reportSearch]);

  // Calcular cambios pendientes en permisos de reportes
  const pendingReportChangesCount = useMemo(
    () => countPendingReportPermissionChanges(roleReportPermissions, initialReportPermissionsMap),
    [countPendingReportPermissionChanges, roleReportPermissions, initialReportPermissionsMap]
  );

  const loadRoles = useCallback(async (roleIdToSync?: number | null) => {
    const response = await listarRoles();
    if (response?.success) {
      const nextRoles: ParametrizacionRole[] = response.data ?? [];
      setRoles(nextRoles);

      if (roleIdToSync) {
        const updatedSelectedRole = nextRoles.find((role) => role.roleId === roleIdToSync);
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
  }, [listarRoles]);

  const loadPermissions = useCallback(
    async (roleId: number) => {
      try {
        setIsLoadingPermissions(true);
        const response = await obtenerPermisosRol(roleId);

        if (response?.success) {
          const nextPermissions: ParametrizacionRolePermission[] = response.data ?? [];
          setRolePermissions(nextPermissions);
          setInitialPermissionsMap(buildInitialPermissionsMap(nextPermissions));
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

  const loadReportPermissions = useCallback(
    async (roleId: number) => {
      try {
        setIsLoadingReportPermissions(true);
        const response = await obtenerPermisosReportesRol(roleId);

        if (response?.success) {
          const nextReportPermissions: ReporteRolePermission[] = response.data ?? [];
          setRoleReportPermissions(nextReportPermissions);
          setInitialReportPermissionsMap(buildInitialReportPermissionsMap(nextReportPermissions));
          return;
        }

        toast.error(response?.message || "No fue posible cargar permisos de reportes del rol");
      } finally {
        setIsLoadingReportPermissions(false);
      }
    },
    [obtenerPermisosReportesRol, buildInitialReportPermissionsMap]
  );

  useEffect(() => {
    void loadRoles(null);
  }, [loadRoles]);

  const confirmarDescartarCambios = useCallback(() => {
    if (pendingChangesCount === 0 && pendingReportChangesCount === 0) {
      return true;
    }

    return window.confirm(
      "Tienes cambios sin guardar. Si continuas, se perderan. Deseas continuar?"
    );
  }, [pendingChangesCount, pendingReportChangesCount]);

  const handleSelectRole = useCallback(
    async (role: ParametrizacionRole) => {
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
      setReportSearch("");
      setActiveTab('permisos');
      await Promise.all([
        loadPermissions(role.roleId),
        loadReportPermissions(role.roleId)
      ]);
    },
    [confirmarDescartarCambios, loadPermissions, loadReportPermissions, selectedRoleId]
  );

  const handleNewRole = useCallback(() => {
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
    setRoleReportPermissions([]);
    setInitialReportPermissionsMap({});
    setReportSearch("");
    setActiveTab('permisos');
  }, [confirmarDescartarCambios]);

  const handleSaveRole = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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

          const responseRole = response.data as ParametrizacionRole | undefined;
          await loadRoles(responseRole?.roleId ?? selectedRoleId);
          if (responseRole?.roleId) {
            await handleSelectRole(responseRole);
          }

          return;
        }

        toast.error(response?.message || "No fue posible guardar el rol");
      } finally {
        setIsSubmittingRole(false);
      }
    },
    [
      actualizarRol,
      canCreate,
      canEdit,
      crearRol,
      handleSelectRole,
      loadRoles,
      roleName,
      selectedRoleId,
    ]
  );

  const handleDeleteRole = useCallback(async () => {
    if (!selectedRoleId) {
      return;
    }

    if (!canDelete) {
      toast.error("No tienes permisos para eliminar roles");
      return;
    }

    const confirmed = window.confirm(
      "Esta accion eliminara el rol seleccionado. Deseas continuar?"
    );
    if (!confirmed) {
      return;
    }

    const response = await eliminarRol(selectedRoleId);
    if (response?.success) {
      toast.success(response.message || "Rol eliminado exitosamente");
      handleNewRole();
      await loadRoles(null);
      return;
    }

    toast.error(response?.message || "No fue posible eliminar el rol");
  }, [canDelete, eliminarRol, handleNewRole, loadRoles, selectedRoleId]);

  const togglePermission = useCallback(
    (targetPermission: ParametrizacionRolePermission) => {
      setRolePermissions((prev) => togglePermissionAccess(prev, targetPermission));
    },
    []
  );

  const aplicarPresetMenu = useCallback((menuId: number, preset: PresetPermisos) => {
    setRolePermissions((prev) => applyPresetToMenu(prev, menuId, preset));
  }, []);

  const aplicarPresetGlobal = useCallback((preset: PresetPermisos) => {
    setRolePermissions((prev) => applyGlobalPreset(prev, preset));
  }, []);

  const descartarCambios = useCallback(() => {
    setRolePermissions((prev) => discardPermissionChanges(prev, initialPermissionsMap));
  }, [initialPermissionsMap]);

  const toggleMenuCollapsed = useCallback((menuId: number) => {
    setCollapsedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  }, []);

  // Togglear permiso de reporte
  const toggleReportPermission = useCallback(
    (targetPermission: ReporteRolePermission) => {
      setRoleReportPermissions((prev) =>
        prev.map((perm) =>
          perm.reporteId === targetPermission.reporteId
            ? { ...perm, hasAccess: !perm.hasAccess }
            : perm
        )
      );
    },
    []
  );

  // Aplicar preset a reportes (todos o ninguno)
  const applyReportPreset = useCallback(
    (preset: 'todos' | 'ninguno') => {
      setRoleReportPermissions((prev) =>
        prev.map((perm) => ({
          ...perm,
          hasAccess: preset === 'todos',
        }))
      );
    },
    []
  );

  // Descartar cambios en permisos de reportes
  const discardReportChanges = useCallback(() => {
    setRoleReportPermissions((prev) =>
      prev.map((perm) => ({
        ...perm,
        hasAccess: initialReportPermissionsMap[perm.reporteId] ?? false,
      }))
    );
  }, [initialReportPermissionsMap]);

  const handleSavePermissions = useCallback(async () => {
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
  }, [
    actualizarPermisosRol,
    canEditPermissions,
    loadPermissions,
    rolePermissions,
    selectedRoleId,
  ]);

  // Guardar permisos de reportes
  const handleSaveReportPermissions = useCallback(async () => {
    if (!selectedRoleId) {
      toast.error("Selecciona un rol para actualizar permisos de reportes");
      return;
    }

    if (!canEditPermissions) {
      toast.error("No tienes permisos para actualizar permisos de rol");
      return;
    }

    const reportesIds = roleReportPermissions
      .filter((permission) => permission.hasAccess)
      .map((permission) => permission.reporteId);

    try {
      setIsSavingReportPermissions(true);
      const response = await actualizarPermisosReportesRol(selectedRoleId, reportesIds);
      if (response?.success) {
        toast.success(response.message || "Permisos de reportes actualizados exitosamente");
        await loadReportPermissions(selectedRoleId);
        return;
      }

      toast.error(response?.message || "No fue posible actualizar los permisos de reportes");
    } finally {
      setIsSavingReportPermissions(false);
    }
  }, [
    actualizarPermisosReportesRol,
    canEditPermissions,
    loadReportPermissions,
    roleReportPermissions,
    selectedRoleId,
  ]);

  return {
    canCreate,
    canEdit,
    canDelete,
    canEditPermissions,
    loading,
    roles,
    selectedRoleId,
    selectedRole,
    roleName,
    roleSearch,
    permissionsSearch,
    permissionsFilter,
    rolePermissions,
    initialPermissionsMap,
    collapsedMenus,
    isLoadingPermissions,
    isSubmittingRole,
    isSavingPermissions,
    filteredRoles,
    pendingChangesCount,
    activePermissionsCount,
    groupedPermissions,
    filtroPermisosOptions: FILTRO_PERMISOS_OPTIONS,
    presetPermisosOptions: PRESET_PERMISOS_OPTIONS,
    setRoleName,
    setRoleSearch,
    setPermissionsSearch,
    setPermissionsFilter,
    handleSelectRole,
    handleNewRole,
    handleSaveRole,
    handleDeleteRole,
    togglePermission,
    aplicarPresetMenu,
    aplicarPresetGlobal,
    descartarCambios,
    toggleMenuCollapsed,
    handleSavePermissions,
    isPermissionChanged: (permission: ParametrizacionRolePermission) =>
      isPermissionChanged(permission, initialPermissionsMap),
    // Nuevos para permisos de reportes
    activeTab,
    setActiveTab,
    roleReportPermissions,
    initialReportPermissionsMap,
    filteredReportPermissions,
    reportSearch,
    setReportSearch,
    isLoadingReportPermissions,
    isSavingReportPermissions,
    pendingReportChangesCount,
    toggleReportPermission,
    applyReportPreset,
    discardReportChanges,
    handleSaveReportPermissions,
    isReportPermissionChanged: (permission: ReporteRolePermission) =>
      isReportPermissionChanged(permission, initialReportPermissionsMap),
  };
}
