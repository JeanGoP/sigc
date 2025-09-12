// src/services/eventoService.ts
import { useApi } from "@app/hooks/useApi";
import { useCallback } from "react";

export interface EventoPayload {
  tipo: number;
  fecha: string | null;
  hora: string | null;
  monto: number;
  idUsuario: string | number | null;
  cliente: string | number | null;
  factura: string | number | null;
  cuenta: string | number | null;
}

// Respuesta esperada del backend
interface ValidarEventoResponse {
  success: boolean;
  message: string;
}

export function useValidarEvento() {
  const { loading, error, request } = useApi<ValidarEventoResponse>(
    "/api/v1",
    {
      timeout: 5000,
      retries: 1,
    }
  );

  const validarEvento = useCallback(
    (payload: EventoPayload) => {
      return request({
        url: "/validar-evento",
        method: "POST",
        data: payload,
      });
    },
    [request]
  );

  return { loading, error, validarEvento };
}
