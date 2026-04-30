// src/services/tiposContactoService.ts
import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";

export function useListarTiposContacto() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 5000,
  });

  const listarTiposContacto = useCallback(
    (params: { nombre?: string; page: number; pageSize: number }) => {
      return request({
        url: "/ListarTiposContacto",
        method: "GET",
        params,
      });
    },
    [request],
  );

  return { loading, error, listarTiposContacto };
}
