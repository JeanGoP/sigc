import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";
import type {
  ControlHorarioFullConfig,
  PermisoHorario,
  AsignarPermisosMasivoPayload,
  RevocarPermisoPayload,
  UpdateGeneralConfigPayload,
  UpdateHorariosSemanaPayload,
  UpsertFestivoPayload,
  LogAuditoriaHorario,
  ValidacionAccesoMe,
} from "./controlHorarioTypes";

export function useControlHorarioService() {
  const { loading, error, request } = useApi<any>("/api/v1/control-horario", {
    timeout: 10000,
    retries: 0,
    retryDelay: 1000,
  });

  const getConfig = useCallback((refresh = false) => {
    return request({
      url: "/config",
      method: "GET",
      params: refresh ? { refresh: true } : undefined,
    });
  }, [request]);

  const updateGeneralConfig = useCallback(
    (data: UpdateGeneralConfigPayload) => {
      return request({
        url: "/config/general",
        method: "PUT",
        data,
      });
    },
    [request]
  );

  const updateHorariosSemana = useCallback(
    (data: UpdateHorariosSemanaPayload) => {
      return request({
        url: "/config/semana",
        method: "PUT",
        data,
      });
    },
    [request]
  );

  const upsertFestivo = useCallback(
    (data: UpsertFestivoPayload) => {
      return request({
        url: "/festivos",
        method: "POST",
        data,
      });
    },
    [request]
  );

  const deleteFestivo = useCallback(
    (fecha: string) => {
      return request({
        url: `/festivos/${fecha}`,
        method: "DELETE",
      });
    },
    [request]
  );

  const listarPermisos = useCallback(
    (soloActivos = false, fecha?: string) => {
      return request({
        url: "/permisos",
        method: "GET",
        params: {
          soloActivos,
          ...(fecha ? { fecha } : {}),
        },
      });
    },
    [request]
  );

  const asignarPermisosMasivo = useCallback(
    (data: AsignarPermisosMasivoPayload) => {
      return request({
        url: "/permisos/masivo",
        method: "POST",
        data,
      });
    },
    [request]
  );

  const revocarPermiso = useCallback(
    (data: RevocarPermisoPayload) => {
      return request({
        url: "/permisos/revocar",
        method: "POST",
        data,
      });
    },
    [request]
  );

  const listarAuditoria = useCallback(
    (top = 200) => {
      return request({
        url: "/auditoria",
        method: "GET",
        params: { top },
      });
    },
    [request]
  );

  const validarMe = useCallback(() => {
    return request({
      url: "/validar-me",
      method: "GET",
    });
  }, [request]);

  return {
    loading,
    error,
    getConfig,
    updateGeneralConfig,
    updateHorariosSemana,
    upsertFestivo,
    deleteFestivo,
    listarPermisos,
    asignarPermisosMasivo,
    revocarPermiso,
    listarAuditoria,
    validarMe,
  };
}
