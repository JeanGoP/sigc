// src/services/tiposEventosService.ts
import { useApi } from "@app/hooks/useApi";

export function useEliminarTipoEvento() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 1,
    retryDelay: 3000,
  });

  const eliminarTipoEvento = (id: number) => {
    return request({
      url: `/EliminarTipoEvento/${id}`,
      method: "DELETE",
    });
  };

  return { loading, error, eliminarTipoEvento };
}
