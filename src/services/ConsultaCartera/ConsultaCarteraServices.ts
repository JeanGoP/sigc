// services/ConsultaCarteraService.ts
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";

// 🔹 Tipos de respuesta (ajústalos a tus modelos reales)
export interface FacturaListModel {
  numefac: string;
  cliente: string;
  cuenta: string;
  RAZONCIAL: string;
  EDAD: number;
  ColorCodigo?: string;
}

export interface PlantillaCorreo {
  nombre: string;
  key: string;
}

// Hook de servicios para ConsultaCartera
export function useConsultaCarteraService() {
  const { request, loading, error } = useApi<any>("/api/v1");

  // 🔹 Obtener lista de facturas
  const getFacturasList = async (
    params: Record<string, any>
  ): Promise<ApiResponse<FacturaListModel[]> | null> => {
    return await request({
      url: "/GetFacturasList",
      method: "POST",
      data: params,
    });
  };

  // 🔹 Obtener plantillas de correo
  const getListTemplate = async (
    tipo: string
  ): Promise<ApiResponse<PlantillaCorreo[]> | null> => {
    return await request({
      url: "/GetListTemplate",
      method: "GET",
      params: { tipo },
    });
  };

  // 🔹 Enviar correo con plantilla
  const sendWithTemplate = async (
    body: Record<string, any>
  ): Promise<ApiResponse<any> | null> => {
    return await request({
      url: "/SendWithTemplate",
      method: "POST",
      data: body,
    });
  };

  return {
    getFacturasList,
    getListTemplate,
    sendWithTemplate,
    loading,
    error,
  };
}
