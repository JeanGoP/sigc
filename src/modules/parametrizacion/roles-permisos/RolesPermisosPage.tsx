import { Col, Row } from "react-bootstrap";
import { useRolesPermisosPage } from "./hooks/useRolesPermisosPage";
import PermissionsCard from "./ui/PermissionsCard";
import RolesSidebarCard from "./ui/RolesSidebarCard";

const RolesPermisosPage = () => {
  const {
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
    collapsedMenus,
    isLoadingPermissions,
    isSubmittingRole,
    isSavingPermissions,
    filteredRoles,
    pendingChangesCount,
    activePermissionsCount,
    groupedPermissions,
    filtroPermisosOptions,
    presetPermisosOptions,
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
    isPermissionChanged,
  } = useRolesPermisosPage();

  return (
    <Row className="mt-3">
      <Col lg={4}>
        <RolesSidebarCard
          loading={loading}
          roles={roles}
          filteredRoles={filteredRoles}
          selectedRoleId={selectedRoleId}
          roleName={roleName}
          roleSearch={roleSearch}
          isSubmittingRole={isSubmittingRole}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          onRoleNameChange={setRoleName}
          onRoleSearchChange={setRoleSearch}
          onSelectRole={handleSelectRole}
          onNewRole={handleNewRole}
          onSaveRole={handleSaveRole}
          onDeleteRole={handleDeleteRole}
        />
      </Col>

      <Col lg={8} className="mt-3 mt-lg-0">
        <PermissionsCard
          selectedRoleId={selectedRoleId}
          selectedRole={selectedRole}
          permissionsSearch={permissionsSearch}
          permissionsFilter={permissionsFilter}
          groupedPermissions={groupedPermissions}
          collapsedMenus={collapsedMenus}
          isLoadingPermissions={isLoadingPermissions}
          canEditPermissions={canEditPermissions}
          activePermissionsCount={activePermissionsCount}
          pendingChangesCount={pendingChangesCount}
          totalPermissions={rolePermissions.length}
          isSavingPermissions={isSavingPermissions}
          filtroPermisosOptions={filtroPermisosOptions}
          presetPermisosOptions={presetPermisosOptions}
          onPermissionsSearchChange={setPermissionsSearch}
          onPermissionsFilterChange={setPermissionsFilter}
          onAplicarPresetGlobal={aplicarPresetGlobal}
          onAplicarPresetMenu={aplicarPresetMenu}
          onToggleMenuCollapsed={toggleMenuCollapsed}
          onTogglePermission={togglePermission}
          onDescartarCambios={descartarCambios}
          onSavePermissions={handleSavePermissions}
          isPermissionChanged={isPermissionChanged}
        />
      </Col>
    </Row>
  );
};

export default RolesPermisosPage;
