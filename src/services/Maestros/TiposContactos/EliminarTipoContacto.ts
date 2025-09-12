// src/services/tiposContactoService.ts
import { useApi } from "@app/hooks/useApi";

export function useEliminarTipoContacto() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 1,
    retryDelay: 3000,
  });

  const eliminarTipoContacto = (id: number) => {
    return request({
      url: `/id?id=${id}`,
      method: "DELETE",
    });
  };

  return { loading, error, eliminarTipoContacto };
}
