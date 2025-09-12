// services/BitacoraService.ts
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";

export interface Bitacora {
  id: number;
  cliente: string;
  usuario: string;
  fechaHora: string;
  comentario: string;
  calificacion: number;
}

export interface ResumenBitacora {
  cliente: string;
  totalCalificaciones: number;
  promedioCalificacion: number;
  cantidad1: number;
  cantidad2: number;
  cantidad3: number;
  cantidad4: number;
  cantidad5: number;
}

export function useBitacoraService() {
  const { request, loading, error } = useApi<any>("/api/v1");

  // 🔹 Obtener bitácoras
  const obtenerBitacoras = async (
    cliente: string
  ): Promise<ApiResponse<Bitacora[]> | null> => {
    return await request({
      url: "/listar",
      method: "GET",
      params: { cliente },
    });
  };

  // 🔹 Crear bitácora
  const crearBitacora = async (
    bitacora: Omit<Bitacora, "id">
  ): Promise<ApiResponse<null> | null> => {
    return await request({
      url: "/insertar",
      method: "POST",
      data: { id: 0, ...bitacora },
    });
  };

  // 🔹 Resumen
  const obtenerResumenBitacora = async (
    cliente: string
  ): Promise<ApiResponse<ResumenBitacora> | null> => {
    return await request({
      url: "/resumen_bitacora",
      method: "GET",
      params: { cliente },
    });
  };

  return {
    obtenerBitacoras,
    crearBitacora,
    obtenerResumenBitacora,
    loading,
    error,
  };
}
