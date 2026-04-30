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
