import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import type {
  ParametrizacionRole,
  ParametrizacionRolePermission,
} from "@app/services/Parametrizacion/types";
import type { FiltroPermisos, GrupoPermisos, PresetPermisos } from "../domain/types";
import PermissionGroupCard from "./PermissionGroupCard";

interface PermissionsCardProps {
  selectedRoleId: number | null;
  selectedRole: ParametrizacionRole | null;
  permissionsSearch: string;
  permissionsFilter: FiltroPermisos;
  groupedPermissions: GrupoPermisos[];
  collapsedMenus: Record<number, boolean>;
  isLoadingPermissions: boolean;
  canEditPermissions: boolean;
  activePermissionsCount: number;
  pendingChangesCount: number;
  totalPermissions: number;
  isSavingPermissions: boolean;
  filtroPermisosOptions: Array<{ value: FiltroPermisos; label: string }>;
  presetPermisosOptions: Array<{ value: PresetPermisos; label: string }>;
  onPermissionsSearchChange: (value: string) => void;
  onPermissionsFilterChange: (value: FiltroPermisos) => void;
  onAplicarPresetGlobal: (preset: PresetPermisos) => void;
  onAplicarPresetMenu: (menuId: number, preset: PresetPermisos) => void;
  onToggleMenuCollapsed: (menuId: number) => void;
  onTogglePermission: (permission: ParametrizacionRolePermission) => void;
  onDescartarCambios: () => void;
  onSavePermissions: () => void;
  isPermissionChanged: (permission: ParametrizacionRolePermission) => boolean;
}

export default function PermissionsCard({
  selectedRoleId,
  selectedRole,
  permissionsSearch,
  permissionsFilter,
  groupedPermissions,
  collapsedMenus,
  isLoadingPermissions,
  canEditPermissions,
  activePermissionsCount,
  pendingChangesCount,
  totalPermissions,
  isSavingPermissions,
  filtroPermisosOptions,
  presetPermisosOptions,
  onPermissionsSearchChange,
  onPermissionsFilterChange,
  onAplicarPresetGlobal,
  onAplicarPresetMenu,
  onToggleMenuCollapsed,
  onTogglePermission,
  onDescartarCambios,
  onSavePermissions,
  isPermissionChanged,
}: PermissionsCardProps) {
  return (
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
            {presetPermisosOptions.map((preset) => (
              <Button
                key={preset.value}
                size="sm"
                variant="outline-secondary"
                disabled={!selectedRoleId || !canEditPermissions}
                onClick={() => onAplicarPresetGlobal(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <Row className="mt-2">
          <Col md={8}>
            <Form.Control
              value={permissionsSearch}
              onChange={(event) => onPermissionsSearchChange(event.target.value)}
              placeholder="Buscar por modulo, accion o codigo"
              disabled={!selectedRoleId}
            />
          </Col>
          <Col md={4} className="mt-2 mt-md-0">
            <Form.Control
              as="select"
              value={permissionsFilter}
              onChange={(event) => onPermissionsFilterChange(event.target.value as FiltroPermisos)}
              disabled={!selectedRoleId}
            >
              {filtroPermisosOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
          groupedPermissions.map((group) => (
            <PermissionGroupCard
              key={group.menuId}
              group={group}
              isCollapsed={collapsedMenus[group.menuId] ?? false}
              canEditPermissions={canEditPermissions}
              presetPermisosOptions={presetPermisosOptions}
              onAplicarPresetMenu={onAplicarPresetMenu}
              onToggleMenuCollapsed={onToggleMenuCollapsed}
              onTogglePermission={onTogglePermission}
              isPermissionChanged={isPermissionChanged}
            />
          ))
        )}
      </Card.Body>

      <Card.Footer className="bg-white border-top">
        <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 8 }}>
          <div>
            <div style={{ fontWeight: 600 }}>
              Activos: {activePermissionsCount}/{totalPermissions} | Cambios pendientes: {pendingChangesCount}
            </div>
            <small className="text-muted">
              Al guardar permisos se cerraran las sesiones activas de usuarios con este rol.
            </small>
          </div>

          <div className="d-flex" style={{ gap: 6 }}>
            <Button
              variant="outline-secondary"
              onClick={onDescartarCambios}
              disabled={!selectedRoleId || pendingChangesCount === 0 || !canEditPermissions}
            >
              Descartar
            </Button>
            <Button
              variant="dark"
              onClick={onSavePermissions}
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
  );
}
