import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";

interface ChangeOwnPasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function useChangePasswordService() {
  const { loading, error, request } = useApi<null>("/api/v1", {
    timeout: 10000,
    retries: 0,
    retryDelay: 1000,
  });

  const changeOwnPassword = useCallback(
    (payload: ChangeOwnPasswordPayload) => {
      return request({
        url: "/users/me/change-password",
        method: "POST",
        data: payload,
      });
    },
    [request]
  );

  return {
    loading,
    error,
    changeOwnPassword,
  };
}
