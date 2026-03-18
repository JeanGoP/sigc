// src/services/etiquetasClienteService.ts
import { useApi } from "@app/hooks/useApi";
import { useCallback } from "react";

export interface EtiquetaCliente {
  id: number;
  nombre: string;
  color: string | null;
  estado?: boolean;
}

export interface EtiquetaClienteListado extends EtiquetaCliente {
  asignado: boolean;
}

export interface EtiquetaClienteScope {
  idUser: number | string;
  cliente: string;
  factura: string;
  cuenta: string;
}

// -----------------------------------------------------------------------------
// Listar etiquetas por cliente
// GET /api/v1/listar-etiquetas-cliente?idUser=2&cliente=1000184575
// -----------------------------------------------------------------------------
export function useListarEtiquetasCliente() {
  const { loading, error, request } = useApi<EtiquetaClienteListado[]>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 2000,
  });

  const listarEtiquetasCliente = useCallback(
    (scope: EtiquetaClienteScope) => {
      return request({
        url: `/listar-etiquetas-cliente`,
        method: "GET",
        params: scope,
      });
    },
    [request]
  );

  return { loading, error, listarEtiquetasCliente };
}

// -----------------------------------------------------------------------------
// Gestionar etiqueta (asignar / quitar)
// POST /api/v1/gestionarEtiquetaCliente { idUser, cliente, idEtiqueta }
// -----------------------------------------------------------------------------
export function useGestionarEtiquetaCliente() {
  const { loading, error, request } = useApi<null>("/api/v1", {
    timeout: 5000,
  });

  const gestionarEtiquetaCliente = useCallback(
    (scope: EtiquetaClienteScope, idEtiqueta: number) => {
      return request({
        url: "/gestionarEtiquetaCliente",
        method: "POST",
        data: { ...scope, idEtiqueta },
      });
    },
    [request]
  );

  return { loading, error, gestionarEtiquetaCliente };
}
