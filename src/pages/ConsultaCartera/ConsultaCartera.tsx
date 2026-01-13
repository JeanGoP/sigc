import React, { useRef, useState, useEffect } from "react";
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
} from "react-bootstrap";
import {
  DynamicTable,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizables";
import "./GestionCobroLayout.css";
import ConsultaClientes from "../ConsultaClientes/ConsultaCLientes";
import { ContentHeader } from "@app/components";
import { DynamicTablePagination } from "../ConsultaClientes/components/tablaReutilizablePaginacion";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
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
// import { ScoringVisual } from "./components/score";

const API_URL = import.meta.env.VITE_API_URL;

interface EventoXML {
  id: number;
  tipo: string;
  fecha: string;
  hora: string | null;
  valor?: number;
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
  { label: "Sin Gestion Ultimos X Días", value: "sinGestion" },
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
  const [checkSinGestionDias, setCheckSinGestionDias] = useState(false);
  const [sinGestionDias, setSinGestionDias] = useState("");
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
    buscarGestiones,
    GestionarFactura,
    loadingBuscar,
    errorBuscar,
    loadingInsertar,
    errorInsertar,
  } = useGestionFacturaService();

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
          if (
            tablaFacturasRef.current &&
            typeof tablaFacturasRef.current.fetchFacturas === "function"
          ) {
            tablaFacturasRef.current.fetchFacturas();
          }
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

  const handleCheckSinGestionDias = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCheckSinGestionDias(event.target.checked);
    if (!event.target.checked) setSinGestionDias("");
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

  const handleNuevoSeguimiento = async (
    seguimiento: Omit<Seguimiento, "id" | "usuario" | "fecha" | "hora">
  ): Promise<boolean> => {
    if (!hasFullSelection) {
      toast.error("Debe seleccionar un cliente, factura y cuenta.");
      return false;
    }

    if (!currentUser) {
      toast.error(
        "No hay usuario logueado. Por favor, inicie sesión nuevamente."
      );
      return false;
    }

    try {
      // Convertir los eventos a XML solo para el envío al backend
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

      console.log("TIpo de contacto seleccionado: ", seguimiento.tipoContacto);
      const request: GestionFacturaRequest = {
        numefac: registroSeleccionado.numefac,
        cliente: registroSeleccionado.cliente,
        cuenta: registroSeleccionado.cuenta,
        usuario: parseInt(currentUser.id),
        descripcion: seguimiento.texto,
        tipoContacto: seguimiento.tipoContacto || 1,
        eventos: "<Eventos>" + eventosXml + "</Eventos>",
        idGrabacionLlamada: seguimiento.grabacion || "",
      };

      const responseGuardado = await GestionarFactura(request);

      if (responseGuardado && responseGuardado.success) {
        toast.success("Proceso exitoso");
        await cargarGestiones();
        return true;
      }

      console.log("Response de guardar seguimiento: ", responseGuardado);
      // toast.success('Seguimiento guardado exitosamente');

      return false;
    } catch (error) {
      console.error("Error al crear el seguimiento:", error);
      toast.error("Error al guardar el seguimiento");
      return false;
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
    setRegistroSeleccionado(null);
    setActiveTab("info");
  };

  React.useEffect(() => {
    if (selectedValue && tablaFacturasRef.current) {
      tablaFacturasRef.current.fetchFacturas();
    }
  }, [selectedValue, registroSeleccionado]);

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
                    onChange={(e) => setTablaSearch(e.target.value)}
                    disabled={tablaLoading}
                    onKeyDown={(e) => {
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
                  {/* <Button
                    variant="primary"
                    // size="sm"
                    onClick={fetchFacturas}
                    disabled={tablaLoading}
                    style={{
                      minWidth: 40,
                      display: collapsed || MenuFiltrosState ? "none" : "block",
                    }}
                    title="Consultar"
                  >
                    <i className="fas fa-search" />
                  </Button> */}
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

      {/* Modal de previsualización de correo */}
      <Modal show={showModalCorreo} onHide={handleCerrarModalCorreo} centered>
        <Modal.Header {...({ closeButton: true } as any)}>
          <Modal.Title>Confirmar el envio del correo.</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>¿Esta seguro que desea enviar este correo? </Form.Label>
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
