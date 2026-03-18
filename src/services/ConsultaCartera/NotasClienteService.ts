import { useApi } from "@app/hooks/useApi";
import { ApiResponse } from "@app/models/apiResponse";

export interface NotaCliente {
  id: string;
  cliente: string;
  userId: number;
  userName: string;
  texto: string;
  creadoEn: string;
}

export function useNotasClienteService() {
  const { request, loading, error } = useApi<any>("/api/v1");

  const listar = async (cliente: string): Promise<ApiResponse<NotaCliente[]> | null> => {
    return await request({
      method: "GET",
      url: "/notas-cliente",
      params: { cliente },
    });
  };

  const insertar = async (nota: Omit<NotaCliente, "creadoEn" | "userName">): Promise<ApiResponse<null> | null> => {
    return await request({
      method: "POST",
      url: "/notas-cliente",
      data: nota,
    });
  };

  const eliminar = async (
    id: string,
    userId: number,
    isAdmin: boolean
  ): Promise<ApiResponse<null> | null> => {
    return await request({
      method: "DELETE",
      url: "/notas-cliente",
      data: { id, userId, isAdmin },
    });
  };

  return { listar, insertar, eliminar, loading, error };
}
