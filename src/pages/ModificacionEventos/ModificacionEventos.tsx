import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useAppSelector } from "@app/store/store";
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import BuscadoClientes from "@app/pages/ConsultaClientes/components/BuscadoClientes";
import ModalTablaClientes from "@app/pages/ConsultaClientes/components/ModalTablaClientes";
import { useClientesService } from "@app/services/GestionCartera/ConsultaClientes/clientesService";
import {
  DynamicTablePaginationConsultaCartera as DynamicTablePagination,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizablePaginacionConsultaCartera";
import { Checkbox } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import {
  GridColDef,
  GridPaginationModel,
  GridRowParams,
} from "@mui/x-data-grid";
import {
  ActualizarModificacionEventoRequest,
  ListarModificacionEventosRequest,
  useEventosService,
} from "@app/services/Calendario/CalendarioService";
import { useListarTiposEvento } from "@app/services/ConsultaCartera/TipoEventoService";
import { buildConsultaCarteraUrl } from "@app/utils/consultaCarteraNavigation";

interface TipoEventoItem {
  id: string;
  nombre: string;
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
}

interface EventoModificacion {
  id: number;
  cliente: string;
  factura: string;
  cuenta: string;
  tipoEventoId: string;
  tipoEvento: string;
  fechaCreacion: string;
  fechaEvento: string;
  monto: number | null;
  usuario: string;
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
}

type FiltrosConsultaEventos = Omit<
  ListarModificacionEventosRequest,
  "page" | "pageSize"
>;

interface EdicionEventoForm {
  usuario: string | number;
  cuenta: string;
  cliente: string;
  tipoEventoId: string | number;
  fechaEvento: string;
  horaEvento: string;
  monto: string;
}

const pickFirstValue = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
};

const parseNumberValue = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseBooleanValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "si";
  }
  return false;
};

const extractDatePart = (value?: unknown): string => {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const rawValue = String(value).trim();
  if (!rawValue) return "";

  const normalized = rawValue.includes(" ")
    ? rawValue.replace(" ", "T")
    : rawValue;
  const isoMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch?.[1]) return isoMatch[1];

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const extractTimePart = (value?: unknown): string => {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const rawValue = String(value).trim();
  if (!rawValue) return "";

  const normalized = rawValue.includes(" ")
    ? rawValue.replace(" ", "T")
    : rawValue;
  const timeMatch = normalized.match(/T(\d{2}:\d{2})/);
  if (timeMatch?.[1]) return timeMatch[1];

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";

  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const mergeDateAndTime = (
  datePart: string,
  timePart: string,
  includeTime: boolean,
) => {
  if (!datePart) return "";
  if (includeTime && timePart) return `${datePart}T${timePart}:00`;
  return `${datePart}T00:00:00`;
};

const toLocalDateString = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toLocalTimeString = (value: Date) => {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const mapEventoFromApi = (item: any, rowIndex: number): EventoModificacion => {
  const idValue =
    parseNumberValue(
      pickFirstValue(item, ["id", "Id", "idEvento", "IdEvento"]),
    ) ?? rowIndex + 1;

  const montoValue = parseNumberValue(
    pickFirstValue(item, [
      "monto",
      "Monto",
      "montoCompromiso",
      "MontoCompromiso",
    ]),
  );

  return {
    id: idValue,
    cliente: String(
      pickFirstValue(item, [
        "cliente",
        "Cliente",
        "identificacionCliente",
        "IdentificacionCliente",
      ]) ?? "",
    ),
    factura: String(
      pickFirstValue(item, ["factura", "Factura", "numefac", "Numefac"]) ?? "",
    ),
    cuenta: String(
      pickFirstValue(item, ["cuenta", "Cuenta", "codigoCuenta", "CodigoCuenta"]) ??
        "",
    ),
    tipoEventoId: String(
      pickFirstValue(item, [
        "tipoEventoId",
        "TipoEventoId",
        "idTipoEvento",
        "IdTipoEvento",
      ]) ?? "",
    ),
    tipoEvento: String(
      pickFirstValue(item, [
        "tipoEvento",
        "TipoEvento",
        "nombreTipoEvento",
        "NombreTipoEvento",
      ]) ?? "",
    ),
    fechaCreacion: String(
      pickFirstValue(item, [
        "fechaCreacion",
        "FechaCreacion",
        "fechaGestion",
        "FECHAGES",
      ]) ?? "",
    ),
    fechaEvento: String(
      pickFirstValue(item, [
        "fechaEvento",
        "FechaEvento",
        "fechaHoraProgramada",
        "FechaHoraProgramada",
        "start",
      ]) ?? "",
    ),
    monto: montoValue,
    usuario: String(
      pickFirstValue(item, [
        "usuario",
        "Usuario",
        "idUsuario",
        "IdUsuario",
        "IdUsuarioAsignado",
        "NombreUsuario",
      ]) ?? "",
    ),
    requiereFecha: parseBooleanValue(
      pickFirstValue(item, ["requiereFecha", "RequiereFecha"]),
    ),
    requiereHora: parseBooleanValue(
      pickFirstValue(item, ["requiereHora", "RequiereHora"]),
    ),
    requiereMonto: parseBooleanValue(
      pickFirstValue(item, ["requiereMonto", "RequiereMonto"]),
    ),
  };
};

const normalizeEventosResponse = (rawData: any) => {
  const rows =
    (Array.isArray(rawData) && rawData) ||
    (Array.isArray(rawData?.items) && rawData.items) ||
    (Array.isArray(rawData?.rows) && rawData.rows) ||
    (Array.isArray(rawData?.results) && rawData.results) ||
    (Array.isArray(rawData?.data) && rawData.data) ||
    [];

  const totalCandidates = [
    rawData?.totalRows,
    rawData?.total,
    rawData?.totalRecords,
    rawData?.count,
    rawData?.recordsTotal,
    rawData?.pagination?.totalRows,
    rawData?.pagination?.total,
  ];
  const total = totalCandidates.find(
    (value) => typeof value === "number" && !Number.isNaN(value),
  );

  return {
    rows,
    totalRows: typeof total === "number" ? total : rows.length,
  };
};

const getApiErrorMessage = (response: any, fallback: string) => {
  const firstError =
    Array.isArray(response?.errors) &&
    response.errors.find(
      (err: unknown) => typeof err === "string" && err.trim().length > 0,
    );
  return firstError || response?.message || fallback;
};

const formatMonto = (value: number | null): string => {
  if (value === null) return "NULL";
  return value.toFixed(2);
};

export const ModificacionEventos: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const { obtenerUsuariosPorRol, listarModificacionEventos, actualizarModificacionEvento } =
    useEventosService();
  const { listarTiposEvento } = useListarTiposEvento();
  const { listarClientes } = useClientesService();

  const [usuarios, setUsuarios] = useState<
    { label: string; value: string | number }[]
  >([{ label: "Todos", value: "" }]);
  const [tiposEvento, setTiposEvento] = useState<TipoEventoItem[]>([]);

  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [erroresFechas, setErroresFechas] = useState<{
    fechaInicio?: string;
    fechaFin?: string;
  }>({});
  const [usuarioFiltro, setUsuarioFiltro] = useState<string | number>("");
  const [cuentaFiltro, setCuentaFiltro] = useState<string>("");
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [showModalClientes, setShowModalClientes] = useState(false);
  const [searchClienteTerm, setSearchClienteTerm] = useState("");
  const [tableRowsClientes, setTableRowsClientes] = useState<any[]>([]);
  const [selectedRowsClientes, setSelectedRowsClientes] = useState<string[]>(
    [],
  );
  const [paginationModelClientes, setPaginationModelClientes] =
    useState<GridPaginationModel>({
      page: 0,
      pageSize: 20,
    });
  const [tipoEventoFiltro, setTipoEventoFiltro] = useState<string | number>("");

  const [rows, setRows] = useState<EventoModificacion[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [filtrosConsulta, setFiltrosConsulta] =
    useState<FiltrosConsultaEventos | null>(null);
  const [loadingConsulta, setLoadingConsulta] = useState(false);

  const [showModalEdicion, setShowModalEdicion] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<EventoModificacion | null>(
    null,
  );
  const [savingEdicion, setSavingEdicion] = useState(false);
  const [formEdicion, setFormEdicion] = useState<EdicionEventoForm>({
    usuario: "",
    cuenta: "",
    cliente: "",
    tipoEventoId: "",
    fechaEvento: "",
    horaEvento: "",
    monto: "",
  });
  const [formEdicionInicial, setFormEdicionInicial] =
    useState<EdicionEventoForm | null>(null);

  const handleSelectRowCliente = (id: string) => {
    setSelectedRowsClientes((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const handleRowClickCliente = (params: GridRowParams) => {
    const selectedCliente = params.row.id.toString();
    setClienteFiltro(selectedCliente);
    setShowModalClientes(false);
    setSelectedRowsClientes([]);
  };

  const handleOpenModalCliente = () => {
    setSearchClienteTerm("");
    setShowModalClientes(true);
    searchClientes();
  };

  const handleCloseModalCliente = () => {
    setShowModalClientes(false);
  };

  const handleClearCliente = () => {
    setClienteFiltro("");
  };

  const handlePaginationChangeCliente = (model: GridPaginationModel) => {
    setPaginationModelClientes(model);
  };

  const searchClientes = async (filter = "") => {
    const params = {
      page: paginationModelClientes.page + 1,
      numpage: paginationModelClientes.pageSize,
      filter,
      intmora: "3.00",
    };

    if (params.filter.length <= 2) {
      setTableRowsClientes([]);
      return;
    }

    try {
      const response: any = await listarClientes(params);
      if (response?.success) {
        setTableRowsClientes(response.data || []);
      } else {
        setTableRowsClientes([]);
      }
    } catch (error) {
      console.error("No fue posible buscar clientes:", error);
      setTableRowsClientes([]);
    }
  };

  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!currentUser?.id) return;

      try {
        const response = await obtenerUsuariosPorRol(
          "Asesor",
          Number(currentUser.id),
        );
        if (response?.success && Array.isArray(response.data)) {
          const mapped = response.data.map((user: any) => ({
            label: user.fullName,
            value: String(user.userId),
          }));
          setUsuarios([{ label: "Todos", value: "" }, ...mapped]);
        }
      } catch (error) {
        console.error(
          "No fue posible cargar usuarios para modificacion:",
          error,
        );
      }
    };

    fetchUsuarios();
  }, [currentUser]);

  useEffect(() => {
    const fetchTiposEvento = async () => {
      try {
        const response: any = await listarTiposEvento();
        if (response?.success && Array.isArray(response.data)) {
          const mapped = response.data
            .map((item: any): TipoEventoItem => ({
              id: String(item?.id ?? ""),
              nombre: String(item?.nombre ?? ""),
              requiereFecha: parseBooleanValue(item?.requiereFecha),
              requiereHora: parseBooleanValue(item?.requiereHora),
              requiereMonto: parseBooleanValue(item?.requiereMonto),
            }))
            .filter((item: TipoEventoItem) => item.id && item.nombre);

          setTiposEvento(mapped);
          return;
        }

        setTiposEvento([]);
      } catch (error) {
        console.error("No fue posible cargar tipos de evento:", error);
        setTiposEvento([]);
      }
    };

    fetchTiposEvento();
  }, [listarTiposEvento]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(totalRows / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [totalRows, rowsPerPage, page]);

  useEffect(() => {
    if (!showModalClientes) return;
    searchClientes(searchClienteTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    paginationModelClientes.page,
    paginationModelClientes.pageSize,
    showModalClientes,
  ]);

  useEffect(() => {
    if (!showModalClientes) return;
    const timeout = setTimeout(() => {
      searchClientes(searchClienteTerm);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchClienteTerm, showModalClientes]);

  useEffect(() => {
    if (!filtrosConsulta) return;

    const fetchEventosModificacion = async () => {
      setLoadingConsulta(true);

      const payload: ListarModificacionEventosRequest = {
        ...filtrosConsulta,
        page: page + 1,
        pageSize: rowsPerPage,
      };

      try {
        const response: any = await listarModificacionEventos(payload);
        if (response?.success) {
          const normalized = normalizeEventosResponse(response.data);
          const mappedRows = normalized.rows.map((item: any, idx: number) =>
            mapEventoFromApi(item, idx),
          );
          const fallbackTotal = page * rowsPerPage + mappedRows.length;
          setRows(mappedRows);
          setTotalRows(Math.max(normalized.totalRows, fallbackTotal));
        } else {
          setRows([]);
          setTotalRows(0);
          toast.error(
            getApiErrorMessage(response, "No fue posible consultar eventos."),
          );
        }
      } catch (error) {
        console.error("No fue posible consultar eventos para modificacion:", error);
        setRows([]);
        setTotalRows(0);
        toast.error(
          getApiErrorMessage(
            (error as any)?.response?.data ?? error,
            "No fue posible consultar eventos. Intente nuevamente.",
          ),
        );
      } finally {
        setLoadingConsulta(false);
      }
    };

    fetchEventosModificacion();
  }, [filtrosConsulta, page, rowsPerPage, listarModificacionEventos]);

  const tipoEventoOptions = useMemo(
    () => [
      { label: "Seleccione tipo de evento", value: "" },
      ...tiposEvento.map((item) => ({ label: item.nombre, value: item.id })),
    ],
    [tiposEvento],
  );

  const usuarioOptionsEdicion = useMemo(() => {
    const usuariosSinTodos = usuarios.filter((option) => {
      const value = String(option.value ?? "").trim();
      const label = String(option.label ?? "").trim().toLowerCase();
      return value !== "" && label !== "todos";
    });

    const current = String(formEdicion.usuario ?? "").trim();
    if (!current) return usuariosSinTodos;

    const exists = usuariosSinTodos.some(
      (option) => String(option.value) === current || option.label === current,
    );
    if (exists) return usuariosSinTodos;

    if (current.toLowerCase() === "todos") {
      return usuariosSinTodos;
    }

    return [{ label: current, value: current }, ...usuariosSinTodos];
  }, [usuarios, formEdicion.usuario]);

  const tipoEventoOptionsEdicion = useMemo(() => {
    const currentTipoNombre = eventoEditando?.tipoEvento ?? "";
    const currentTipoValue = String(formEdicion.tipoEventoId ?? "");
    const exists = tipoEventoOptions.some(
      (option) => String(option.value) === currentTipoValue,
    );

    if (!currentTipoNombre || exists || currentTipoValue === "") {
      return tipoEventoOptions;
    }

    return [
      { label: currentTipoNombre, value: currentTipoValue },
      ...tipoEventoOptions,
    ];
  }, [tipoEventoOptions, eventoEditando, formEdicion.tipoEventoId]);

  const tipoEventoSeleccionadoEdicion = useMemo(() => {
    const tipoId = String(formEdicion.tipoEventoId ?? "").trim();
    if (!tipoId) return null;
    return tiposEvento.find((item) => String(item.id) === tipoId) ?? null;
  }, [tiposEvento, formEdicion.tipoEventoId]);

  const tipoEventoInicialEdicion = useMemo(() => {
    const tipoId = String(formEdicionInicial?.tipoEventoId ?? "").trim();
    if (!tipoId) return null;
    return tiposEvento.find((item) => String(item.id) === tipoId) ?? null;
  }, [tiposEvento, formEdicionInicial?.tipoEventoId]);

  const requiereFechaEdicion =
    tipoEventoSeleccionadoEdicion?.requiereFecha ??
    eventoEditando?.requiereFecha ??
    false;
  const requiereHoraEdicion =
    tipoEventoSeleccionadoEdicion?.requiereHora ??
    eventoEditando?.requiereHora ??
    false;
  const requiereMontoEdicion =
    tipoEventoSeleccionadoEdicion?.requiereMonto ??
    eventoEditando?.requiereMonto ??
    false;
  const requiereHoraInicialEdicion =
    tipoEventoInicialEdicion?.requiereHora ?? eventoEditando?.requiereHora ?? false;

  const columnsClientes: GridColDef[] = [
    {
      field: "select",
      headerName: "",
      width: 40,
      minWidth: 20,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Checkbox
          checked={params.row.selected || false}
          onChange={() => handleSelectRowCliente(String(params.row.id))}
          icon={
            <FontAwesomeIcon
              icon={faCircleCheck}
              style={{ color: "#63E6BE" }}
            />
          }
        />
      ),
    },
    { field: "id", headerName: "Identificacion", width: 150 },
    { field: "nombre", headerName: "Nombre", flex: 1, maxWidth: 550 },
    { field: "telefono", headerName: "Telefono", width: 150 },
    { field: "codIcta", headerName: "Codigo ICTA", width: 150 },
  ];

  const validarFechas = (): boolean => {
    const errores: { fechaInicio?: string; fechaFin?: string } = {};

    if (!fechaInicio.trim()) {
      errores.fechaInicio = "La fecha inicio es obligatoria.";
    }

    if (!fechaFin.trim()) {
      errores.fechaFin = "La fecha fin es obligatoria.";
    }

    if (fechaInicio && fechaFin) {
      const inicio = new Date(`${fechaInicio}T00:00:00`);
      const fin = new Date(`${fechaFin}T23:59:59`);
      if (inicio > fin) {
        errores.fechaFin =
          "La fecha fin debe ser mayor o igual a la fecha inicio.";
      }
    }

    setErroresFechas(errores);
    return Object.keys(errores).length === 0;
  };

  const handleConsultar = () => {
    if (!validarFechas()) return;

    const nextFilters: FiltrosConsultaEventos = {
      fechaInicio,
      fechaFin,
      userId: parseNumberValue(usuarioFiltro),
      cuenta: cuentaFiltro.trim() || null,
      cliente: clienteFiltro.trim() || null,
      tipoEventoId: parseNumberValue(tipoEventoFiltro),
    };

    setFiltrosConsulta(nextFilters);
    setPage(0);
  };

  const handleChangeTipoEventoEdicion = (value: string | number) => {
    const selectedTipo = tiposEvento.find(
      (item) => String(item.id) === String(value),
    );

    setFormEdicion((prev) => ({
      ...prev,
      tipoEventoId: value,
      fechaEvento:
        selectedTipo && !selectedTipo.requiereFecha ? "" : prev.fechaEvento,
      horaEvento: selectedTipo && !selectedTipo.requiereHora ? "" : prev.horaEvento,
      monto: selectedTipo && !selectedTipo.requiereMonto ? "" : prev.monto,
    }));
  };

  const handleEditar = (evento: EventoModificacion) => {
    const matchedTipo = tiposEvento.find(
      (item) =>
        String(item.id) === String(evento.tipoEventoId) ||
        item.nombre === evento.tipoEvento,
    );

    const fechaHoraSource =
      pickFirstValue(evento as any, [
        "fechaEvento",
        "FechaEvento",
        "fechaHoraProgramada",
        "FechaHoraProgramada",
        "start",
      ]) ??
      pickFirstValue(evento as any, [
        "fechaCreacion",
        "FechaCreacion",
        "FECHAGES",
      ]);
    const fechaEventoInicial = extractDatePart(fechaHoraSource);
    const horaEventoInicial = extractTimePart(fechaHoraSource);

    const initialForm: EdicionEventoForm = {
      usuario: evento.usuario || "",
      cuenta: evento.cuenta || "",
      cliente: evento.cliente || "",
      tipoEventoId: matchedTipo?.id ?? evento.tipoEventoId ?? "",
      fechaEvento: fechaEventoInicial,
      horaEvento: horaEventoInicial,
      monto: evento.monto == null ? "" : String(evento.monto),
    };

    setEventoEditando(evento);
    setFormEdicion(initialForm);
    setFormEdicionInicial(initialForm);
    setShowModalEdicion(true);
  };

  const handleCloseModalEdicion = () => {
    setShowModalEdicion(false);
    setEventoEditando(null);
    setFormEdicionInicial(null);
  };

  const setFieldEdicion = <K extends keyof EdicionEventoForm>(
    field: K,
    value: EdicionEventoForm[K],
  ) => {
    setFormEdicion((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuardarEdicion = async () => {
    if (!eventoEditando || !formEdicionInicial) return;

    const usuarioValue = String(formEdicion.usuario ?? "").trim();
    const cuentaValue = formEdicion.cuenta.trim();
    const clienteValue = formEdicion.cliente.trim();
    const tipoEventoValue = String(formEdicion.tipoEventoId ?? "").trim();
    const now = new Date();
    const today = toLocalDateString(now);
    const currentTime = toLocalTimeString(now);

    if (!usuarioValue || usuarioValue.toLowerCase() === "todos") {
      toast.error("Debe seleccionar un usuario valido.");
      return;
    }

    if (!cuentaValue) {
      toast.error("La cuenta es obligatoria.");
      return;
    }

    if (!clienteValue) {
      toast.error("El cliente es obligatorio.");
      return;
    }

    if (!tipoEventoValue) {
      toast.error("El tipo de evento es obligatorio.");
      return;
    }

    if (requiereFechaEdicion && !formEdicion.fechaEvento) {
      toast.error("La fecha del evento es obligatoria.");
      return;
    }

    if (requiereFechaEdicion && formEdicion.fechaEvento < today) {
      toast.error("La fecha del evento no puede ser menor a la fecha actual.");
      return;
    }

    if (requiereHoraEdicion && !formEdicion.horaEvento) {
      toast.error("La hora del evento es obligatoria.");
      return;
    }

    if (requiereHoraEdicion) {
      if (requiereFechaEdicion) {
        const selectedDateTime = new Date(
          `${formEdicion.fechaEvento}T${formEdicion.horaEvento}:00`,
        );
        if (Number.isNaN(selectedDateTime.getTime())) {
          toast.error("La fecha y hora del evento no son validas.");
          return;
        }
        if (selectedDateTime < now) {
          toast.error("La fecha y hora del evento no pueden ser menores a la actual.");
          return;
        }
      } else if (formEdicion.horaEvento < currentTime) {
        toast.error("La hora del evento no puede ser menor a la hora actual.");
        return;
      }
    }

    if (
      requiereMontoEdicion &&
      (formEdicion.monto.trim() === "" || Number.isNaN(Number(formEdicion.monto)))
    ) {
      toast.error("El monto del evento es obligatorio.");
      return;
    }

    const usuarioChanged =
      String(formEdicion.usuario ?? "").trim() !==
      String(formEdicionInicial.usuario ?? "").trim();
    const tipoEventoChanged =
      String(formEdicion.tipoEventoId ?? "").trim() !==
      String(formEdicionInicial.tipoEventoId ?? "").trim();

    const currentFechaHoraProgramada = mergeDateAndTime(
      formEdicion.fechaEvento,
      formEdicion.horaEvento,
      requiereHoraEdicion,
    );
    const initialFechaHoraProgramada = mergeDateAndTime(
      formEdicionInicial.fechaEvento,
      formEdicionInicial.horaEvento,
      requiereHoraInicialEdicion,
    );
    const fechaHoraChanged =
      requiereFechaEdicion &&
      currentFechaHoraProgramada !== initialFechaHoraProgramada;

    const currentMonto =
      formEdicion.monto.trim() === "" ? null : Number(formEdicion.monto);
    const initialMonto =
      formEdicionInicial.monto.trim() === ""
        ? null
        : Number(formEdicionInicial.monto);
    const montoChanged = requiereMontoEdicion && currentMonto !== initialMonto;

    const updatePayload: ActualizarModificacionEventoRequest = {
      idEvento: eventoEditando.id,
    };

    if (usuarioChanged) {
      const userId = parseNumberValue(formEdicion.usuario);
      if (userId === null) {
        toast.error(
          "El usuario seleccionado no es valido para actualizar el evento.",
        );
        return;
      }
      updatePayload.idUsuarioAsignado = userId;
    }

    if (tipoEventoChanged) {
      const tipoId = parseNumberValue(formEdicion.tipoEventoId);
      if (tipoId === null) {
        toast.error(
          "El tipo de evento seleccionado no es valido para actualizar el evento.",
        );
        return;
      }
      updatePayload.idTipoEvento = tipoId;
    }

    if (fechaHoraChanged) {
      updatePayload.fechaHoraProgramada = currentFechaHoraProgramada;
    }

    if (montoChanged) {
      updatePayload.montoCompromiso = currentMonto;
    }

    const changedFieldsCount = Object.keys(updatePayload).length - 1;
    if (changedFieldsCount <= 0) {
      toast.error("No hay cambios para guardar.");
      return;
    }

    setSavingEdicion(true);

    try {
      const result: any = await actualizarModificacionEvento(updatePayload);
      if (!result?.success) {
        toast.error(
          getApiErrorMessage(
            result,
            "No fue posible guardar la edicion del evento.",
          ),
        );
        return;
      }

      const usuarioSeleccionado = usuarios.find(
        (option) => String(option.value) === String(formEdicion.usuario),
      );
      const tipoEventoSeleccionado = tiposEvento.find(
        (item) => String(item.id) === String(formEdicion.tipoEventoId),
      );

      setRows((prevRows) =>
        prevRows.map((item) =>
          item.id === eventoEditando.id
            ? {
                ...item,
                usuario: usuarioSeleccionado?.label || String(formEdicion.usuario || item.usuario),
                cuenta: formEdicion.cuenta.trim() || item.cuenta,
                cliente: formEdicion.cliente.trim() || item.cliente,
                tipoEventoId: String(formEdicion.tipoEventoId || item.tipoEventoId),
                tipoEvento: tipoEventoSeleccionado?.nombre || item.tipoEvento,
                requiereFecha:
                  tipoEventoSeleccionado?.requiereFecha ?? item.requiereFecha,
                requiereHora:
                  tipoEventoSeleccionado?.requiereHora ?? item.requiereHora,
                requiereMonto:
                  tipoEventoSeleccionado?.requiereMonto ?? item.requiereMonto,
                fechaEvento:
                  currentFechaHoraProgramada || item.fechaEvento,
                monto:
                  formEdicion.monto.trim() === ""
                    ? null
                    : Number(formEdicion.monto),
                }
            : item,
        ),
      );

      toast.success(result?.message || "Evento actualizado correctamente.");
      handleCloseModalEdicion();
    } catch (error) {
      console.error("No fue posible preparar la edicion del evento:", error);
      toast.error("No fue posible preparar la edicion del evento.");
    } finally {
      setSavingEdicion(false);
    }
  };

  const handleEliminar = (evento: EventoModificacion) => {
    const confirmDelete = window.confirm(
      `Desea eliminar el evento con id ${evento.id}?`,
    );
    if (!confirmDelete) return;

    setRows((prevRows) => prevRows.filter((item) => item.id !== evento.id));
    setTotalRows((prevTotal) => Math.max(0, prevTotal - 1));
  };

  const handleIrSeguimiento = (evento: EventoModificacion) => {
    const targetUrl = buildConsultaCarteraUrl({
      cuenta: evento.cuenta,
      factura: evento.factura,
      identificacionCliente: evento.cliente,
    });
    const hashUrl = `${window.location.origin}${window.location.pathname}#${targetUrl}`;
    window.open(hashUrl, "_blank", "noopener,noreferrer");
  };

  const columns: TableColumn[] = useMemo(
    () => [
      { id: "id", label: "ID" },
      { id: "cliente", label: "Cliente" },
      { id: "factura", label: "Factura" },
      { id: "cuenta", label: "Cuenta" },
      { id: "tipoEvento", label: "Tipo evento" },
      { id: "fechaCreacion", label: "Fecha creacion" },
      { id: "fechaEvento", label: "Fecha evento" },
      {
        id: "monto",
        label: "Monto",
        align: "right",
        format: (value: number | null) => formatMonto(value),
      },
      {
        id: "acciones",
        label: "Acciones",
        align: "center",
        format: (_value, row: EventoModificacion) => (
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            <Button
              size="sm"
              variant="light"
              onClick={() => handleEditar(row)}
              title="Editar"
              style={{ padding: "2px 6px", border: "1px solid #d0d7de" }}
            >
              <i className="fas fa-edit" />
            </Button>
            <Button
              size="sm"
              variant="light"
              onClick={() => handleEliminar(row)}
              title="Eliminar"
              style={{ padding: "2px 6px", border: "1px solid #d0d7de" }}
            >
              <i className="fas fa-trash-alt" />
            </Button>
            <Button
              size="sm"
              variant="light"
              onClick={() => handleIrSeguimiento(row)}
              title="Ir a seguimiento"
              style={{ padding: "2px 6px", border: "1px solid #d0d7de" }}
            >
              <i className="fas fa-external-link-alt" />
            </Button>
          </div>
        ),
      },
    ],
    [handleEditar, handleEliminar, handleIrSeguimiento],
  );

  return (
    <div className="mt-5" style={{ margin: "auto", width: "90%" }}>
      <h3>Modificacion de eventos</h3>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Form>
            <Row>
              <Col md={2}>
                <Form.Group controlId="fechaInicio">
                  <Form.Label>Fecha inicio</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaInicio}
                    isInvalid={Boolean(erroresFechas.fechaInicio)}
                    onChange={(event) => {
                      setFechaInicio(event.target.value);
                      setErroresFechas((prev) => ({
                        ...prev,
                        fechaInicio: undefined,
                      }));
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {erroresFechas.fechaInicio}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group controlId="fechaFin">
                  <Form.Label>Fecha fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaFin}
                    isInvalid={Boolean(erroresFechas.fechaFin)}
                    onChange={(event) => {
                      setFechaFin(event.target.value);
                      setErroresFechas((prev) => ({
                        ...prev,
                        fechaFin: undefined,
                      }));
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {erroresFechas.fechaFin}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={2}>
                <SingleSelect
                  label="Usuario"
                  options={usuarios}
                  selectedValue={usuarioFiltro}
                  onChange={setUsuarioFiltro}
                />
              </Col>

              <Col md={3}>
                <BuscadorCuentas
                  opcion="CU"
                  op="CLIENTE"
                  placeholder="Buscar cuenta..."
                  label="Cuenta"
                  value={cuentaFiltro || undefined}
                  onChange={(cuenta) => setCuentaFiltro(cuenta ?? "")}
                  onSelect={() => {}}
                />
              </Col>
              <Col md={2}>
                <BuscadoClientes
                  selectedValue={clienteFiltro}
                  onOpenModal={handleOpenModalCliente}
                  onClear={handleClearCliente}
                />
              </Col>

              <Col md={2}>
                <SingleSelect
                  label="Tipo de evento"
                  options={tipoEventoOptions}
                  selectedValue={tipoEventoFiltro}
                  onChange={setTipoEventoFiltro}
                />
              </Col>

              <Col md={2} className="d-flex align-items-center">
                <Button
                  variant="primary"
                  type="button"
                  onClick={handleConsultar}
                  style={{ marginTop: 14 }}
                  disabled={loadingConsulta}
                >
                  {loadingConsulta ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Consultando...
                    </>
                  ) : (
                    "Consultar"
                  )}
                </Button>
              </Col>
            </Row>

            <Row className="mt-3">
              
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <DynamicTablePagination
            columns={columns}
            rows={rows}
            totalRows={totalRows}
            withSearch={false}
            searchText=""
            onSearchChange={() => {}}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            page={page}
            onPageChange={setPage}
            maxHeight="500px"
          />
        </Card.Body>
      </Card>

      <Modal
        show={showModalEdicion}
        onHide={handleCloseModalEdicion}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar evento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {eventoEditando && (
            <>
              <Row>
                <Col md={3}>
                  <SingleSelect
                    label="Usuario"
                    options={usuarioOptionsEdicion}
                    selectedValue={formEdicion.usuario}
                    onChange={(value) => setFieldEdicion("usuario", value)}
                  />
                </Col>

                <Col md={3}>
                  <Form.Group controlId="cuentaEventoEdicion">
                    <Form.Label>Cuenta</Form.Label>
                    <Form.Control type="text" value={formEdicion.cuenta} readOnly />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group controlId="clienteEventoEdicion">
                    <Form.Label>Cliente</Form.Label>
                    <Form.Control type="text" value={formEdicion.cliente} readOnly />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <SingleSelect
                    label="Tipo de evento"
                    options={tipoEventoOptionsEdicion}
                    selectedValue={formEdicion.tipoEventoId}
                    onChange={handleChangeTipoEventoEdicion}
                  />
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={3}>
                  <Form.Group controlId="fechaEventoEdicion">
                    <Form.Label>Fecha evento</Form.Label>
                    <Form.Control
                      type="date"
                      value={formEdicion.fechaEvento}
                      disabled={!requiereFechaEdicion}
                      onChange={(event) =>
                        setFieldEdicion("fechaEvento", event.target.value)
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group controlId="horaEventoEdicion">
                    <Form.Label>Hora evento</Form.Label>
                    <Form.Control
                      type="time"
                      value={formEdicion.horaEvento}
                      disabled={!requiereHoraEdicion}
                      onChange={(event) =>
                        setFieldEdicion("horaEvento", event.target.value)
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group controlId="montoEventoEdicion">
                    <Form.Label>Monto</Form.Label>
                    <Form.Control
                      type="number"
                      value={formEdicion.monto}
                      disabled={!requiereMontoEdicion}
                      onChange={(event) =>
                        setFieldEdicion("monto", event.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModalEdicion}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleGuardarEdicion}
            disabled={savingEdicion}
          >
            {savingEdicion ? "Guardando..." : "Guardar"}
          </Button>
        </Modal.Footer>
      </Modal>

      <ModalTablaClientes
        show={showModalClientes}
        onHide={handleCloseModalCliente}
        searchTerm={searchClienteTerm}
        onSearchChange={setSearchClienteTerm}
        columns={columnsClientes}
        rows={tableRowsClientes}
        selectedRows={selectedRowsClientes}
        onSelectRow={handleSelectRowCliente}
        onPaginationChange={handlePaginationChangeCliente}
        paginationModel={paginationModelClientes}
        onRowClick={handleRowClickCliente}
      />
    </div>
  );
};
