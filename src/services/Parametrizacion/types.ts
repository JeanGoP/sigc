export interface ParametrizacionUser {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt?: string | null;
  roleId?: number | null;
  roleName?: string;
}

export interface ParametrizacionRole {
  roleId: number;
  roleName: string;
}

export interface ParametrizacionRolePermission {
  actionId: number;
  menuId: number;
  menuKey: string;
  menuName: string;
  sortOrder: number;
  actionKey: string;
  actionName: string;
  permissionCode: string;
  isAllowed: boolean;
}

export interface SaveUserPayload {
  username: string;
  password?: string;
  fullName: string;
  email: string;
  roleId?: number | null;
  isActive: boolean;
}

// Tipo para la relación entre rol y reporte (permiso binario)
export interface ReporteRolePermission {
  reporteId: number;
  codigoReporte: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  iconClass: string | null;
  hasAccess: boolean; // true si el rol tiene acceso al reporte
}

// Tipo para actualizar permisos de reportes de un rol
export interface UpdateReportePermissionsPayload {
  reportesIds: number[]; // IDs de reportes a los que el rol tendrá acceso
}
