import { useCallback, useEffect, useMemo, useState } from "react";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useApi } from "@app/hooks/useApi";
import { toast } from "react-toastify";
import {
  type DashboardCarteraCuentaExcluidaDto,
  useDashboardCarteraExclusionService,
} from "@app/services/Dashboard/dashboardCarteraExclusionService";
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
  const [cuentasExcluidas, setCuentasExcluidas] = useState<
    DashboardCarteraCuentaExcluidaDto[]
  >([]);

  const { loading, error, request } = useApi<Record<string, unknown>[]>(
    "/api/v1/dashboard/cartera",
    { timeout: 60000 },
  );
  const {
    listarCuentasExcluidas,
    guardarCuentaExcluida,
    eliminarCuentaExcluida,
    loadingCuentasExcluidas,
    errorCuentasExcluidas,
  } = useDashboardCarteraExclusionService();

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

  const loadCuentasExcluidas = useCallback(async () => {
    const response = await listarCuentasExcluidas();
    if (response?.success && Array.isArray(response.data)) {
      setCuentasExcluidas(response.data);
    }
  }, [listarCuentasExcluidas]);

  const handleAgregarCuentaExcluida = useCallback(
    async (cuenta: string) => {
      const cuentaNormalizada = cuenta.trim();
      if (!cuentaNormalizada) {
        return false;
      }

      const response = await guardarCuentaExcluida({ cuenta: cuentaNormalizada });
      if (!response?.success) {
        toast.error(response?.message || "No se pudo excluir la cuenta.");
        return false;
      }

      await loadCuentasExcluidas();
      toast.success("Cuenta excluida guardada.");
      return true;
    },
    [guardarCuentaExcluida, loadCuentasExcluidas],
  );

  const handleEliminarCuentaExcluida = useCallback(
    async (cuenta: string) => {
      const cuentaNormalizada = cuenta.trim();
      if (!cuentaNormalizada) {
        return false;
      }

      const response = await eliminarCuentaExcluida(cuentaNormalizada);
      if (!response?.success) {
        toast.error(response?.message || "No se pudo eliminar la exclusión.");
        return false;
      }

      await loadCuentasExcluidas();
      toast.success("Cuenta removida de exclusión.");
      return true;
    },
    [eliminarCuentaExcluida, loadCuentasExcluidas],
  );

  const accountOptions = useMemo(
    () =>
      data.map((row) => ({
        value: row.codicta,
        label: `${row.codicta} - ${row.desccta}`,
      })),
    [data],
  );

  useEffect(() => {
    void loadCuentasExcluidas();
  }, [loadCuentasExcluidas]);

  return {
    fecha,
    data,
    accountOptions,
    lastFecha,
    loading,
    error,
    cuentasExcluidas,
    loadingCuentasExcluidas,
    errorCuentasExcluidas,
    handleFechaChange,
    handleConsultar,
    handleAgregarCuentaExcluida,
    handleEliminarCuentaExcluida,
    loadCuentasExcluidas,
  };
}
