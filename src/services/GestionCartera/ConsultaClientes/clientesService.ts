// src/services/clientesService.ts
import { useApi } from "@app/hooks/useApi";
// import { ClientesListRequest } from "./GetClientesListByFilter"; // Reutilizamos el tipo que ya tienes

export type ClientesListRequest = {
    page: number;
    numpage: number;
    filter: string;
    intmora: string;
  };

export function useClientesService() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 5000,
  });

  const listarClientes = (params: ClientesListRequest) => {
    return request({
      url: "/GetClientes", // el endpoint que usas
      method: "POST",
      data: params,
    });
  };

  return { loading, error, listarClientes };
}
