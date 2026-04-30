import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "@app/store/store";
import { useRendimientoAsesoresService } from "@app/services/RendimientoAsesores/RendimientoAsesoresService";
import type { ProductividadAsesorDto } from "@models/ProductividadAsesorDto";
import {
  buildDefaultRendimientoAsesoresFilters,
  buildRendimientoAsesoresColumns,
  buildRendimientoAsesoresParams,
  normalizeProductividadAsesoresRows,
} from "../domain/rendimientoAsesores";
import type { RendimientoAsesoresFilters } from "../domain/types";

export function useRendimientoAsesoresPage() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { loading, error, listarRendimiento } = useRendimientoAsesoresService();
  const [filters, setFilters] = useState<RendimientoAsesoresFilters>(() =>
    buildDefaultRendimientoAsesoresFilters(),
  );
  const [rows, setRows] = useState<ProductividadAsesorDto[]>([]);
  const hasLoadedRef = useRef(false);
  const columns = useMemo(() => buildRendimientoAsesoresColumns(), []);

  const setFilterValue = useCallback(
    (field: keyof RendimientoAsesoresFilters, value: string) => {
      setFilters((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const handleConsultar = useCallback(async () => {
    const params = buildRendimientoAsesoresParams(currentUser?.id, filters);

    if (!params) {
      return;
    }

    const response = await listarRendimiento(params);

    if (response?.success) {
      setRows(normalizeProductividadAsesoresRows(response.data));
    }
  }, [currentUser?.id, filters, listarRendimiento]);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    void handleConsultar();
  }, [handleConsultar]);

  return {
    columns,
    error,
    filters,
    handleConsultar,
    loading,
    rows,
    setFilterValue,
  };
}
