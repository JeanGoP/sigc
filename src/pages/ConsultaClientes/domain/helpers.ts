import type { GridPaginationModel } from "@mui/x-data-grid";
import type { ClientesListRequest } from "@app/services/GestionCartera/ConsultaClientes/clientesService";

export interface FacturaSeleccionada {
  cuenta: string;
  factura: string;
  identificacionCliente: string;
}

export function toggleSelectedRow(
  selectedRows: string[],
  id: string
): string[] {
  if (selectedRows.includes(id)) {
    return selectedRows.filter((rowId) => rowId !== id);
  }

  return [...selectedRows, id];
}

export function buildClientesListRequest(
  paginationModel: GridPaginationModel,
  intMora: string,
  filter = ""
): ClientesListRequest {
  return {
    page: paginationModel.page + 1,
    numpage: paginationModel.pageSize,
    filter,
    intmora: intMora,
  };
}

export function shouldSearchClientes(filter: string): boolean {
  return String(filter ?? "").length > 2;
}

export function toSelectedClienteValue(row: Record<string, unknown>): string {
  return String(row?.id ?? "").trim();
}

export function buildFacturaSeleccionada(
  row: Record<string, unknown>,
  selectedValue: string
): FacturaSeleccionada | null {
  const cuenta = row?.CUENTA ?? row?.cuenta ?? "";
  const factura = row?.NUMEFAC ?? row?.factura ?? "";
  const identificacionCliente =
    row?.cliente ?? row?.identificacionCliente ?? selectedValue ?? "";

  if (!cuenta || !factura || !identificacionCliente) {
    return null;
  }

  return {
    cuenta: String(cuenta),
    factura: String(factura),
    identificacionCliente: String(identificacionCliente),
  };
}

export function buildSeguimientoButtonTitle(
  facturaSeleccionada: FacturaSeleccionada | null
): string {
  return facturaSeleccionada
    ? "Ir a consulta de cartera"
    : "Seleccione una factura con el ícono del ojo";
}
