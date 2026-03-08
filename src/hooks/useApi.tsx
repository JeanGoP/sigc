// src/hooks/useApi.ts
import { useState, useCallback } from "react";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

import { ApiResponse } from "@app/models/apiResponse";
interface UseApiOptions {
  timeout?: number;    // en ms
  retries?: number;    // cantidad de reintentos
  retryDelay?: number; // tiempo de espera entre reintentos en ms
  logoutOn401?: boolean;
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "";

function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

function buildBaseUrl(baseURL: string): string {
  const candidate = baseURL.trim();
  if (isAbsoluteHttpUrl(candidate)) {
    return candidate;
  }

  if (!API_URL) {
    return candidate;
  }

  const normalizedApiUrl = API_URL.replace(/\/+$/, "");
  const normalizedPath = candidate.replace(/^\/+/, "");
  return normalizedPath ? `${normalizedApiUrl}/${normalizedPath}` : normalizedApiUrl;
}

export function useApi<T>(
  baseURL: string,
  { timeout = 5000, retries = 0, retryDelay = 1000, logoutOn401 = false }: UseApiOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedBaseURL = buildBaseUrl(baseURL);

  // Pequeña utilidad para pausar la ejecución
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const request = useCallback(
    async (config: AxiosRequestConfig): Promise<ApiResponse<T> | null> => {
      setLoading(true);
      setError(null);

      // Obtener el token desde userAccess en localStorage
      let token = "";
      let tenantId = "";
      try {
        const storedUser = localStorage.getItem("userAccess");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          // soportar distintos formatos de guardado
          // 1) { token: string }
          if (typeof parsed?.token === "string") {
            token = parsed.token;
          }
          // 2) { token: { token: string, ... } }
          else if (
            parsed?.token && typeof parsed.token === "object" && typeof parsed.token.token === "string"
          ) {
            token = parsed.token.token;
          }
          // 3) { data: { token: { token: string } } }
          else if (
            parsed?.data?.token && typeof parsed.data.token === "object" && typeof parsed.data.token.token === "string"
          ) {
            token = parsed.data.token.token;
          }

          // Validando el TenantId -----------------------------------------------------------------------------------------------
          // 1) { token: string }
          if (typeof parsed?.tenantId === "string") {
            tenantId = parsed.tenantId;
          }
          // 2) { token: { token: string, ... } }
          else if (
            parsed?.tenantId && typeof parsed.tenantId === "object" && typeof parsed.token.tenantId === "string"
          ) {
            tenantId = parsed.token.tenantId;
          }
          // 3) { data: { token: { token: string } } }
          else if (
            parsed?.data?.tenantId && typeof parsed.data.token === "object" && typeof parsed.data.token.tenantId === "string"
          ) {
            tenantId = parsed.data.token.tenantId;
          }
        }
      } catch (e) {
        console.warn("No se pudo leer el token de localStorage", e);
      }

      const obj =  {
        baseURL: resolvedBaseURL,
        timeout,
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          "X-Tenant-Id": tenantId,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }

      const instance = axios.create(obj);

      let attempt = 0;

      while (attempt <= retries) {
        try {
          const res = await instance.request<ApiResponse<T>>(config);
          return res.data;
        } catch (err) {
          const axiosErr = err as AxiosError<ApiResponse<T>>;

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
            await delay(retryDelay); // â³ espera antes del siguiente intento
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
    [resolvedBaseURL, timeout, retries, retryDelay, logoutOn401]
  );

  return { loading, error, request };
}

