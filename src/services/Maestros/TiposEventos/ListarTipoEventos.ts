// src/services/tiposEventosService.ts
import { useApi } from "@app/hooks/useApi";

export function useListarTiposEventos() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 5000,
  });

  const listarTiposEventos = (params: { page: number; pageSize: number; nombre?: string }) => {
    return request({
      url: "/ListarTiposEvento",
      method: "GET",
      params,
    });
  };

  return { loading, error, listarTiposEventos };
}
