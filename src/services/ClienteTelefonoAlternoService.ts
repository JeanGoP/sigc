import { useCallback } from "react";
import { ApiResponse } from "@app/models/apiResponse";
import { useApi } from "@app/hooks/useApi";

export interface ClienteTelefonoAlternoDto {
  id: number;
  cliente: string;
  telefono: string;
  telefonoNormalizado: string;
  etiqueta: string;
  observacion?: string | null;
  activo: boolean;
  createdAt: string;
  createdByUserId: number;
  updatedAt?: string | null;
  updatedByUserId?: number | null;
  lastUsedAt?: string | null;
}

export interface ClienteTelefonoAlternoOperationResult {
  outcomeCode: string;
  telefonoAlterno?: ClienteTelefonoAlternoDto | null;
}

export interface SaveClienteTelefonoAlternoPayload {
  telefono: string;
  etiqueta: string;
  observacion?: string | null;
}

export interface UpdateClienteTelefonoAlternoPayload {
  etiqueta: string;
  observacion?: string | null;
  activo: boolean;
}

export interface MarkUsedClienteTelefonoAlternoPayload {
  telefono: string;
}

export function normalizeClienteTelefono(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  let normalized = "";
  for (let index = 0; index < raw.length; index += 1) {
    const current = raw[index];
    if (/\d/.test(current)) {
      normalized += current;
      continue;
    }

    if (current === "+" && normalized.length === 0) {
      normalized += current;
    }
  }

  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  }

  return normalized === "+" ? "" : normalized;
}

export function useClienteTelefonoAlternoService() {
  const listApi = useApi<ClienteTelefonoAlternoDto[]>("/api/v1");
  const saveApi = useApi<ClienteTelefonoAlternoOperationResult>("/api/v1");
  const updateApi = useApi<ClienteTelefonoAlternoOperationResult>("/api/v1");
  const markUsedApi = useApi<ClienteTelefonoAlternoOperationResult>("/api/v1");

  const listarTelefonosAlternos = useCallback(
    async (cliente: string): Promise<ApiResponse<ClienteTelefonoAlternoDto[]> | null> => {
      return listApi.request({
        method: "GET",
        url: `/clientes/${encodeURIComponent(cliente)}/telefonos-alternos`,
      });
    },
    [listApi.request]
  );

  const guardarTelefonoAlterno = useCallback(
    async (
      cliente: string,
      payload: SaveClienteTelefonoAlternoPayload
    ): Promise<ApiResponse<ClienteTelefonoAlternoOperationResult> | null> => {
      return saveApi.request({
        method: "POST",
        url: `/clientes/${encodeURIComponent(cliente)}/telefonos-alternos`,
        data: payload,
      });
    },
    [saveApi.request]
  );

  const actualizarTelefonoAlterno = useCallback(
    async (
      id: number,
      payload: UpdateClienteTelefonoAlternoPayload
    ): Promise<ApiResponse<ClienteTelefonoAlternoOperationResult> | null> => {
      return updateApi.request({
        method: "PUT",
        url: `/clientes/telefonos-alternos/${id}`,
        data: payload,
      });
    },
    [updateApi.request]
  );

  const marcarTelefonoAlternoComoUsado = useCallback(
    async (
      cliente: string,
      payload: MarkUsedClienteTelefonoAlternoPayload
    ): Promise<ApiResponse<ClienteTelefonoAlternoOperationResult> | null> => {
      return markUsedApi.request({
        method: "POST",
        url: `/clientes/${encodeURIComponent(cliente)}/telefonos-alternos/mark-used`,
        data: payload,
      });
    },
    [markUsedApi.request]
  );

  return {
    listarTelefonosAlternos,
    guardarTelefonoAlterno,
    actualizarTelefonoAlterno,
    marcarTelefonoAlternoComoUsado,
    loadingTelefonosAlternos: listApi.loading,
    loadingGuardarTelefonoAlterno: saveApi.loading,
    loadingActualizarTelefonoAlterno: updateApi.loading,
    loadingMarcarTelefonoAlternoComoUsado: markUsedApi.loading,
    errorTelefonosAlternos: listApi.error,
    errorGuardarTelefonoAlterno: saveApi.error,
    errorActualizarTelefonoAlterno: updateApi.error,
    errorMarcarTelefonoAlternoComoUsado: markUsedApi.error,
  };
}
