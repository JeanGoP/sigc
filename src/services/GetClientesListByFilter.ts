import { handleApiResponse } from "@app/utils/handleApiResponse";

export type ClientesListRequest = {
    page: number;
    numpage: number;
    filter: string;
    intmora: string;
  };
  
  type ClientesResponse = any; // Puedes tipar esto mejor si conoces la estructura de respuesta
  
export const  getClientesList = async (data: ClientesListRequest): Promise<ClientesResponse> =>{
    try {
      const response = await fetch("https://localhost:7013/api/Clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*"
        },
        body: JSON.stringify(data)
      });

      // if (!response.ok) {
      //   throw new Error(`Error ${response.status}: ${response.statusText}`);
      // }
  
      // const result = await response.json();
      
      return await handleApiResponse<ClientesResponse>(response);
    } catch (error) {
      console.error("Error al obtener los clientes:", error);
      throw error;
    }
  }
  