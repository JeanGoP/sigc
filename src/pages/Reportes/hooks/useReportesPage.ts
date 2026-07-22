import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAppSelector } from "@app/store/store";
import { canAccessReporte } from "@app/utils/security";
import { useReportesService, type ReporteItem, type ReporteFiltroItem } from "@app/services/ReportesService";
import type { BuscadorSelectOption } from "@app/components/BuscadorSelect/BuscadorSelect";

interface UseReportesPageResult {
  reportes: ReporteItem[];
  tipos: string[];
  tipoSeleccionado: string;
  reporteSeleccionado: ReporteItem | null;
  filtros: ReporteFiltroItem[];
  filtrosValues: Record<string, string>;
  cargando: boolean;
  generando: boolean;
  pdfPreviewUrl: string | null;
  seleccionarTipo: (tipo: string) => void;
  seleccionarReporte: (codigo: string) => void;
  actualizarFiltro: (paramName: string, value: string) => void;
  generarPDF: () => Promise<void>;
  generarExcel: () => Promise<void>;
  generarCSV: () => Promise<void>;
  cerrarPreviewPDF: () => void;
  descargarPDF: () => void;
  fetchOpcionesFiltro: (spName: string | null, codigoOpcion: string | null, subOpcion: string | null, query: string) => Promise<BuscadorSelectOption[]>;
}

export function useReportesPage(): UseReportesPageResult {
  const { getMenu, getFiltros, getOpcionesFiltro, generarReporte } = useReportesService();
  const reportesPermitidos = useAppSelector((state) => state.security.reportesPermitidos);

  const [todosReportes, setTodosReportes] = useState<ReporteItem[]>([]);
  const [reportes, setReportes] = useState<ReporteItem[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("Todas");
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteItem | null>(null);
  const [filtros, setFiltros] = useState<ReporteFiltroItem[]>([]);
  const [filtrosValues, setFiltrosValues] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [filtrosCache, setFiltrosCache] = useState<Map<string, ReporteFiltroItem[]>>(new Map());
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Filtrar reportes permitidos cuando cambian los datos
  useEffect(() => {
    const filtrados = todosReportes.filter((reporte) =>
      canAccessReporte(reportesPermitidos, reporte.codigoReporte)
    );
    setReportes(filtrados);

    // Si el reporte seleccionado ya no está permitido, limpiarlo
    if (
      reporteSeleccionado &&
      !canAccessReporte(reportesPermitidos, reporteSeleccionado.codigoReporte)
    ) {
      setReporteSeleccionado(null);
      setFiltros([]);
    }
  }, [todosReportes, reportesPermitidos, reporteSeleccionado]);

  // Carga única del menú
  useEffect(() => {
    let cancelado = false;

    (async () => {
      setCargando(true);
      const resp = await getMenu();
      if (cancelado) return;

      if (resp?.success && Array.isArray(resp.data)) {
        const items = resp.data as ReporteItem[];
        setTodosReportes(items);
      }
      setCargando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, [getMenu]);

  // Reiniciar valores al cambiar de reporte
  useEffect(() => {
    setFiltrosValues({});
    setErrorValidacion(null);
  }, [reporteSeleccionado]);

  // Tipos únicos ordenados
  const tipos = ["Todas", ...Array.from(new Set(reportes.map((r) => r.tipo))).sort()];

  const seleccionarTipo = useCallback((tipo: string) => {
    setTipoSeleccionado(tipo);
  }, []);

  const seleccionarReporte = useCallback(
    async (codigo: string) => {
      const reporte = reportes.find((r) => r.codigoReporte === codigo) ?? null;
      setReporteSeleccionado(reporte);

      if (!reporte) {
        setFiltros([]);
        return;
      }

      if (filtrosCache.has(codigo)) {
        setFiltros(filtrosCache.get(codigo)!);
        return;
      }

      const resp = await getFiltros(codigo);
      if (resp?.success && Array.isArray(resp.data)) {
        const items = resp.data as ReporteFiltroItem[];
        setFiltros(items);
        setFiltrosCache((prev) => new Map(prev).set(codigo, items));
      } else {
        setFiltros([]);
      }
    },
    [reportes, filtrosCache, getFiltros]
  );

  const actualizarFiltro = useCallback((paramName: string, value: string) => {
    setFiltrosValues((prev) => ({ ...prev, [paramName]: value }));
    setErrorValidacion(null);
  }, []);

  const validarFiltros = useCallback((): boolean => {
    if (!filtros || filtros.length === 0) return true;

    const faltantes = filtros
      .filter((f) => f.obligatorio && (!filtrosValues[f.paramName] || !filtrosValues[f.paramName].trim()))
      .map((f) => f.label);

    if (faltantes.length > 0) {
      setErrorValidacion(`Campos obligatorios: ${faltantes.join(", ")}`);
      return false;
    }

    setErrorValidacion(null);
    return true;
  }, [filtros, filtrosValues]);

  const cerrarPreviewPDF = useCallback(() => {
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl(null);
  }, [pdfPreviewUrl]);

  const descargarPDF = useCallback(() => {
    if (!pdfPreviewUrl || !reporteSeleccionado) return;
    const a = document.createElement("a");
    a.href = pdfPreviewUrl;
    a.download = `${reporteSeleccionado.codigoReporte}_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [pdfPreviewUrl, reporteSeleccionado]);

  const ejecutarGenerar = useCallback(
    async (formato: "PDF" | "Excel" | "CSV") => {
      if (!reporteSeleccionado) return;
      if (!validarFiltros()) return;

      setGenerando(true);
      try {
        const resultado = await generarReporte(reporteSeleccionado.codigoReporte, formato, filtrosValues);
        if (formato === "PDF" && typeof resultado === "string") {
          setPdfPreviewUrl(resultado);
          toast.success("PDF generado correctamente.");
        } else {
          toast.success(`${formato} generado correctamente.`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al generar el reporte";
        toast.error(msg);
        setErrorValidacion(msg);
      } finally {
        setGenerando(false);
      }
    },
    [reporteSeleccionado, validarFiltros, generarReporte, filtrosValues]
  );

  const generarPDF = useCallback(() => ejecutarGenerar("PDF"), [ejecutarGenerar]);
  const generarExcel = useCallback(() => ejecutarGenerar("Excel"), [ejecutarGenerar]);
  const generarCSV = useCallback(() => ejecutarGenerar("CSV"), [ejecutarGenerar]);

  const fetchOpcionesFiltro = useCallback(
    async (spName: string | null, codigoOpcion: string | null, subOpcion: string | null, query: string): Promise<BuscadorSelectOption[]> => {
      const resp = await getOpcionesFiltro(spName, codigoOpcion, subOpcion, query);
      if (resp?.success && Array.isArray(resp.data)) {
        return (resp.data as Array<{ value?: string; label?: string }>)
          .map((item) => ({
            value: item.value ?? "",
            label: item.label ?? item.value ?? "",
          }))
          .filter((opt) => opt.value);
      }
      return [];
    },
    [getOpcionesFiltro]
  );

  return {
    reportes,
    tipos,
    tipoSeleccionado,
    reporteSeleccionado,
    filtros,
    filtrosValues,
    cargando,
    generando,
    pdfPreviewUrl,
    seleccionarTipo,
    seleccionarReporte,
    actualizarFiltro,
    generarPDF,
    generarExcel,
    generarCSV,
    cerrarPreviewPDF,
    descargarPDF,
    fetchOpcionesFiltro,
  };
}
