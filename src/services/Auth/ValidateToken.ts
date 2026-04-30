import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";
import { User } from "@app/models/auth/User.model";
import {
  AUTH_STORAGE_KEY,
  AuthUserLike,
  buildUserFromSessionData,
  buildUserFromTokenPayload,
  buildUserFromUserAccess,
  parseStoredUserAccess,
} from "@app/services/Auth/authStorage";

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
    async (currentUser?: AuthUserLike): Promise<{
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
        finalUser = buildUserFromTokenPayload(tk);

        return { valid: true, api: res, user: finalUser };
      }

      if (res.data && "userId" in res.data && "username" in res.data && res.data.userId && res.data.username) {
        finalUser = buildUserFromSessionData(res.data, currentUser);

        return { valid: true, api: res, user: finalUser };
      }

      if (currentUser) {
        finalUser = buildUserFromUserAccess(currentUser);
      } else {
        try {
          finalUser = buildUserFromUserAccess(
            parseStoredUserAccess(localStorage.getItem(AUTH_STORAGE_KEY))
          );
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
