// src/services/tipoContactoService.ts
import { useApi } from "@app/hooks/useApi";
import { useCallback } from "react";

export interface TipoContacto {
  id: string;
  descripcion: string;
}

// -----------------------------------------------------------------------------
// Listar tipos de contacto
// GET /api/v1/listarForNuevaGestion?filtro=...
// -----------------------------------------------------------------------------
export function useListarTiposContacto() {
  const { loading, error, request } = useApi<TipoContacto[]>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 2000,
  });

  const listarTiposContacto = useCallback(
    (filtro: string = "w") => {
      return request({
        url: "/listarForNuevaGestion",
        method: "GET",
        params: { filtro },
      });
    },
    [request]
  );

  return { loading, error, listarTiposContacto };
}
