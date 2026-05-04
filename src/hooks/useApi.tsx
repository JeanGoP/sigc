// src/hooks/useApi.ts
import { useState, useCallback } from "react";
import { AxiosError, AxiosRequestConfig } from "axios";

import { ApiResponse } from "@app/models/apiResponse";
import { resolveStoredAuthSession } from "@app/services/Auth/authStorage";
import { createApiClient } from "@app/services/api/apiClientFactory";
import { getConfiguredApiUrl } from "@app/services/api/apiConfig";

interface UseApiOptions {
  timeout?: number;    // en ms
  retries?: number;    // cantidad de reintentos
  retryDelay?: number; // tiempo de espera entre reintentos en ms
  logoutOn401?: boolean;
}

export function useApi<T>(
  baseURL: string,
  { timeout = 5000, retries = 0, retryDelay = 1000, logoutOn401 = false }: UseApiOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = getConfiguredApiUrl();

  // Pequeña utilidad para pausar la ejecución
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const request = useCallback(
    async (config: AxiosRequestConfig): Promise<ApiResponse<T> | null> => {
      setLoading(true);
      setError(null);

      const instance = createApiClient({
        baseURL,
        apiUrl,
        timeout,
        authSession: resolveStoredAuthSession(),
      });

      let attempt = 0;

      while (attempt <= retries) {
        try {
          const res = await instance.request<ApiResponse<T>>(config);
          return res.data;
        } catch (err) {
          const axiosErr = err as AxiosError<ApiResponse<T>>;

          if (axiosErr.code === "ERR_CANCELED") {
            return null;
          }

          // Manejo centralizado de 401 No Autorizado
          if (axiosErr.response?.status === 401) {
            if (logoutOn401) {
              try {
                localStorage.removeItem("userAccess");
              } catch {/* ignore */}
              // recargar para forzar flujo a /login y limpiar estados en memoria
              window.location.reload();
            }

            if (axiosErr.response?.data) {
              setError(axiosErr.response.data.message || "No autorizado");
              return axiosErr.response.data;
            }

            setError("No autorizado");
            return null;
          }

          if (attempt < retries) {
            attempt++;
            await delay(retryDelay); // espera antes del siguiente intento
            continue;
          }

          if (axiosErr.response?.data) {
            setError(axiosErr.response.data.message || "Error desconocido");
            return axiosErr.response.data;
          }

          setError(axiosErr.message);
          return null;
        } finally {
          setLoading(false);
        }
      }

      return null;
    },
    [apiUrl, baseURL, timeout, retries, retryDelay, logoutOn401]
  );

  return { loading, error, request };
}
