import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";
import {
  Checkbox,
  Chip,
  Divider,
  IconButton,
  TablePagination,
  Tooltip,
} from "@mui/material";
import { useAppSelector } from "@app/store/store";
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import BuscadoClientes from "@app/pages/ConsultaClientes/components/BuscadoClientes";
import ModalTablaClientes from "@app/pages/ConsultaClientes/components/ModalTablaClientes";
import { useClientesService } from "@app/services/GestionCartera/ConsultaClientes/clientesService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import {
  GridColDef,
  GridPaginationModel,
  GridRowParams,
} from "@mui/x-data-grid";
import {
  ActualizarDescripcionGestionRequest,
  ActualizarModificacionEventoRequest,
  CrearEventoGestionRequest,
  EliminarEventoGestionRequest,
  EliminarGestionRequest,
  ListarGestionesModificacionRequest,
  useEventosService,
} from "@app/services/Calendario/CalendarioService";
import { useListarTiposEvento } from "@app/services/ConsultaCartera/TipoEventoService";
import { useHorasDispDia, HoraDispItem } from "@app/services/ConsultaCartera/HorasDispDiaService";
import { HoraSelectorEvento } from "@app/modules/maestros/tipos-eventos/components/HoraSelectorEvento";
import { buildConsultaCarteraUrl } from "@app/utils/consultaCarteraNavigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TipoEventoItem {
  id: string;
  nombre: string;
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
}

interface EventoGestion {
  id: number;
  idGestion: number;
  cliente: string;
  factura: string;
  cuenta: string;
  idUsuarioAsignado: number;
  idTipoEvento: number;
  fechaHoraProgramada: string;
  montoCompromiso: number | null;
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
}

interface GestionModificacion {
  idGestion: number;
  cliente: string;
  factura: string;
  cuenta: string;
  usuario: number;
  Username: string;
  FechaHora: string;
  descripcion: string;
  eventos: EventoGestion[];
}

// Kept for edit-modal compatibility
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

type FiltrosConsultaGestiones = Omit<
  ListarGestionesModificacionRequest,
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

const EMPTY_FORM: EdicionEventoForm = {
  usuario: "",
  cuenta: "",
  cliente: "",
  tipoEventoId: "",
  fechaEvento: "",
  horaEvento: "",
  monto: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pickFirstValue = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
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
    const n = value.trim().toLowerCase();
    return n === "true" || n === "1" || n === "si";
  }
  return false;
};

const extractDatePart = (value?: unknown): string => {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const raw = String(value).trim();
  if (!raw) return "";
  const norm = raw.includes(" ") ? raw.replace(" ", "T") : raw;
  const m = norm.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m?.[1]) return m[1];
  const d = new Date(norm);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const extractTimePart = (value?: unknown): string => {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
  }
  const raw = String(value).trim();
  if (!raw) return "";
  const norm = raw.includes(" ") ? raw.replace(" ", "T") : raw;
  const m = norm.match(/T(\d{2}:\d{2})/);
  if (m?.[1]) return m[1];
  const d = new Date(norm);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const mergeDateAndTime = (
  datePart: string,
  timePart: string,
  includeTime: boolean,
) => {
  if (!datePart) return "";
  return includeTime && timePart
    ? `${datePart}T${timePart}:00`
    : `${datePart}T00:00:00`;
};

const toLocalDateString = (v: Date) =>
  `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;

const toLocalTimeString = (v: Date) =>
  `${String(v.getHours()).padStart(2, "0")}:${String(v.getMinutes()).padStart(2, "0")}`;

const getApiErrorMessage = (response: any, fallback: string) => {
  const first =
    Array.isArray(response?.errors) &&
    response.errors.find(
      (e: unknown) => typeof e === "string" && (e as string).trim().length > 0,
    );
  return first || response?.message || fallback;
};

const formatMonto = (value: number | null): string =>
  value === null ? "-" : value.toFixed(2);

const formatFechaHora = (value: string): string => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("es-CO");
  } catch {
    return value;
  }
};

const normalizeGestionFilterValue = (value: string): string | null => {
  const normalized = value.trim();
  return normalized ? normalized : null;
};

const normalizeGestionesResponse = (rawData: any) => {
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
    rawData?.pagination?.totalRows,
    rawData?.pagination?.total,
  ];
  const total = totalCandidates.find(
    (v) => typeof v === "number" && !Number.isNaN(v),
  );
  return { rows, totalRows: typeof total === "number" ? total : rows.length };
};

const mapEventoGestionFromApi = (
  item: any,
  gestionFactura: string,
  gestionCuenta: string,
  gestionCliente: string,
): EventoGestion => ({
  id:
    parseNumberValue(
      pickFirstValue(item, ["id", "Id", "idEvento", "IdEvento"]),
    ) ?? 0,
  idGestion:
    parseNumberValue(pickFirstValue(item, ["idGestion", "IdGestion"])) ?? 0,
  cliente: String(
    pickFirstValue(item, ["cliente", "Cliente"]) ?? gestionCliente,
  ),
  factura: gestionFactura,
  cuenta: gestionCuenta,
  idUsuarioAsignado:
    parseNumberValue(
      pickFirstValue(item, ["IdUsuarioAsignado", "idUsuarioAsignado"]),
    ) ?? 0,
  idTipoEvento:
    parseNumberValue(pickFirstValue(item, ["IdTipoEvento", "idTipoEvento"])) ??
    0,
  fechaHoraProgramada: String(
    pickFirstValue(item, ["FechaHoraProgramada", "fechaHoraProgramada"]) ?? "",
  ),
  montoCompromiso: parseNumberValue(
    pickFirstValue(item, ["MontoCompromiso", "montoCompromiso"]),
  ),
  requiereFecha: parseBooleanValue(
    pickFirstValue(item, ["requiereFecha", "RequiereFecha"]),
  ),
  requiereHora: parseBooleanValue(
    pickFirstValue(item, ["requiereHora", "RequiereHora"]),
  ),
  requiereMonto: parseBooleanValue(
    pickFirstValue(item, ["RequiereMonto", "requiereMonto"]),
  ),
});

const mapGestionFromApi = (item: any): GestionModificacion => {
  const cliente = String(pickFirstValue(item, ["cliente", "Cliente"]) ?? "");
  const factura = String(pickFirstValue(item, ["factura", "Factura"]) ?? "");
  const cuenta = String(pickFirstValue(item, ["cuenta", "Cuenta"]) ?? "");

  let eventosRaw: any[] = [];
  const eventosField = pickFirstValue(item, ["eventos", "Eventos"]);
  if (typeof eventosField === "string") {
    try {
      const p = JSON.parse(eventosField);
      if (Array.isArray(p)) eventosRaw = p;
    } catch {
      /* empty */
    }
  } else if (Array.isArray(eventosField)) {
    eventosRaw = eventosField;
  }

  return {
    idGestion:
      parseNumberValue(pickFirstValue(item, ["idGestion", "IdGestion"])) ?? 0,
    cliente,
    factura,
    cuenta,
    usuario:
      parseNumberValue(pickFirstValue(item, ["usuario", "Usuario"])) ?? 0,
    Username: String(
      pickFirstValue(item, ["Username", "username", "NombreUsuario"]) ?? "",
    ),
    FechaHora: String(
      pickFirstValue(item, ["FechaHora", "fechaHora", "FechaGestion"]) ?? "",
    ),
    descripcion: String(
      pickFirstValue(item, ["Descripcion", "descripcion"]) ?? "",
    ),
    eventos: eventosRaw.map((ev) =>
      mapEventoGestionFromApi(ev, factura, cuenta, cliente),
    ),
  };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ModificacionEventos: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const {
    obtenerUsuariosPorRol,
    actualizarModificacionEvento,
    listarGestionesModificacion,
    crearEventoGestion,
    eliminarEventoGestion,
    eliminarGestion,
    actualizarDescripcionGestion,
  } = useEventosService();
  const { listarTiposEvento } = useListarTiposEvento();
  const { listarClientes } = useClientesService();
  const { obtenerHoras, loading: loadingHoras } = useHorasDispDia();

  // Dropdowns
  const [usuarios, setUsuarios] = useState<
    { label: string; value: string | number }[]
  >([{ label: "Todos", value: "" }]);
  const [tiposEvento, setTiposEvento] = useState<TipoEventoItem[]>([]);

  // Filters
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [erroresFechas, setErroresFechas] = useState<{
    fechaInicio?: string;
    fechaFin?: string;
  }>({});
  const [usuarioFiltro, setUsuarioFiltro] = useState<string | number>("");
  const [cuentaFiltro, setCuentaFiltro] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState("");

  // Client modal
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

  // Main data
  const [rows, setRows] = useState<GestionModificacion[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [page, setPage] = useState(0);
  const [filtrosConsulta, setFiltrosConsulta] =
    useState<FiltrosConsultaGestiones | null>(null);
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [busquedaGestion, setBusquedaGestion] = useState("");

  // Drawer
  const [drawerGestion, setDrawerGestion] =
    useState<GestionModificacion | null>(null);

  // Description edit (inside drawer)
  const [editandoDescripcion, setEditandoDescripcion] = useState(false);
  const [descripcionEdit, setDescripcionEdit] = useState("");
  const [savingDescripcion, setSavingDescripcion] = useState(false);

  // Edit event modal
  const [showModalEdicion, setShowModalEdicion] = useState(false);
  const [eventoEditando, setEventoEditando] =
    useState<EventoModificacion | null>(null);
  const [savingEdicion, setSavingEdicion] = useState(false);
  const [formEdicion, setFormEdicion] = useState<EdicionEventoForm>(EMPTY_FORM);
  const [formEdicionInicial, setFormEdicionInicial] =
    useState<EdicionEventoForm | null>(null);

  // Add event modal
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [formAgregar, setFormAgregar] = useState<EdicionEventoForm>(EMPTY_FORM);
  const [savingAgregar, setSavingAgregar] = useState(false);

  // Horas disponibles
  const [horasDisponiblesEdicion, setHorasDisponiblesEdicion] = useState<HoraDispItem[]>([]);
  const [horasDisponiblesAgregar, setHorasDisponiblesAgregar] = useState<HoraDispItem[]>([]);
  const horasFechaEdicionRef = useRef<string>("");
  const horasFechaAgregarRef = useRef<string>("");

  // ---------------------------------------------------------------------------
  // Client modal handlers
  // ---------------------------------------------------------------------------

  const handleSelectRowCliente = (id: string) => {
    setSelectedRowsClientes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const handleRowClickCliente = (params: GridRowParams) => {
    setClienteFiltro(params.row.id.toString());
    setShowModalClientes(false);
    setSelectedRowsClientes([]);
  };

  const handleOpenModalCliente = () => {
    setSearchClienteTerm("");
    setShowModalClientes(true);
    searchClientes();
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
      setTableRowsClientes(response?.success ? response.data || [] : []);
    } catch {
      setTableRowsClientes([]);
    }
  };

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fetch = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await obtenerUsuariosPorRol(
          "Asesor",
          Number(currentUser.id),
        );
        if (response?.success && Array.isArray(response.data)) {
          setUsuarios([
            { label: "Todos", value: "" },
            ...response.data.map((u: any) => ({
              label: u.fullName,
              value: String(u.userId),
            })),
          ]);
        }
      } catch {
        /* silent */
      }
    };
    fetch();
  }, [currentUser]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response: any = await listarTiposEvento();
        if (response?.success && Array.isArray(response.data)) {
          setTiposEvento(
            response.data
              .map(
                (item: any): TipoEventoItem => ({
                  id: String(item?.id ?? ""),
                  nombre: String(item?.nombre ?? ""),
                  requiereFecha: parseBooleanValue(item?.requiereFecha),
                  requiereHora: parseBooleanValue(item?.requiereHora),
                  requiereMonto: parseBooleanValue(item?.requiereMonto),
                }),
              )
              .filter((i: TipoEventoItem) => i.id && i.nombre),
          );
        }
      } catch {
        setTiposEvento([]);
      }
    };
    fetch();
  }, [listarTiposEvento]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(totalRows / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
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
    const t = setTimeout(() => searchClientes(searchClienteTerm), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchClienteTerm, showModalClientes]);

  useEffect(() => {
    if (!filtrosConsulta) return;
    const fetch = async () => {
      setLoadingConsulta(true);
      try {
        const response: any = await listarGestionesModificacion({
          ...filtrosConsulta,
          page: page + 1,
          pageSize: rowsPerPage,
        });
        if (response?.success) {
          const { rows: raw, totalRows: total } = normalizeGestionesResponse(
            response.data,
          );
          const mapped = raw.map((item: any) => mapGestionFromApi(item));
          setRows(mapped);
          setTotalRows(Math.max(total, page * rowsPerPage + mapped.length));
        } else {
          setRows([]);
          setTotalRows(0);
          toast.error(
            getApiErrorMessage(response, "No fue posible consultar gestiones."),
          );
        }
      } catch (error) {
        setRows([]);
        setTotalRows(0);
        toast.error(
          getApiErrorMessage(
            (error as any)?.response?.data ?? error,
            "No fue posible consultar gestiones.",
          ),
        );
      } finally {
        setLoadingConsulta(false);
      }
    };
    fetch();
  }, [filtrosConsulta, page, rowsPerPage, listarGestionesModificacion]);

  useEffect(() => {
    if (!filtrosConsulta) return undefined;

    const nextFiltro = normalizeGestionFilterValue(busquedaGestion);
    const currentFiltro = normalizeGestionFilterValue(filtrosConsulta.filtro ?? "");

    if (nextFiltro === currentFiltro) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setPage(0);
      setDrawerGestion(null);
      setFiltrosConsulta((prev) => {
        if (!prev) return prev;

        const prevFiltro = normalizeGestionFilterValue(prev.filtro ?? "");
        if (prevFiltro === nextFiltro) {
          return prev;
        }

        return {
          ...prev,
          filtro: nextFiltro,
        };
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [busquedaGestion, filtrosConsulta]);

  // ---------------------------------------------------------------------------
  // Memos
  // ---------------------------------------------------------------------------

  const tipoEventoOptions = useMemo(
    () => [
      { label: "Seleccione tipo de evento", value: "" },
      ...tiposEvento.map((t) => ({ label: t.nombre, value: t.id })),
    ],
    [tiposEvento],
  );

  const usuarioOptionsEdicion = useMemo(() => {
    const sinTodos = usuarios.filter(
      (o) =>
        String(o.value ?? "").trim() !== "" &&
        String(o.label ?? "")
          .trim()
          .toLowerCase() !== "todos",
    );
    const current = String(formEdicion.usuario ?? "").trim();
    if (!current) return sinTodos;
    const exists = sinTodos.some(
      (o) => String(o.value) === current || o.label === current,
    );
    if (exists || current.toLowerCase() === "todos") return sinTodos;
    return [{ label: current, value: current }, ...sinTodos];
  }, [usuarios, formEdicion.usuario]);

  const tipoEventoOptionsEdicion = useMemo(() => {
    const nombre = eventoEditando?.tipoEvento ?? "";
    const val = String(formEdicion.tipoEventoId ?? "");
    const exists = tipoEventoOptions.some((o) => String(o.value) === val);
    if (!nombre || exists || val === "") return tipoEventoOptions;
    return [{ label: nombre, value: val }, ...tipoEventoOptions];
  }, [tipoEventoOptions, eventoEditando, formEdicion.tipoEventoId]);

  const tipoEventoSeleccionadoEdicion = useMemo(
    () =>
      tiposEvento.find(
        (t) => String(t.id) === String(formEdicion.tipoEventoId ?? "").trim(),
      ) ?? null,
    [tiposEvento, formEdicion.tipoEventoId],
  );

  const tipoEventoInicialEdicion = useMemo(
    () =>
      tiposEvento.find(
        (t) =>
          String(t.id) ===
          String(formEdicionInicial?.tipoEventoId ?? "").trim(),
      ) ?? null,
    [tiposEvento, formEdicionInicial?.tipoEventoId],
  );

  const tipoEventoSeleccionadoAgregar = useMemo(
    () =>
      tiposEvento.find(
        (t) => String(t.id) === String(formAgregar.tipoEventoId ?? "").trim(),
      ) ?? null,
    [tiposEvento, formAgregar.tipoEventoId],
  );

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
    tipoEventoInicialEdicion?.requiereHora ??
    eventoEditando?.requiereHora ??
    false;

  const requiereFechaAgregar =
    tipoEventoSeleccionadoAgregar?.requiereFecha ?? false;
  const requiereHoraAgregar =
    tipoEventoSeleccionadoAgregar?.requiereHora ?? false;
  const requiereMontoAgregar =
    tipoEventoSeleccionadoAgregar?.requiereMonto ?? false;

  // ---------------------------------------------------------------------------
  // Columns for client modal
  // ---------------------------------------------------------------------------

  const columnsClientes: GridColDef[] = [
    {
      field: "select",
      headerName: "",
      width: 40,
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

  // ---------------------------------------------------------------------------
  // Filter handlers
  // ---------------------------------------------------------------------------

  const validarFechas = (): boolean => {
    const errores: { fechaInicio?: string; fechaFin?: string } = {};
    if (!fechaInicio.trim())
      errores.fechaInicio = "La fecha inicio es obligatoria.";
    if (!fechaFin.trim()) errores.fechaFin = "La fecha fin es obligatoria.";
    if (
      fechaInicio &&
      fechaFin &&
      new Date(`${fechaInicio}T00:00:00`) > new Date(`${fechaFin}T23:59:59`)
    )
      errores.fechaFin =
        "La fecha fin debe ser mayor o igual a la fecha inicio.";
    setErroresFechas(errores);
    return Object.keys(errores).length === 0;
  };

  const handleConsultar = () => {
    if (!validarFechas()) return;
    setFiltrosConsulta({
      fechaInicio,
      fechaFin,
      userId: parseNumberValue(usuarioFiltro),
      cuenta: cuentaFiltro.trim() || null,
      cliente: clienteFiltro.trim() || null,
      filtro: normalizeGestionFilterValue(busquedaGestion),
    });
    setPage(0);
    setDrawerGestion(null);
  };

  // ---------------------------------------------------------------------------
  // Horas disponibles effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fecha = formEdicion.fechaEvento;
    const idUsuario = formEdicion.usuario;
    if (!requiereHoraEdicion || !fecha || !idUsuario) {
      setHorasDisponiblesEdicion([]);
      horasFechaEdicionRef.current = "";
      return;
    }
    if (horasFechaEdicionRef.current === fecha) return;
    horasFechaEdicionRef.current = fecha;
    setHorasDisponiblesEdicion([]);
    obtenerHoras(fecha, idUsuario).then((res) => {
      const data = (res as any)?.data as HoraDispItem[] | undefined;
      if (!data) return;
      setHorasDisponiblesEdicion(data);
      setFormEdicion((prev) => {
        if (!prev.horaEvento) return prev;
        const [h, m] = prev.horaEvento.split(":").map(Number);
        const item = data.find((x) => x.hora === h && x.minuto === m);
        if (item?.ocupado) return { ...prev, horaEvento: "" };
        return prev;
      });
    });
  }, [formEdicion.fechaEvento, formEdicion.usuario, requiereHoraEdicion, obtenerHoras]);

  useEffect(() => {
    const fecha = formAgregar.fechaEvento;
    const idUsuario = formAgregar.usuario;
    if (!requiereHoraAgregar || !fecha || !idUsuario) {
      setHorasDisponiblesAgregar([]);
      horasFechaAgregarRef.current = "";
      return;
    }
    if (horasFechaAgregarRef.current === fecha) return;
    horasFechaAgregarRef.current = fecha;
    setHorasDisponiblesAgregar([]);
    obtenerHoras(fecha, idUsuario).then((res) => {
      const data = (res as any)?.data as HoraDispItem[] | undefined;
      if (!data) return;
      setHorasDisponiblesAgregar(data);
      setFormAgregar((prev) => {
        if (!prev.horaEvento) return prev;
        const [h, m] = prev.horaEvento.split(":").map(Number);
        const item = data.find((x) => x.hora === h && x.minuto === m);
        if (item?.ocupado) return { ...prev, horaEvento: "" };
        return prev;
      });
    });
  }, [formAgregar.fechaEvento, formAgregar.usuario, requiereHoraAgregar, obtenerHoras]);

  // ---------------------------------------------------------------------------
  // Drawer handlers
  // ---------------------------------------------------------------------------

  const handleOpenDrawer = (gestion: GestionModificacion) => {
    setDrawerGestion(gestion);
    setEditandoDescripcion(false);
    setDescripcionEdit(gestion.descripcion ?? "");
    setShowModalAgregar(false);
  };

  const handleCloseDrawer = () => {
    setDrawerGestion(null);
    setEditandoDescripcion(false);
  };

  // ---------------------------------------------------------------------------
  // Description handlers
  // ---------------------------------------------------------------------------

  const handleIniciarEditarDescripcion = () => {
    setDescripcionEdit(drawerGestion?.descripcion ?? "");
    setEditandoDescripcion(true);
  };

  const handleCancelarDescripcion = () => {
    setEditandoDescripcion(false);
    setDescripcionEdit("");
  };

  const handleGuardarDescripcion = async () => {
    if (!drawerGestion) return;
    setSavingDescripcion(true);
    try {
      const payload: ActualizarDescripcionGestionRequest = {
        idGestion: drawerGestion.idGestion,
        descripcion: descripcionEdit,
      };
      const result: any = await actualizarDescripcionGestion(payload);
      if (!result?.success) {
        toast.error(getApiErrorMessage(result, "No fue posible actualizar la descripcion."));
        return;
      }
      const updated = { ...drawerGestion, descripcion: descripcionEdit };
      setRows((prev) =>
        prev.map((g) =>
          g.idGestion === drawerGestion.idGestion ? updated : g,
        ),
      );
      setDrawerGestion(updated);
      setEditandoDescripcion(false);
      toast.success("Descripcion actualizada.");
    } catch {
      toast.error("No fue posible actualizar la descripcion.");
    } finally {
      setSavingDescripcion(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Edit event handlers
  // ---------------------------------------------------------------------------

  const handleEditarEvento = (ev: EventoGestion) => {
    const tipoEncontrado = tiposEvento.find(
      (t) => String(t.id) === String(ev.idTipoEvento),
    );
    const usuarioEncontrado = usuarios.find(
      (u) => String(u.value) === String(ev.idUsuarioAsignado),
    );

    const eventoMapped: EventoModificacion = {
      id: ev.id,
      cliente: ev.cliente,
      factura: ev.factura,
      cuenta: ev.cuenta,
      tipoEventoId: String(ev.idTipoEvento),
      tipoEvento: tipoEncontrado?.nombre ?? String(ev.idTipoEvento),
      fechaCreacion: "",
      fechaEvento: ev.fechaHoraProgramada ?? "",
      monto: ev.montoCompromiso,
      usuario: usuarioEncontrado?.label ?? String(ev.idUsuarioAsignado),
      requiereFecha: ev.requiereFecha,
      requiereHora: ev.requiereHora,
      requiereMonto: ev.requiereMonto,
    };

    const initialForm: EdicionEventoForm = {
      usuario: usuarioEncontrado?.value ?? String(ev.idUsuarioAsignado),
      cuenta: ev.cuenta,
      cliente: ev.cliente,
      tipoEventoId: tipoEncontrado?.id ?? String(ev.idTipoEvento),
      fechaEvento: extractDatePart(ev.fechaHoraProgramada),
      horaEvento: extractTimePart(ev.fechaHoraProgramada),
      monto: ev.montoCompromiso == null ? "" : String(ev.montoCompromiso),
    };

    setEventoEditando(eventoMapped);
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

  const handleChangeTipoEventoEdicion = (value: string | number) => {
    const tipo = tiposEvento.find((t) => String(t.id) === String(value));
    setFormEdicion((prev) => ({
      ...prev,
      tipoEventoId: value,
      fechaEvento: tipo && !tipo.requiereFecha ? "" : prev.fechaEvento,
      horaEvento: tipo && !tipo.requiereHora ? "" : prev.horaEvento,
      monto: tipo && !tipo.requiereMonto ? "" : prev.monto,
    }));
  };

  const handleGuardarEdicion = async () => {
    if (!eventoEditando || !formEdicionInicial) return;

    const usuarioValue = String(formEdicion.usuario ?? "").trim();
    const tipoEventoValue = String(formEdicion.tipoEventoId ?? "").trim();
    const now = new Date();
    const today = toLocalDateString(now);
    const currentTime = toLocalTimeString(now);

    if (!usuarioValue || usuarioValue.toLowerCase() === "todos") {
      toast.error("Debe seleccionar un usuario valido.");
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
        const dt = new Date(
          `${formEdicion.fechaEvento}T${formEdicion.horaEvento}:00`,
        );
        if (Number.isNaN(dt.getTime())) {
          toast.error("La fecha y hora del evento no son validas.");
          return;
        }
        if (dt < now) {
          toast.error(
            "La fecha y hora del evento no pueden ser menores a la actual.",
          );
          return;
        }
      } else if (formEdicion.horaEvento < currentTime) {
        toast.error("La hora del evento no puede ser menor a la hora actual.");
        return;
      }
    }
    if (
      requiereMontoEdicion &&
      (formEdicion.monto.trim() === "" ||
        Number.isNaN(Number(formEdicion.monto)))
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
    const currentFHP = mergeDateAndTime(
      formEdicion.fechaEvento,
      formEdicion.horaEvento,
      requiereHoraEdicion,
    );
    const initialFHP = mergeDateAndTime(
      formEdicionInicial.fechaEvento,
      formEdicionInicial.horaEvento,
      requiereHoraInicialEdicion,
    );
    const fechaHoraChanged = requiereFechaEdicion && currentFHP !== initialFHP;
    const currentMonto =
      formEdicion.monto.trim() === "" ? null : Number(formEdicion.monto);
    const initialMonto =
      formEdicionInicial.monto.trim() === ""
        ? null
        : Number(formEdicionInicial.monto);
    const montoChanged = requiereMontoEdicion && currentMonto !== initialMonto;

    const payload: ActualizarModificacionEventoRequest = {
      idEvento: eventoEditando.id,
    };
    if (usuarioChanged) {
      const uid = parseNumberValue(formEdicion.usuario);
      if (uid === null) {
        toast.error("El usuario seleccionado no es valido.");
        return;
      }
      payload.idUsuarioAsignado = uid;
    }
    if (tipoEventoChanged) {
      const tid = parseNumberValue(formEdicion.tipoEventoId);
      if (tid === null) {
        toast.error("El tipo de evento seleccionado no es valido.");
        return;
      }
      payload.idTipoEvento = tid;
    }
    if (fechaHoraChanged) payload.fechaHoraProgramada = currentFHP;
    if (montoChanged) payload.montoCompromiso = currentMonto;

    if (Object.keys(payload).length <= 1) {
      toast.error("No hay cambios para guardar.");
      return;
    }

    setSavingEdicion(true);
    try {
      const result: any = await actualizarModificacionEvento(payload);
      if (!result?.success) {
        toast.error(
          getApiErrorMessage(result, "No fue posible guardar la edicion."),
        );
        return;
      }

      const tipoSel = tiposEvento.find(
        (t) => String(t.id) === String(formEdicion.tipoEventoId),
      );

      const updateEvento = (ev: EventoGestion): EventoGestion =>
        ev.id !== eventoEditando.id
          ? ev
          : {
              ...ev,
              idUsuarioAsignado: usuarioChanged
                ? parseNumberValue(formEdicion.usuario) ?? ev.idUsuarioAsignado
                : ev.idUsuarioAsignado,
              idTipoEvento: tipoEventoChanged
                ? parseNumberValue(formEdicion.tipoEventoId) ?? ev.idTipoEvento
                : ev.idTipoEvento,
              requiereFecha: tipoSel?.requiereFecha ?? ev.requiereFecha,
              requiereHora: tipoSel?.requiereHora ?? ev.requiereHora,
              requiereMonto: tipoSel?.requiereMonto ?? ev.requiereMonto,
              fechaHoraProgramada: fechaHoraChanged
                ? currentFHP
                : ev.fechaHoraProgramada,
              montoCompromiso: montoChanged ? currentMonto : ev.montoCompromiso,
            };

      setRows((prev) =>
        prev.map((g) => ({ ...g, eventos: g.eventos.map(updateEvento) })),
      );
      setDrawerGestion((prev) =>
        prev ? { ...prev, eventos: prev.eventos.map(updateEvento) } : prev,
      );

      toast.success(result?.message || "Evento actualizado correctamente.");
      handleCloseModalEdicion();
    } catch {
      toast.error("No fue posible guardar la edicion del evento.");
    } finally {
      setSavingEdicion(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Add event handlers
  // ---------------------------------------------------------------------------

  const handleOpenModalAgregar = () => {
    if (!drawerGestion) return;
    setFormAgregar({
      ...EMPTY_FORM,
      cuenta: drawerGestion.cuenta,
      cliente: drawerGestion.cliente,
    });
    setShowModalAgregar(true);
  };

  const handleCloseModalAgregar = () => {
    setShowModalAgregar(false);
    setFormAgregar(EMPTY_FORM);
  };

  const setFieldAgregar = <K extends keyof EdicionEventoForm>(
    field: K,
    value: EdicionEventoForm[K],
  ) => {
    setFormAgregar((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangeTipoEventoAgregar = (value: string | number) => {
    const tipo = tiposEvento.find((t) => String(t.id) === String(value));
    setFormAgregar((prev) => ({
      ...prev,
      tipoEventoId: value,
      fechaEvento: tipo && !tipo.requiereFecha ? "" : prev.fechaEvento,
      horaEvento: tipo && !tipo.requiereHora ? "" : prev.horaEvento,
      monto: tipo && !tipo.requiereMonto ? "" : prev.monto,
    }));
  };

  const handleGuardarAgregar = async () => {
    if (!drawerGestion) return;

    const usuarioValue = String(formAgregar.usuario ?? "").trim();
    const tipoValue = String(formAgregar.tipoEventoId ?? "").trim();
    const now = new Date();
    const today = toLocalDateString(now);
    const currentTime = toLocalTimeString(now);

    if (!usuarioValue || usuarioValue.toLowerCase() === "todos") {
      toast.error("Debe seleccionar un usuario.");
      return;
    }
    if (!tipoValue) {
      toast.error("El tipo de evento es obligatorio.");
      return;
    }
    if (requiereFechaAgregar && !formAgregar.fechaEvento) {
      toast.error("La fecha del evento es obligatoria.");
      return;
    }
    if (requiereFechaAgregar && formAgregar.fechaEvento < today) {
      toast.error("La fecha del evento no puede ser menor a la fecha actual.");
      return;
    }
    if (requiereHoraAgregar && !formAgregar.horaEvento) {
      toast.error("La hora del evento es obligatoria.");
      return;
    }
    if (requiereHoraAgregar) {
      if (requiereFechaAgregar) {
        const dt = new Date(
          `${formAgregar.fechaEvento}T${formAgregar.horaEvento}:00`,
        );
        if (Number.isNaN(dt.getTime())) {
          toast.error("La fecha y hora no son validas.");
          return;
        }
        if (dt < now) {
          toast.error("La fecha y hora no pueden ser menores a la actual.");
          return;
        }
      } else if (formAgregar.horaEvento < currentTime) {
        toast.error("La hora no puede ser menor a la hora actual.");
        return;
      }
    }
    if (
      requiereMontoAgregar &&
      (formAgregar.monto.trim() === "" ||
        Number.isNaN(Number(formAgregar.monto)))
    ) {
      toast.error("El monto es obligatorio.");
      return;
    }

    const idUsuario = parseNumberValue(formAgregar.usuario);
    const idTipo = parseNumberValue(formAgregar.tipoEventoId);
    if (!idUsuario || !idTipo) {
      toast.error("Datos invalidos.");
      return;
    }

    const payload: CrearEventoGestionRequest = {
      idGestion: drawerGestion.idGestion,
      idUsuarioAsignado: idUsuario,
      idTipoEvento: idTipo,
      fechaHoraProgramada: requiereFechaAgregar
        ? mergeDateAndTime(
            formAgregar.fechaEvento,
            formAgregar.horaEvento,
            requiereHoraAgregar,
          )
        : undefined,
      montoCompromiso: requiereMontoAgregar
        ? formAgregar.monto.trim() === ""
          ? null
          : Number(formAgregar.monto)
        : undefined,
    };

    setSavingAgregar(true);
    try {
      const result: any = await crearEventoGestion(payload);
      if (!result?.success) {
        toast.error(
          getApiErrorMessage(result, "No fue posible agregar el evento."),
        );
        return;
      }

      const tipoSel = tiposEvento.find((t) => String(t.id) === String(idTipo));
      const nuevoEvento: EventoGestion = {
        id: result?.data?.id ?? Date.now(),
        idGestion: drawerGestion.idGestion,
        cliente: drawerGestion.cliente,
        factura: drawerGestion.factura,
        cuenta: drawerGestion.cuenta,
        idUsuarioAsignado: idUsuario,
        idTipoEvento: idTipo,
        fechaHoraProgramada: payload.fechaHoraProgramada ?? "",
        montoCompromiso: payload.montoCompromiso ?? null,
        requiereFecha: tipoSel?.requiereFecha ?? false,
        requiereHora: tipoSel?.requiereHora ?? false,
        requiereMonto: tipoSel?.requiereMonto ?? false,
      };

      const addEvento = (g: GestionModificacion): GestionModificacion =>
        g.idGestion === drawerGestion.idGestion
          ? { ...g, eventos: [...g.eventos, nuevoEvento] }
          : g;

      setRows((prev) => prev.map(addEvento));
      setDrawerGestion((prev) =>
        prev ? { ...prev, eventos: [...prev.eventos, nuevoEvento] } : prev,
      );

      toast.success(result?.message || "Evento agregado correctamente.");
      handleCloseModalAgregar();
    } catch {
      toast.error("No fue posible agregar el evento.");
    } finally {
      setSavingAgregar(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete event handler
  // ---------------------------------------------------------------------------

  const handleEliminarGestion = async () => {
    if (!drawerGestion) return;
    if (!window.confirm(`¿Desea eliminar la gestión #${drawerGestion.idGestion}? Esta acción también eliminará todos sus eventos.`)) return;
    try {
      const payload: EliminarGestionRequest = { idGestion: drawerGestion.idGestion };
      const result: any = await eliminarGestion(payload);
      if (!result?.success) {
        toast.error(getApiErrorMessage(result, "No fue posible eliminar la gestión."));
        return;
      }
      setRows((prev) => prev.filter((g) => g.idGestion !== drawerGestion.idGestion));
      handleCloseDrawer();
      toast.success("Gestión eliminada correctamente.");
    } catch {
      toast.error("No fue posible eliminar la gestión.");
    }
  };

  const handleEliminarEvento = async (ev: EventoGestion) => {
    if (!window.confirm(`¿Desea eliminar el evento con id ${ev.id}?`)) return;
    try {
      const payload: EliminarEventoGestionRequest = { idEvento: ev.id };
      const result: any = await eliminarEventoGestion(payload);
      if (!result?.success) {
        toast.error(getApiErrorMessage(result, "No fue posible eliminar el evento."));
        return;
      }
      const removeEvento = (g: GestionModificacion): GestionModificacion => ({
        ...g,
        eventos: g.eventos.filter((e) => e.id !== ev.id),
      });
      setRows((prev) => prev.map(removeEvento));
      setDrawerGestion((prev) => (prev ? removeEvento(prev) : prev));
      toast.success("Evento eliminado correctamente.");
    } catch {
      toast.error("No fue posible eliminar el evento.");
    }
  };

  const handleIrSeguimientoEvento = (ev: EventoGestion) => {
    const url = buildConsultaCarteraUrl({
      cuenta: ev.cuenta,
      factura: ev.factura,
      identificacionCliente: ev.cliente,
    });
    window.open(
      `${window.location.origin}${window.location.pathname}#${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const resolverNombreTipo = (id: number) =>
    tiposEvento.find((t) => String(t.id) === String(id))?.nombre ?? String(id);

  const resolverNombreUsuario = (id: number) =>
    usuarios.find((u) => String(u.value) === String(id))?.label ?? String(id);

  const renderFechaEvento = (ev: EventoGestion) => {
    if (!ev.fechaHoraProgramada) return "-";
    return (
      extractDatePart(ev.fechaHoraProgramada) +
      (ev.requiereHora ? ` ${extractTimePart(ev.fechaHoraProgramada)}` : "")
    );
  };

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div className="mt-5" style={{ margin: "auto", width: "90%" }}>
      <h3>Modificacion de gestiones</h3>

      {/* ---- Filters ---- */}
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
                    onChange={(e) => {
                      setFechaInicio(e.target.value);
                      setErroresFechas((p) => ({
                        ...p,
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
                    onChange={(e) => {
                      setFechaFin(e.target.value);
                      setErroresFechas((p) => ({ ...p, fechaFin: undefined }));
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
                  onChange={(c) => setCuentaFiltro(c ?? "")}
                  onSelect={() => {}}
                />
              </Col>
              <Col md={2}>
                <BuscadoClientes
                  selectedValue={clienteFiltro}
                  onOpenModal={handleOpenModalCliente}
                  onClear={() => setClienteFiltro("")}
                />
              </Col>
              <Col md={1} className="d-flex align-items-center">
                <Button
                  variant="primary"
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
          </Form>
        </Card.Body>
      </Card>

      {/* ---- Gestiones table ---- */}
      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="mb-3" style={{ maxWidth: 280 }}>
            <Form.Control
              type="text"
              placeholder="Buscar por ID Gestion..."
              value={busquedaGestion}
              onChange={(e) => setBusquedaGestion(e.target.value)}
            />
          </div>

          {loadingConsulta ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-5 text-muted">
              {filtrosConsulta
                ? "No se encontraron gestiones."
                : "Aplique los filtros para consultar."}
            </div>
          ) : (
            <Table hover responsive style={{ cursor: "pointer", fontSize: 14 }}>
              <thead className="table-light">
                <tr>
                  <th>ID Gestion</th>
                  <th>Usuario</th>
                  <th>Cliente</th>
                  <th>Factura</th>
                  <th>Cuenta</th>
                  <th>Fecha / Hora</th>
                  <th className="text-center">Eventos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((gestion) => (
                  <tr
                    key={gestion.idGestion}
                    onClick={() => handleOpenDrawer(gestion)}
                    style={{
                      backgroundColor:
                        drawerGestion?.idGestion === gestion.idGestion
                          ? "#eef2ff"
                          : undefined,
                    }}
                  >
                    <td>
                      <strong>{gestion.idGestion}</strong>
                    </td>
                    <td>{gestion.Username}</td>
                    <td>{gestion.cliente}</td>
                    <td>{gestion.factura}</td>
                    <td>{gestion.cuenta}</td>
                    <td>{formatFechaHora(gestion.FechaHora)}</td>
                    <td className="text-center">
                      <Chip
                        size="small"
                        label={gestion.eventos.length}
                        color={
                          gestion.eventos.length > 0 ? "primary" : "default"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {filtrosConsulta && !loadingConsulta && (
            <TablePagination
              component="div"
              count={totalRows}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Filas por pagina:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `mas de ${to}`}`
              }
            />
          )}
        </Card.Body>
      </Card>

      {/* ---- Modal Seguimiento ---- */}
      <Modal
        show={drawerGestion !== null}
        onHide={handleCloseDrawer}
        size="xl"
        scrollable
        enforceFocus={false}
        centered
      >
        {drawerGestion && (
          <>
            <Modal.Header
              closeButton
              placeholder=""
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            >
              <Modal.Title className="d-flex align-items-center" style={{ marginRight: "1rem" }}>
                Gestión #{drawerGestion.idGestion}
                <Tooltip title="Eliminar gestión">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleEliminarGestion}
                    type="button"
                    style={{ marginLeft: "1rem" }}
                  >
                    <i className="fas fa-trash-alt" />
                  </button>
                </Tooltip>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Usuario</Form.Label>
                    <Form.Control
                      type="text"
                      value={drawerGestion.Username}
                      readOnly
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Fecha / Hora</Form.Label>
                    <Form.Control
                      type="text"
                      value={formatFechaHora(drawerGestion.FechaHora)}
                      readOnly
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Cliente</Form.Label>
                    <Form.Control
                      type="text"
                      value={drawerGestion.cliente}
                      readOnly
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Factura</Form.Label>
                    <Form.Control
                      type="text"
                      value={drawerGestion.factura}
                      readOnly
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Cuenta</Form.Label>
                    <Form.Control
                      type="text"
                      value={drawerGestion.cuenta}
                      readOnly
                    />
                  </Form.Group>
                </Col>
              </Row>

              <hr />

              {/* Descripcion */}
              <Row>
                <Col>
                  <Form.Group>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Form.Label className="mb-0">Descripción</Form.Label>
                      {!editandoDescripcion ? (
                        <Tooltip title="Editar descripción">
                          <button className="btn btn-sm btn-outline-primary" onClick={handleIniciarEditarDescripcion} type="button">
                            <i className="fas fa-edit" />
                          </button>
                        </Tooltip>
                      ) : (
                        <div className="d-flex" style={{ gap: "0.5rem" }}>
                          <Tooltip title="Cancelar">
                            <button className="btn btn-sm btn-outline-secondary" onClick={handleCancelarDescripcion} type="button">
                              <i className="fas fa-times" />
                            </button>
                          </Tooltip>
                          <Tooltip title="Guardar">
                            <button className="btn btn-sm btn-primary" onClick={handleGuardarDescripcion} disabled={savingDescripcion} type="button">
                              {savingDescripcion ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check" />}
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={descripcionEdit}
                      onChange={(e) => setDescripcionEdit(e.target.value)}
                      placeholder="Sin descripcion"
                      style={{ resize: "vertical" }}
                      readOnly={!editandoDescripcion}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <hr />

              {/* Eventos */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0">
                  Eventos ({drawerGestion.eventos.length})
                </Form.Label>
                <Button
                  size="sm"
                  variant="success"
                  onClick={handleOpenModalAgregar}
                >
                  <i className="fas fa-plus mr-1" />
                  Añadir
                </Button>
              </div>

              {drawerGestion.eventos.length === 0 ? (
                <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                  Sin eventos registrados.
                </p>
              ) : (
                <Table
                  size="sm"
                  bordered
                  hover
                  responsive
                  style={{ fontSize: 13 }}
                >
                  <thead className="thead-light">
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Tipo</th>
                      <th>Fecha / Hora</th>
                      <th className="text-right">Monto</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drawerGestion.eventos.map((ev) => (
                      <tr key={ev.id}>
                        <td>{ev.id}</td>
                        <td>{resolverNombreUsuario(ev.idUsuarioAsignado)}</td>
                        <td>{resolverNombreTipo(ev.idTipoEvento)}</td>
                        <td>{renderFechaEvento(ev)}</td>
                        <td className="text-right">
                          {formatMonto(ev.montoCompromiso)}
                        </td>
                        <td className="text-center">
                          <div
                            className="d-flex justify-content-center"
                            style={{ gap: 4 }}
                          >
                            <Tooltip title="Editar">
                              <Button
                                size="sm"
                                variant="light"
                                onClick={() => handleEditarEvento(ev)}
                                style={{
                                  padding: "2px 6px",
                                  border: "1px solid #d0d7de",
                                }}
                              >
                                <i className="fas fa-edit" />
                              </Button>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <Button
                                size="sm"
                                variant="light"
                                onClick={() => handleEliminarEvento(ev)}
                                style={{
                                  padding: "2px 6px",
                                  border: "1px solid #d0d7de",
                                }}
                              >
                                <i className="fas fa-trash-alt" />
                              </Button>
                            </Tooltip>
                            <Tooltip title="Ir a seguimiento">
                              <Button
                                size="sm"
                                variant="light"
                                onClick={() => handleIrSeguimientoEvento(ev)}
                                style={{
                                  padding: "2px 6px",
                                  border: "1px solid #d0d7de",
                                }}
                              >
                                <i className="fas fa-external-link-alt" />
                              </Button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseDrawer}>
                Cerrar
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* ---- Edit event modal ---- */}
      <Modal
        show={showModalEdicion}
        onHide={handleCloseModalEdicion}
        size="xl"
        centered
        style={{ zIndex: 1060 }}
      >
        <Modal.Header
          closeButton
          placeholder=""
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        >
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
                    onChange={(v) => setFieldEdicion("usuario", v)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Cuenta</Form.Label>
                    <Form.Control
                      type="text"
                      value={formEdicion.cuenta}
                      readOnly
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Cliente</Form.Label>
                    <Form.Control
                      type="text"
                      value={formEdicion.cliente}
                      readOnly
                    />
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
                  <Form.Group>
                    <Form.Label>Fecha evento</Form.Label>
                    <Form.Control
                      type="date"
                      value={formEdicion.fechaEvento}
                      disabled={!requiereFechaEdicion}
                      onChange={(e) =>
                        setFieldEdicion("fechaEvento", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <HoraSelectorEvento
                      fecha={requiereHoraEdicion ? formEdicion.fechaEvento : ""}
                      value={requiereHoraEdicion ? formEdicion.horaEvento || null : null}
                      onChange={(hora) => setFieldEdicion("horaEvento", hora ?? "")}
                      horas={horasDisponiblesEdicion}
                      loading={loadingHoras}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Monto</Form.Label>
                    <Form.Control
                      type="number"
                      value={formEdicion.monto}
                      disabled={!requiereMontoEdicion}
                      onChange={(e) => setFieldEdicion("monto", e.target.value)}
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

      {/* ---- Add event modal ---- */}
      <Modal
        show={showModalAgregar}
        onHide={handleCloseModalAgregar}
        size="xl"
        centered
        style={{ zIndex: 1060 }}
      >
        <Modal.Header
          closeButton
          placeholder=""
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        >
          <Modal.Title>
            Agregar evento — Gestion #{drawerGestion?.idGestion}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={3}>
              <SingleSelect
                label="Usuario"
                options={usuarioOptionsEdicion}
                selectedValue={formAgregar.usuario}
                onChange={(v) => setFieldAgregar("usuario", v)}
              />
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Cuenta</Form.Label>
                <Form.Control type="text" value={formAgregar.cuenta} readOnly />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Cliente</Form.Label>
                <Form.Control
                  type="text"
                  value={formAgregar.cliente}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <SingleSelect
                label="Tipo de evento"
                options={tipoEventoOptions}
                selectedValue={formAgregar.tipoEventoId}
                onChange={handleChangeTipoEventoAgregar}
              />
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Fecha evento</Form.Label>
                <Form.Control
                  type="date"
                  value={formAgregar.fechaEvento}
                  disabled={!requiereFechaAgregar}
                  onChange={(e) =>
                    setFieldAgregar("fechaEvento", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <HoraSelectorEvento
                  fecha={requiereHoraAgregar ? formAgregar.fechaEvento : ""}
                  value={requiereHoraAgregar ? formAgregar.horaEvento || null : null}
                  onChange={(hora) => setFieldAgregar("horaEvento", hora ?? "")}
                  horas={horasDisponiblesAgregar}
                  loading={loadingHoras}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Monto</Form.Label>
                <Form.Control
                  type="number"
                  value={formAgregar.monto}
                  disabled={!requiereMontoAgregar}
                  onChange={(e) => setFieldAgregar("monto", e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModalAgregar}>
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleGuardarAgregar}
            disabled={savingAgregar}
          >
            {savingAgregar ? "Guardando..." : "Agregar"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ---- Client modal ---- */}
      <ModalTablaClientes
        show={showModalClientes}
        onHide={() => setShowModalClientes(false)}
        searchTerm={searchClienteTerm}
        onSearchChange={setSearchClienteTerm}
        columns={columnsClientes}
        rows={tableRowsClientes}
        selectedRows={selectedRowsClientes}
        onSelectRow={handleSelectRowCliente}
        onPaginationChange={(m) => setPaginationModelClientes(m)}
        paginationModel={paginationModelClientes}
        onRowClick={handleRowClickCliente}
      />
    </div>
  );
};
