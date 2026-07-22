import React from "react";
import type { ReporteRolePermission } from "@app/services/Parametrizacion/types";

interface ReportPermissionsCardProps {
  selectedRoleId: number | null;
  reportPermissions: ReporteRolePermission[];
  filteredReportPermissions: ReporteRolePermission[];
  reportSearch: string;
  isLoading: boolean;
  canEditPermissions: boolean;
  pendingChangesCount: number;
  isSaving: boolean;
  onReportSearchChange: (value: string) => void;
  onTogglePermission: (permission: ReporteRolePermission) => void;
  onApplyPreset: (preset: 'todos' | 'ninguno') => void;
  onDiscardChanges: () => void;
  onSavePermissions: () => void;
  isPermissionChanged: (permission: ReporteRolePermission) => boolean;
}

const ReportPermissionsCard: React.FC<ReportPermissionsCardProps> = ({
  selectedRoleId,
  reportPermissions,
  filteredReportPermissions,
  reportSearch,
  isLoading,
  canEditPermissions,
  pendingChangesCount,
  isSaving,
  onReportSearchChange,
  onTogglePermission,
  onApplyPreset,
  onDiscardChanges,
  onSavePermissions,
  isPermissionChanged,
}) => {
  // Agrupar reportes por tipo
  const groupedReports = React.useMemo(() => {
    const groups: Record<string, ReporteRolePermission[]> = {};
    filteredReportPermissions.forEach((report) => {
      if (!groups[report.tipo]) {
        groups[report.tipo] = [];
      }
      groups[report.tipo].push(report);
    });
    return groups;
  }, [filteredReportPermissions]);

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="fas fa-file-alt mr-2"></i>
          Permisos de Reportes
        </h5>
      </div>
      <div className="card-body">
        {!selectedRoleId ? (
          <p className="text-muted text-center py-5">
            Selecciona un rol para gestionar sus permisos de reportes.
          </p>
        ) : isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Cargando...</span>
            </div>
            <p className="mt-3 text-muted">Cargando permisos de reportes...</p>
          </div>
        ) : reportPermissions.length === 0 ? (
          <p className="text-muted text-center py-5">
            No hay reportes configurados en el sistema.
          </p>
        ) : (
          <>
            {/* Barra de búsqueda y botones de preset */}
            <div className="mb-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Buscar reportes..."
                    value={reportSearch}
                    onChange={(e) => onReportSearchChange(e.target.value)}
                  />
                </div>
                <div className="col-md-6 d-flex gap-2 justify-content-end">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    disabled={!canEditPermissions}
                    onClick={() => onApplyPreset('todos')}
                  >
                    <i className="fas fa-check-double mr-1"></i>
                    Todos
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    disabled={!canEditPermissions}
                    onClick={() => onApplyPreset('ninguno')}
                  >
                    <i className="fas fa-times mr-1"></i>
                    Ninguno
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de reportes agrupados */}
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {Object.keys(groupedReports).length === 0 ? (
                <p className="text-muted text-center py-3">
                  No hay reportes que coincidan con la búsqueda.
                </p>
              ) : (
                Object.entries(groupedReports).map(([tipo, reportes]) => (
                  <div key={tipo} className="mb-4">
                    <h6 className="text-muted text-uppercase small mb-2">
                      {tipo}
                    </h6>
                    <div className="list-group">
                      {reportes.map((report) => (
                        <button
                          key={report.reporteId}
                          type="button"
                          className={`list-group-item list-group-item-action d-flex align-items-center gap-3 ${
                            isPermissionChanged(report) ? 'list-group-item-warning' : ''
                          }`}
                          disabled={!canEditPermissions}
                          onClick={() => onTogglePermission(report)}
                        >
                          <div className="flex-shrink-0">
                            <i className={report.iconClass || 'fas fa-file'}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-semibold small">{report.nombre}</div>
                            {report.descripcion && (
                              <small className="text-muted">{report.descripcion}</small>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <div
                              className={`form-check form-switch m-0 ${
                                report.hasAccess ? 'text-success' : 'text-muted'
                              }`}
                            >
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={report.hasAccess}
                                onChange={() => onTogglePermission(report)}
                                disabled={!canEditPermissions}
                              />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Botones de acción */}
            <div className="mt-4 pt-3 border-top d-flex gap-2 justify-content-end">
              {pendingChangesCount > 0 && (
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={!canEditPermissions || isSaving}
                  onClick={onDiscardChanges}
                >
                  <i className="fas fa-undo mr-1"></i>
                  Descartar ({pendingChangesCount})
                </button>
              )}
              <button
                className="btn btn-primary btn-sm"
                disabled={
                  !canEditPermissions || isSaving || pendingChangesCount === 0
                }
                onClick={onSavePermissions}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-1"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-1"></i>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportPermissionsCard;
