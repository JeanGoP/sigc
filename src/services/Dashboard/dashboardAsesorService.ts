import { useCallback, useRef } from "react";
import { useApi } from "@app/hooks/useApi";
import type { ApiResponse } from "@app/models/apiResponse";

export type DashboardAsesorRow = Record<string, unknown>;

export interface DashboardAsesorPorUsuarioResponse {
  cuentasTramos: DashboardAsesorRow[];
  gestiones: DashboardAsesorRow[];
  recaudos: DashboardAsesorRow[];
  cartera: DashboardAsesorRow[];
}

export interface DashboardAsesorPorUsuarioPayload {
  userId: number;
}

export function useDashboardAsesorService() {
  const api = useApi<DashboardAsesorPorUsuarioResponse>("/api/v1", {
    timeout: 60000,
    retries: 0,
  });

  const apiRequestRef = useRef(api.request);
  apiRequestRef.current = api.request;

  const obtenerDashboardPorUsuario = useCallback(
    async (
      payload: DashboardAsesorPorUsuarioPayload,
    ): Promise<ApiResponse<DashboardAsesorPorUsuarioResponse> | null> =>
      apiRequestRef.current({
        method: "POST",
        url: "/dashboard/asesor",
        data: payload,
      }),
    [],
  );

  return {
    obtenerDashboardPorUsuario,
    loading: api.loading,
    error: api.error,
  };
}
