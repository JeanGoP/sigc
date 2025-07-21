export interface TipoEvento {
  id: number;
  nombre: string;
  descripcion: string;
  requiereMonto: boolean;
  requiereFecha: boolean;
  requiereHora: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

export const obtenerTiposEvento = async (): Promise<TipoEvento[]> => {
  const response = await fetch(`${API_URL}/api/TipoEvento/Listartodo`, {
    method: 'GET',
    headers: {
      'accept': '*/*',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener los tipos de evento');
  }

  const data = await response.json();
  return data.data;
}; 