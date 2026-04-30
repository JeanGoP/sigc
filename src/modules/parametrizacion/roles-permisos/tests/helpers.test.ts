import {
  applyPresetToMenu,
  buildInitialPermissionsMap,
  countPendingPermissionChanges,
  groupPermissions,
  togglePermissionAccess,
} from "../domain/helpers";

const permissions = [
  {
    actionId: 1,
    menuId: 10,
    menuKey: "usuarios",
    menuName: "Usuarios",
    sortOrder: 1,
    actionKey: "view",
    actionName: "Ver",
    permissionCode: "usuarios.view",
    isAllowed: false,
  },
  {
    actionId: 2,
    menuId: 10,
    menuKey: "usuarios",
    menuName: "Usuarios",
    sortOrder: 1,
    actionKey: "edit",
    actionName: "Editar",
    permissionCode: "usuarios.edit",
    isAllowed: false,
  },
  {
    actionId: 3,
    menuId: 20,
    menuKey: "roles",
    menuName: "Roles",
    sortOrder: 2,
    actionKey: "view",
    actionName: "Ver",
    permissionCode: "roles.view",
    isAllowed: true,
  },
];

describe("roles permisos helpers", () => {
  it("builds the initial permissions map", () => {
    expect(buildInitialPermissionsMap(permissions)).toEqual({
      1: false,
      2: false,
      3: true,
    });
  });

  it("enables view when a non-view permission is enabled", () => {
    const next = togglePermissionAccess(permissions, permissions[1]);

    expect(next.find((p) => p.actionKey === "view" && p.menuId === 10)?.isAllowed)
      .toBe(true);
    expect(next.find((p) => p.actionKey === "edit" && p.menuId === 10)?.isAllowed)
      .toBe(true);
  });

  it("disables all permissions from a menu when view is disabled", () => {
    const enabled = applyPresetToMenu(permissions, 10, "todos");
    const next = togglePermissionAccess(enabled, enabled[0]);

    expect(next.filter((p) => p.menuId === 10).every((p) => !p.isAllowed)).toBe(true);
  });

  it("groups and filters changed permissions", () => {
    const initialMap = buildInitialPermissionsMap(permissions);
    const changed = togglePermissionAccess(permissions, permissions[1]);
    const groups = groupPermissions({
      rolePermissions: changed,
      permissionsSearch: "",
      permissionsFilter: "cambios",
      initialPermissionsMap: initialMap,
    });

    expect(countPendingPermissionChanges(changed, initialMap)).toBe(2);
    expect(groups).toHaveLength(1);
    expect(groups[0].menuKey).toBe("usuarios");
  });
});
