import { useCallback } from "react";
import { useApi } from "@app/hooks/useApi";

export interface ReporteItem {
  reporteId: number;
  codigoReporte: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  spName: string;
  iconClass: string | null;
  handlerClass: string | null;
  sortOrder: number;
}

export interface ReporteFiltroItem {
  filtroId: number;
  nombre: string;
  label: string;
  tipoFiltro: string;
  obligatorio: boolean;
  paramName: string;
  spOpciones: string | null;
  codigoOpcion: string | null;
  subOpcion: string | null;
  valorDefault: string | null;
  orden: number;
}

export function useReportesService() {
  const { request } = useApi<unknown>("/api/v1/reportes", {
    timeout: 10000,
    retries: 0,
  });

  const getMenu = useCallback(async () => {
    return request({
      method: "GET",
      url: "/menu",
    });
  }, [request]);

  const getFiltros = useCallback(
    async (codigoReporte: string) => {
      return request({
        method: "GET",
        url: `/${codigoReporte}/filtros`,
      });
    },
    [request]
  );

  const getOpcionesFiltro = useCallback(
    async (spName: string | null, codigoOpcion: string | null, subOpcion: string | null, query: string) => {
      return request({
        method: "GET",
        url: "/opcionesfiltro",
        params: { sp: spName, codigoOpcion, subOpcion, q: query },
      });
    },
    [request]
  );

  const generarReporte = useCallback(
    async (
      codigoReporte: string,
      formato: "PDF" | "Excel" | "CSV",
      filtros: Record<string, string>
    ): Promise<string | void> => {
      const response = await request({
        method: "POST",
        url: "/generar",
        data: { codigoReporte, formato, filtros },
        responseType: "blob",
      });

      if (!response) throw new Error("Error al generar reporte");

      const blob = response as unknown as Blob;

      // Si el servidor devolvió JSON de error (ej. 400), el blob es JSON
      if (blob.type === "application/json") {
        const text = await blob.text();
        let message = "Error al generar reporte";
        try {
          const errData = JSON.parse(text);
          message = errData.message || errData.Message || message;
          if (errData.errors?.length) {
            message += `: ${errData.errors.join("; ")}`;
          }
        } catch {
          // si no se puede parsear, usar mensaje genérico
        }
        throw new Error(message);
      }

      const extension = formato === "Excel" ? "xlsx" : formato.toLowerCase();
      const url = window.URL.createObjectURL(blob);

      // PDF: devolver el URL para previsualizacion
      if (formato === "PDF") {
        return url;
      }

      // Excel/CSV: descargar automaticamente
      const a = document.createElement("a");
      a.href = url;
      a.download = `${codigoReporte}_${new Date().toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    [request]
  );

  return { getMenu, getFiltros, getOpcionesFiltro, generarReporte };
}
