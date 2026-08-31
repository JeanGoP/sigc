import { useState } from "react";
import { Col, Row, Nav } from "react-bootstrap";
import { useAppSelector } from "@app/store/store";
import { useRolesPermisosPage } from "./hooks/useRolesPermisosPage";
import PermissionsCard from "./ui/PermissionsCard";
import RolesSidebarCard from "./ui/RolesSidebarCard";
import ReportPermissionsCard from "./ui/ReportPermissionsCard";

const RolesPermisosPage = () => {
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const isMobile = screenSize === "xs";
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

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
    // Nuevos para reportes
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
    isReportPermissionChanged,
  } = useRolesPermisosPage();

  const effectiveMobileView = selectedRoleId ? mobileView : "list";

  const handleSelectRoleMobile: typeof handleSelectRole = (role) => {
    const selection = handleSelectRole(role);
    if (isMobile) setMobileView("detail");
    return selection;
  };

  return (
    <Row className="mt-3">
      {(!isMobile || effectiveMobileView === "list") && (
        <Col xs={12} lg={4}>
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
            onSelectRole={handleSelectRoleMobile}
            onNewRole={handleNewRole}
            onSaveRole={handleSaveRole}
            onDeleteRole={handleDeleteRole}
          />
        </Col>
      )}

      {(!isMobile || effectiveMobileView === "detail") && (
      <Col xs={12} lg={8} className="mt-3 mt-lg-0">
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="btn btn-link px-0 mb-2"
            style={{ textDecoration: "none" }}
          >
            <i className="fas fa-arrow-left mr-2" />
            Volver a roles
          </button>
        )}
        {selectedRoleId && (
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'permisos'}
                onClick={() => setActiveTab('permisos')}
              >
                <i className="fas fa-key mr-2"></i>
                Permisos
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'reportes'}
                onClick={() => setActiveTab('reportes')}
              >
                <i className="fas fa-file-alt mr-2"></i>
                Reportes
                {pendingReportChangesCount > 0 && (
                  <span className="ml-2 badge bg-warning text-dark">
                    {pendingReportChangesCount}
                  </span>
                )}
              </Nav.Link>
            </Nav.Item>
          </Nav>
        )}

        {activeTab === 'permisos' && (
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
        )}

        {activeTab === 'reportes' && (
          <ReportPermissionsCard
            selectedRoleId={selectedRoleId}
            reportPermissions={roleReportPermissions}
            filteredReportPermissions={filteredReportPermissions}
            reportSearch={reportSearch}
            isLoading={isLoadingReportPermissions}
            canEditPermissions={canEditPermissions}
            pendingChangesCount={pendingReportChangesCount}
            isSaving={isSavingReportPermissions}
            onReportSearchChange={setReportSearch}
            onTogglePermission={toggleReportPermission}
            onApplyPreset={applyReportPreset}
            onDiscardChanges={discardReportChanges}
            onSavePermissions={handleSaveReportPermissions}
            isPermissionChanged={isReportPermissionChanged}
          />
        )}
      </Col>
      )}
    </Row>
  );
};

export default RolesPermisosPage;
