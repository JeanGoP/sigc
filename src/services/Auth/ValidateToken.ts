import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";
import { User } from "@app/models/auth/User.model";

export type TokenPayload = {
  creado: string;
  email: string;
  expira: string;
  fullName: string | null;
  isActive: boolean;
  mustChangePassword?: boolean;
  telephonyEnabled?: boolean;
  role: string;
  tenantId?: string | null;
  token: string;
  userId: number;
  username: string;
};

type ValidateTokenData =
  | { token: TokenPayload }
  | {
      userId?: number;
      username?: string;
      fullName?: string;
      email?: string;
      role?: string;
      tenantId?: string;
      mustChangePassword?: boolean;
      telephonyEnabled?: boolean;
      expira?: string;
    }
  | { valid?: boolean }
  | null;

export const useSessionService = () => {
  const { request, loading, error } = useApi<ValidateTokenData>("/api/v1", {
    timeout: 8000,
    retries: 1,
    retryDelay: 800,
    logoutOn401: true,
  });

  const validateToken = useCallback(
    async (currentUser?: {
      id: string;
      username: string;
      fullName: string;
      email: string;
      role: string;
      token: string;
      tenantId?: string;
      mustChangePassword?: boolean;
      telephonyEnabled?: boolean;
    }): Promise<{
      valid: boolean;
      api: ApiResponse<ValidateTokenData> | null;
      user: User | null;
    }> => {
      const res = await request({
        url: "/validate-token",
        method: "GET",
      });

      if (!res?.success) {
        return { valid: false, api: res ?? null, user: null };
      }

      let finalUser: User | null = null;

      const tk = res.data && "token" in res.data ? res.data.token : undefined;
      if (tk) {
        finalUser = new User(
          tk.userId.toString(),
          tk.username,
          "",
          tk.fullName || "",
          tk.email,
          tk.role,
          tk.token,
          tk.tenantId || "",
          Boolean(tk.mustChangePassword),
          Boolean(tk.telephonyEnabled)
        );

        return { valid: true, api: res, user: finalUser };
      }

      if (res.data && "userId" in res.data && "username" in res.data && res.data.userId && res.data.username) {
        finalUser = new User(
          String(res.data.userId),
          String(res.data.username),
          "",
          String(res.data.fullName || currentUser?.fullName || ""),
          String(res.data.email || currentUser?.email || res.data.username),
          String(res.data.role || currentUser?.role || ""),
          currentUser?.token,
          String(res.data.tenantId || currentUser?.tenantId || ""),
          Boolean(res.data.mustChangePassword),
          Boolean(res.data.telephonyEnabled ?? currentUser?.telephonyEnabled)
        );

        return { valid: true, api: res, user: finalUser };
      }

      if (currentUser) {
        finalUser = new User(
          currentUser.id,
          currentUser.username,
          "",
          currentUser.fullName || "",
          currentUser.email,
          currentUser.role,
          currentUser.token,
          currentUser.tenantId || "",
          Boolean(currentUser.mustChangePassword),
          Boolean(currentUser.telephonyEnabled)
        );
      } else {
        try {
          const raw = localStorage.getItem("userAccess");
          if (raw) {
            const u = JSON.parse(raw);
            finalUser = new User(
              u.id,
              u.username,
              "",
              u.fullName || "",
              u.email || u.username,
              u.role,
              u.token,
              u.tenantId || "",
              Boolean(u.mustChangePassword),
              Boolean(u.telephonyEnabled)
            );
          }
        } catch {
          // ignore
        }
      }

      return { valid: true, api: res, user: finalUser };
    },
    [request]
  );

  const logout = useCallback(async () => {
    return request({
      url: "/logout",
      method: "POST",
    });
  }, [request]);

  return { validateToken, logout, loading, error };
};
