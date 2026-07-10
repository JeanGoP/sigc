import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import type { ApiResponse } from "@app/models/apiResponse";
import type { ClienteInfo } from "@app/services/ClienteService";
import type { FacturaListResponse } from "@app/services/ConsultaCartera/ConsultaCarteraServices";
import type { FetchFacturasRef } from "@app/pages/ConsultaClientes/components/EstadoClienteCompleto";
import {
  ensureConsultaCarteraFilters,
  loadConsultaCarteraFilters,
  updateConsultaCarteraFilterProperty,
} from "../domain/filterStorage";
import {
  buildFacturaMontoSuggestion,
  buildFallbackFacturaSelectionFromSearchParams,
  buildFacturaSelection,
  buildFacturasListParams,
  type FacturaSelection,
  findFacturaRowBySearchParams,
  hasConsultaCarteraSearchSelection,
  parseConsultaCarteraSearchParams,
  resolveConsultaCarteraSearchValue,
} from "../domain/helpers";

type ConsultaCarteraRow = Record<string, unknown>;

interface UseConsultaCarteraControllerOptions {
  currentUserId?: string | number;
  getFacturasList: (
    params: object
  ) => Promise<ApiResponse<FacturaListResponse | ConsultaCarteraRow[]> | null>;
  obtenerCliente: (idCliente: string) => Promise<ApiResponse<ClienteInfo> | null>;
}

export function useConsultaCarteraController({
  currentUserId,
  getFacturasList,
  obtenerCliente,
}: UseConsultaCarteraControllerOptions) {
  const location = useLocation();

  const tablaFacturasRef = useRef<FetchFacturasRef>(null);
  const obtenerClienteRef = useRef(obtenerCliente);
  const clienteInfoRequestIdRef = useRef(0);

  const [selectedValue, setSelectedValue] = useState("");
  const [registroSeleccionado, setRegistroSeleccionado] = useState<any>(null);
  const [filtroSaldoCero, setFiltroSaldoCero] = useState(false);
  const [fechaConsultaFacturas, setFechaConsultaFacturas] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tablaRows, setTablaRows] = useState<ConsultaCarteraRow[]>([]);
  const [tablaTotalRows, setTablaTotalRows] = useState(0);
  const [totalSaldoCartera, setTotalSaldoCartera] = useState(0);
  const [tablaLoading, setTablaLoading] = useState(false);
  const [tablaSearch, setTablaSearch] = useState("");
  const [tablaRowsPerPage, setTablaRowsPerPage] = useState(50);
  const [tablaPage, setTablaPage] = useState(0);
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [activeTab, setActiveTab] = useState<string>("info");
  const [isSeguimientoDraftOpen, setIsSeguimientoDraftOpen] = useState(false);
  const [montoEventoSugerido, setMontoEventoSugerido] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    obtenerClienteRef.current = obtenerCliente;
  }, [obtenerCliente]);

  const handleFechaFiltroChange = useCallback((date: string | null) => {
    if (!date) {
      return;
    }

    updateConsultaCarteraFilterProperty("fechaConsulta", date);
    setFechaConsultaFacturas(date);
  }, []);

  const cargarInfoCliente = useCallback(
    async (idCliente: string) => {
      const requestId = ++clienteInfoRequestIdRef.current;

      try {
        const response = await obtenerClienteRef.current(idCliente);
        if (requestId !== clienteInfoRequestIdRef.current) {
          return;
        }

        if (response?.success) {
          setClienteInfo(response.data ?? null);
        } else {
          setClienteInfo(null);
        }
      } catch (error) {
        console.error("Error al cargar información del cliente:", error);
        setClienteInfo(null);
        toast.error("No se pudo cargar la información del cliente.");
      }
    },
    []
  );

  const fetchFacturas = useCallback(
    async (filterOverride?: string): Promise<ConsultaCarteraRow[]> => {
      setTablaLoading(true);
      let resultRows: ConsultaCarteraRow[] = [];

      try {
        const filtros = loadConsultaCarteraFilters();
        setFiltroSaldoCero(filtros.checkIncluirSaldosCero);

        const params = buildFacturasListParams({
          fechaConsultaFacturas,
          filtros,
          currentUserId,
          tablaPage,
          tablaRowsPerPage,
          tablaSearch,
          filterOverride,
        });

        const data = await getFacturasList(params);
        if (data?.success && data.data) {
          const responseData = data.data as any;

          if (Array.isArray(responseData)) {
            resultRows = responseData;
            setTablaRows(resultRows);
            setTablaTotalRows(resultRows.length);
            setTotalSaldoCartera(0);
          } else if (Array.isArray(responseData.items)) {
            resultRows = responseData.items as unknown as ConsultaCarteraRow[];
            setTablaRows(resultRows);
            setTablaTotalRows(
              typeof responseData.total === "number" ? responseData.total : resultRows.length
            );
            setTotalSaldoCartera(
              typeof responseData.totalValorMora === "number" ? responseData.totalValorMora : 0
            );
          } else {
            setTablaRows([]);
            setTablaTotalRows(0);
            setTotalSaldoCartera(0);
          }
        } else {
          setTablaRows([]);
          setTablaTotalRows(0);
          setTotalSaldoCartera(0);
        }
      } catch {
        setTablaRows([]);
        setTablaTotalRows(0);
      }

      setTablaLoading(false);
      return resultRows;
    },
    [
      currentUserId,
      fechaConsultaFacturas,
      getFacturasList,
      tablaPage,
      tablaRowsPerPage,
      tablaSearch,
    ]
  );

  const limpiarSeleccion = useCallback(() => {
    setIsSeguimientoDraftOpen(false);
    setRegistroSeleccionado(null);
    setMontoEventoSugerido(undefined);
    setSelectedValue("");
    setActiveTab("info");
  }, []);

  const handleSeleccionarFactura = useCallback(
    (row: Record<string, unknown> | FacturaSelection) => {
      const seleccionado = buildFacturaSelection(
        row as Record<string, unknown>,
        selectedValue
      );

      setRegistroSeleccionado(seleccionado);
      setMontoEventoSugerido(
        buildFacturaMontoSuggestion(row as Record<string, unknown>)
      );
      setIsSeguimientoDraftOpen(false);
      if (seleccionado.cliente) {
        setSelectedValue(seleccionado.cliente);
      }

    },
    [selectedValue]
  );

  const handleSeleccionarRegistro = useCallback((row: ConsultaCarteraRow) => {
    const clienteId = String(row?.cliente ?? row?.CLIENTE ?? row?.IDCLIPRV ?? "");
    setSelectedValue(clienteId);
    setIsSeguimientoDraftOpen(false);
    setRegistroSeleccionado(null);
    setMontoEventoSugerido(undefined);
    setActiveTab("info");
  }, []);

  const handleClicLupaBuscar = useCallback(
    async (row: ConsultaCarteraRow) => {
      try {
        if (!row || typeof row !== "object") {
          toast.error("Registro inválido");
          console.error("Registro inválido:", row);
          return;
        }

        if (!row.numefac && !row.cliente && !row.cuenta) {
          toast.warn("Registro sin información esencial");
        }

        handleSeleccionarRegistro(row);
      } catch (err) {
        console.error("Error al seleccionar registro:", err);
        toast.error("Error al seleccionar registro");
      }
    },
    [handleSeleccionarRegistro]
  );

  const handleBuscar = useCallback(async (): Promise<void> => {
    await fetchFacturas();
  }, [fetchFacturas]);

  useEffect(() => {
    ensureConsultaCarteraFilters();
  }, []);

  useEffect(() => {
    const params = parseConsultaCarteraSearchParams(location.search);

    if (!hasConsultaCarteraSearchSelection(params)) {
      return;
    }

    const filterValue = resolveConsultaCarteraSearchValue(params);
    setTablaSearch(filterValue);

    (async () => {
      const rows = await fetchFacturas(filterValue);
      const row = findFacturaRowBySearchParams(rows, params);

      if (row) {
        handleSeleccionarFactura(row);
        setActiveTab("seguimiento");
        return;
      }

      if (!params.identificacionCliente) {
        return;
      }

      setSelectedValue(params.identificacionCliente);

      const fallbackSelection = buildFallbackFacturaSelectionFromSearchParams(params);
      if (fallbackSelection) {
        handleSeleccionarFactura(fallbackSelection);
        setActiveTab("seguimiento");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    const clienteId = String(registroSeleccionado?.cliente || selectedValue || "").trim();
    if (clienteId) {
      void cargarInfoCliente(clienteId);
    } else {
      clienteInfoRequestIdRef.current += 1;
      setClienteInfo(null);
    }
  }, [cargarInfoCliente, registroSeleccionado?.cliente, selectedValue]);

  useEffect(() => {
    void fetchFacturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablaPage, tablaRowsPerPage]);

  useEffect(() => {
    if (selectedValue && tablaFacturasRef.current) {
      tablaFacturasRef.current.fetchFacturas();
    }
  }, [selectedValue]);

  return {
    activeTab,
    clienteInfo,
    fechaConsultaFacturas,
    filtroSaldoCero,
    isSeguimientoDraftOpen,
    montoEventoSugerido,
    registroSeleccionado,
    selectedValue,
    tablaFacturasRef,
    tablaLoading,
    tablaPage,
    tablaRows,
    tablaRowsPerPage,
    tablaSearch,
    tablaTotalRows,
    totalSaldoCartera,
    cargarInfoCliente,
    fetchFacturas,
    handleBuscar,
    handleClicLupaBuscar,
    handleFechaFiltroChange,
    handleSeleccionarFactura,
    handleSeleccionarRegistro,
    limpiarSeleccion,
    setActiveTab,
    setIsSeguimientoDraftOpen,
    setRegistroSeleccionado,
    setSelectedValue,
    setTablaPage,
    setTablaRowsPerPage,
    setTablaSearch,
  };
}
