// api/recibosCajaService.ts
import { ApiResponse } from "@app/models/apiResponse";
import { ReciboCajaListModel } from "../../../models/recibocaja/recibocajaListoModel";
import { useApi } from "@app/hooks/useApi";

export function useRecibosCajaService() {
  // ⏳ Usamos tu hook genérico
  const { request, loading, error } = useApi<ReciboCajaListModel[]>("/api/v1");

  const ObtenerRecibosCajaPorFactura = async (
    fecha: string,
    cliente: string,
    factura: string
  ): Promise<ApiResponse<ReciboCajaListModel[]> | null> => {
    return await request({
      url: "/GetRecibos",
      method: "GET",
      params: {
        fecha,
        cliente,
        factura,
      },
    });
  };

  return {
    ObtenerRecibosCajaPorFactura,
    loading,
    error,
  };
}
