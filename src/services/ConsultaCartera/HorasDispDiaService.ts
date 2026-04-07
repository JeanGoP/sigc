import { useApi } from "@app/hooks/useApi";
import { useCallback } from "react";

export interface HoraDispItem {
  horaMinuto: string;
  hora: number;
  minuto: number;
  ocupado: boolean;
}

export function useHorasDispDia() {
  const { loading, error, request } = useApi<HoraDispItem[]>("/api/v1", {
    timeout: 8000,
    retries: 1,
    retryDelay: 1000,
  });

  const obtenerHoras = useCallback(
    (fecha: string, idUsuario: number | string) => {
      return request({
        url: `/horas-disponibles-dia?fecha=${fecha}&idUsuario=${idUsuario}`,
        method: "GET",
      });
    },
    [request]
  );

  return { loading, error, obtenerHoras };
}
