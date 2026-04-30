// src/services/etiquetasClientesService.ts
import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";

export type EtiquetaClientePayload = {
  id: number;
  nombre: string;
  color: string;
  estado: boolean;
  iduser: number;
};

// Listar
export function useListarEtiquetasClientes() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 5000,
  });

  const listarEtiquetasClientes = useCallback(
    (filter: string) => {
      return request({
        url: `/GetEtiqueta`,
        method: "GET",
        params: { filter },
      });
    },
    [request],
  );

  return { loading, error, listarEtiquetasClientes };
}

// Guardar
export function useGuardarEtiquetaCliente() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
  });

  const guardarEtiquetaCliente = useCallback(
    (payload: EtiquetaClientePayload) => {
      return request({
        url: "/Post",
        method: "POST",
        data: payload,
      });
    },
    [request],
  );

  return { loading, error, guardarEtiquetaCliente };
}

// Eliminar
export function useEliminarEtiquetaCliente() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
  });

  const eliminarEtiquetaCliente = useCallback(
    (id: number) => {
      return request({
        url: `/Post/${id}`,
        method: "DELETE",
      });
    },
    [request],
  );

  return { loading, error, eliminarEtiquetaCliente };
}
