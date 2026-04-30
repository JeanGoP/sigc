import type {
  ParametrizacionRole,
  ParametrizacionRolePermission,
} from "@app/services/Parametrizacion/types";
import { ORDEN_ACCIONES } from "./constants";
import type { FiltroPermisos, GrupoPermisos, PresetPermisos } from "./types";

export function filterRoles(
  roles: ParametrizacionRole[],
  roleSearch: string
): ParametrizacionRole[] {
  const search = roleSearch.trim().toLowerCase();
  if (!search) {
    return roles;
  }

  return roles.filter((role) => role.roleName.toLowerCase().includes(search));
}

export function buildInitialPermissionsMap(
  permissions: ParametrizacionRolePermission[]
): Record<number, boolean> {
  return Object.fromEntries(
    permissions.map((permission) => [permission.actionId, permission.isAllowed])
  );
}

export function isPermissionChanged(
  permission: ParametrizacionRolePermission,
  initialPermissionsMap: Record<number, boolean>
): boolean {
  return (initialPermissionsMap[permission.actionId] ?? false) !== permission.isAllowed;
}

export function countPendingPermissionChanges(
  permissions: ParametrizacionRolePermission[],
  initialPermissionsMap: Record<number, boolean>
): number {
  return permissions.filter((permission) =>
    isPermissionChanged(permission, initialPermissionsMap)
  ).length;
}

export function countActivePermissions(
  permissions: ParametrizacionRolePermission[]
): number {
  return permissions.filter((permission) => permission.isAllowed).length;
}

export function groupPermissions(input: {
  rolePermissions: ParametrizacionRolePermission[];
  permissionsSearch: string;
  permissionsFilter: FiltroPermisos;
  initialPermissionsMap: Record<number, boolean>;
}): GrupoPermisos[] {
  const { rolePermissions, permissionsSearch, permissionsFilter, initialPermissionsMap } = input;
  const groups: Record<number, GrupoPermisos> = {};
  const search = permissionsSearch.trim().toLowerCase();

  for (const permission of rolePermissions) {
    const matchesSearch =
      !search
      || permission.menuName.toLowerCase().includes(search)
      || permission.actionName.toLowerCase().includes(search)
      || permission.permissionCode.toLowerCase().includes(search);

    if (!matchesSearch) {
      continue;
    }

    const changed = isPermissionChanged(permission, initialPermissionsMap);
    const matchesFilter =
      permissionsFilter === "todos"
      || (permissionsFilter === "activos" && permission.isAllowed)
      || (permissionsFilter === "cambios" && changed);

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
}

export function togglePermissionAccess(
  permissions: ParametrizacionRolePermission[],
  targetPermission: ParametrizacionRolePermission
): ParametrizacionRolePermission[] {
  const isTurningOn = !targetPermission.isAllowed;

  if (targetPermission.actionKey === "view") {
    if (isTurningOn) {
      return permissions.map((permission) =>
        permission.actionId === targetPermission.actionId
          ? { ...permission, isAllowed: true }
          : permission
      );
    }

    return permissions.map((permission) =>
      permission.menuId === targetPermission.menuId
        ? { ...permission, isAllowed: false }
        : permission
    );
  }

  if (isTurningOn) {
    return permissions.map((permission) => {
      if (permission.actionId === targetPermission.actionId) {
        return { ...permission, isAllowed: true };
      }

      if (permission.menuId === targetPermission.menuId && permission.actionKey === "view") {
        return { ...permission, isAllowed: true };
      }

      return permission;
    });
  }

  return permissions.map((permission) =>
    permission.actionId === targetPermission.actionId
      ? { ...permission, isAllowed: false }
      : permission
  );
}

export function applyPresetToMenu(
  permissions: ParametrizacionRolePermission[],
  menuId: number,
  preset: PresetPermisos
): ParametrizacionRolePermission[] {
  return permissions.map((permission) => {
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
  });
}

export function applyGlobalPreset(
  permissions: ParametrizacionRolePermission[],
  preset: PresetPermisos
): ParametrizacionRolePermission[] {
  return permissions.map((permission) => {
    if (preset === "todos") {
      return { ...permission, isAllowed: true };
    }

    if (preset === "ninguno") {
      return { ...permission, isAllowed: false };
    }

    return { ...permission, isAllowed: permission.actionKey === "view" };
  });
}

export function discardPermissionChanges(
  permissions: ParametrizacionRolePermission[],
  initialPermissionsMap: Record<number, boolean>
): ParametrizacionRolePermission[] {
  return permissions.map((permission) => ({
    ...permission,
    isAllowed: initialPermissionsMap[permission.actionId] ?? false,
  }));
}
