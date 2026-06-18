import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@app/store/store";
import { useApi } from "@app/hooks/useApi";
import type { ApiResponse } from "@app/models/apiResponse";
import { computeAsesorLiteDashboardKpis, computeEficienciaGestiones, type AnyRow } from "../domain/kpis";

export interface AsesorLiteDashboardResponse {
  cuentasTramos: AnyRow[];
  gestiones: AnyRow[];
  recaudos: AnyRow[];
  cartera: AnyRow[];
}

type CachedDashboard = {
  data: AsesorLiteDashboardResponse;
  fetchedAtMs: number;
};

type ConsultarOptions = {
  force?: boolean;
  cacheTtlMs?: number;
  userId?: number | string | null;
};

const dashboardCache = new Map<number, CachedDashboard>();

function pruneDashboardCache(nowMs: number) {
  for (const [key, entry] of dashboardCache.entries()) {
    if (nowMs - entry.fetchedAtMs > 10 * 60 * 1000) {
      dashboardCache.delete(key);
    }
  }
}

function normalizeUserId(value: number | string | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

export function useAsesorLiteDashboard() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const currentUserId = useMemo(() => String(currentUser?.id ?? "").trim(), [currentUser?.id]);

  const api = useApi<AsesorLiteDashboardResponse>("/api/v1", {
    timeout: 60000,
    retries: 0,
  });

  const [data, setData] = useState<AsesorLiteDashboardResponse | null>(null);
  const [lastUpdatedAtMs, setLastUpdatedAtMs] = useState<number | null>(null);

  useEffect(() => {
    return () => pruneDashboardCache(Date.now());
  }, []);

  const consultar = useCallback(async (options?: ConsultarOptions) => {
    const userId = normalizeUserId(options?.userId) ?? normalizeUserId(currentUserId);
    if (!userId) {
      return;
    }

    const nowMs = Date.now();
    pruneDashboardCache(nowMs);
    const ttlMs = Math.max(0, options?.cacheTtlMs ?? 60_000);
    const cached = dashboardCache.get(userId);
    if (!options?.force && cached && nowMs - cached.fetchedAtMs <= ttlMs) {
      setData(cached.data);
      setLastUpdatedAtMs(cached.fetchedAtMs);
      return;
    }

    const response: ApiResponse<AsesorLiteDashboardResponse> | null = await api.request({
      method: "POST",
      url: "/dashboard/asesor",
      data: { userId },
    });

    if (!response?.success || !response.data) {
      return;
    }

    dashboardCache.set(userId, { data: response.data, fetchedAtMs: nowMs });
    setData(response.data);
    setLastUpdatedAtMs(nowMs);
  }, [api, currentUserId]);

  const kpis = useMemo(
    () =>
      computeAsesorLiteDashboardKpis({
        gestiones: data?.gestiones ?? [],
        recaudos: data?.recaudos ?? [],
      }),
    [data?.gestiones, data?.recaudos],
  );

  const eficiencia = useMemo(
    () => computeEficienciaGestiones(data?.gestiones ?? []),
    [data?.gestiones],
  );

  const cuentasResumen = useMemo(() => {
    const rows = data?.cuentasTramos ?? [];
    return rows.slice(0, 6).map((row) => ({
      cuenta: String(row.Cuenta ?? row.cuenta ?? "").trim(),
      tramos: String(row.Tramos ?? row.tramos ?? "").trim(),
    }));
  }, [data?.cuentasTramos]);

  return {
    currentUser,
    currentUserId,
    data,
    kpis,
    eficiencia,
    cuentasResumen,
    consultar,
    lastUpdatedAtMs,
    loading: api.loading,
    error: api.error,
  };
}
