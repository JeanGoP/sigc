// src/services/eventosDiariosService.ts
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";

/* -----------------------------
 * Payload de la API
 * ----------------------------- */
export interface ApiEventoDiario {
  id: number;
  icono: string;
  color: string;
  tipo: string;
  cliente: string;
  fechaHoraProgramada: string;
  fechaCumplimiento: string;
  cumplido: boolean;
  minutos: number;
}

/* -----------------------------
 * Hook especializado para eventos
 * ----------------------------- */
export function useEventosDiariosService() {
  // apunta al segmento base de tu API
  const { loading, error, request } = useApi<ApiEventoDiario[]>("/api/v1");

  const obtenerEventosDiarios = async (
    idUser: number
  ): Promise<ApiResponse<ApiEventoDiario[]> | null> => {
    return await request({
      method: "GET",
      url: "/eventos-diarios",
      params: { idUser },
    });
  };

  return { loading, error, obtenerEventosDiarios };
}