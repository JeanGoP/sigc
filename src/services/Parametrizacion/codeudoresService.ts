import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";
import type {
  CodeudorItem,
  CodeudorListResponse,
  CodeudorCreatePayload,
  CodeudorUpdatePayload,
  FacturaLookupItem,
} from "./codeudoresTypes";

export function useCodeudoresService() {
  const { loading, error, request } = useApi<any>(
    "/api/v1/parametrizacion/codeudores",
    {
      timeout: 15000,
      retries: 0,
      retryDelay: 1000,
    }
  );

  const listarCodeudores = useCallback(
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

  const buscarFacturas = useCallback(
    (q: string) => {
      return request({
        url: "/lookup-facturas",
        method: "GET",
        params: { q },
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

  const crearCodeudor = useCallback(
    (data: CodeudorCreatePayload) => {
      return request({
        url: "",
        method: "POST",
        data,
      });
    },
    [request]
  );

  const actualizarCodeudor = useCallback(
    (id: number, data: CodeudorUpdatePayload) => {
      return request({
        url: `/${id}`,
        method: "PUT",
        data,
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

  const eliminarCodeudor = useCallback(
    (id: number) => {
      return request({
        url: `/${id}`,
        method: "DELETE",
      });
    },
    [request]
  );

  return {
    loading,
    error,
    listarCodeudores,
    obtenerPorId,
    buscarFacturas,
    obtenerEstadisticas,
    crearCodeudor,
    actualizarCodeudor,
    cambiarEstado,
    eliminarCodeudor,
  };
}
