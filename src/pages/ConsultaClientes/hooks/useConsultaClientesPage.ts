import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GridPaginationModel, GridRowParams } from "@mui/x-data-grid";
import type { FetchFacturasRef } from "../components/EstadoClienteCompleto";
import { useClientesService } from "@app/services/GestionCartera/ConsultaClientes/clientesService";
import { useNavigate } from "react-router-dom";
import { buildConsultaCarteraUrl } from "@app/utils/consultaCarteraNavigation";
import {
  buildClientesListRequest,
  buildFacturaSeleccionada,
  buildSeguimientoButtonTitle,
  shouldSearchClientes,
  toSelectedClienteValue,
  toggleSelectedRow,
} from "../domain/helpers";

type ClienteRow = Record<string, unknown>;

export function useConsultaClientesPage() {
  const [selectedValue, setSelectedValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableRowsClientes, setTableRowsClientes] = useState<ClienteRow[]>([]);
  const [fechaConsultaFacturas, setFechaConsultaFacturas] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [intMora, setIntMora] = useState<string>("3.00");
  const tablaFacturasRef = useRef<FetchFacturasRef>(null);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<{
    cuenta: string;
    factura: string;
    identificacionCliente: string;
  } | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const navigate = useNavigate();
  const { listarClientes } = useClientesService();

  const searchClientes = useCallback(
    async (filter = "") => {
      const params = buildClientesListRequest(paginationModel, intMora, filter);
      if (!shouldSearchClientes(params.filter)) {
        return;
      }

      const response = await listarClientes(params);
      if (response?.success) {
        setTableRowsClientes(response.data || []);
      } else {
        setTableRowsClientes([]);
      }
    },
    [intMora, listarClientes, paginationModel]
  );

  const handleSelectRow = useCallback((id: string) => {
    setSelectedRows((previousRows) => toggleSelectedRow(previousRows, id));
  }, []);

  const handleRowClick = useCallback((params: GridRowParams) => {
    const clienteValue = toSelectedClienteValue(params.row);
    setSelectedValue(clienteValue);
    setShowModal(false);
    setSelectedRows([]);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedValue("");
    setFacturaSeleccionada(null);
  }, []);

  const handleOpenModal = useCallback(() => {
    setSearchTerm("");
    setShowModal(true);
    void searchClientes();
  }, [searchClientes]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handlePaginationChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
  }, []);

  const handleBuscarFacturas = useCallback(() => {
    setFacturaSeleccionada(null);
    tablaFacturasRef.current?.fetchFacturas({ force: true });
  }, []);

  const handleSelectFactura = useCallback(
    (row: Record<string, unknown>) => {
      const nextSelection = buildFacturaSeleccionada(row, selectedValue);
      setFacturaSeleccionada(nextSelection);
    },
    [selectedValue]
  );

  const handleIrConsultaCartera = useCallback(() => {
    if (!facturaSeleccionada) {
      return;
    }

    navigate(buildConsultaCarteraUrl(facturaSeleccionada));
  }, [facturaSeleccionada, navigate]);

  useEffect(() => {
    void searchClientes(searchTerm);
    // Keep pagination-triggered fetch behavior stable; search term changes are debounced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize, searchClientes]);

  useEffect(() => {
    setFacturaSeleccionada(null);
  }, [selectedValue]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void searchClientes(searchTerm);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchClientes, searchTerm]);

  const seguimientoTitle = useMemo(
    () => buildSeguimientoButtonTitle(facturaSeleccionada),
    [facturaSeleccionada]
  );

  return {
    facturaSeleccionada,
    fechaConsultaFacturas,
    intMora,
    paginationModel,
    searchTerm,
    selectedRows,
    selectedValue,
    seguimientoTitle,
    showModal,
    tablaFacturasRef,
    tableRowsClientes,
    handleBuscarFacturas,
    handleClearSelection,
    handleCloseModal,
    handleIrConsultaCartera,
    handleOpenModal,
    handlePaginationChange,
    handleRowClick,
    handleSelectFactura,
    handleSelectRow,
    setFechaConsultaFacturas,
    setIntMora,
    setSearchTerm,
  };
}
