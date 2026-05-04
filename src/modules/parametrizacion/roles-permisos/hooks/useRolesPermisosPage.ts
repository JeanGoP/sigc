import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { can } from "@app/utils/security";
import { useAppSelector } from "@app/store/store";
import { useParametrizacionService } from "@app/services/Parametrizacion/parametrizacionService";
import type {
  ParametrizacionRole,
  ParametrizacionRolePermission,
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

  useEffect(() => {
    void loadRoles(null);
  }, [loadRoles]);

  const confirmarDescartarCambios = useCallback(() => {
    if (pendingChangesCount === 0) {
      return true;
    }

    return window.confirm(
      "Tienes cambios sin guardar. Si continuas, se perderan. Deseas continuar?"
    );
  }, [pendingChangesCount]);

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
      await loadPermissions(role.roleId);
    },
    [confirmarDescartarCambios, loadPermissions, selectedRoleId]
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
  };
}
