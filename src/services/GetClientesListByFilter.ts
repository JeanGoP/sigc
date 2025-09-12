import { handleApiResponse } from "@app/utils/handleApiResponse";

const API_URL = import.meta.env.VITE_API_URL;


  
//   type ClientesResponse = any; // Puedes tipar esto mejor si conoces la estructura de respuesta
  
// export const  getClientesList = async (data: ClientesListRequest): Promise<ClientesResponse> =>{
//     try {
//       const response = await fetch(`${API_URL}/api/v1/GetClientes`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "*/*"
//         },
//         body: JSON.stringify(data)
//       });

//       // if (!response.ok) {
//       //   throw new Error(`Error ${response.status}: ${response.statusText}`);
//       // }
  
//       // const result = await response.json();
      
//       return await handleApiResponse<ClientesResponse>(response);
//     } catch (error) {
//       console.error("Error al obtener los clientes:", error);
//       throw error;
//     }
//   }
  