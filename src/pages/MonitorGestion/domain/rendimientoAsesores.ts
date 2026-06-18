import type { TableColumn } from "@app/pages/ConsultaClientes/components/tablaReutilizables";
import type { ProductividadAsesorDto } from "@models/ProductividadAsesorDto";
import { StringToMoney } from "../../../utils/formattersFunctions";
import type {
  RendimientoAsesoresFilters,
  RendimientoAsesoresParams,
} from "./types";

export function formatDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function buildDefaultRendimientoAsesoresFilters(
  now: Date = new Date(),
): RendimientoAsesoresFilters {
  const today = formatDateInputValue(now);

  return {
    fechaInicial: today,
    fechaFinal: today,
  };
}

export function buildRendimientoAsesoresParams(
  userId: number | string | null | undefined,
  filters: RendimientoAsesoresFilters,
): RendimientoAsesoresParams | null {
  const normalizedUserId = Number(userId);

  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    return null;
  }

  return {
    IdUsuario: normalizedUserId,
    FechaInicial: filters.fechaInicial,
    FechaFinal: filters.fechaFinal,
  };
}

export function normalizeProductividadAsesoresRows(
  rows: ProductividadAsesorDto[] | null | undefined,
): ProductividadAsesorDto[] {
  return (rows ?? []).map((item) => ({
    ...item,
    whatsApp: item.whatsApp ?? 0,
  }));
}

export function buildRendimientoAsesoresColumns(): TableColumn[] {
  return [
    { id: "asesor", label: "Asesor" },
    { id: "totalGestiones", label: "Total Gestiones", align: "right" },
    { id: "clientesGestionados", label: "Clientes", align: "right" },
    { id: "contactoDirecto", label: "Contacto Directo", align: "right" },
    { id: "whatsApp", label: "WhatsApp", align: "right" },
    { id: "contactoIndirecto", label: "Contacto Indirecto", align: "right" },
    { id: "noContacto", label: "No Contacto", align: "right" },
    { id: "numCompromisosdePago", label: "# Compromisos", align: "right" },
    {
      id: "acumuladoCompromisos",
      label: "Acumulado",
      align: "right",
      format: formatMoneyCell,
    },
    {
      id: "acumuladoCompromisosCumplidos",
      label: "Acum. Cumplidos",
      align: "right",
      format: formatMoneyCell,
    },
  ];
}

function formatMoneyCell(value: unknown): string {
  return (
    "$ " +
    StringToMoney(
      typeof value === "number" || typeof value === "string" ? value : 0,
    )
  );
}
