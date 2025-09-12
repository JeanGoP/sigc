// src/hooks/useApi.ts
import { useState, useCallback } from "react";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

import { ApiResponse } from "@app/models/apiResponse";
interface UseApiOptions {
  timeout?: number;    // en ms
  retries?: number;    // cantidad de reintentos
  retryDelay?: number; // tiempo de espera entre reintentos en ms
}

const API_URL = import.meta.env.VITE_API_URL;

export function useApi<T>(
  baseURL: string,
  { timeout = 5000, retries = 0, retryDelay = 1000 }: UseApiOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  baseURL = `${API_URL}${baseURL}`;

  // Pequeña utilidad para pausar la ejecución
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const request = useCallback(
    async (config: AxiosRequestConfig): Promise<ApiResponse<T> | null> => {
      setLoading(true);
      setError(null);

      // Obtener el token desde userAccess en localStorage
      let token = "";
      try {
        const storedUser = localStorage.getItem("userAccess");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          token = parsed?.token || "";
        }
      } catch (e) {
        console.warn("No se pudo leer el token de localStorage", e);
      }

      const instance = axios.create({
        baseURL,
        timeout,
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      let attempt = 0;

      while (attempt <= retries) {
        try {
          const res = await instance.request<ApiResponse<T>>(config);
          return res.data;
        } catch (err) {
          const axiosErr = err as AxiosError<ApiResponse<T>>;

          if (attempt < retries) {
            attempt++;
            await delay(retryDelay); // ⏳ espera antes del siguiente intento
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
    [baseURL, timeout, retries, retryDelay]
  );

  return { loading, error, request };
}
