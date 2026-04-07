// src/services/eventosService.ts
import { useApi } from "@app/hooks/useApi";
import { useCallback } from "react";

export interface Evento {
  title: string;
  start: string | Date;
  end: string | Date;
  monto: string;
  descripcion: string;
  usuario: string;
  tipoEvento: string;
  identificacionCliente: string;
  cuenta: string; // agregado
  factura: string; // agregado
  icono: string;
  color: string;
  estado: string;
}

export interface ListarModificacionEventosRequest {
  fechaInicio: string;
  fechaFin: string;
  userId?: number | null;
  cuenta?: string | null;
  cliente?: string | null;
  tipoEventoId?: number | null;
  page: number;
  pageSize: number;
}

export interface ActualizarModificacionEventoRequest {
  idEvento: number;
  idUsuarioAsignado?: number;
  idTipoEvento?: number;
  fechaHoraProgramada?: string;
  montoCompromiso?: number | null;
}

export interface CrearEventoGestionRequest {
  idGestion: number;
  idUsuarioAsignado: number;
  idTipoEvento: number;
  fechaHoraProgramada?: string;
  montoCompromiso?: number | null;
}

export interface EliminarEventoGestionRequest {
  idEvento: number;
}

export interface EliminarGestionRequest {
  idGestion: number;
}

export interface ActualizarDescripcionGestionRequest {
  idGestion: number;
  descripcion: string;
}

export interface ListarGestionesModificacionRequest {
  fechaInicio: string;
  fechaFin: string;
  userId?: number | null;
  cuenta?: string | null;
  cliente?: string | null;
  filtro?: string | null;
  page: number;
  pageSize: number;
}

export function useEventosService() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 3000,
  });

  const obtenerUsuariosPorRol = useCallback((roleName: string, iduser: number) => {
    return request({
      url: "/PorRol",
      method: "POST",
      data: { roleName, iduser },
    });
  }, [request]);

  const obtenerEventos = useCallback((params: {
    eventosAnteriores: boolean;
    eventosCumplidos: boolean;
    userId?: string | number;
    cuentaFiltro?: string | null;
    fechaInicio?: string;
    fechaFin?: string;
  }) => {
    return request({
      url: "/ObtenerEventos",
      method: "GET",
      params,
    });
  }, [request]);

  const listarModificacionEventos = useCallback((data: ListarModificacionEventosRequest) => {
    return request({
      url: "/modificacion-eventos/listar",
      method: "POST",
      data,
    });
  }, [request]);

  const actualizarModificacionEvento = useCallback(
    (data: ActualizarModificacionEventoRequest) => {
      return request({
        url: "/modificacion-eventos/actualizar",
        method: "POST",
        data,
      });
    },
    [request]
  );

  const crearEventoGestion = useCallback(
    (data: CrearEventoGestionRequest) => {
      return request({
        url: "/modificacion-gestiones/agregar-evento",
        method: "POST",
        data,
      });
    },
    [request]
  );

  const eliminarEventoGestion = useCallback(
    (data: EliminarEventoGestionRequest) => {
      return request({
        url: "/modificacion-gestiones/eliminar-evento",
        method: "POST",
        data,
      });
    },
    [request]
  );

  const eliminarGestion = useCallback(
    (data: EliminarGestionRequest) => {
      return request({
        url: "/modificacion-gestiones/eliminar",
        method: "POST",
        data,
      });
    },
    [request]
  );

  const actualizarDescripcionGestion = useCallback(
    (data: ActualizarDescripcionGestionRequest) => {
      return request({
        url: "/modificacion-gestiones/actualizar-descripcion",
        method: "POST",
        data,
      });
    },
    [request]
  );

  const listarGestionesModificacion = useCallback(
    (data: ListarGestionesModificacionRequest) => {
      return request({
        url: "/modificacion-gestiones/listar",
        method: "POST",
        data,
      });
    },
    [request]
  );

  return {
    loading,
    error,
    obtenerUsuariosPorRol,
    obtenerEventos,
    listarModificacionEventos,
    actualizarModificacionEvento,
    listarGestionesModificacion,
    crearEventoGestion,
    eliminarEventoGestion,
    eliminarGestion,
    actualizarDescripcionGestion,
  };
}
