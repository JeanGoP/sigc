import { ApiResponse } from '@app/models/apiResponse';
import { useApi } from '@app/hooks/useApi';

// const API_URL = import.meta.env.VITE_API_URL;

export interface EstadoCuentaRequest {
  cuenta: string;
  fecha: string;
  cliente: string;
  factura: string;
  intMora: string;
}

export const useEstadoCuentaService = () => {
  // usamos tu hook con la misma baseURL
  const { request, loading, error } = useApi<any>("/api/v1/GetEstadoDeCuenta");

  const FetchEstadoCuentaClienteFactura = async (
    requestBody: EstadoCuentaRequest
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await request({
        method: "POST",
        url: "", // ya tienes el baseURL en el hook
        data: requestBody,
      });

      if (!response) {
        return {
          success: false,
          message: "Error al obtener el estado de cuenta",
          data: [],
          statusCode: 500,
          errors: ["Respuesta nula"],
        };
      }

      return response;
    } catch (error: any) {
      return {
        success: false,
        message: "Error al obtener el estado de cuenta",
        data: [],
        statusCode: 500,
        errors: [error.message || "Error desconocido"],
      };
    }
  };

  return { FetchEstadoCuentaClienteFactura, loading, error };
};
