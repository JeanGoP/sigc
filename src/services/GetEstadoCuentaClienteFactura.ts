import { ApiResponse } from '@app/models/apiResponse';

export interface EstadoCuentaRequest {
    cuenta: string;
    fecha: string;
    cliente: string;
    factura: string;
    intMora: number;
  }
  
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'accept': '*/*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const FetchEstadoCuentaClienteFactura = async (request: EstadoCuentaRequest): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch('https://localhost:7013/api/EstadoCuentaClienteFactura', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    });
  
    if (!response.ok) {
      throw new Error('Error al obtener el estado de cuenta');
    }
  
    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al obtener el estado de cuenta',
      data: [],
      statusCode: 500,
      errors: [error.message || 'Error desconocido']
    };
  }
};