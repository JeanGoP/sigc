import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Tabs,
  Tab,
  Accordion,
  Form,
  Button,
  Card,
  FormLabel,
  Row,
  Col,
  Badge,
  Alert,
} from "react-bootstrap";
import {
  DynamicTable,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizables";
import "./GestionCobroLayout.css";
import ConsultaClientes from "../ConsultaClientes/ConsultaCLientes";
import { ContentHeader } from "@app/components";
import { DynamicTablePagination } from "../ConsultaClientes/components/tablaReutilizablePaginacion";
import {
  ClienteEstadoCuenta,
  FetchFacturasRef,
} from "../ConsultaClientes/components/EstadoClienteCompleto";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faPhone,
  faHandHoldingUsd,
  faExclamationTriangle,
  faHome,
  faBuilding,
  faMicrophone,
  faTag,
  faTimes,
  faCheck,
  faEnvelope,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { CustomDatePicker } from "@app/components/DatePicker/DatePickerv2";
import { NumericField } from "@app/components/InputFields/NumericField";
import Select from "react-select";
import { handleApiResponse } from "@app/utils/handleApiResponse";
import Modal from "react-bootstrap/Modal";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import {
  TimelineSeguimientos,
  type Seguimiento,
  type Evento,
} from "@app/modules/maestros/tipos-eventos/TimelineSeguimientos";
import { convertirEventoAXml } from "./functions/convertEventoToXML";
import {
  SAVE_SESSION_SYNC_RETRY_DELAYS_MS,
  findGestionSessionBySessionRef,
  isGestionSessionNonActiveStatus,
  normalizeGestionSessionStatus,
  normalizeSaveOutcomeCode,
  shouldCloseSeguimientoDraftAfterSave,
} from "./functions/gestionSessionSaveSync";
// import {
//   GestionarFactura,
//   GestionFacturaRequest,
//   buscarGestiones,
//   GestionesEventosFacturaResulta,
// } from "@app/services/GestionFacturaService";
import {
  useGestionFacturaService,
  GestionFacturaRequest,
  GestionesEventosFacturaResulta,
} from "@app/services/GestionFacturaService";
// import { obtenerCliente, ClienteInfo } from "@app/services/ClienteService";
import { useClienteService, ClienteInfo } from "@app/services/ClienteService";
import { TablaBitacoras } from "./components/TablaBitacoras";
import { useAppSelector } from "@app/store/store";
import { toast } from "react-toastify";
import { EtiquetasClienteGestion } from "./components/EtiquetasClientesGestion";
import { useConsultaCarteraService } from "@app/services/ConsultaCartera/ConsultaCarteraServices";
import { useLocation, useNavigate } from "react-router-dom";
import { FiltrosCarteras } from "./components/FiltrosCarteras/FiltrosCarteras";
import {
  existsInLocalStorage,
  getSessionValue,
  loadFiltrosCarteras,
  saveExpecificFiltroProperty,
  saveFiltrosCarteras,
} from "@app/utils/localStorageHandler";
import { FiltrosFacturasCarteraModel } from "@app/models/otros/FiltrosFacturasCarteraModel";
import { StickyNote } from "./components/StickyNote/StickyNote";
import { DynamicTablePaginationConsultaCartera } from "../ConsultaClientes/components/tablaReutilizablePaginacionConsultaCartera";
import { TablaEventosPorClave } from "./components/TablaEventosPorClave/TablaEventosPorClave";
import {
  GestionLlamadaEventType,
  useGestionLlamadaService,
} from "@app/services/GestionLlamadaService";
import {
  buildGestionContextKey,
  calculateGestionSessionElapsedSeconds,
  useGestionSessionService,
} from "@app/services/GestionSessionService";
import {
  acquireActionLock,
  createOrReuseSaveAttempt,
  getCurrentTabId,
  getPendingInboundCalls,
  releaseActionLock,
  removePendingInboundCall,
  subscribePendingInboundCalls,
  PendingInboundCallSnapshot,
} from "@app/services/GestionLlamadas";
import {
  requestGlobalWebRtcOutboundDial,
  subscribeGlobalWebRtcCallEnded,
  subscribeGlobalWebRtcCallStarted,
} from "@app/services/WebRtc/webrtcBridge";
import { useGestionSessionContext } from "@app/modules/main/gestion-session/GestionSessionContext";
import GestionSessionConflictModal from "./components/GestionSessionConflictModal";
import { buildConsultaCarteraUrl } from "@app/utils/consultaCarteraNavigation";
import {
  ClienteTelefonoAlternoDto,
  normalizeClienteTelefono,
  useClienteTelefonoAlternoService,
} from "@app/services/ClienteTelefonoAlternoService";
import type { WebRtcCallDto } from "@app/services/WebRtc/webrtcService";
// import { ScoringVisual } from "./components/score";

const API_URL = import.meta.env.VITE_API_URL;

interface EventoXML {
  id: number;
  tipo: string;
  fecha: string;
  hora: string | null;
  valor?: number;
}

interface GestionSaveSyncResult {
  confirmedNonActive: boolean;
  sessionMissing: boolean;
  sessionStatus: string | null;
  synced: boolean;
}

const opciones_edades = [
  { label: "Todos", value: "todos" },
  { label: "30", value: "30" },
  { label: "60", value: "60" },
  { label: "90", value: "90" },
  { label: "+90", value: "+90" },
];

const opciones_tipos_filtro = [
  { label: "Todos", value: "todos" },
  { label: "Por Campaña", value: "campaña" },
  { label: "Por Fecha de Vencimiento", value: "vencimiento" },
  { label: "Sin Gestión Últimos X Días", value: "sinGestion" },
  { label: "Con Eventos", value: "eventos" },
  { label: "Por Etiqueta de Cliente", value: "etiqueta" },
];

const etiquetasMockup = [
  { id: 1, nombre: "Cliente Electro", color: "#1976d2" },
  { id: 2, nombre: "Cliente Moto", color: "#388e3c" },
  { id: 3, nombre: "Penalizado", color: "#d32f2f" },
  { id: 4, nombre: "Buen Cliente", color: "#fbc02d" },
  { id: 5, nombre: "Cliente VIP", color: "#512da8" },
];

function formatElapsedHhMmSs(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0
    ? Math.floor(totalSeconds)
    : 0;
  const hh = Math.floor(safeSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const mm = Math.floor((safeSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function createStartIdempotencyKey(): string {
  return `start-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSaveFallbackIdempotencyKey(): string {
  return `save-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createTransitionIdempotencyKey(prefix = "transition"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, delayMs);
  });
}

function isInboundCallDirection(directionRaw?: string | null): boolean {
  const direction = String(directionRaw ?? "").trim().toLowerCase();
  return direction.includes("inbound") || direction.includes("incoming");
}

function isTerminalCallStatus(statusRaw?: string | null): boolean {
  const status = String(statusRaw ?? "").trim().toLowerCase();
  return [
    "completed",
    "failed",
    "canceled",
    "cancelled",
    "busy",
    "no-answer",
    "rejected",
    "disconnected",
    "error",
  ].includes(status);
}

function areEquivalentPhoneValues(
  leftRaw?: string | null,
  rightRaw?: string | null
): boolean {
  const leftNormalized = normalizeClienteTelefono(leftRaw);
  const rightNormalized = normalizeClienteTelefono(rightRaw);
  if (!leftNormalized || !rightNormalized) {
    return false;
  }

  if (leftNormalized === rightNormalized) {
    return true;
  }

  const leftDigits = leftNormalized.replace(/\D/g, "");
  const rightDigits = rightNormalized.replace(/\D/g, "");
  if (!leftDigits || !rightDigits) {
    return false;
  }

  if (leftDigits === rightDigits) {
    return true;
  }

  const leftWithout57 = leftDigits.startsWith("57") ? leftDigits.slice(2) : leftDigits;
  const rightWithout57 = rightDigits.startsWith("57") ? rightDigits.slice(2) : rightDigits;
  if (leftWithout57 && rightWithout57 && leftWithout57 === rightWithout57) {
    return true;
  }

  if (leftDigits.length >= 10 && rightDigits.length >= 10) {
    return leftDigits.slice(-10) === rightDigits.slice(-10);
  }

  return false;
}

interface PendingOutboundAlternatePhoneCandidate {
  cliente: string;
  telefonoPrincipalNormalizado: string;
  telefonoDestino: string;
  telefonoDestinoNormalizado: string;
  callSid?: string | null;
  createdAtMs: number;
}

interface PendingSaveAlternatePhonePrompt {
  cliente: string;
  telefono: string;
  telefonoNormalizado: string;
}

export const ConsultaCartera: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [seleccionEdades, setSeleccionEdades] = useState("todos");
  const [seleccionTipoFiltro, setSeleccionTipoFiltro] = useState("todos");
  const [selectedValue, setSelectedValue] = useState("");
  const [intMora, setIntMora] = useState<string>("3.00");
  const [registroSeleccionado, setRegistroSeleccionado] = useState<any>(null);
  const tablaFacturasRef = useRef<FetchFacturasRef>(null);
  const [checkIncluirSaldosCero, setCheckIncluirSaldosCero] = useState(false);
  const [fechaConsultaFacturas, setFechaConsultaFacturas] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [MenuFiltrosState, setMenuFiltrosState] = useState(false);
  const [unsavedFilttersChanges, useUnsavedFilttersChanges] = useState(false);
  const [filtroGenericoStringPorTipo, setFiltroGenericoStringPorTipo] =
    useState<string>("");
  const [checkSoloAsignadas, setCheckSoloAsignadas] = useState(false);
  const [checkSoloEventosPendientes, setCheckSoloEventosPendientes] =
    useState(false);
  const [eventosOpciones, setEventosOpciones] = useState([
    { label: "Todas", value: "todas" },
    { label: "Evento A", value: "eventoA" },
    { label: "Evento B", value: "eventoB" },
    { label: "Evento C", value: "eventoC" },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  if (!existsInLocalStorage("filtros_carteras")) {
    const obj = new FiltrosFacturasCarteraModel();
    saveFiltrosCarteras(obj);
  }

  const {
    loading: loadingCliente,
    error: errorCliente,
    obtenerCliente,
  } = useClienteService();
  const {
    listarTelefonosAlternos,
    guardarTelefonoAlterno,
    marcarTelefonoAlternoComoUsado,
    loadingTelefonosAlternos,
    loadingGuardarTelefonoAlterno,
  } = useClienteTelefonoAlternoService();

  const {
    buscarGestiones,
    GestionarFactura,
    loadingBuscar,
    errorBuscar,
    loadingInsertar,
    errorInsertar,
  } = useGestionFacturaService();
  const { registrarEventoLlamada } = useGestionLlamadaService();

  const { getFacturasList, getListTemplate, sendWithTemplate, loading, error } =
    useConsultaCarteraService();

  const [eventosSeleccionados, setEventosSeleccionados] = useState<string[]>(
    []
  );
  const [tablaRows, setTablaRows] = useState<any[]>([]);
  const [tablaTotalRows, setTablaTotalRows] = useState(0);
  const [tablaLoading, setTablaLoading] = useState(false);
  const [tablaSearch, setTablaSearch] = useState("");
  const [tablaRowsPerPage, setTablaRowsPerPage] = useState(50);
  const [tablaPage, setTablaPage] = useState(0);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [etiquetasCliente, setEtiquetasCliente] = useState<number[]>([]);
  const [showModalEtiquetas, setShowModalEtiquetas] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("info");
  const hasFullSelection = Boolean(
    registroSeleccionado?.cliente &&
      registroSeleccionado?.numefac &&
      registroSeleccionado?.cuenta
  );
  const selectedCliente = String(registroSeleccionado?.cliente ?? "").trim();
  const selectedFactura = String(registroSeleccionado?.numefac ?? "").trim();
  const selectedCuenta = String(registroSeleccionado?.cuenta ?? "").trim();
  const selectedContextKey = hasFullSelection
    ? buildGestionContextKey(selectedCliente, selectedFactura, selectedCuenta)
    : "";

  const {
    startGestionSession,
    listInProgressGestionSessions,
    transitionGestionSession,
    loadingStartGestionSession,
    loadingTransitionGestionSession,
  } = useGestionSessionService();
  const {
    activeSession: activeGestionSession,
    getSessionByContextKey,
    refreshSessions,
    switchActiveSession,
    hasLiveCall,
    switchBlockedReason,
  } = useGestionSessionContext();
  const [isSeguimientoDraftOpen, setIsSeguimientoDraftOpen] = useState(false);
  const [gestionElapsedSeconds, setGestionElapsedSeconds] = useState(0);
  const [dialDestination, setDialDestination] = useState("");
  const [showOutboundCallModal, setShowOutboundCallModal] = useState(false);
  const [telefonosAlternosCliente, setTelefonosAlternosCliente] = useState<
    ClienteTelefonoAlternoDto[]
  >([]);
  const [pendingSaveAlternatePhonePrompt, setPendingSaveAlternatePhonePrompt] =
    useState<PendingSaveAlternatePhonePrompt | null>(null);
  const [showSaveAlternatePhoneModal, setShowSaveAlternatePhoneModal] =
    useState(false);
  const [alternatePhoneLabel, setAlternatePhoneLabel] = useState("");
  const [alternatePhoneObservation, setAlternatePhoneObservation] =
    useState("");
  const [isSavingSeguimiento, setIsSavingSeguimiento] = useState(false);
  const [pendingInboundCalls, setPendingInboundCalls] = useState<PendingInboundCallSnapshot[]>(
    () => getPendingInboundCalls()
  );
  const [isAssociatingInboundCall, setIsAssociatingInboundCall] = useState(false);
  const [showGestionConflictModal, setShowGestionConflictModal] = useState(false);
  const [isSwitchingGestionContext, setIsSwitchingGestionContext] = useState(false);
  const isSavingSeguimientoRef = useRef(false);
  const isStartingGestionRef = useRef(false);
  const pendingOutboundAlternatePhoneCandidateRef =
    useRef<PendingOutboundAlternatePhoneCandidate | null>(null);
  const tabId = getCurrentTabId();
  const currentContextGestionSession = hasFullSelection
    ? getSessionByContextKey(selectedContextKey)
    : null;
  const telephonyEnabled = Boolean(currentUser?.telephonyEnabled);
  const isCallInProgress = telephonyEnabled && hasLiveCall;
  const numeroPrincipalCliente = String(clienteInfo?.telefono ?? "").trim();
  const telefonosAlternosActivos = telefonosAlternosCliente.filter(
    (item) => item.activo
  );

  const handlnChangeFechaFiltro = (date: string | null) => {
    if (date) {
      // const isoString = date.toISOString().split("T")[0];
      saveExpecificFiltroProperty("fechaConsulta", date);
      setFechaConsultaFacturas(date);
    }
  };

  // Leer query params para auto-seleccionar cliente/factura/cuenta
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cuenta = params.get("cuenta") || "";
    const factura = params.get("factura") || "";
    const identificacionCliente = params.get("identificacionCliente") || "";

    if (cuenta || factura || identificacionCliente) {
      // Ajustar el texto de búsqueda según prioridad
      if (identificacionCliente) {
        setTablaSearch(identificacionCliente);
      } else if (factura) {
        setTablaSearch(factura);
      } else if (cuenta) {
        setTablaSearch(cuenta);
      }

      (async () => {
        const rows = await fetchFacturas();
        const row = rows.find((r: any) =>
          factura
            ? String(r.numefac) === String(factura)
            : cuenta
              ? String(r.cuenta) === String(cuenta)
              : identificacionCliente
                ? String(r.cliente) === String(identificacionCliente)
                : false
        );

        if (row) {
          handleSeleccionarFactura(row);
          setActiveTab("seguimiento");
          if (row.cliente) cargarInfoCliente(String(row.cliente));
        } else if (identificacionCliente) {
          // Forzar ejecución de EstadoClienteCompleto con el id, aunque no haya fila aún
          setSelectedValue(identificacionCliente);
          cargarInfoCliente(identificacionCliente);
          if (factura || cuenta) {
            handleSeleccionarFactura({
              cliente: identificacionCliente,
              numefac: factura || "",
              cuenta: cuenta || "",
            });
            setActiveTab("seguimiento");
          }
        }
      })();
    }
  }, [location.search]);
  const [plantillasApi, setPlantillasApi] = useState<
    { nombre: string; key: string }[]
  >([]);
  const [plantillaSeleccionadaKey, setPlantillaSeleccionadaKey] =
    useState<string>("");

  const todasLasOpciones = eventosOpciones
    .filter((opt) => opt.value !== "todas")
    .map((opt) => opt.value);
  const isAllSelected = eventosSeleccionados.length === todasLasOpciones.length;

  const handleSelectEventos = (selected: any) => {
    if (!selected || selected.length === 0) {
      setEventosSeleccionados([]);
      return;
    }
    // Si selecciona 'Todas' y ya estaban todas seleccionadas, desmarca todo
    if (selected.some((opt: any) => opt.value === "todas")) {
      if (isAllSelected) {
        setEventosSeleccionados([]);
      } else {
        setEventosSeleccionados(todasLasOpciones);
      }
    } else {
      setEventosSeleccionados(selected.map((opt: any) => opt.value));
    }
  };

  const collapseHandler = () => {
    setCollapsed(!collapsed);
    // remor
  };

  const handleCheckIncluirSaldosCero = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCheckIncluirSaldosCero(event.target.checked);
  };

  const handleCheckSoloAsignadas = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCheckSoloAsignadas(event.target.checked);
  };

  const fetchFacturas = async (): Promise<any[]> => {
    setTablaLoading(true);
    let resultRows: any[] = [];
    try {
      const storedRaw =
        loadFiltrosCarteras() as Partial<FiltrosFacturasCarteraModel> | null;
      const filtros = new FiltrosFacturasCarteraModel(storedRaw ?? undefined);

      const params = {
        fecha: fechaConsultaFacturas,
        incluirCarterasSaldoCero: filtros.checkIncluirSaldosCero,
        user: currentUser?.id,
        forUser: filtros.checkSoloAsignadas,
        mostrarYaGestionados: filtros.checkSoloEventosPendientes,
        cuenta: filtros.cuenta ?? "",
        sinGestionDias: filtros.sinGestionDias,
        edad: filtros.filtroEdadMora,
        filtroEventos: filtros.tipoEvento,
        filtroPorVencimiento: filtros.filtroPorVencimiento ?? "",
        filtroPorEtiqueta: filtros.etiqueta,
        page: Math.max(1, tablaPage + 1),
        numPage: tablaRowsPerPage,
        filter: tablaSearch,
      };

      const data = await getFacturasList(params);
      if (data?.success && data.data) {
        if (Array.isArray(data.data)) {
          resultRows = data.data;
          setTablaRows(resultRows);
          setTablaTotalRows(resultRows.length);
        } else if (Array.isArray(data.data.items)) {
          resultRows = data.data.items;
          setTablaRows(resultRows);
          setTablaTotalRows(
            typeof data.data.total === "number" ? data.data.total : resultRows.length
          );
        } else {
          setTablaRows([]);
          setTablaTotalRows(0);
        }
      } else {
        setTablaRows([]);
        setTablaTotalRows(0);
      }
    } catch {
      setTablaRows([]);
      setTablaTotalRows(0);
    }
    setTablaLoading(false);
    return resultRows;
  };
  // Función para cargar las gestiones
  const cargarGestiones = async () => {
    if (!hasFullSelection) return;

    console.log("Cargando gestiones para:", registroSeleccionado);
    try {
      const response = await buscarGestiones(
        registroSeleccionado.numefac,
        registroSeleccionado.cliente,
        registroSeleccionado.cuenta
      );

      // console.log("Response de cargarGestiones: ", response);

      if (response && response.success && response.data) {
        const data: GestionesEventosFacturaResulta = response.data;
        // Transformar las gestiones al formato que espera el Timeline
        const seguimientosTransformados: Seguimiento[] = data.gestiones.map(
          (gestion) => {
            // Filtrar los eventos asociados a esta gestión
            const eventosGestion = (
              response.data && response.data.eventos
                ? response.data.eventos
                : []
            )
              .filter((evento) => evento.idGestion === gestion.id)
              .map((evento) => {
                // if (evento.TipoEvento === undefined)
                //   return alert("Tipo de evento no definido para el evento con ID: " + evento.id);

                return {
                  id: evento.id,
                  tipo: evento.tipoEvento ?? "",
                  fecha: evento.fechaHoraProgramada
                    ? evento.fechaHoraProgramada.split("T")[0]
                    : "",
                  hora: evento.fechaHoraProgramada
                    ? evento.fechaHoraProgramada
                        .split("T")[1]
                        ?.substring(0, 5) || null
                    : null,
                  color: evento.color || "black",
                  icono: evento.icono === null ? undefined : evento.icono,
                  valor: evento.montoCompromiso || undefined,
                  cumplido: evento.cumplido,
                };
              });
            return {
              id: gestion.id,
              usuario: gestion.usuario.toString(),
              fecha: (typeof gestion.fechaHora === "string"
                ? gestion.fechaHora
                : gestion.fechaHora.toISOString()
              ).split("T")[0],
              hora: (typeof gestion.fechaHora === "string"
                ? gestion.fechaHora
                : gestion.fechaHora.toISOString()
              )
                .split("T")[1]
                .substring(0, 5),
              texto: gestion.descripcion,
              detalle: gestion.descripcion,
              eventos: eventosGestion,
              tipoContacto: gestion.tipoContacto || "",
              grabacion: gestion.idGrabacionLlamada || null,
            };
          }
        );

        setSeguimientos(seguimientosTransformados);
      }
    } catch (error) {
      console.error("Error al cargar las gestiones:", error);
    }
  };

  useEffect(() => {
    const fetchPlantillas = async () => {
      const data = await getListTemplate("email");
      if (data?.success && Array.isArray(data.data)) {
        setPlantillasApi(data.data);
        if (data.data.length > 0) setPlantillaSeleccionadaKey(data.data[0].key);
      } else {
        toast.error("No se pudieron cargar las plantillas");
      }
    };
    fetchPlantillas();
  }, []);

  useEffect(() => {
    if (
      !loading &&
      inputRef.current &&
      inputRef.current.offsetParent !== null
    ) {
      inputRef.current.focus();
    }
  }, [tablaLoading]);

  // Cargar gestiones cuando se selecciona un registro
  useEffect(() => {
    if (hasFullSelection) {
      cargarGestiones();
    }
  }, [hasFullSelection, registroSeleccionado]);

  useEffect(() => {
    if (!currentContextGestionSession) {
      setIsSeguimientoDraftOpen(false);
      setGestionElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      setGestionElapsedSeconds(
        calculateGestionSessionElapsedSeconds(currentContextGestionSession)
      );
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [
    currentContextGestionSession?.accumulatedActiveSeconds,
    currentContextGestionSession?.currentActiveStartedAt,
    currentContextGestionSession?.elapsedActiveSeconds,
    currentContextGestionSession?.sessionRef,
    currentContextGestionSession?.status,
  ]);

  useEffect(() => {
    return subscribePendingInboundCalls((calls) => {
      setPendingInboundCalls(calls);
    });
  }, []);

  useEffect(() => {
    setDialDestination(numeroPrincipalCliente);
  }, [numeroPrincipalCliente]);

  useEffect(() => {
    setTelefonosAlternosCliente([]);
  }, [selectedCliente]);

  const isSameActiveContext = Boolean(
    activeGestionSession &&
      buildGestionContextKey(
        activeGestionSession.cliente,
        activeGestionSession.factura,
        activeGestionSession.cuenta
      ) === selectedContextKey
  );
  const gestionOperativaActiva = Boolean(
    isSameActiveContext && activeGestionSession?.status === "activa"
  );
  const canStartOutboundCall = telephonyEnabled && gestionOperativaActiva;
  const startCallBlockedReason = telephonyEnabled
    ? "Debes iniciar una gestión activa para poder llamar."
    : "La telefonia no esta habilitada para esta empresa.";
  const pendingInboundCount = telephonyEnabled ? pendingInboundCalls.length : 0;
  const hasPendingInboundCalls = telephonyEnabled && pendingInboundCount > 0;
  const nextPendingInboundCall = hasPendingInboundCalls
    ? pendingInboundCalls[0]
    : null;
  const seguimientoDraftStorageKey = (() => {
    const tenantId = String(currentUser?.tenantId ?? "").trim();
    const userId = String(currentUser?.id ?? "").trim();
    const sessionRef = String(activeGestionSession?.sessionRef ?? "").trim();

    if (!tenantId || !userId || !sessionRef) {
      return undefined;
    }

    return `sigc.gestion.seguimiento-draft:${tenantId}:${userId}:${sessionRef}`;
  })();
  const isSaveRequestInFlight = Boolean(isSavingSeguimiento || loadingInsertar);
  const canSaveSeguimiento = Boolean(
    gestionOperativaActiva
      && !isCallInProgress
      && !isSaveRequestInFlight
      && !hasPendingInboundCalls
      && !isAssociatingInboundCall
  );
  const saveSeguimientoBlockedReason = !gestionOperativaActiva
    ? "Debes iniciar una gestión activa antes de guardar seguimiento."
    : isCallInProgress
    ? "No puedes guardar mientras hay una llamada activa. Primero debes colgar."
    : hasPendingInboundCalls
    ? "Tienes una llamada entrante pendiente de asociar. Asociala a la gestion activa antes de guardar."
    : isAssociatingInboundCall
    ? "Asociando llamada entrante pendiente. Espera a que finalice."
    : "Ya hay un guardado en curso. Espera a que finalice.";

  const loadClienteTelefonosAlternos = useCallback(
    async (
      cliente: string,
      options?: { silent?: boolean }
    ): Promise<ClienteTelefonoAlternoDto[]> => {
      const clienteTrim = String(cliente ?? "").trim();
      if (!clienteTrim) {
        setTelefonosAlternosCliente([]);
        return [];
      }

      const response = await listarTelefonosAlternos(clienteTrim);
      if (response?.success && Array.isArray(response.data)) {
        if (selectedCliente === clienteTrim) {
          setTelefonosAlternosCliente(response.data);
        }
        return response.data;
      }

      if (selectedCliente === clienteTrim) {
        setTelefonosAlternosCliente([]);
      }
      if (!options?.silent) {
        toast.warning(
          response?.message || "No fue posible cargar los telefonos alternos del cliente."
        );
      }

      return [];
    },
    [listarTelefonosAlternos, selectedCliente]
  );

  const handleCloseSaveAlternatePhoneModal = useCallback(() => {
    if (loadingGuardarTelefonoAlterno) {
      return;
    }

    setShowSaveAlternatePhoneModal(false);
    setPendingSaveAlternatePhonePrompt(null);
    setAlternatePhoneLabel("");
    setAlternatePhoneObservation("");
  }, [loadingGuardarTelefonoAlterno]);

  const handleSubmitSaveAlternatePhone = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event?.preventDefault();

      const prompt = pendingSaveAlternatePhonePrompt;
      if (!prompt) {
        return;
      }

      const etiqueta = String(alternatePhoneLabel ?? "").trim();
      const observacion = String(alternatePhoneObservation ?? "").trim();
      if (!etiqueta) {
        toast.warning("Debes indicar una etiqueta para guardar el numero alterno.");
        return;
      }

      const response = await guardarTelefonoAlterno(prompt.cliente, {
        telefono: prompt.telefono,
        etiqueta,
        observacion: observacion || null,
      });

      if (!response?.success) {
        toast.warning(
          response?.message || "No fue posible guardar el numero alterno."
        );
        return;
      }

      const outcome = String(
        response.data?.outcomeCode ?? ""
      ).trim().toLowerCase();

      if (selectedCliente === prompt.cliente) {
        void loadClienteTelefonosAlternos(prompt.cliente, { silent: true });
      }

      handleCloseSaveAlternatePhoneModal();

      if (outcome === "reactivated") {
        toast.success("Numero alterno reactivado correctamente.");
        return;
      }

      if (outcome === "updated_existing") {
        toast.success("Numero alterno actualizado correctamente.");
        return;
      }

      toast.success("Numero alterno guardado correctamente.");
    },
    [
      alternatePhoneLabel,
      alternatePhoneObservation,
      guardarTelefonoAlterno,
      handleCloseSaveAlternatePhoneModal,
      loadClienteTelefonosAlternos,
      pendingSaveAlternatePhonePrompt,
      selectedCliente,
    ]
  );

  const handleAttachPendingInboundToActiveSession = useCallback(async (): Promise<void> => {
    if (isAssociatingInboundCall) {
      return;
    }

    const pendingCall = nextPendingInboundCall;
    if (!pendingCall?.callSid) {
      toast.info("No hay llamadas entrantes pendientes por asociar.");
      return;
    }

    if (!gestionOperativaActiva || !activeGestionSession?.idGestionSession || !activeGestionSession?.sessionRef) {
      toast.warning("Debes tener una gestion activa para asociar la llamada entrante pendiente.");
      return;
    }

    setIsAssociatingInboundCall(true);
    try {
      const shouldCloseEvent = Boolean(pendingCall.endedAt) || isTerminalCallStatus(pendingCall.status);
      const eventType: GestionLlamadaEventType = shouldCloseEvent ? "end" : "status";
      const fallbackStatus = shouldCloseEvent ? "completed" : "in-progress";

      const response = await registrarEventoLlamada({
        idGestionSession: activeGestionSession.idGestionSession,
        sessionRef: activeGestionSession.sessionRef,
        callSid: pendingCall.callSid,
        eventType,
        direction: pendingCall.direction ?? "inbound-client",
        status: pendingCall.status ?? fallbackStatus,
        finalStatus: shouldCloseEvent ? pendingCall.status ?? fallbackStatus : null,
        startedAt: pendingCall.startedAt ?? null,
        endedAt: shouldCloseEvent
          ? pendingCall.endedAt ?? new Date().toISOString()
          : pendingCall.endedAt ?? null,
        source: "consulta_cartera_inbound_attach",
      });

      if (!response?.success) {
        toast.warning(
          response?.message || "No se pudo asociar la llamada entrante a la gestion activa."
        );
        return;
      }

      removePendingInboundCall(pendingCall.callSid);
      toast.success("Llamada entrante asociada a la gestion activa.");
    } catch (error) {
      console.error("Error asociando llamada inbound pendiente:", error);
      toast.error("Error inesperado asociando llamada inbound pendiente.");
    } finally {
      setIsAssociatingInboundCall(false);
    }
  }, [
    activeGestionSession?.idGestionSession,
    activeGestionSession?.sessionRef,
    gestionOperativaActiva,
    isAssociatingInboundCall,
    nextPendingInboundCall,
    registrarEventoLlamada,
  ]);

  const navigateToGestionSession = useCallback(
    (cliente: string, factura: string, cuenta: string) => {
      navigate(
        buildConsultaCarteraUrl({
          identificacionCliente: cliente,
          factura,
          cuenta,
        })
      );
    },
    [navigate]
  );

  const handleCloseActiveGestionForInbound = useCallback(async (): Promise<void> => {
    if (!activeGestionSession?.idGestionSession || !activeGestionSession?.sessionRef) {
      toast.info("No hay gestion activa para cerrar.");
      return;
    }

    if (switchBlockedReason) {
      toast.warning(switchBlockedReason);
      return;
    }

    const response = await transitionGestionSession({
      idGestionSession: activeGestionSession.idGestionSession,
      sessionRef: activeGestionSession.sessionRef,
      newState: "cancelada",
      reason: "inbound_reasignacion_contexto",
      idempotencyKey: createTransitionIdempotencyKey("close_inbound"),
      source: "consulta_cartera_inbound_resolution",
      tabId,
    });

    const outcome = String(response.operation?.outcomeCode ?? "").trim().toLowerCase();
    if (response.success || outcome === "no_change" || outcome === "idempotent_replay") {
      await refreshSessions();
      setIsSeguimientoDraftOpen(false);
      toast.info("Gestion activa cerrada. Ahora puedes iniciar una nueva para esta llamada.");
      return;
    }

    toast.warning(response.message || "No se pudo cerrar la gestion activa.");
  }, [
    activeGestionSession?.idGestionSession,
    activeGestionSession?.sessionRef,
    tabId,
    refreshSessions,
    switchBlockedReason,
    transitionGestionSession,
  ]);

  const handleContinueCurrentActiveGestion = useCallback(() => {
    if (!activeGestionSession) {
      setShowGestionConflictModal(false);
      return;
    }

    navigateToGestionSession(
      activeGestionSession.cliente,
      activeGestionSession.factura,
      activeGestionSession.cuenta
    );
    setShowGestionConflictModal(false);
  }, [activeGestionSession, navigateToGestionSession]);

  const handleConfirmSwitchToSelectedContext = useCallback(async () => {
    if (!hasFullSelection) {
      return;
    }

    if (switchBlockedReason) {
      toast.warning(switchBlockedReason);
      return;
    }

    setIsSwitchingGestionContext(true);
    try {
      if (currentContextGestionSession && currentContextGestionSession.status !== "activa") {
        const switchResult = await switchActiveSession({
          idGestionSession: currentContextGestionSession.idGestionSession,
          sessionRef: currentContextGestionSession.sessionRef,
          reason: "consulta_cartera_switch_selected_context",
          idempotencyKey: createTransitionIdempotencyKey("switch_selected_context"),
          source: "consulta_cartera_conflict_modal",
          tabId,
        });

        const outcome = String(switchResult.operation?.outcomeCode ?? "").trim().toLowerCase();
        if (!switchResult.success && outcome !== "already_active") {
          toast.warning(
            switchResult.message || "No se pudo activar la gestion seleccionada."
          );
          return;
        }
      } else {
        const startResult = await startGestionSession({
          cliente: selectedCliente,
          factura: selectedFactura,
          cuenta: selectedCuenta,
          idempotencyKey: createStartIdempotencyKey(),
          source: "consulta_cartera_conflict_modal",
          tabId,
          autoPauseCurrentActive: true,
        });

        if (!startResult.success) {
          toast.warning(
            startResult.message || "No se pudo activar la nueva gestion seleccionada."
          );
          return;
        }
      }

      await refreshSessions();
      setShowGestionConflictModal(false);
      setIsSeguimientoDraftOpen(true);
      toast.success(
        currentContextGestionSession
          ? "Gestion reactivada correctamente."
          : "Gestion temporal iniciada."
      );
    } finally {
      setIsSwitchingGestionContext(false);
    }
  }, [
    currentContextGestionSession,
    hasFullSelection,
    refreshSessions,
    selectedCliente,
    selectedCuenta,
    selectedFactura,
    startGestionSession,
    switchActiveSession,
    switchBlockedReason,
    tabId,
  ]);

  const handleGestionSessionFabClick = async () => {
    if (!hasFullSelection) {
      return;
    }

    setActiveTab("seguimiento");

    if (gestionOperativaActiva) {
      setIsSeguimientoDraftOpen((prev) => !prev);
      return;
    }

     if (activeGestionSession && !isSameActiveContext) {
      setShowGestionConflictModal(true);
      return;
    }

    if (currentContextGestionSession && currentContextGestionSession.status !== "activa") {
      if (switchBlockedReason) {
        toast.warning(switchBlockedReason);
        return;
      }

      const switchResult = await switchActiveSession({
        idGestionSession: currentContextGestionSession.idGestionSession,
        sessionRef: currentContextGestionSession.sessionRef,
        reason: "consulta_cartera_fab_activate_existing",
        idempotencyKey: createTransitionIdempotencyKey("fab_activate_existing"),
        source: "consulta_cartera_fab",
        tabId,
      });
      const outcome = String(switchResult.operation?.outcomeCode ?? "").trim().toLowerCase();
      if (!switchResult.success && outcome !== "already_active") {
        toast.warning(
          switchResult.message || "No se pudo activar la gestion seleccionada."
        );
        return;
      }

      setIsSeguimientoDraftOpen(true);
      return;
    }

    const startScopeKey = selectedContextKey || "consulta_cartera_start";
    const startLock = acquireActionLock({
      scopeKey: startScopeKey,
      action: "start_gestion_session",
      ownerId: tabId,
      ttlMs: 15_000,
    });

    if (!startLock.acquired || isStartingGestionRef.current) {
      toast.info(
        "Ya hay un inicio de gestion en curso. Espera unos segundos e intenta de nuevo."
      );
      return;
    }

    isStartingGestionRef.current = true;

    try {
      const startResult = await startGestionSession({
        cliente: selectedCliente,
        factura: selectedFactura,
        cuenta: selectedCuenta,
        idempotencyKey: createStartIdempotencyKey(),
        source: "consulta_cartera_fab",
        tabId,
      });

      await refreshSessions();

      if (!startResult.success) {
        const outcome = String(startResult.operation?.outcomeCode ?? "").trim().toLowerCase();
        if (startResult.statusCode === 409 && outcome === "conflict_active_session") {
          setShowGestionConflictModal(true);
          return;
        }

        toast.warning(
          startResult.message || "No fue posible iniciar una gestion temporal."
        );
        return;
      }

      setIsSeguimientoDraftOpen(true);

      if (
        startResult.operation?.outcomeCode &&
        startResult.operation.outcomeCode.toLowerCase() === "idempotent_replay"
      ) {
        toast.info("Se reutilizo el inicio de gestion ya enviado.");
      } else {
        toast.success("Gestion temporal iniciada.");
      }
    } finally {
      isStartingGestionRef.current = false;
      releaseActionLock({
        scopeKey: startScopeKey,
        action: "start_gestion_session",
        ownerId: tabId,
      });
    }
  };

  const handleOutboundCallClick = useCallback(async (): Promise<boolean> => {
    if (!canStartOutboundCall) {
      toast.warning(startCallBlockedReason);
      return false;
    }

    if (isCallInProgress) {
      toast.info("Ya existe una llamada en curso.");
      return false;
    }

    const destination = String(dialDestination ?? "").trim();
    if (!destination) {
      toast.warning("Debes ingresar el numero destino.");
      return false;
    }

    pendingOutboundAlternatePhoneCandidateRef.current = selectedCliente
      ? {
          cliente: selectedCliente,
          telefonoPrincipalNormalizado: normalizeClienteTelefono(numeroPrincipalCliente),
          telefonoDestino: destination,
          telefonoDestinoNormalizado: normalizeClienteTelefono(destination),
          callSid: null,
          createdAtMs: Date.now(),
        }
      : null;

    const result = await requestGlobalWebRtcOutboundDial({
      destination,
      source: "external",
    });

    if (result.ok) {
      return true;
    }

    pendingOutboundAlternatePhoneCandidateRef.current = null;

    const code = String(result.error?.code ?? "").trim();
    if (code === "WEBRTC_OWNER_REQUIRED") {
      toast.info(
        result.error?.message
          || "Esta pestaña está en modo acompañante. Usa la pestaña dueña del softphone."
      );
      return false;
    }

    toast.warning(
      result.error?.message
        || result.message
        || "No fue posible iniciar la llamada."
    );
    return false;
  }, [
    canStartOutboundCall,
    dialDestination,
    isCallInProgress,
    numeroPrincipalCliente,
    selectedCliente,
    startCallBlockedReason,
  ]);

  const handleOpenOutboundCallModal = useCallback(() => {
    if (!canStartOutboundCall) {
      toast.warning(startCallBlockedReason);
      return;
    }

    if (isCallInProgress) {
      toast.info("Ya existe una llamada en curso.");
      return;
    }

    setDialDestination(numeroPrincipalCliente);
    setShowOutboundCallModal(true);
    if (selectedCliente) {
      void loadClienteTelefonosAlternos(selectedCliente, { silent: true });
    }
  }, [
    canStartOutboundCall,
    isCallInProgress,
    loadClienteTelefonosAlternos,
    numeroPrincipalCliente,
    selectedCliente,
    startCallBlockedReason,
  ]);

  const handleCloseOutboundCallModal = useCallback(() => {
    setShowOutboundCallModal(false);
  }, []);

  const handleSubmitOutboundCallModal = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event?.preventDefault();
      const started = await handleOutboundCallClick();
      if (started) {
        setShowOutboundCallModal(false);
      }
    },
    [handleOutboundCallClick]
  );

  const handleOutboundCallStartedForAlternatePhones = useCallback(
    (call: WebRtcCallDto) => {
      if (!call?.callSid || isInboundCallDirection(call.direction)) {
        return;
      }

      const candidate = pendingOutboundAlternatePhoneCandidateRef.current;
      if (!candidate || candidate.callSid) {
        return;
      }

      const endedTooLate = Date.now() - candidate.createdAtMs > 60_000;
      if (endedTooLate) {
        pendingOutboundAlternatePhoneCandidateRef.current = null;
        return;
      }

      const normalizedTo = normalizeClienteTelefono(call.to);
      if (
        candidate.telefonoDestinoNormalizado &&
        normalizedTo &&
        !areEquivalentPhoneValues(candidate.telefonoDestinoNormalizado, normalizedTo)
      ) {
        return;
      }

      pendingOutboundAlternatePhoneCandidateRef.current = {
        ...candidate,
        callSid: call.callSid,
      };
    },
    []
  );

  const handleOutboundCallEndedForAlternatePhones = useCallback(
    async (call: WebRtcCallDto | null): Promise<void> => {
      if (!call || isInboundCallDirection(call.direction)) {
        return;
      }

      const candidate = pendingOutboundAlternatePhoneCandidateRef.current;
      if (!candidate) {
        return;
      }

      const normalizedTo = normalizeClienteTelefono(call.to);
      const sameCallSid = Boolean(
        candidate.callSid &&
        call.callSid &&
        candidate.callSid === call.callSid
      );
      const sameDestination = Boolean(
        candidate.telefonoDestinoNormalizado &&
        normalizedTo &&
        areEquivalentPhoneValues(candidate.telefonoDestinoNormalizado, normalizedTo)
      );

      if (!sameCallSid && !sameDestination) {
        return;
      }

      pendingOutboundAlternatePhoneCandidateRef.current = null;

      if (
        !candidate.telefonoDestinoNormalizado ||
        (
          candidate.telefonoPrincipalNormalizado &&
          areEquivalentPhoneValues(
            candidate.telefonoPrincipalNormalizado,
            candidate.telefonoDestinoNormalizado
          )
        )
      ) {
        return;
      }

      const listResponse = await listarTelefonosAlternos(candidate.cliente);
      const existingAlternos = listResponse?.success && Array.isArray(listResponse.data)
        ? listResponse.data
        : [];

      const alreadySaved = existingAlternos.some((item) => {
        const normalizedSaved = normalizeClienteTelefono(
          item.telefonoNormalizado || item.telefono
        );
        return areEquivalentPhoneValues(normalizedSaved, candidate.telefonoDestinoNormalizado);
      });

      if (alreadySaved) {
        const markUsedResponse = await marcarTelefonoAlternoComoUsado(candidate.cliente, {
          telefono: candidate.telefonoDestino,
        });

        if (!markUsedResponse?.success) {
          console.warn("[ConsultaCartera] No se pudo marcar uso del telefono alterno", {
            cliente: candidate.cliente,
            telefono: candidate.telefonoDestino,
            message: markUsedResponse?.message ?? "sin respuesta",
          });
        }

        if (selectedCliente === candidate.cliente) {
          void loadClienteTelefonosAlternos(candidate.cliente, { silent: true });
        }
        return;
      }

      if (selectedCliente === candidate.cliente && existingAlternos.length > 0) {
        setTelefonosAlternosCliente(existingAlternos);
      }

      setPendingSaveAlternatePhonePrompt({
        cliente: candidate.cliente,
        telefono: candidate.telefonoDestino,
        telefonoNormalizado: candidate.telefonoDestinoNormalizado,
      });
      setAlternatePhoneLabel("");
      setAlternatePhoneObservation("");
      setShowSaveAlternatePhoneModal(true);
    },
    [
      listarTelefonosAlternos,
      loadClienteTelefonosAlternos,
      marcarTelefonoAlternoComoUsado,
      selectedCliente,
    ]
  );

  const synchronizeGestionSessionAfterSave = useCallback(
    async (sessionRef: string): Promise<GestionSaveSyncResult> => {
      const normalizedSessionRef = String(sessionRef ?? "").trim();
      if (!normalizedSessionRef) {
        await refreshSessions();
        return {
          confirmedNonActive: false,
          sessionMissing: false,
          sessionStatus: null,
          synced: false,
        };
      }

      await refreshSessions();

      let lastKnownStatus: string | null = null;
      let hasSuccessfulSync = false;

      for (const delayMs of SAVE_SESSION_SYNC_RETRY_DELAYS_MS) {
        await wait(delayMs);

        const listResult = await listInProgressGestionSessions();
        if (!listResult.success) {
          continue;
        }

        hasSuccessfulSync = true;
        const matchingSession = findGestionSessionBySessionRef(
          listResult.operation?.sessions ?? [],
          normalizedSessionRef
        );

        if (!matchingSession) {
          await refreshSessions();
          return {
            confirmedNonActive: true,
            sessionMissing: true,
            sessionStatus: null,
            synced: true,
          };
        }

        const syncedStatus = normalizeGestionSessionStatus(matchingSession.status);
        lastKnownStatus = syncedStatus || null;

        if (isGestionSessionNonActiveStatus(syncedStatus)) {
          await refreshSessions();
          return {
            confirmedNonActive: true,
            sessionMissing: false,
            sessionStatus: lastKnownStatus,
            synced: true,
          };
        }
      }

      await refreshSessions();

      return {
        confirmedNonActive: isGestionSessionNonActiveStatus(lastKnownStatus),
        sessionMissing: false,
        sessionStatus: lastKnownStatus,
        synced: hasSuccessfulSync,
      };
    },
    [listInProgressGestionSessions, refreshSessions]
  );

  useEffect(() => {
    if (!telephonyEnabled) {
      return undefined;
    }

    const unsubscribeStarted = subscribeGlobalWebRtcCallStarted((call) => {
      handleOutboundCallStartedForAlternatePhones(call);
    });
    const unsubscribeEnded = subscribeGlobalWebRtcCallEnded((call) => {
      void handleOutboundCallEndedForAlternatePhones(call);
    });

    return () => {
      unsubscribeStarted();
      unsubscribeEnded();
    };
  }, [
    handleOutboundCallEndedForAlternatePhones,
    handleOutboundCallStartedForAlternatePhones,
    telephonyEnabled,
  ]);

  const handleNuevoSeguimiento = async (
    seguimiento: Omit<Seguimiento, "id" | "usuario" | "fecha" | "hora">
  ): Promise<boolean> => {
    if (!hasFullSelection) {
      toast.error("Debe seleccionar un cliente, factura y cuenta.");
      return false;
    }

    if (!currentUser) {
      toast.error(
        "No hay usuario logueado. Por favor, inicie sesion nuevamente."
      );
      return false;
    }

    if (!gestionOperativaActiva) {
      toast.warning(
        "Debes iniciar una gestion activa antes de guardar seguimiento."
      );
      return false;
    }

    if (isCallInProgress) {
      toast.warning(
        "No puedes guardar mientras hay una llamada activa. Primero debes colgar."
      );
      return false;
    }

    if (hasPendingInboundCalls) {
      toast.warning(
        "Tienes una llamada entrante pendiente de asociar. Debes resolverla antes de guardar."
      );
      return false;
    }

    if (isAssociatingInboundCall) {
      toast.info("Espera a que termine la asociacion de la llamada entrante.");
      return false;
    }

    if (isSaveRequestInFlight || isSavingSeguimientoRef.current) {
      toast.info("Ya hay un guardado en curso. Espera a que termine.");
      return false;
    }

    const activeSessionId = activeGestionSession?.idGestionSession ?? null;
    const activeSessionRef = activeGestionSession?.sessionRef ?? null;

    if (!activeSessionId || !activeSessionRef) {
      toast.warning(
        "No se encontro una gestion activa valida. Inicia gestion antes de guardar."
      );
      return false;
    }

    const saveScopeKey = activeSessionRef;
    const saveLock = acquireActionLock({
      scopeKey: saveScopeKey,
      action: "save_seguimiento_final",
      ownerId: tabId,
      ttlMs: 45_000,
    });

    if (!saveLock.acquired) {
      toast.warning(
        "Ya hay un guardado/cierre en curso para esta gestion desde otra pestana."
      );
      return false;
    }

    isSavingSeguimientoRef.current = true;
    setIsSavingSeguimiento(true);

    try {
      const eventosXml = Array.isArray(seguimiento.eventos)
        ? seguimiento.eventos
            .map((evento) => {
              const eventoXML: EventoXML = {
                id: evento.id,
                tipo: evento.tipo,
                fecha: evento.fecha || "",
                hora: evento.hora || null,
                valor: evento.valor,
              };
              return convertirEventoAXml(eventoXML);
            })
            .join("\n")
        : "";

      const saveAttempt = createOrReuseSaveAttempt({
        sessionRef: activeSessionRef,
        selectionKey: selectedContextKey,
        cliente: selectedCliente,
        factura: selectedFactura,
        cuenta: selectedCuenta,
        userId: currentUser?.id ?? null,
        descripcion: seguimiento.texto,
        tipoContacto: seguimiento.tipoContacto ?? null,
      });

      const saveIdempotencyKey =
        saveAttempt?.idempotencyKey || createSaveFallbackIdempotencyKey();

      const request: GestionFacturaRequest = {
        numefac: registroSeleccionado.numefac,
        cliente: registroSeleccionado.cliente,
        cuenta: registroSeleccionado.cuenta,
        usuario: parseInt(currentUser.id),
        descripcion: seguimiento.texto,
        tipoContacto: seguimiento.tipoContacto || 1,
        eventos: "<Eventos>" + eventosXml + "</Eventos>",
        idGrabacionLlamada: seguimiento.grabacion || "",
        idGestionSession: activeSessionId,
        sessionRef: activeSessionRef,
        idempotencyKey: saveIdempotencyKey,
        source: "consulta_cartera_save",
        tabId,
      };

      const responseGuardado = await GestionarFactura(request);
      const outcomeCode = normalizeSaveOutcomeCode(
        responseGuardado?.data?.outcomeCode
      );
      const responseSessionStatus = normalizeGestionSessionStatus(
        responseGuardado?.data?.sessionStatus
      );

      if (responseGuardado?.success) {
        if (outcomeCode === "idempotent_replay") {
          toast.info("Este guardado ya habia sido procesado.");
        } else {
          toast.success("Proceso exitoso");
        }

        const syncResult = await synchronizeGestionSessionAfterSave(
          activeSessionRef
        );
        const shouldCloseDraft = shouldCloseSeguimientoDraftAfterSave({
          outcomeCode,
          sessionStatus: responseSessionStatus,
          syncedSessionStatus: syncResult.sessionStatus,
          sessionMissing: syncResult.sessionMissing,
        });

        if (
          shouldCloseDraft
          && !syncResult.confirmedNonActive
          && !syncResult.sessionMissing
        ) {
          console.warn(
            "[ConsultaCartera] El guardado reporto cierre/no-activa pero la sincronizacion no lo confirmo todavia.",
            {
              outcomeCode,
              responseSessionStatus,
              syncedSessionStatus: syncResult.sessionStatus,
              synced: syncResult.synced,
              sessionRef: activeSessionRef,
            }
          );
        }

        if (shouldCloseDraft) {
          setIsSeguimientoDraftOpen(false);
        }

        await cargarGestiones();
        return true;
      }

      if (responseGuardado?.statusCode === 409) {
        toast.warning(
          responseGuardado.message ||
            "La gestion ya fue cerrada por otro intento. Inicia una nueva gestion para continuar."
        );

        const syncResult = await synchronizeGestionSessionAfterSave(
          activeSessionRef
        );
        const shouldCloseDraft = shouldCloseSeguimientoDraftAfterSave({
          outcomeCode,
          sessionStatus: responseSessionStatus,
          syncedSessionStatus: syncResult.sessionStatus,
          sessionMissing: syncResult.sessionMissing,
        });

        if (shouldCloseDraft) {
          setIsSeguimientoDraftOpen(false);
        }

        await cargarGestiones();
        return false;
      }

      console.log("Response de guardar seguimiento: ", responseGuardado);
      toast.error(responseGuardado?.message || "Error al guardar el seguimiento");
      return false;
    } catch (error) {
      console.error("Error al crear el seguimiento:", error);
      toast.error("Error al guardar el seguimiento");
      return false;
    } finally {
      isSavingSeguimientoRef.current = false;
      setIsSavingSeguimiento(false);
      releaseActionLock({
        scopeKey: saveScopeKey,
        action: "save_seguimiento_final",
        ownerId: tabId,
      });
    }
  };

  const handleBuscar = async (): Promise<void> => {
    await fetchFacturas();
  };

  const handleClicLupaBuscar = async (row: any) => {
    try {
      if (!row || typeof row !== "object") {
        toast.error("Registro inválido");
        console.error("Registro inválido:", row);
        return;
      }
      // opcional: chequear claves importantes
      if (!row.numefac && !row.cliente && !row.cuenta) {
        toast.warn("Registro sin información esencial");
        // aún puedes setearlo, o decidir no hacerlo
      }
      handleSeleccionarRegistro(row);
    } catch (err) {
      console.error("Error al seleccionar registro:", err);
      toast.error("Error al seleccionar registro");
    }
  };

  // Función para cargar la información del cliente
  const cargarInfoCliente = async (idCliente: string) => {
    try {
      console.log("[ConsultaCartera] cargando info cliente:", idCliente);
      const response = await obtenerCliente(idCliente);
      console.log("[ConsultaCartera] respuesta obtenerCliente:", response);
      if (response?.success) {
        setClienteInfo(response.data ?? null);
      } else {
        setClienteInfo(null);
      }
    } catch (error) {
      console.error("Error al cargar información del cliente:", error);
      setClienteInfo(null);
    }
  };

  // Actualizar la información del cliente cuando se selecciona un registro
  useEffect(() => {
    if (registroSeleccionado?.cliente) {
      cargarInfoCliente(registroSeleccionado.cliente);
    } else {
      setClienteInfo(null);
    }
  }, [registroSeleccionado]);

  // Función para abrir WhatsApp
  const abrirWhatsApp = (telefono: string) => {
    const numeroLimpio = telefono.replace(/\D/g, "");
    window.open(`https://wa.me/${numeroLimpio}`, "_blank");
  };

  // React.useEffect(() => {
  //   fetchFacturas();
  // }, []);

  React.useEffect(() => {
    fetchFacturas();
    // eslint-disable-next-line
  }, [tablaPage, tablaRowsPerPage]);

  // Función para limpiar la selección
  const limpiarSeleccion = () => {
    setIsSeguimientoDraftOpen(false);
    setRegistroSeleccionado(null);
    setSelectedValue("");
    setActiveTab("info");
  };

  const handleSeleccionarFactura = (row: any) => {
    const seleccionado = {
      cliente:
        row?.cliente ?? row?.CLIENTE ?? row?.IDCLIPRV ?? selectedValue ?? "",
      numefac: row?.numefac ?? row?.NUMEFAC ?? row?.factura ?? "",
      cuenta: row?.cuenta ?? row?.CUENTA ?? "",
    };

    setRegistroSeleccionado(seleccionado);
    setIsSeguimientoDraftOpen(false);
    if (seleccionado.cliente) {
      setSelectedValue(seleccionado.cliente);
    }
    console.log(
      "[ConsultaCartera] registroSeleccionado desde Ver:",
      seleccionado
    );
  };

  // Función para manejar la selección de un registro
  const handleSeleccionarRegistro = (row: any) => {
    const clienteId = row?.cliente || "";
    setSelectedValue(clienteId);
    setIsSeguimientoDraftOpen(false);
    setRegistroSeleccionado(null);
    setActiveTab("info");
  };

  React.useEffect(() => {
    if (selectedValue && tablaFacturasRef.current) {
      tablaFacturasRef.current.fetchFacturas();
    }
  }, [selectedValue]);

  const columns: TableColumn[] = [
    {
      id: "buscar",
      label: "",
      format: (_value, row) => (
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: "#1565c0",
            // color: row.colorEstadoGestion,
            fontSize: 18,
          }}
          title="Buscar"
          onClick={handleClicLupaBuscar.bind(null, row)}
        >
          <i className="fas fa-search" />
        </button>
      ),
    },
    { id: "cliente", label: "Cliente" },
    {
      id: "estadoGestion",
      label: "",
      format: (value, row) => (
        <span
          style={{
            background: row.colorEstadoGestion || "#eee",
            display: "inline-block",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            margin: "auto",
          }}
        ></span>
      ),
    },
    {
      id: "RAZONCIAL",
      label: "Razón Social",
    },
    // { id: "numefac", label: "Factura" },
    { id: "cuenta", label: "Cuenta" },
    {
      id: "EDAD",
      label: "Edad",
      format: (value, row) => (
        <span
          style={{
            background: row.ColorCodigo || "#eee",
            color: "#fff",
            borderRadius: "4px",
            padding: "2px 8px",
            display: "inline-block",
            minWidth: 40,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {value}
        </span>
      ),
    },
  ];

  const handleAsignarEtiqueta = (idEtiqueta: number) => {
    if (!etiquetasCliente.includes(idEtiqueta)) {
      setEtiquetasCliente([...etiquetasCliente, idEtiqueta]);
    }
  };

  const handleQuitarEtiqueta = (idEtiqueta: number) => {
    setEtiquetasCliente(etiquetasCliente.filter((id) => id !== idEtiqueta));
  };

  const [showModalCorreo, setShowModalCorreo] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const handlePrevisualizarCorreo = () => setShowModalCorreo(true);
  const handleCerrarModalCorreo = () => setShowModalCorreo(false);
  const handleEnviarCorreo = async () => {
    if (!hasFullSelection) {
      toast.error("Debe seleccionar un cliente, factura y cuenta");
      return;
    }

    setEnviandoCorreo(true);
    try {
      const body = {
        cliente: registroSeleccionado.cliente,
        factura: registroSeleccionado.numefac,
        cuenta: registroSeleccionado.cuenta,
        plantillaKey: plantillaSeleccionadaKey,
        fecha: fechaConsultaFacturas,
        idUser: currentUser?.id || 0,
      };

      const result = await sendWithTemplate(body);

      if (result?.success) {
        toast.success("Correo enviado correctamente");
        setShowModalCorreo(false);
      } else {
        toast.error(`Error: ${result?.message}`);
      }
    } catch (error) {
      toast.error("Error al enviar el correo");
    } finally {
      setEnviandoCorreo(false);
    }
  };

  const handleMenuFiltrosStateChange = (): void => {
    setMenuFiltrosState(!MenuFiltrosState);
    fetchFacturas();
  };

  const hasActiveGestionInContext = Boolean(currentContextGestionSession);
  const gestionStatusLabel = hasActiveGestionInContext
    ? currentContextGestionSession?.status || "activa"
    : "sin_gestion";
  const gestionElapsedLabel = formatElapsedHhMmSs(gestionElapsedSeconds);
  const fabDisabled =
    !hasFullSelection || loadingStartGestionSession || isSwitchingGestionContext;
  const fabLabel = gestionOperativaActiva
    ? isSeguimientoDraftOpen
      ? "Ocultar seguimiento"
      : "Abrir seguimiento"
    : currentContextGestionSession
      ? "Activar gestion"
      : "Iniciar gestión";

  return (
    <div>
      {/* <ContentHeader title="Consulta de Cartera" /> */}
      <section className="content">
        <div className="container-fluid">
          <div className="row" style={{ height: "100vh" }}>
            <div
              className={` side-panel ${
                collapsed ? "collapsed" : "col col-sm-4 col-md-5 col-lg-4"
              }`}
            >
              <div className="d-flex align-items-center p-2 gap-2">
                {/* {collapsed == true ? "" : <strong>Clientes</strong>} */}
                <div className="d-flex align-items-center flex-grow-1">
                  <Form.Control
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar"
                    value={tablaSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTablaSearch(e.target.value)
                    }
                    disabled={tablaLoading}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // evita que haga submit accidental
                        fetchFacturas(); // <--- tu función a ejecutar
                      }
                    }}
                    style={{
                      // width: 200,
                      // marginRight: 8,
                      display: collapsed || MenuFiltrosState ? "none" : "block",
                    }}
                  />
                  <Button
                    variant="primary"
                    // size="sm"
                    onClick={fetchFacturas}
                    disabled={tablaLoading}
                    style={{
                      marginLeft: 8,
                      minWidth: 40,
                      display: collapsed || MenuFiltrosState ? "none" : "block",
                    }}
                    title="Consultar"
                  >
                    <i className="fas fa-search" />
                  </Button>
                </div>
                <div className="d-flex align-items-center">
                  <Button
                    variant={!MenuFiltrosState ? "outline-primary" : "primary"}
                    // size="sm"
                    onClick={handleMenuFiltrosStateChange}
                    style={{
                      minWidth: 40,
                      margin: "0 10px",
                      justifySelf: "center",
                      display: collapsed ? "none" : "block",
                    }}
                    title="Consultar"
                  >
                    <i className="fas fa-filter" />
                  </Button>
                  <button
                    className={
                      "btn " +
                      (collapsed ? "btn-sm" : "btn") +
                      " btn-outline-primary"
                    }
                    onClick={() => collapseHandler()}
                  >
                    {collapsed ? (
                      <FontAwesomeIcon icon={faArrowRight} />
                    ) : (
                      <FontAwesomeIcon icon={faArrowLeft} />
                    )}
                  </button>
                </div>
              </div>
              <div
                className="xd"
                style={{ display: collapsed ? "none" : "block" }}
              >
                {/* <DynamicTable columns={columns} rows={rows} /> */}

                {/* Tabla donde esta ubicada la lupa de buscar en la que aparece el error de que se parte la ui */}
                {MenuFiltrosState ? (
                  <div>
                    <FiltrosCarteras
                      state={MenuFiltrosState}
                      onApply={handleMenuFiltrosStateChange}
                    />
                  </div>
                ) : (
                  <DynamicTablePaginationConsultaCartera
                    columns={columns}
                    rows={tablaRows}
                    totalRows={tablaTotalRows}
                    searchText={tablaSearch}
                    onSearchChange={setTablaSearch}
                    rowsPerPage={tablaRowsPerPage}
                    onRowsPerPageChange={setTablaRowsPerPage}
                    rowPageOptions={[50, 100, 150, 200]}
                    withSearch={false}
                    maxHeight={"80vh"}
                    page={tablaPage}
                    onPageChange={setTablaPage}
                    enableKeyboardNavigation={true}
                    onRowEnter={(row) => {
                      console.log("ENTER pressed on row:", row);
                      handleClicLupaBuscar(row);
                    }}
                    selectedPredicate={(row) =>
                      Boolean(
                        hasFullSelection &&
                          row?.cliente &&
                          registroSeleccionado &&
                          String(row.cliente) ===
                            String(registroSeleccionado.cliente) &&
                          String(row.cuenta ?? "") ===
                            String(registroSeleccionado.cuenta ?? "")
                      )
                    }
                  />
                )}
                {/* {!collapsed && <DynamicTable columns={columns} rows={rows} />} */}
              </div>
            </div>

            <div className="col main-panel">
              {activeGestionSession && hasFullSelection && !isSameActiveContext && (
                <Alert variant="info" className="py-2">
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-2 align-items-lg-center">
                    <div className="small">
                      Estás viendo otro cliente. Tu gestion activa sigue en{" "}
                      <strong>
                        {activeGestionSession.cliente} | F{activeGestionSession.factura} | C{activeGestionSession.cuenta}
                      </strong>.
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={handleContinueCurrentActiveGestion}
                      >
                        Ir a la activa
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setShowGestionConflictModal(true)}
                        disabled={Boolean(switchBlockedReason)}
                      >
                        {currentContextGestionSession ? "Activar esta" : "Crear esta"}
                      </Button>
                    </div>
                  </div>
                </Alert>
              )}
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || "info")}
                id="tabs"
                className="mb-3"
              >
                {/* {registroSeleccionado?.numefac && ( */}
                <Tab
                  eventKey="facturaActual"
                  title={
                    <strong>
                      {registroSeleccionado?.numefac || "No seleccionado"}
                    </strong>
                  }
                  // title={`${registroSeleccionado.numefac}`}
                  disabled
                />
                {/* )} */}
                <Tab eventKey="info" title="Información General">
                  <Row className="mb-3">
                    <Col xs={12} md={3}>
                      <CustomDatePicker
                        label="Seleccione la fecha"
                        selectedDate={fechaConsultaFacturas}
                        onDateChange={handlnChangeFechaFiltro}
                      />
                    </Col>
                    <Col xs={12} md={3}>
                      <NumericField
                        value={intMora}
                        onChange={(int) => setIntMora(int)}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      {/* <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Etiquetas</h6>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setShowModalEtiquetas(true)}
                          disabled={!registroSeleccionado}
                        >
                          <FontAwesomeIcon icon={faTag} className="me-1" />
                          Gestionar etiquetas
                        </Button>
                      </div>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {etiquetasCliente.map((id) => {
                          const etiqueta = etiquetasMockup.find(
                            (e) => e.id === id
                          );
                          if (!etiqueta) return null;
                          return (
                            <Badge
                              key={etiqueta.id}
                              variant="light"
                              className="d-flex align-items-center"
                              style={{
                                backgroundColor: etiqueta.color + "20",
                                color: etiqueta.color,
                                border: `1px solid ${etiqueta.color}`,
                                padding: "0.5rem 0.75rem",
                              }}
                            >
                              {etiqueta.nombre}
                              <FontAwesomeIcon
                                icon={faTimes}
                                className="ms-2"
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  handleQuitarEtiqueta(etiqueta.id)
                                }
                              />
                            </Badge>
                          );
                        })}
                      </div> */}

                      <EtiquetasClienteGestion
                        cliente={selectedValue}
                        idUser={currentUser?.id ?? 0}
                      />
                    </Col>
                  </Row>

                  {/* <StickyNote clientId={""} currentUser={""} /> */}
                  {clienteInfo && (
                    <Card className="mb-4">
                      <Card.Header style={{ backgroundColor: "#f8f9fa" }}>
                        <h5 className="mb-0">Información del Cliente</h5>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Razón Social</Form.Label>
                              <Form.Control
                                type="text"
                                value={clienteInfo.razonSocial ?? ""}
                                readOnly
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Dirección</Form.Label>
                              <Form.Control
                                type="text"
                                value={clienteInfo.direccion ?? ""}
                                readOnly
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Ciudad</Form.Label>
                              <Form.Control
                                type="text"
                                value={clienteInfo.ciudad ?? ""}
                                readOnly
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Teléfono</Form.Label>
                              <Form.Control
                                type="text"
                                value={clienteInfo.telefono}
                                readOnly
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Email</Form.Label>
                              <Form.Control
                                type="text"
                                value={clienteInfo.email}
                                readOnly
                              />
                            </Form.Group>
                            <div className="d-flex justify-content-end mt-4 align-items-center gap-2">
                              {telephonyEnabled && (
                                <Button
                                  variant="outline-primary"
                                  onClick={handleOpenOutboundCallModal}
                                  disabled={!canStartOutboundCall || isCallInProgress}
                                  title={
                                    isCallInProgress
                                      ? "Ya existe una llamada en curso."
                                      : canStartOutboundCall
                                      ? "Llamar cliente"
                                      : startCallBlockedReason
                                  }
                                  aria-label="Llamar cliente"
                                  style={{
                                    minWidth: "48px",
                                    width: "48px",
                                    height: "48px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPhone} size="lg" />
                                </Button>
                              )}
                              <Button
                                variant="success"
                                onClick={() =>
                                  abrirWhatsApp(clienteInfo.telefono)
                                }
                                disabled={!clienteInfo.telefono}
                                style={{
                                  minWidth: "48px",
                                  width: "48px",
                                  height: "48px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: 0,
                                }}
                              >
                                <FontAwesomeIcon icon={faWhatsapp} size="lg" />
                              </Button>
                              <Form.Group
                                controlId="plantillaCorreo"
                                className="mb-0 ms-2"
                              >
                                <Form.Control
                                  as="select"
                                  value={plantillaSeleccionadaKey}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLSelectElement>
                                  ) =>
                                    setPlantillaSeleccionadaKey(e.target.value)
                                  }
                                  style={{
                                    minWidth: 180,
                                    display: "inline-block",
                                  }}
                                >
                                  {plantillasApi.map((p) => (
                                    <option key={p.key} value={p.key}>
                                      {p.nombre}
                                    </option>
                                  ))}
                                </Form.Control>
                              </Form.Group>
                              <Button
                                variant="primary"
                                className="ms-2"
                                onClick={handlePrevisualizarCorreo}
                                disabled={!plantillaSeleccionadaKey}
                                style={{
                                  minWidth: "48px",
                                  width: "48px",
                                  height: "48px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: 0,
                                }}
                              >
                                <FontAwesomeIcon icon={faEnvelope} size="lg" />
                              </Button>
                            </div>
                            <div className="mt-3">
                              {telephonyEnabled && (!canStartOutboundCall || isCallInProgress) && (
                                <div className="d-flex align-items-center gap-2 small text-muted">
                                  <FontAwesomeIcon
                                    icon={isCallInProgress ? faPhone : faClock}
                                  />
                                  <span>
                                    {isCallInProgress
                                      ? "Ya existe una llamada en curso."
                                      : startCallBlockedReason}
                                  </span>
                                </div>
                              )}
                              {hasPendingInboundCalls && (
                                <Alert
                                  variant="warning"
                                  className={`mb-0 py-2 px-3 border-0 shadow-sm ${
                                    !canStartOutboundCall || isCallInProgress ? "mt-3" : ""
                                  }`}
                                  style={{
                                    borderRadius: 16,
                                    background:
                                      "linear-gradient(135deg, rgba(255,243,205,0.98) 0%, rgba(255,248,230,0.98) 100%)",
                                  }}
                                >
                                  <div className="d-flex flex-column gap-3">
                                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-2">
                                      <div className="d-flex align-items-start gap-2">
                                        <div
                                          className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                          style={{
                                            width: 34,
                                            height: 34,
                                            background: "rgba(255, 193, 7, 0.18)",
                                            color: "#9a6700",
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faExclamationTriangle} />
                                        </div>
                                        <div>
                                          <div className="d-flex align-items-center flex-wrap gap-2">
                                            <strong style={{ fontSize: "0.95rem" }}>
                                              Llamadas entrantes pendientes
                                            </strong>
                                            <Badge
                                              variant="light"
                                              className="border"
                                              style={{
                                                color: "#9a6700",
                                                fontWeight: 700,
                                                background: "rgba(255,255,255,0.72)",
                                              }}
                                            >
                                              {pendingInboundCount}
                                            </Badge>
                                          </div>
                                          <div className="small text-muted">
                                            Debes resolver esto antes de guardar seguimiento.
                                          </div>
                                        </div>
                                      </div>

                                      {nextPendingInboundCall && (
                                        <div
                                          className="small text-muted px-2 py-1 rounded"
                                          style={{
                                            background: "rgba(255,255,255,0.72)",
                                            border: "1px solid rgba(0,0,0,0.08)",
                                          }}
                                        >
                                          <strong>SID:</strong> {nextPendingInboundCall.callSid}
                                          {nextPendingInboundCall.from && (
                                            <span> | Desde: {nextPendingInboundCall.from}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="d-flex flex-column flex-lg-row gap-2">
                                      <div
                                        className="flex-fill px-3 py-2 rounded"
                                        style={{
                                          background: "rgba(255,255,255,0.76)",
                                          border: "1px solid rgba(0,0,0,0.08)",
                                        }}
                                      >
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                          <FontAwesomeIcon
                                            icon={faCheck}
                                            className="text-warning"
                                          />
                                          <strong className="small">
                                            Asociar a gestion activa
                                          </strong>
                                        </div>
                                        <div className="small text-muted mb-2">
                                          {!gestionOperativaActiva
                                            ? "Primero inicia una gestion para poder asociar la llamada."
                                            : "Vincula la llamada pendiente a la gestion que ya tienes abierta."}
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="warning"
                                          className="w-100"
                                          onClick={() => void handleAttachPendingInboundToActiveSession()}
                                          disabled={
                                            !gestionOperativaActiva
                                            || isAssociatingInboundCall
                                            || isSaveRequestInFlight
                                            || loadingTransitionGestionSession
                                          }
                                        >
                                          {isAssociatingInboundCall
                                            ? "Asociando..."
                                            : "Asociar llamada"}
                                        </Button>
                                      </div>

                                      {gestionOperativaActiva && (
                                        <div
                                          className="flex-fill px-3 py-2 rounded"
                                          style={{
                                            background: "rgba(255,255,255,0.76)",
                                            border: "1px solid rgba(0,0,0,0.08)",
                                          }}
                                        >
                                          <div className="d-flex align-items-center gap-2 mb-1">
                                            <FontAwesomeIcon
                                              icon={faArrowRight}
                                              className="text-secondary"
                                            />
                                            <strong className="small">
                                              Cerrar activa e iniciar nueva
                                            </strong>
                                          </div>
                                          <div className="small text-muted mb-2">
                                            Usa esta opcion si la llamada no corresponde a la gestion actual.
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            className="w-100"
                                            onClick={() => void handleCloseActiveGestionForInbound()}
                                            disabled={
                                              isAssociatingInboundCall
                                              || loadingTransitionGestionSession
                                            }
                                          >
                                            {loadingTransitionGestionSession
                                              ? "Cerrando..."
                                              : "Cambiar gestion"}
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Alert>
                              )}
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  )}
                  {/* <ScoringVisual/> */}

                  <ClienteEstadoCuenta
                    cliente={selectedValue}
                    fecha={fechaConsultaFacturas}
                    intmora={intMora}
                    ref={tablaFacturasRef}
                    onSelectFactura={handleSeleccionarFactura}
                    // numCuotas={registroSeleccionado.CUOTAS}
                  />
                </Tab>
                <Tab
                  eventKey="seguimiento"
                  title={
                    <span>
                      Seguimiento
                      {!hasFullSelection && (
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id="tooltip-seguimiento">
                              Seleccione cliente, factura y cuenta para ver sus
                              seguimientos
                            </Tooltip>
                          }
                        >
                          <span style={{ marginLeft: "5px", color: "#999" }}>
                            <i className="fas fa-lock" />
                          </span>
                        </OverlayTrigger>
                      )}
                    </span>
                  }
                  disabled={!hasFullSelection}
                >
                  <TimelineSeguimientos
                    seguimientos={seguimientos}
                    onNuevoSeguimiento={handleNuevoSeguimiento}
                    onBuscar={handleBuscar}
                    nuevoAbiertoControlado={isSeguimientoDraftOpen}
                    onNuevoAbiertoChange={setIsSeguimientoDraftOpen}
                    draftStorageKey={seguimientoDraftStorageKey}
                    ocultarBotonNuevo
                    disableGuardarSeguimiento={!canSaveSeguimiento}
                    disableGuardarSeguimientoReason={saveSeguimientoBlockedReason}
                    contextoEvento={{
                      idUsuario: currentUser?.id || 0,
                      cliente: registroSeleccionado?.cliente || "",
                      factura: registroSeleccionado?.numefac || "",
                      cuenta: registroSeleccionado?.cuenta || "",
                    }}
                  />
                </Tab>
                <Tab
                  eventKey="bitacora"
                  title="Bitácora"
                  disabled={!hasFullSelection}
                >
                  {hasFullSelection ? (
                    // <TablaBitacoras cliente={registroSeleccionado.cliente} />
                    <TablaEventosPorClave
                      cliente= {registroSeleccionado?.cliente || ""}
                      factura= {registroSeleccionado?.numefac || ""}
                      cuenta= {registroSeleccionado?.cuenta || ""}
                    />
                  ) : (
                    <div className="text-center p-4">
                      <p>
                        Seleccione cliente, factura y cuenta para ver su
                        bitácora
                      </p>
                    </div>
                  )}
                </Tab>
              </Tabs>
            </div>
          </div>
        </div>
      </section>
      <div className="gestion-session-floating-wrap">
        {hasActiveGestionInContext && (
          <div className="gestion-session-active-pill">
            <div className="gestion-session-active-pill-title">
              <FontAwesomeIcon icon={faClock} /> Gestion activa ({gestionStatusLabel})
            </div>
            <div className="gestion-session-active-pill-time">
              {gestionElapsedLabel}
            </div>
          </div>
        )}
        <Button
          className="gestion-session-fab"
          variant={gestionOperativaActiva ? "success" : "primary"}
          disabled={fabDisabled}
          onClick={handleGestionSessionFabClick}
        >
          {loadingStartGestionSession
            ? "Iniciando..."
            : isSwitchingGestionContext
              ? "Procesando..."
              : fabLabel}
        </Button>
      </div>

      <div
        className="modal fade show"
        style={{ display: showModalEtiquetas ? "block" : "none" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Gestionar etiquetas</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModalEtiquetas(false)}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <div className="d-flex flex-wrap gap-2">
                {etiquetasMockup
                  .filter((etiqueta) => !etiquetasCliente.includes(etiqueta.id))
                  .map((etiqueta) => (
                    <div
                      key={etiqueta.id}
                      className="d-flex align-items-center"
                      style={{
                        backgroundColor: etiqueta.color + "20",
                        color: etiqueta.color,
                        border: `1px solid ${etiqueta.color}`,
                        padding: "0.5rem 0.75rem",
                        cursor: "pointer",
                        borderRadius: "4px",
                      }}
                      onClick={() => handleAsignarEtiqueta(etiqueta.id)}
                    >
                      {etiqueta.nombre}
                    </div>
                  ))}
              </div>
            </div>
            <div className="modal-footer">
              <Button
                variant="secondary"
                onClick={() => setShowModalEtiquetas(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <GestionSessionConflictModal
        show={showGestionConflictModal}
        activeSession={activeGestionSession}
        targetCliente={selectedCliente}
        targetFactura={selectedFactura}
        targetCuenta={selectedCuenta}
        targetHasExistingSession={Boolean(currentContextGestionSession)}
        blockedReason={switchBlockedReason}
        switching={isSwitchingGestionContext}
        onContinueActive={handleContinueCurrentActiveGestion}
        onConfirmSwitch={() => {
          void handleConfirmSwitchToSelectedContext();
        }}
        onHide={() => setShowGestionConflictModal(false)}
      />

      <Modal
        show={showOutboundCallModal}
        onHide={handleCloseOutboundCallModal}
        centered
        size="sm"
      >
        <Modal.Header {...({ closeButton: true } as any)}>
          <Modal.Title>Llamar cliente</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(event) => void handleSubmitOutboundCallModal(event)}>
          <Modal.Body>
            <Form.Group controlId="modalDialDestination">
              <Form.Label>Numero destino</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                placeholder="3218446041"
                value={dialDestination}
                onChange={(event) => setDialDestination(event.target.value)}
                autoFocus
              />
              <Form.Text className="text-muted">
                Se usara el numero origen configurado para este tenant.
              </Form.Text>
            </Form.Group>
            <div className="mt-3">
              <div className="small text-muted mb-2">
                Numeros disponibles para este cliente
              </div>
              {loadingTelefonosAlternos ? (
                <div className="small text-muted">
                  Cargando telefonos alternos...
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {numeroPrincipalCliente && (
                    <Button
                      variant={
                        normalizeClienteTelefono(dialDestination) ===
                        normalizeClienteTelefono(numeroPrincipalCliente)
                          ? "primary"
                          : "outline-secondary"
                      }
                      size="sm"
                      className="text-start"
                      onClick={() => setDialDestination(numeroPrincipalCliente)}
                    >
                      <div className="fw-semibold">{numeroPrincipalCliente}</div>
                      <div className="small">
                        Principal
                      </div>
                    </Button>
                  )}
                  {telefonosAlternosActivos.map((item) => (
                    <Button
                      key={item.id}
                      variant={
                        normalizeClienteTelefono(dialDestination) ===
                        normalizeClienteTelefono(item.telefono)
                          ? "primary"
                          : "outline-secondary"
                      }
                      size="sm"
                      className="text-start"
                      onClick={() => setDialDestination(item.telefono)}
                    >
                      <div className="fw-semibold">{item.telefono}</div>
                      <div className="small">
                        {item.etiqueta}
                        {item.observacion ? ` | ${item.observacion}` : ""}
                      </div>
                    </Button>
                  ))}
                  {!numeroPrincipalCliente && telefonosAlternosActivos.length === 0 && (
                    <div className="small text-muted">
                      Este cliente no tiene numeros guardados. Puedes escribir uno manualmente.
                    </div>
                  )}
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseOutboundCallModal}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!canStartOutboundCall || isCallInProgress}
            >
              <FontAwesomeIcon icon={faPhone} className="me-2" />
              Llamar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showSaveAlternatePhoneModal}
        onHide={handleCloseSaveAlternatePhoneModal}
        centered
        size="sm"
      >
        <Modal.Header {...({ closeButton: !loadingGuardarTelefonoAlterno } as any)}>
          <Modal.Title>Guardar numero alterno</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(event) => void handleSubmitSaveAlternatePhone(event)}>
          <Modal.Body>
            <div className="small text-muted mb-3">
              {pendingSaveAlternatePhonePrompt
                ? `Cliente ${pendingSaveAlternatePhonePrompt.cliente}`
                : "Cliente actual"}
            </div>
            <Form.Group controlId="alternatePhoneValue" className="mb-3">
              <Form.Label>Numero</Form.Label>
              <Form.Control
                type="text"
                value={pendingSaveAlternatePhonePrompt?.telefono ?? ""}
                readOnly
              />
            </Form.Group>
            <Form.Group controlId="alternatePhoneLabel" className="mb-3">
              <Form.Label>Etiqueta</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej. Celular trabajo"
                value={alternatePhoneLabel}
                onChange={(event) => setAlternatePhoneLabel(event.target.value)}
                autoFocus
              />
            </Form.Group>
            <Form.Group controlId="alternatePhoneObservation">
              <Form.Label>Observacion</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Opcional"
                value={alternatePhoneObservation}
                onChange={(event) => setAlternatePhoneObservation(event.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseSaveAlternatePhoneModal}
              disabled={loadingGuardarTelefonoAlterno}
            >
              Omitir
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loadingGuardarTelefonoAlterno}
            >
              {loadingGuardarTelefonoAlterno ? "Guardando..." : "Guardar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de previsualización de correo */}
      <Modal show={showModalCorreo} onHide={handleCerrarModalCorreo} centered>
        <Modal.Header {...({ closeButton: true } as any)}>
          <Modal.Title>Confirmar el envio del correo.</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>¿Está seguro que desea enviar este correo?</Form.Label>
            {/* <Form.Control
              as="textarea"
              rows={12}
              value={plantillaActual?.texto || ""}
              readOnly
              style={{ fontFamily: "monospace", fontSize: 15 }}
            /> */}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCerrarModalCorreo}
            disabled={enviandoCorreo}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleEnviarCorreo}
            disabled={enviandoCorreo}
          >
            {enviandoCorreo ? "Enviando..." : "Enviar correo"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};






