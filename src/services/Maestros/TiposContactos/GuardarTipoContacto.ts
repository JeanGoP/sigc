// src/services/tiposContactoService.ts
import { useApi } from "@app/hooks/useApi";

export type TipoContactoPayload = {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  idUser: number;
};

export function useGuardarTipoContacto() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 1,
    retryDelay: 3000,
  });

  const guardarTipoContacto = (payload: TipoContactoPayload) => {
    return request({
      url: "/Guardar",
      method: "POST",
      data: payload,
    });
  };

  return { loading, error, guardarTipoContacto };
}
