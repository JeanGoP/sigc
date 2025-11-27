import { useCallback } from "react";
import { useApi } from "../../hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";

// Params del endpoint GET /api/v1/Contabilidad/GetFacturas
export type GetFacturasParams = {
  numDocutra: string;          // ej: "0000002138"
  idFuente: number | string;   // ej: 36
  tercero: string;             // ej: "1000603859"
};

// Ajusta este tipo a lo que devuelva tu API
export interface FacturaDto {
  // Ejemplos (coloca los reales):
  // cuenta: string;
  // numefac: string;
  // idcliprv: string;
  // sact: number;
  // ...
  [k: string]: unknown;
}

export function useGetContabilidadService() {
  // Base del módulo Contabilidad (se concatena con VITE_API_URL dentro de useApi)
  const { loading, error, request } = useApi<any>(
    "/api/v1/Contabilidad",
    {
      timeout: 8000,
      retries: 1,       // un reintento
      retryDelay: 700,  // 700ms entre intentos
    }
  );

  /**
   * GET /api/v1/Contabilidad/GetFacturas
   * Query: ?numDocutra=...&idFuente=...&tercero=...
   */
  const getContabilizacion = useCallback(
    async (params: GetFacturasParams): Promise<ApiResponse<any> | null> => {
      return request({
        method: "GET",
        url: "/GetContabilizacion",
        params, // axios arma la query string
      });
    },
    [request]
  );

  return {
    loading,
    error,
    getContabilizacion,
  };
}




