// src/services/facturasService.ts
import { useApi } from "@app/hooks/useApi";
import { FacturaListado } from "@app/models/facturaConsultaclienteModel";

export function useFacturasService() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 5000,
  });

  const listarFacturas = (params: { fecha: string; cliente: string }) => {
    const cliente = String(params?.cliente ?? "").trim();
    if (!cliente) {
      return Promise.resolve({
        success: false,
        data: [],
        message: "Cliente requerido",
      } as any);
    }
    return request({
      url: "/GetFacturas",
      method: "GET",
      params: {
        ...params,
        cliente,
      },
    });
  };

  const obtenerRecibosCajaPorFactura = (params: { fecha: string; cliente: string; factura: string }) => {
    return request({
      url: "/GetRecibos",
      method: "GET",
      params,
    });
  };

  return { loading, error, listarFacturas, obtenerRecibosCajaPorFactura };
}
