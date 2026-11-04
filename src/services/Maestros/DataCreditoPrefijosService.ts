import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";
import type {
  DataCreditoPrefijoItem,
  DataCreditoPrefijoListResponse,
  DataCreditoEstadisticas,
  CuentaCarteraDisponible,
  SaveDataCreditoPrefijoPayload,
  PreviewDataCreditoPayload,
  PreviewDataCreditoResponse,
} from "./dataCreditoPrefijosTypes";

export function useDataCreditoPrefijosService() {
  const { loading, error, request } = useApi<any>(
    "/api/v1/maestros/datacredito-prefijos",
    {
      timeout: 15000,
      retries: 0,
      retryDelay: 1000,
    }
  );

  const listar = useCallback(
    (params: {
      search?: string;
      activo?: boolean;
      page?: number;
      pageSize?: number;
    }) => {
      return request({
        url: "",
        method: "GET",
        params: {
          search: params.search || undefined,
          activo: params.activo !== undefined ? params.activo : undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 20,
        },
      });
    },
    [request]
  );

  const obtenerPorId = useCallback(
    (id: number) => {
      return request({
        url: `/${id}`,
        method: "GET",
      });
    },
    [request]
  );

  const obtenerEstadisticas = useCallback(() => {
    return request({
      url: "/estadisticas",
      method: "GET",
    });
  }, [request]);

  const listarCuentasDisponibles = useCallback(() => {
    return request({
      url: "/cuentas-disponibles",
      method: "GET",
    });
  }, [request]);

  const crear = useCallback(
    (payload: SaveDataCreditoPrefijoPayload) => {
      return request({
        url: "",
        method: "POST",
        data: payload,
      });
    },
    [request]
  );

  const actualizar = useCallback(
    (id: number, payload: SaveDataCreditoPrefijoPayload) => {
      return request({
        url: `/${id}`,
        method: "PUT",
        data: payload,
      });
    },
    [request]
  );

  const cambiarEstado = useCallback(
    (id: number, activo: boolean) => {
      return request({
        url: `/${id}/estado`,
        method: "PATCH",
        data: { activo },
      });
    },
    [request]
  );

  const eliminar = useCallback(
    (id: number) => {
      return request({
        url: `/${id}`,
        method: "DELETE",
      });
    },
    [request]
  );

  const preview = useCallback(
    (payload: PreviewDataCreditoPayload) => {
      return request({
        url: "/preview",
        method: "POST",
        data: payload,
      });
    },
    [request]
  );

  return {
    loading,
    error,
    listar,
    obtenerPorId,
    obtenerEstadisticas,
    listarCuentasDisponibles,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    preview,
  };
}
