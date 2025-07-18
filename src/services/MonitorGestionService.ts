import { handleApiResponse } from '@app/utils/handleApiResponse';

export interface Gestion {
  id: number;
  numefac: string;
  cliente: string;
  cuenta: string;
  usuario: number;
  fechaHora: string;
  descripcion: string;
  tipoContacto: string;
  idGrabacionLlamada: string;
}

export interface Evento {
  id: number;
  idGestion: number;
  cliente: string;
  idUsuarioAsignado: number;
  idTipoEvento: number;
  fechaHoraProgramada: string;
  descripcion: string;
  montoCompromiso: number | null;
  cumplido: boolean;
  fechaCumplimiento: string | null;
}

export interface MonitorGestionResponse {
  success: boolean;
  message: string;
  data: {
    gestiones: Gestion[];
    eventos: Evento[];
  };
  statusCode: number;
  errors: string[];
}

export const obtenerGestionesEventos = async (pageNumber: number, pageSize: number): Promise<MonitorGestionResponse> => {
  try {
    const response = await fetch(`https://localhost:7013/api/MonitorGestion/gestiones-eventos?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
      method: 'GET',
      headers: {
        'accept': '*/*'
      }
    });

    return await handleApiResponse<MonitorGestionResponse>(response);
  } catch (error) {
    console.error('Error al obtener gestiones y eventos:', error);
    throw error;
  }
}; 