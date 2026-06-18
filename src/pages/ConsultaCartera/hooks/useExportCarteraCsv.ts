import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { loadConsultaCarteraFilters } from "../domain/filterStorage";
import { buildFacturasListParams } from "../domain/helpers";

interface UseExportCarteraCsvOptions {
  getFacturasList: (params: object) => Promise<unknown>;
  currentUserId?: string | number;
  fechaConsultaFacturas: string;
  tablaSearch: string;
}

export function useExportCarteraCsv({
  getFacturasList,
  currentUserId,
  fechaConsultaFacturas,
  tablaSearch,
}: UseExportCarteraCsvOptions) {
  const [exporting, setExporting] = useState(false);

  const exportToCsv = useCallback(async () => {
    setExporting(true);
    try {
      const filtros = loadConsultaCarteraFilters();
      const params = buildFacturasListParams({
        fechaConsultaFacturas,
        filtros,
        currentUserId,
        tablaPage: 0,
        tablaRowsPerPage: 99999,
        tablaSearch,
      });

      const response: any = await getFacturasList(params);

      if (!response?.success || !response.data) {
        toast.error("No se pudieron obtener los datos para exportar.");
        return;
      }

      const items = Array.isArray(response.data)
        ? response.data
        : (response.data as any).items ?? [];

      if (items.length === 0) {
        toast.info("No hay registros para exportar.");
        return;
      }

      const headers = Object.keys(items[0]);
      const bom = "\uFEFF";
      const csvRows: string[] = [headers.join(",")];

      for (const item of items) {
        csvRows.push(
          headers
            .map((h) => {
              const val = String(item[h] ?? "");
              if (val.includes(",") || val.includes('"') || val.includes("\n")) {
                return `"${val.replace(/"/g, '""')}"`;
              }
              return val;
            })
            .join(",")
        );
      }

      const blob = new Blob([bom + csvRows.join("\r\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cartera_${fechaConsultaFacturas}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al exportar. Intente de nuevo.");
    } finally {
      setExporting(false);
    }
  }, [getFacturasList, currentUserId, fechaConsultaFacturas, tablaSearch]);

  return { exportToCsv, exporting };
}
