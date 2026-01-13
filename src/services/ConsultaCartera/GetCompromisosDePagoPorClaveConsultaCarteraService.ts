import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";

export interface CompromisosDePagoPorClaveRequest {
  cliente: string;
  cuenta: string;
  factura: string;
  idTipoEvento?: number | null;
  estadoEspecifico?: string | null;
}

export interface CompromisoDePagoPorClave {
  IdEvento: number;
  numefac: string;
  cliente: string;
  cuenta: string;
  FECHAGES: string;
  FechaHoraProgramada: string | null;
  FechaCumplimientoCalc: string | null;
  IdUsuarioAsignado: number;
  IdTipoEvento: number;
  MontoCompromiso: number;
  TotalPagado: number;
  PorcentajeDePago: number;
  CUMPLIDO: number;
  EstadoDeCompromiso: string;
  EstadoDePago: string;
}

export function useGetCompromisosDePagoPorClaveConsultaCarteraService() {
  const { loading, error, request } = useApi<CompromisoDePagoPorClave[]>(
    "/api/v1",
    {
      timeout: 5000,
      retries: 1,
      retryDelay: 1000,
    }
  );

  const getCompromisosDePagoPorClave = useCallback(
    (
      params: CompromisosDePagoPorClaveRequest
    ): Promise<ApiResponse<CompromisoDePagoPorClave[]> | null> => {
      return request({
        url: "/GetCompromisosDePagoPorClaveConsultaCartera",
        method: "POST",
        data: params,
      });
    },
    [request]
  );

  return {
    loading,
    error,
    getCompromisosDePagoPorClave,
  };
}
