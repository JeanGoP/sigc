import { ApiResponse } from '@app/models/apiResponse';

export interface ClienteInfo {
  cliente: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  ruc: string;
  tipoCliente: string;
  ciudad: string;
  estado: string;
  fechaAlta: string;
  fechaBaja: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  usuarioAlta: string;
  usuarioBaja: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'accept': '*/*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const obtenerCliente = async (cliente: string): Promise<ApiResponse<ClienteInfo>> => {
  
  try {
    const response = await fetch(`https://localhost:7013/api/Cliente/${cliente}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener el cliente');
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al obtener el cliente',
      data: {} as ClienteInfo,
      statusCode: 500,
      errors: [error.message || 'Error desconocido']
    };
  }
}; 