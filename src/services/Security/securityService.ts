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
  menuTree: SecurityMenuItem[];
  permissions: string[];
}

export function useSecurityService() {
  const { loading, error, request } = useApi<SecurityMeData>("/api/v1", {
    timeout: 8000,
    retries: 1,
    retryDelay: 800,
  });

  const getSecurityMe = useCallback(async () => {
    return request({
      method: "GET",
      url: "/security/me",
    });
  }, [request]);

  return { loading, error, getSecurityMe };
}
