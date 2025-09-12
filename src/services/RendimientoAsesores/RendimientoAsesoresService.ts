// src/services/rendimientoAsesoresService.ts
import { useApi } from "@app/hooks/useApi";
import { ProductividadAsesorDto } from "@models/ProductividadAsesorDto";

export function useRendimientoAsesoresService() {
  const { loading, error, request } = useApi<ProductividadAsesorDto[]>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 3000,
  });

  const listarRendimiento = (params: { IdUsuario: number; FechaInicial: string; FechaFinal: string }) => {
    return request({
      url: "/GetList",
      method: "GET",
      params,
    });
  };

  return { loading, error, listarRendimiento };
}
