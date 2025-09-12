// src/services/eventosService.ts
import { useApi } from "@app/hooks/useApi";

export interface Evento {
  title: string;
  start: string | Date;
  end: string | Date;
  monto: string;
  descripcion: string;
  usuario: string;
  nombreCliente: string;
  identificacionCliente: string;
  cuenta: string; // agregado
  factura: string; // agregado
  icono: string;
  color: string;
  estado: string;
}

export function useEventosService() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 3000,
  });

  const obtenerUsuariosPorRol = (roleName: string, iduser: number) => {
    return request({
      url: "/PorRol",
      method: "POST",
      data: { roleName, iduser },
    });
  };

  const obtenerEventos = (params: {
    eventosAnteriores: boolean;
    eventosCumplidos: boolean;
    userId?: string | number;
  }) => {
    return request({
      url: "/ObtenerEventos",
      method: "GET",
      params,
    });
  };

  return { loading, error, obtenerUsuariosPorRol, obtenerEventos };
}
