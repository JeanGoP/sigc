import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";

export interface ParametroSistema {
  clave: string;
  valor: string;
  descripcion?: string | null;
  tipo?: string | null;
}

export interface TelephonyConfig {
  telephonyEnabled: boolean;
  source: string;
  description?: string | null;
}

export function useParametrosSistemaService() {
  const { loading, error, request } = useApi<any>("/api/v1", {
    timeout: 10000,
    retries: 0,
    retryDelay: 1000,
  });

  const getTelefoniaConfig = useCallback(() => {
    return request({
      url: "/parametros-sistema/telefonia",
      method: "GET",
    });
  }, [request]);

  const setTelefoniaConfig = useCallback(
    (enabled: boolean) => {
      return request({
        url: "/parametros-sistema/telefonia",
        method: "PUT",
        data: { enabled },
      });
    },
    [request]
  );

  const getParametros = useCallback(() => {
    return request({
      url: "/parametros-sistema",
      method: "GET",
    });
  }, [request]);

  const updateParametro = useCallback(
    (clave: string, valor: string, descripcion?: string, tipo?: string) => {
      return request({
        url: `/parametros-sistema/${encodeURIComponent(clave)}`,
        method: "PUT",
        data: { valor, descripcion, tipo },
      });
    },
    [request]
  );

  return {
    loading,
    error,
    getTelefoniaConfig,
    setTelefoniaConfig,
    getParametros,
    updateParametro,
  };
}

