import { ApiResponse } from '@app/models/apiResponse';

export interface Factura {
  id: number;
  numero: string;
  fecha: string;
  monto: number;
  estado: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'accept': '*/*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const obtenerFacturas = async (idCliente: string): Promise<ApiResponse<Factura[]>> => {
  try {
    const response = await fetch(`https://localhost:7013/api/Factura/${idCliente}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener las facturas');
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al obtener las facturas',
      data: null,
      statusCode: 500,
      errors: [error.message || 'Error desconocido']
    };
  }
}; 