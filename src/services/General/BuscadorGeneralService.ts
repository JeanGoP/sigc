import { useApi } from "../../hooks/useApi";

export type BuscadorOpcion = "CU" | "PR" | "CL" | "FA" | string;

export interface BuscadorParams {
  opcion: BuscadorOpcion;
  filtro?: string;
  op?: string;
  op2?: string;
  signal?: AbortSignal;
}

export interface CuentaResumen {
  id?: string;
  codigo?: string;
  nombre?: string;
  documento?: string;
}

export function useBuscadorGeneralService() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 5000,
    retries: 2,
    retryDelay: 3000,
  });

  const buscarGeneral = (params: BuscadorParams) => {
    const { signal, ...rest } = params;
    return request({
      url: "/BuscadorGeneral",
      method: "GET",
      params: rest,
      signal,
    });
  };

  return { loading, error, buscarGeneral };
}