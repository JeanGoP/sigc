// import { ApiResponse } from "@app/models/apiResponse";
// import { faC } from "@fortawesome/free-solid-svg-icons";
// import { toast } from "react-toastify";

// const API_URL = import.meta.env.VITE_API_URL;

// export interface GestionFactura {
//   id: number;
//   factura: string;
//   cliente: string;
//   usuario: string;
//   fechaHora: string;
//   comentario: string;
//   calificacion: number;
// }

// export interface GestionFacturaRequest {
//   numefac: string;
//   cliente: string;
//   cuenta: string;
//   usuario: number;
//   descripcion: string;
//   tipoContacto: string | number;
//   eventos: string;
//   idGrabacionLlamada: string;
// }

// export interface GestionFacturaResponse {
//   success: boolean;
//   message: string;
//   data: GestionFactura[];
//   statusCode: number;
//   errors: string[];
// }

// export interface GestionFacturaInsertResponse {
//   success: boolean;
//   message: string;
//   data: boolean;
//   statusCode: number;
//   errors: string[];
// }

// export interface Gestion {
//   id: number;
//   numefac: string;
//   cliente: string;
//   cuenta: string;
//   usuario: number;
//   fechaHora: Date;
//   descripcion: string;
//   tipoContacto: string;
//   idGrabacionLlamada: string;
// }

// export interface EventosGestion {
//   id: number;
//   idGestion: number;
//   cliente: string;
//   idUsuarioAsignado: number | null;
//   tipoEvento: string | null;
//   color: string | null;
//   icono: string | null;
//   fechaHoraProgramada: string | null;
//   descripcion: string;
//   montoCompromiso: number | null;
//   cumplido: boolean;
//   fechaCumplimiento: string | null;
// }

// export interface GestionesEventosFacturaResulta {
//   gestiones: Gestion[];
//   eventos: EventosGestion[];
// }

// const getAuthHeaders = () => {
//   const token = localStorage.getItem("token");
//   return {
//     accept: "*/*",
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${token}`,
//   };
// };

// export const buscarGestiones = async (
//   factura: string,
//   cliente: string,
//   cuenta: string
// ): Promise<ApiResponse<GestionesEventosFacturaResulta>> => {
//   try {
//     const response = await fetch(
//       `${API_URL}/api/v1/BuscarGestiones?numefac=${factura}&cliente=${cliente}&cuenta=${cuenta}`,
//       {
//         method: "GET",
//         headers: getAuthHeaders(),
//       }
//     );

//     if (!response.ok) {
//       throw new Error("Error al buscar las gestiones");
//     }

//     const result = await response.json();
//     return result;
//   } catch (error: any) {
//     return {
//       success: false,
//       message: "Error al buscar las gestiones",
//       data: { gestiones: [], eventos: [] },
//       statusCode: 500,
//       errors: [error.message || "Error desconocido"],
//     };
//   }
// };

// export const GestionarFactura = async (
//   gestion: GestionFacturaRequest
// ): Promise<ApiResponse<null>> => {
//   let responseData2: any;
//   try {
//     const response = await fetch(`${API_URL}/api/v1/InsertarGestionFactura`, {
//       method: "POST",
//       headers: getAuthHeaders(),
//       body: JSON.stringify(gestion),
//     });

//     const responseData: GestionFacturaInsertResponse = await response.json();
//     console.log("Response Data:", responseData);

//     responseData2 = responseData;

//     if (!response.ok) {
//       responseData.errors.forEach((error) => toast.error("Error: " + error));
//       // toast.error('Error al guardar el seguimiento');
//       throw new Error("Error al gestionar la factura");
//     }

//     return await response.json();
//   } catch (error: any) {
//     return responseData2;
//     // {
//     //   success: false,
//     //   message: 'Error al gestionar la factura',
//     //   data: null,
//     //   statusCode: 500,
//     //   errors: [error.message || 'Error desconocido']
//     // };
//   }
// };

// src/services/GestionFacturaService.ts
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";

export interface GestionFactura {
  id: number;
  factura: string;
  cliente: string;
  usuario: string;
  fechaHora: string;
  comentario: string;
  calificacion: number;
}

export interface GestionFacturaRequest {
  numefac: string;
  cliente: string;
  cuenta: string;
  usuario: number;
  descripcion: string;
  tipoContacto: string | number;
  eventos: string;
  idGrabacionLlamada: string;
}

export interface GestionFacturaResponse {
  success: boolean;
  message: string;
  data: GestionFactura[];
  statusCode: number;
  errors: string[];
}

export interface GestionFacturaInsertResponse {
  success: boolean;
  message: string;
  data: boolean;
  statusCode: number;
  errors: string[];
}

export interface Gestion {
  id: number;
  numefac: string;
  cliente: string;
  cuenta: string;
  usuario: number;
  fechaHora: Date | string;
  descripcion: string;
  tipoContacto: string;
  idGrabacionLlamada: string;
}

export interface EventosGestion {
  id: number;
  idGestion: number;
  cliente: string;
  idUsuarioAsignado: number | null;
  tipoEvento: string | null;
  color: string | null;
  icono: string | null;
  fechaHoraProgramada: string | null;
  descripcion: string;
  montoCompromiso: number | null;
  cumplido: boolean;
  fechaCumplimiento: string | null;
}

export interface GestionesEventosFacturaResulta {
  gestiones: Gestion[];
  eventos: EventosGestion[];
}

// Hook service
export function useGestionFacturaService() {
  const buscarApi = useApi<GestionesEventosFacturaResulta>("/api/v1/BuscarGestiones");
  const insertarApi = useApi<GestionFacturaInsertResponse>("/api/v1/InsertarGestionFactura");

  // Buscar gestiones
  const buscarGestiones = async (factura: string, cliente: string, cuenta: string) => {
    return await buscarApi.request({
      method: "GET",
      params: { numefac: factura, cliente, cuenta },
    });
  };

  // Insertar gestión
  const GestionarFactura = async (gestion: GestionFacturaRequest) => {
    return await insertarApi.request({
      method: "POST",
      data: gestion,
    });
  };

  return {
    buscarGestiones,
    GestionarFactura,
    loadingBuscar: buscarApi.loading,
    errorBuscar: buscarApi.error,
    loadingInsertar: insertarApi.loading,
    errorInsertar: insertarApi.error,
  };
}
