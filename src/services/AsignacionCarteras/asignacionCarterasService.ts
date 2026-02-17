import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";

export interface CarteraAsignacionActual {
  id: number;
  cuenta: string;
  tramoCodigo: string;
  tramoNombre: string;
  tramoOrden: number;
  asesorUserId: number;
  asesorNombre: string;
  fechaAsignacion?: string | null;
  asignadoPorUserId: number;
  asignadoPorNombre: string;
  updatedAt?: string | null;
}

export interface CarteraAsignacionHistorial {
  id: number;
  cuenta: string;
  tramoCodigo: string;
  tramoNombre: string;
  asesorAnteriorUserId?: number | null;
  asesorAnteriorNombre: string;
  asesorNuevoUserId: number;
  asesorNuevoNombre: string;
  cambiadoPorUserId: number;
  cambiadoPorNombre: string;
  fechaCambio?: string | null;
  fechaCorte?: string | null;
  eventosMovidos: number;
  origen: string;
  motivo: string;
}

export interface CarteraAsesor {
  userId: number;
  fullName: string;
  email: string;
  roleName: string;
}

export interface CarteraReasignacionCambioPayload {
  cuenta: string;
  tramoCodigo: string;
  asesorNuevoUserId: number;
  motivo?: string | null;
}

export interface CarteraAplicacionDetalle {
  cuenta: string;
  tramoCodigo: string;
  asesorAnteriorUserId?: number | null;
  asesorNuevoUserId: number;
  tipoCambio: string;
  eventosMovidos: number;
}

export interface CarteraAplicacionResumen {
  altas: number;
  reasignaciones: number;
  sinCambios: number;
  eventosMovidos: number;
}

export interface CarteraAplicacionResultado {
  detalles: CarteraAplicacionDetalle[];
  resumen: CarteraAplicacionResumen;
}

export interface CarteraGuardarPayload {
  cuenta: string;
  tramos: string[];
  asesorNuevoUserId: number;
  motivo?: string | null;
  fechaCorte?: string | null;
}

export interface CarteraReasignarMasivoPayload {
  cambios: CarteraReasignacionCambioPayload[];
  fechaCorte?: string | null;
}

export interface ListarAsignacionesParams {
  cuenta?: string;
  tramoCodigo?: string;
  asesorUserId?: number;
  soloTramosActivos?: boolean;
}

export interface ListarHistorialParams {
  cuenta?: string;
  tramoCodigo?: string;
  asesorUserId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export function useAsignacionCarterasService() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 12000,
    retries: 0,
    retryDelay: 1000,
  });

  const listarAsignaciones = useCallback(
    (params: ListarAsignacionesParams = {}) => {
      return request({
        method: "GET",
        url: "/asignacion-carteras/asignaciones",
        params,
      });
    },
    [request]
  );

  const listarAsesores = useCallback(
    (soloActivos = true) => {
      return request({
        method: "GET",
        url: "/asignacion-carteras/asesores",
        params: { soloActivos },
      });
    },
    [request]
  );

  const listarHistorial = useCallback(
    (params: ListarHistorialParams = {}) => {
      return request({
        method: "GET",
        url: "/asignacion-carteras/historial",
        params,
      });
    },
    [request]
  );

  const guardarAsignacion = useCallback(
    (payload: CarteraGuardarPayload) => {
      return request({
        method: "POST",
        url: "/asignacion-carteras/guardar",
        data: payload,
      });
    },
    [request]
  );

  const reasignarMasivo = useCallback(
    (payload: CarteraReasignarMasivoPayload) => {
      return request({
        method: "POST",
        url: "/asignacion-carteras/reasignar-masivo",
        data: payload,
      });
    },
    [request]
  );

  return {
    loading,
    error,
    listarAsignaciones,
    listarAsesores,
    listarHistorial,
    guardarAsignacion,
    reasignarMasivo,
  };
}
