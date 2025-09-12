// src/services/tipoEventoService.ts
import { useApi } from "@app/hooks/useApi";
import { useCallback } from "react";

export interface TipoEvento {
  id: number;
  nombre: string;
  descripcion: string;
  requiereMonto: boolean;
  requiereFecha: boolean;
  requiereHora: boolean;
}

// -----------------------------------------------------------------------------
// Listar todos los tipos de evento
// GET /api/v1/Listartodo
// -----------------------------------------------------------------------------
export function useListarTiposEvento() {
  const { loading, error, request } = useApi<TipoEvento[]>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 2000,
  });

  const listarTiposEvento = useCallback(() => {
    return request({
      url: "/Listartodo",
      method: "GET",
    });
  }, [request]);

  return { loading, error, listarTiposEvento };
}