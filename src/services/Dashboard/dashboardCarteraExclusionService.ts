import { useCallback } from "react";
import { ApiResponse } from "@app/models/apiResponse";
import { useApi } from "@app/hooks/useApi";

export interface DashboardCarteraCuentaExcluidaDto {
  cuenta: string;
  createdAt: string;
  createdByUserId: number;
}

export interface DashboardCarteraCuentaExcluidaSavePayload {
  cuenta: string;
}

export function useDashboardCarteraExclusionService() {
  const listApi = useApi<DashboardCarteraCuentaExcluidaDto[]>("/api/v1");
  const saveApi = useApi<DashboardCarteraCuentaExcluidaDto>("/api/v1");
  const deleteApi = useApi<null>("/api/v1");

  const listarCuentasExcluidas = useCallback(
    async (): Promise<ApiResponse<DashboardCarteraCuentaExcluidaDto[]> | null> =>
      listApi.request({
        method: "GET",
        url: "/dashboard/cartera/excluidas",
      }),
    [listApi.request],
  );

  const guardarCuentaExcluida = useCallback(
    async (
      payload: DashboardCarteraCuentaExcluidaSavePayload,
    ): Promise<ApiResponse<DashboardCarteraCuentaExcluidaDto> | null> =>
      saveApi.request({
        method: "POST",
        url: "/dashboard/cartera/excluidas",
        data: payload,
      }),
    [saveApi.request],
  );

  const eliminarCuentaExcluida = useCallback(
    async (cuenta: string): Promise<ApiResponse<null> | null> =>
      deleteApi.request({
        method: "DELETE",
        url: `/dashboard/cartera/excluidas/${encodeURIComponent(cuenta)}`,
      }),
    [deleteApi.request],
  );

  return {
    listarCuentasExcluidas,
    guardarCuentaExcluida,
    eliminarCuentaExcluida,
    loadingCuentasExcluidas:
      listApi.loading || saveApi.loading || deleteApi.loading,
    errorCuentasExcluidas: listApi.error || saveApi.error || deleteApi.error,
  };
}
