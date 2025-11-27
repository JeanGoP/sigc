// src/services/session.service.ts
import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";
import { User } from "@app/models/auth/User.model";

/** Debe calzar con lo que devuelva tu backend. */
export type TokenPayload = {
  creado: string;
  email: string;
  expira: string;
  fullName: string | null;
  isActive: boolean;
  role: string;
  token: string;
  userId: number;
  username: string;
};

/** Algunas APIs solo devuelven success, otras devuelven el token; cubrimos ambos casos. */
type ValidateTokenData =
  | { token: TokenPayload }            // tu API puede devolver el token
  | { valid?: boolean }                // o solo un flag
  | null;

export const useSessionService = () => {
  const { request, loading, error } = useApi<ValidateTokenData>("/api/v1", {
    timeout: 8000,
    retries: 1,
    retryDelay: 800,
  });

  /**
   * Valida el token usando Authorization que ya inyecta useApi desde localStorage.userAccess.token.
   * Si recibes el user “actual” (por ejemplo, el que armaste desde localStorage),
   * te regreso también la instancia `User` para usar en Redux.
   */
  const validateToken = useCallback(
    async (currentUser?: {
      id: string;
      username: string;
      fullName: string;
      email: string;
      role: string;
      token: string;
    }): Promise<{
      valid: boolean;
      api: ApiResponse<ValidateTokenData> | null;
      user: User | null;
    }> => {
      const res = await request({
        url: "/validate-token",
        method: "GET",
      });

      // Caso feliz: success true
      if (res?.success) {
        // Si la API devolvió el token, podemos preferir sus campos; si no, usamos el currentUser/localStorage.
        const tk =
          (res.data && "token" in res.data ? res.data.token : undefined) ??
          undefined;

        let finalUser: User | null = null;

        if (tk) {
          finalUser = new User(
            tk.userId.toString(),
            tk.username,
            "",
            tk.fullName || "",
            tk.email,
            tk.role,
            tk.token
          );
        } else if (currentUser) {
          finalUser = new User(
            currentUser.id,
            currentUser.username,
            "",
            currentUser.fullName || "",
            currentUser.email,
            currentUser.role,
            currentUser.token
          );
        } else {
          // Último intento: leer de localStorage si no te pasaron currentUser
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
                u.token
              );
            }
          } catch {
            /* ignore */
          }
        }

        return { valid: true, api: res, user: finalUser };
      }

      // No válido
      return { valid: false, api: res ?? null, user: null };
    },
    [request]
  );

  return { validateToken, loading, error };
};
