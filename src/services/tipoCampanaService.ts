import { TipoCampana } from '../pages/Campaigns/types/campaign';

interface ApiResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    descripcion: string;
  }>;
  statusCode: number;
  errors: any[];
}

const API_URL = import.meta.env.VITE_API_URL;

const URL_API = API_URL;

export const fetchTiposCampana = async (): Promise<TipoCampana[]> => {
  try {
    const response = await fetch(`${URL_API}/api/v1/listar`);
    if (!response.ok) {
      throw new Error('Error al obtener los tipos de campaña');
    }
    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener los tipos de campaña');
    }

    // Transformar los datos al formato esperado
    return result.data.map(item => ({
      id: parseInt(item.id),
      nombre: item.descripcion
    }));
  } catch (error) {
    console.error('Error en fetchTiposCampana:', error);
    throw error;
  }
}; 