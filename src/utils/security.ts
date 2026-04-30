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
