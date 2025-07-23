import { ApiResponse } from "@app/models/apiResponse";

const API_URL = import.meta.env.VITE_API_URL;

export interface GestionFacturaRequest {
  numefac: string;
  cliente: string;
  cuenta: string;
  usuario: number;
  descripcion: string;
  tipoContacto: string;
  eventos: string;
  idGrabacionLlamada?: string;
}

export const insertarGestionFactura = async (
  data: GestionFacturaRequest
): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${API_URL}/api/v1/InsertarGestionFactura`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return result as ApiResponse<null>;
  } catch (error: any) {
    return {
      success: false,
      message: 'Error en la comunicación con el servidor.',
      data: null,
      statusCode: 500,
      errors: [error.message || 'Error desconocido']
    };
  }
};
