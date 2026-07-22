export const normalizePermissionCode = (permissionCode: string): string => {
  return permissionCode.trim().toLowerCase();
};

export const can = (
  permissions: readonly string[] | null | undefined,
  permissionCode: string
): boolean => {
  if (!permissions || permissions.length === 0 || !permissionCode) {
    return false;
  }

  const normalizedTarget = normalizePermissionCode(permissionCode);

  if (!normalizedTarget) {
    return false;
  }

  return permissions.some(
    (permission) => normalizePermissionCode(permission) === normalizedTarget
  );
};

/**
 * Verifica si un usuario tiene acceso a un reporte específico
 * @param reportesPermitidos Lista de códigos de reportes permitidos
 * @param codigoReporte Código del reporte a verificar
 * @returns true si tiene acceso, false en caso contrario
 */
export const canAccessReporte = (
  reportesPermitidos: readonly string[] | null | undefined,
  codigoReporte: string
): boolean => {
  if (!reportesPermitidos || reportesPermitidos.length === 0 || !codigoReporte) {
    return false;
  }

  const normalizedCodigo = codigoReporte.trim().toLowerCase();

  return reportesPermitidos.some(
    (codigo) => codigo.trim().toLowerCase() === normalizedCodigo
  );
};
