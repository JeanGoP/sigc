// src/services/clientesService.ts
import { useCallback, useEffect, useRef } from "react";
import { useApi } from "@app/hooks/useApi";
// import { ClientesListRequest } from "./GetClientesListByFilter"; // Reutilizamos el tipo que ya tienes

export type ClientesListRequest = {
    page: number;
    numpage: number;
    filter: string;
    intmora: string;
  };

export function useClientesService() {
  const activeClientesRequestRef = useRef<AbortController | null>(null);
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 0,
    retryDelay: 5000,
  });

  const listarClientes = useCallback(
    (params: ClientesListRequest) => {
      activeClientesRequestRef.current?.abort();
      const controller = new AbortController();
      activeClientesRequestRef.current = controller;

      return request({
        url: "/GetClientes", // el endpoint que usas
        method: "POST",
        data: params,
        signal: controller.signal,
      });
    },
    [request]
  );

  useEffect(() => {
    return () => {
      activeClientesRequestRef.current?.abort();
    };
  }, []);

  return { loading, error, listarClientes };
}
