// src/services/tiposEventosService.ts
import { useApi } from "@app/hooks/useApi";

export type TipoEventoPayload = {
  id: number;
  idUser: number;
  nombre: string;
  color: string;
  icono: string;
};

export function useGuardarTipoEvento() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 2, // puedes ajustarlo
    retryDelay: 5000, // tiempo de espera entre reintentos
  });

  const guardarTipoEvento = (payload: TipoEventoPayload) => {
    return request({
      url: "/GuardarTipoEvento",
      method: "POST",
      data: payload,
    });
  };

  return { loading, error, guardarTipoEvento };
}
