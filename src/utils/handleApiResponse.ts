import { toast } from 'react-toastify';
import { ApiResponse } from '@models/apiResponse';

export async function handleApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach(err => toast.error(err));
      } else if (data.errors.length === 0) {
        toast.error(data.message || 'Ocurrió un error inesperado');
      }
      
      else {
        toast.error(data.message || 'Ocurrió un error inesperado');
      }

      console.log('Error en la respuesta del servidor:', data);
      return {
        success: false,
        message: data.message,
        data: [],
        statusCode: data.statusCode,
        errors: data.errors || [],
      };
    }

    return data;
  } catch (error) {
    toast.error('Error al procesar la respuesta del servidor');
    return {
      success: false,
      message: 'Error inesperado al interpretar la respuesta',
      data: [],
      statusCode: 500,
      errors: ['Respuesta malformada del servidor'],
    };
  }
}
