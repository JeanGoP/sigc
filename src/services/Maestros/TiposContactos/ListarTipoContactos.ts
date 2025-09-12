// src/services/tiposContactoService.ts
import { useApi } from "@app/hooks/useApi";

export function useListarTiposContacto() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 5000,
  });

  const listarTiposContacto = (params: { nombre?: string; page: number; pageSize: number }) => {
    return request({
      url: "/ListarTiposContacto",
      method: "GET",
      params,
    });
  };

  return { loading, error, listarTiposContacto };
}
