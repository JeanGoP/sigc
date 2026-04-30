import { useCallback, useState } from "react";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useApi } from "@app/hooks/useApi";
import { mapApiRowsToCarteraRows } from "../domain/mappers";
import {
  loadDashboardCarteraDataset,
  saveDashboardCarteraDataset,
} from "../domain/storage";

export function useCarteraBoard() {
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<CarteraRow[]>(
    () => loadDashboardCarteraDataset()?.data ?? [],
  );
  const [lastFecha, setLastFecha] = useState<string | null>(
    () => loadDashboardCarteraDataset()?.fecha ?? null,
  );

  const { loading, error, request } = useApi<Record<string, unknown>[]>(
    "/api/v1/dashboard/cartera",
    { timeout: 30000 },
  );

  const handleFechaChange = useCallback((value: string) => {
    setFecha(value);
  }, []);

  const handleConsultar = useCallback(async () => {
    const response = await request({ method: "GET", params: { fecha } });

    if (response?.success && Array.isArray(response.data)) {
      const mapped = mapApiRowsToCarteraRows(response.data);
      setData(mapped);
      setLastFecha(fecha);
      saveDashboardCarteraDataset({ fecha, data: mapped });
    }
  }, [fecha, request]);

  return {
    fecha,
    data,
    lastFecha,
    loading,
    error,
    handleFechaChange,
    handleConsultar,
  };
}
