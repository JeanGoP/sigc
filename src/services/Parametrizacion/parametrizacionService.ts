import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";

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

export function useParametrizacionService() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 10000,
    retries: 0,
    retryDelay: 1000,
  });

  const listarUsuarios = useCallback(() => {
    return request({
      url: "/parametrizacion/usuarios",
      method: "GET",
    });
  }, [request]);

  const crearUsuario = useCallback(
    (data: SaveUserPayload) => {
      return request({
        url: "/parametrizacion/usuarios",
        method: "POST",
        data,
      });
    },
    [request]
  );

  const actualizarUsuario = useCallback(
    (userId: number, data: SaveUserPayload) => {
      return request({
        url: `/parametrizacion/usuarios/${userId}`,
        method: "PUT",
        data,
      });
    },
    [request]
  );

  const cambiarEstadoUsuario = useCallback(
    (userId: number, isActive: boolean) => {
      return request({
        url: `/parametrizacion/usuarios/${userId}/estado`,
        method: "PATCH",
        data: { isActive },
      });
    },
    [request]
  );

  const cambiarPasswordUsuario = useCallback(
    (userId: number, newPassword: string) => {
      return request({
        url: `/parametrizacion/usuarios/${userId}/change-password`,
        method: "POST",
        data: { newPassword },
      });
    },
    [request]
  );

  const listarRoles = useCallback(() => {
    return request({
      url: "/parametrizacion/roles",
      method: "GET",
    });
  }, [request]);

  const crearRol = useCallback(
    (roleName: string) => {
      return request({
        url: "/parametrizacion/roles",
        method: "POST",
        data: { roleName },
      });
    },
    [request]
  );

  const actualizarRol = useCallback(
    (roleId: number, roleName: string) => {
      return request({
        url: `/parametrizacion/roles/${roleId}`,
        method: "PUT",
        data: { roleName },
      });
    },
    [request]
  );

  const eliminarRol = useCallback(
    (roleId: number) => {
      return request({
        url: `/parametrizacion/roles/${roleId}`,
        method: "DELETE",
      });
    },
    [request]
  );

  const obtenerPermisosRol = useCallback(
    (roleId: number) => {
      return request({
        url: `/parametrizacion/roles/${roleId}/permisos`,
        method: "GET",
      });
    },
    [request]
  );

  const actualizarPermisosRol = useCallback(
    (roleId: number, actionIds: number[]) => {
      return request({
        url: `/parametrizacion/roles/${roleId}/permisos`,
        method: "PUT",
        data: { actionIds },
      });
    },
    [request]
  );

  return {
    loading,
    error,
    listarUsuarios,
    crearUsuario,
    actualizarUsuario,
    cambiarEstadoUsuario,
    cambiarPasswordUsuario,
    listarRoles,
    crearRol,
    actualizarRol,
    eliminarRol,
    obtenerPermisosRol,
    actualizarPermisosRol,
  };
}
