// src/services/etiquetasClientesService.ts
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

  const listarEtiquetasClientes = (filter: string) => {
    return request({
      url: `/GetEtiqueta`,
      method: "GET",
      params: { filter },
    });
  };

  return { loading, error, listarEtiquetasClientes };
}

// Guardar
export function useGuardarEtiquetaCliente() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
  });

  const guardarEtiquetaCliente = (payload: EtiquetaClientePayload) => {
    return request({
      url: "/Post",
      method: "POST",
      data: payload,
    });
  };

  return { loading, error, guardarEtiquetaCliente };
}

// Eliminar
export function useEliminarEtiquetaCliente() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
  });

  const eliminarEtiquetaCliente = (id: number) => {
    return request({
      url: `/Post/${id}`,
      method: "DELETE",
    });
  };

  return { loading, error, eliminarEtiquetaCliente };
}
