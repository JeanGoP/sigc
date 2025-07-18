import { ApiResponse } from '@app/models/apiResponse';

export interface Bitacora {
  id: number;
  cliente: string;
  usuario: string;
  fechaHora: string;
  comentario: string;
  calificacion: number;
}

export interface BitacoraResponse {
  success: boolean;
  message: string;
  data: Bitacora[];
  statusCode: number;
  errors: string[];
}

export interface BitacoraInsertResponse {
  success: boolean;
  message: string;
  data: boolean;
  statusCode: number;
  errors: string[];
}

export interface ResumenBitacora {
  cliente: string;
  totalCalificaciones: number;
  promedioCalificacion: number;
  cantidad1: number;
  cantidad2: number;
  cantidad3: number;
  cantidad4: number;
  cantidad5: number;
}

export interface ResumenBitacoraResponse {
  success: boolean;
  message: string;
  data: ResumenBitacora;
  statusCode: number;
  errors: string[];
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'accept': '*/*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const obtenerBitacoras = async (cliente: string): Promise<ApiResponse<Bitacora[]>> => {
  try {
    const response = await fetch(`https://localhost:7013/api/BitacoraCliente/listar/${cliente}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener las bitácoras');
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al obtener las bitácoras',
      data: [],
      statusCode: 500,
      errors: [error.message || 'Error desconocido']
    };
  }
};

export const crearBitacora = async (bitacora: Omit<Bitacora, 'id'>): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch('https://localhost:7013/api/BitacoraCliente/insertar', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: 0,
        cliente: bitacora.cliente,
        usuario: bitacora.usuario,
        fechaHora: bitacora.fechaHora,
        comentario: bitacora.comentario,
        calificacion: bitacora.calificacion
      })
    });

    if (!response.ok) {
      throw new Error('Error al crear la bitácora');
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al crear la bitácora',
      data: null,
      statusCode: 500,
      errors: [error.message || 'Error desconocido']
    };
  }
};

export const obtenerResumenBitacora = async (cliente: string): Promise<ApiResponse<ResumenBitacora>> => {
  try {
    const response = await fetch(`https://localhost:7013/api/BitacoraCliente/resumen_bitacora/${cliente}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener el resumen de la bitácora');
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al obtener el resumen de la bitácora',
      data: {
        cliente: cliente,
        totalCalificaciones: 0,
        promedioCalificacion: 0,
        cantidad1: 0,
        cantidad2: 0,
        cantidad3: 0,
        cantidad4: 0,
        cantidad5: 0
      },
      statusCode: 500,
      errors: [error.message || 'Error desconocido']
    };
  }
};