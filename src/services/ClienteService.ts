// src/services/clienteService.ts
import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";

export interface ClienteInfo {
  cliente: string;
  razonSocial: string;
  direccion: string;
  telefono: string;
  email: string;
  ruc: string;
  tipoCliente: string;
  ciudad: string;
  estado: string;
  fechaAlta: string;
  fechaBaja: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  usuarioAlta: string;
  usuarioBaja: string;
}

// Hook especializado
export function useClienteService() {
  const { loading, error, request } = useApi<ClienteInfo>("/api/v1");

  const obtenerCliente = async (
    idCliente: string
  ): Promise<ApiResponse<ClienteInfo> | null> => {
    return await request({
      method: "GET",
      url: `/GetCliente`,
      params: { idCliente },
    });
  };

  return { loading, error, obtenerCliente };
}
