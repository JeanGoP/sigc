import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";
import { SecurityMenuItem } from "@app/store/reducers/security";

export interface SecurityMeData {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  tenantId: string;
  mustChangePassword: boolean;
  telephonyEnabled: boolean;
  menuTree: SecurityMenuItem[];
  permissions: string[];
  reportesPermitidos?: string[]; // Códigos de reportes a los que tiene acceso el usuario
}

export function useSecurityService() {
  const { loading, error, request } = useApi<SecurityMeData>("/api/v1", {
    timeout: 8000,
    retries: 1,
    retryDelay: 800,
    logoutOn401: true,
  });

  const getSecurityMe = useCallback(async () => {
    return request({
      method: "GET",
      url: "/security/me",
    });
  }, [request]);

  return { loading, error, getSecurityMe };
}
