export interface TipoContacto {
  id: string;
  descripcion: string;
}

const API_URL = import.meta.env.VITE_API_URL;

export const obtenerTiposContacto = async (
  filtro: string
): Promise<TipoContacto[]> => {
  filtro = "";
  const response = await fetch(
    `${API_URL}/api/v1/listarForNuevaGestion?filtro=${encodeURIComponent("w")}`,
    {
      method: "GET",
      headers: {
        accept: "*/*",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener los tipos de contacto");
  }

  const data = await response.json();
  return data.data; // Asegúrate de que el JSON devuelto tenga `{ data: [...] }`
};
