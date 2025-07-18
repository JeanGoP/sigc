export interface TipoEvento {
  id: number;
  nombre: string;
  descripcion: string;
  requiereMonto: boolean;
  requiereFecha: boolean;
  requiereHora: boolean;
}

export const obtenerTiposEvento = async (): Promise<TipoEvento[]> => {
  const response = await fetch('https://localhost:7013/api/TipoEvento/Listartodo', {
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