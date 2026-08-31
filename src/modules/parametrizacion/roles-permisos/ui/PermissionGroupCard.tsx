import { Badge, Button, Form } from "react-bootstrap";
import type { ParametrizacionRolePermission } from "@app/services/Parametrizacion/types";
import type { GrupoPermisos, PresetPermisos } from "../domain/types";

interface PermissionGroupCardProps {
  group: GrupoPermisos;
  isCollapsed: boolean;
  canEditPermissions: boolean;
  presetPermisosOptions: Array<{ value: PresetPermisos; label: string }>;
  onAplicarPresetMenu: (menuId: number, preset: PresetPermisos) => void;
  onToggleMenuCollapsed: (menuId: number) => void;
  onTogglePermission: (permission: ParametrizacionRolePermission) => void;
  isPermissionChanged: (permission: ParametrizacionRolePermission) => boolean;
}

export default function PermissionGroupCard({
  group,
  isCollapsed,
  canEditPermissions,
  presetPermisosOptions,
  onAplicarPresetMenu,
  onToggleMenuCollapsed,
  onTogglePermission,
  isPermissionChanged,
}: PermissionGroupCardProps) {
  const allowedCount = group.rows.filter((permission) => permission.isAllowed).length;
  const changedCount = group.rows.filter((permission) => isPermissionChanged(permission)).length;

  return (
    <div className="border rounded mb-3 overflow-hidden">
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
          {presetPermisosOptions.map((preset) => (
            <Button
              key={preset.value}
              size="sm"
              variant="outline-primary"
              disabled={!canEditPermissions}
              onClick={() => onAplicarPresetMenu(group.menuId, preset.value)}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="light"
            onClick={() => onToggleMenuCollapsed(group.menuId)}
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
                className="d-flex flex-wrap justify-content-between align-items-center border rounded px-3 py-2 mb-2"
                style={{
                  gap: 8,
                  ...(changed
                    ? { borderColor: "#ffc107", backgroundColor: "#fffaf0" }
                    : undefined),
                }}
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
                  onChange={() => onTogglePermission(permission)}
                  disabled={!canEditPermissions}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
