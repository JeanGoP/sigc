import { useCallback, useMemo } from "react";
import { useAppSelector } from "@app/store/store";
import { useDashboardAsesorService } from "@app/services/Dashboard/dashboardAsesorService";

export function useAsesorBoard() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { obtenerDashboardPorUsuario, loading, error: requestError } =
    useDashboardAsesorService();

  const currentUserId = useMemo(
    () => String(currentUser?.id ?? "").trim(),
    [currentUser?.id],
  );
  const role = useMemo(() => String(currentUser?.role ?? "").trim(), [currentUser?.role]);

  const error = useMemo<string | null>(() => {
    if (!currentUser) {
      return "No hay un usuario autenticado.";
    }

    if (!currentUserId) {
      return "No fue posible resolver el ID del usuario para filtrar la informacion.";
    }

    return null;
  }, [currentUser, currentUserId]);

  const consultar = useCallback(async () => {
    const parsedUserId = Number(currentUserId);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      return;
    }

    const response = await obtenerDashboardPorUsuario({ userId: parsedUserId });
    if (!response?.success || !response.data) {
      return;
    }

    console.group("Dashboard asesor - resultado");
    console.log("Tabla 1 - CuentasTramos", response.data.cuentasTramos);
    console.log("Tabla 2 - Gestiones", response.data.gestiones);
    console.log("Tabla 3 - Recaudos", response.data.recaudos);
    console.log("Tabla 4 - Cartera", response.data.cartera);
    console.groupEnd();
  }, [currentUserId, obtenerDashboardPorUsuario]);

  return {
    currentUserId,
    role,
    error: error || requestError,
    loading,
    consultar,
  };
}
