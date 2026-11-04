export interface DataCreditoPrefijoItem {
  id: number;
  cuenta: string;
  descripcionCuenta: string | null;
  prefijo: string;
  separador: string;
  manejoNumero: "ULTIMOS_4" | "QUITAR_CEROS" | "MANTENER" | "PAD_LEFT";
  longitudPadding: number;
  sufijo: string | null;
  ejemploFactura: string;
  ejemploObligacion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface DataCreditoPrefijoListResponse {
  items: DataCreditoPrefijoItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface DataCreditoEstadisticas {
  total: number;
  activos: number;
  inactivos: number;
}

export interface CuentaCarteraDisponible {
  codigoCuenta: string;
  nombreCuenta: string;
  yaConfigurada: boolean;
}

export interface SaveDataCreditoPrefijoPayload {
  cuenta: string;
  descripcionCuenta?: string | null;
  prefijo: string;
  separador?: string;
  manejoNumero: "ULTIMOS_4" | "QUITAR_CEROS" | "MANTENER" | "PAD_LEFT";
  longitudPadding?: number;
  sufijo?: string | null;
  ejemploFactura?: string;
  activo: boolean;
}

export interface PreviewDataCreditoPayload {
  cuenta?: string;
  prefijo: string;
  separador?: string;
  manejoNumero: string;
  longitudPadding?: number;
  sufijo?: string | null;
  ejemploFactura?: string;
}

export interface PreviewDataCreditoResponse {
  factura: string;
  obligacion: string;
}
