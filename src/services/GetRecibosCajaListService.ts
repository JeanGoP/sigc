// api/recibosCajaService.ts
import { handleApiResponse } from "@app/utils/handleApiResponse";
import { ReciboCajaListModel } from "../models/recibocaja/recibocajaListoModel";
import { ApiResponse } from "@app/models/apiResponse";

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'accept': '*/*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export async function ObtenerRecibosCajaPorFactura(
  fecha: string,
  cliente: string,
  factura: string
): Promise<ApiResponse<ReciboCajaListModel[]>> {
  try {
    const url = new URL('https://localhost:7013/api/GetRecibosCajaListByFactura');
    url.searchParams.append('fecha', fecha);
    url.searchParams.append('cliente', cliente);
    url.searchParams.append('factura', factura);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error al obtener recibos: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al obtener los recibos de caja',
      data: [],
      statusCode: 500,
      errors: [error.message || 'Error desconocido']
    };
  }
}
