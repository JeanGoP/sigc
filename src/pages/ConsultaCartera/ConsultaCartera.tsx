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
import {
  GestionarFactura,
  GestionFacturaRequest,
  buscarGestiones,
  GestionesEventosFacturaResulta,
} from "@app/services/GestionFacturaService";
import { obtenerCliente, ClienteInfo } from "@app/services/ClienteService";
import { TablaBitacoras } from "./components/TablaBitacoras";
import { useAppSelector } from "@app/store/store";
import { toast } from "react-toastify";

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
    // new Date().toISOString().split("T")[0]
    "2025-04-30" // Cambia esto a la fecha que necesites
  );
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
  const [eventosSeleccionados, setEventosSeleccionados] = useState<string[]>(
    []
  );
  const [tablaRows, setTablaRows] = useState<any[]>([]);
  const [tablaLoading, setTablaLoading] = useState(false);
  const [tablaSearch, setTablaSearch] = useState("");
  const [tablaRowsPerPage, setTablaRowsPerPage] = useState(50);
  const [tablaPage, setTablaPage] = useState(0);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [etiquetasCliente, setEtiquetasCliente] = useState<number[]>([]);
  const [showModalEtiquetas, setShowModalEtiquetas] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
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

  const fetchFacturas = async () => {
    setTablaLoading(true);
    try {
      const params = {
        fecha: fechaConsultaFacturas,
        incluirCarterasSaldoCero: checkIncluirSaldosCero,
        user: "usuario", // Ajusta según tu lógica de usuario
        forUser: checkSoloAsignadas,
        cuenta: "", // Ajusta si tienes campo de cuenta
        sinGestionDias: checkSinGestionDias ? sinGestionDias : "",
        edad: seleccionEdades,
        filtroEventos: checkSoloEventosPendientes
          ? eventosSeleccionados.join(",")
          : "",
        filtroPorVencimiento: filtroGenericoStringPorTipo,
        filtroPorEtiqueta: 0, // Ajusta si tienes etiquetas
        page: tablaPage === 0 ? 1 : tablaPage,
        numPage: tablaRowsPerPage,
        filter: tablaSearch,
      };

      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://localhost:7013/api/FacturasListConsultaCarteras",
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(params),
        }
      );
      const data = await handleApiResponse(response);
      if (data.success && Array.isArray(data.data)) {
        setTablaRows(data.data);
      } else {
        setTablaRows([]);
      }
    } catch (e) {
      setTablaRows([]);
    }
    setTablaLoading(false);
  };

  // Función para cargar las gestiones
  const cargarGestiones = async () => {
    if (!registroSeleccionado) return;

    try {
      const response = await buscarGestiones(
        registroSeleccionado.numefac,
        registroSeleccionado.cliente,
        registroSeleccionado.cuenta
      );

      // console.log("Response de cargarGestiones: ", response);

      const data: GestionesEventosFacturaResulta = response.data;

      if (response.success) {
        // Transformar las gestiones al formato que espera el Timeline
        const seguimientosTransformados: Seguimiento[] = data.gestiones.map(
          (gestion) => {
            // Filtrar los eventos asociados a esta gestión
            const eventosGestion = (response.data.eventos || [])
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
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "https://localhost:7013/api/EmailTemplateMaster/GetListTemplate?tipo=email",
          {
            method: "GET",
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setPlantillasApi(data.data);
          if (data.data.length > 0)
            setPlantillaSeleccionadaKey(data.data[0].key);
        } else {
          toast.error("No se pudieron cargar las plantillas");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar las plantillas");
      }
    };

    fetchPlantillas();
  }, []);

  // Cargar gestiones cuando se selecciona un registro
  useEffect(() => {
    if (registroSeleccionado) {
      cargarGestiones();
    }
  }, [registroSeleccionado]);

  const handleNuevoSeguimiento = async (
    seguimiento: Omit<Seguimiento, "id" | "usuario" | "fecha" | "hora">
  ): Promise<boolean> => {
    if (!registroSeleccionado) return false;

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

      if (responseGuardado.success) {
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

  // Función para cargar la información del cliente
  const cargarInfoCliente = async (idCliente: string) => {
    try {
      const response = await obtenerCliente(idCliente);
      if (response.success) {
        setClienteInfo(response.data);
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

  React.useEffect(() => {
    fetchFacturas();
  }, []);

  React.useEffect(() => {
    fetchFacturas();
    // eslint-disable-next-line
  }, [tablaPage, tablaRowsPerPage]);

  // Función para limpiar la selección
  const limpiarSeleccion = () => {
    setRegistroSeleccionado(null);
    setSelectedValue("");
  };

  // Función para manejar la selección de un registro
  const handleSeleccionarRegistro = (row: any) => {
    setRegistroSeleccionado(row);
    setSelectedValue(row.cliente || "");
  };

  React.useEffect(() => {
    if (tablaFacturasRef.current) {
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
            fontSize: 18,
          }}
          title="Buscar"
          onClick={() => handleSeleccionarRegistro(row)}
        >
          <i className="fas fa-search" />
        </button>
      ),
    },
    { id: "cliente", label: "Cliente" },
    { id: "RAZONCIAL", label: "Razón Social" },
    { id: "numefac", label: "Factura" },
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

  // Plantillas de ejemplo
  // const plantillasCorreo = [
  //   {
  //     id: 1,
  //     nombre: "Bienvenida",
  //     texto: "Estimado cliente, bienvenido a nuestra empresa.",
  //   },
  //   {
  //     id: 2,
  //     nombre: "Recordatorio de pago",
  //     texto:
  //       "Le recordamos que tiene un pago pendiente. Por favor, póngase al día.",
  //   },
  //   {
  //     id: 3,
  //     nombre: "Agradecimiento",
  //     texto: "Gracias por confiar en nosotros. ¡Esperamos seguir atendiéndole!",
  //   },
  //   {
  //     id: 4,
  //     nombre: "Notificación de cuenta en mora",
  //     texto:
  //       "Asunto: 📌 Notificación de cuenta en mora – {X} días de atraso\n\n" +
  //       "Estimado/a {Nombre del Cliente},\n\n" +
  //       "Esperamos que se encuentre bien. Nos permitimos recordarle que su cuenta presenta un saldo vencido con una antigüedad de {X} días, correspondiente al siguiente concepto:\n\n" +
  //       "Número de factura/contrato: {Número}\n" +
  //       "Monto vencido: {Valor}\n" +
  //       "Fecha de vencimiento: {Fecha}\n\n" +
  //       "Le invitamos a regularizar su situación financiera lo antes posible para evitar la generación de intereses adicionales o la suspensión del servicio.\n\n" +
  //       "Si ya ha realizado el pago, por favor ignore este mensaje o envíenos el comprobante al correo {correo de soporte}.\n\n" +
  //       "Agradecemos su atención y quedamos atentos a su comunicación.\n\n" +
  //       "Cordialmente,\n" +
  //       "{Nombre del asesor o entidad}\n" +
  //       "{Teléfono / Correo de contacto}",
  //   },
  //   {
  //     id: 5,
  //     nombre: "Recordatorio de Pago Próximo",
  //     texto:
  //       "Asunto: ⏰ Recordatorio de pago – Próxima cuota vence pronto\n\n" +
  //       "Hola {Nombre del Cliente},\n\n" +
  //       "Le escribimos para recordarle que próximamente se vencerá una de sus cuotas pendientes. A continuación, los detalles:\n\n" +
  //       "Número de cuota o factura: {Número}\n" +
  //       "Fecha de vencimiento: {Fecha}\n" +
  //       "Valor a pagar: {Valor}\n\n" +
  //       "Evite contratiempos realizando el pago oportunamente antes de la fecha mencionada. Puede hacerlo a través de {medio de pago o enlace}.\n\n" +
  //       "Si tiene alguna duda o necesita asistencia, no dude en comunicarse con nosotros.\n\n" +
  //       "Gracias por su confianza,\n" +
  //       "{Nombre del asesor o entidad}",
  //   },
  // ];
  // const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<number>(
  //   plantillasCorreo[0].id
  // );
  const [showModalCorreo, setShowModalCorreo] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  // const plantillaActual = plantillasCorreo.find(
  //   (p) => p.id === plantillaSeleccionada
  // );
  const handlePrevisualizarCorreo = () => setShowModalCorreo(true);
  const handleCerrarModalCorreo = () => setShowModalCorreo(false);
  const handleEnviarCorreo = async () => {
  if (!registroSeleccionado) {
    toast.error("Debe seleccionar un cliente y una factura");
    return;
  }

  setEnviandoCorreo(true);
  try {
    const token = localStorage.getItem("token");
    const body = {
      cliente: registroSeleccionado.cliente,
      factura: registroSeleccionado.numefac,
      cuenta: registroSeleccionado.cuenta,
      plantillaKey: plantillaSeleccionadaKey,
      fecha: fechaConsultaFacturas,
      idUser: currentUser?.id || 0,
    };

    const response = await fetch(
      "https://localhost:7013/api/EmailTemplateMaster/SendWithTemplate",
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();
    if (result.success) {
      toast.success("Correo enviado correctamente");
      setShowModalCorreo(false);
    } else {
      toast.error(`Error: ${result.message}`);
      console.error(result.errors);
    }
  } catch (error) {
    console.error(error);
    toast.error("Error al enviar el correo");
  } finally {
    setEnviandoCorreo(false);
  }
};

  return (
    <div
    // style={{
    //   height: "100vh",
    //   // display: "flex",
    //   flexDirection: "column",
    //   // overflow: "hidden",
    // }}
    >
      {/* <ContentHeader title="Consulta de Cartera" /> */}
      <section className="content">
        <div className="container-fluid">
          <div className="row" style={{ height: "100vh" }}>
            <div
              className={` side-panel ${collapsed ? "collapsed" : "col col-sm-4 col-md-5 col-lg-4"}`}
            >
              <div className="d-flex justify-content-between align-items-center p-2">
                {collapsed == true ? "" : <strong>Clientes</strong>}
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => collapseHandler()}
                >
                  {collapsed ? (
                    <FontAwesomeIcon icon={faArrowRight} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowLeft} />
                  )}
                </button>
              </div>
              <div
                className="xd"
                style={{ display: collapsed ? "none" : "block" }}
              >
                <Accordion defaultActiveKey="0">
                  <Accordion defaultActiveKey="0">
                    <Card>
                      <Accordion.Toggle as={Button} variant="link" eventKey="0">
                        Filtros
                      </Accordion.Toggle>
                      <Accordion.Collapse eventKey="0">
                        <Card.Body>
                          <Form>
                            {/* <Form.Group className="mb-3">
                              <Form.Label>Nombre del Cliente</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Buscar por nombre"
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Identificación</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Número de identificación"
                              />
                            </Form.Group> */}

                            <Form>
                              <div className="filtro-relacionado mb-3">
                                <div className="d-flex align-items-center mb-2 mt-2">
                                  <Form.Check
                                    type="switch"
                                    id="custom-switch"
                                    label={
                                      <span className="ms-2">
                                        Solo Carteras saldo cero
                                      </span>
                                    }
                                    checked={checkIncluirSaldosCero}
                                    onChange={handleCheckIncluirSaldosCero}
                                  />
                                </div>
                                <div className="d-flex align-items-center mb-2 mt-2">
                                  <Form.Check
                                    type="switch"
                                    id="switch-solo-asignadas"
                                    label={
                                      <span className="ms-2">
                                        Mostrar solo carteras asignadas a mi
                                        usuario
                                      </span>
                                    }
                                    checked={checkSoloAsignadas}
                                    onChange={handleCheckSoloAsignadas}
                                  />
                                </div>
                                <div className="d-flex align-items-center mb-2 mt-2">
                                  <Form.Check
                                    type="switch"
                                    id="switch-sin-gestion"
                                    label={
                                      <span className="ms-2">
                                        Filtrar por sin gestión en X días
                                      </span>
                                    }
                                    checked={checkSinGestionDias}
                                    onChange={handleCheckSinGestionDias}
                                  />
                                </div>
                                <div
                                  style={{
                                    width: 120,
                                    display: checkSinGestionDias
                                      ? "block"
                                      : "none",
                                    marginLeft: "2.2rem",
                                    marginBottom: "1rem",
                                  }}
                                >
                                  <NumericField
                                    value={sinGestionDias}
                                    onChange={setSinGestionDias}
                                  />
                                </div>
                                <div className="d-flex align-items-center mb-2 mt-2">
                                  <Form.Check
                                    type="switch"
                                    id="switch-solo-eventos-pendientes"
                                    label={
                                      <span className="ms-2">
                                        Mostrar solo Carteras con eventos
                                        pendientes
                                      </span>
                                    }
                                    checked={checkSoloEventosPendientes}
                                    onChange={(e) =>
                                      setCheckSoloEventosPendientes(
                                        e.target.checked
                                      )
                                    }
                                  />
                                </div>
                                {checkSoloEventosPendientes &&
                                  eventosOpciones.length > 1 && (
                                    <div
                                      style={{
                                        marginLeft: "2.2rem",
                                        marginBottom: "1rem",
                                      }}
                                    >
                                      <Form.Label>
                                        Opciones de eventos a incluir
                                      </Form.Label>
                                      <Select
                                        isMulti
                                        options={eventosOpciones}
                                        value={
                                          isAllSelected
                                            ? eventosOpciones
                                            : eventosOpciones.filter((opt) =>
                                                opt.value === "todas"
                                                  ? false
                                                  : eventosSeleccionados.includes(
                                                      opt.value
                                                    )
                                              )
                                        }
                                        onChange={handleSelectEventos}
                                        placeholder="Selecciona eventos..."
                                        closeMenuOnSelect={false}
                                      />
                                    </div>
                                  )}
                              </div>
                              <div className="row">
                                {/* <div className="row">
                              <div className="col">
                                <Button variant="primary" className="mb-2">
                                  Consultar
                                </Button>
                              </div>
                              <div className="col">
                                <Button variant="secondary" className="mb-2">
                                  Limpiar
                                </Button>
                              </div>
                            </div> */}
                                <div className="col">
                                  <SingleSelect
                                    options={opciones_edades}
                                    selectedValue={seleccionEdades}
                                    onChange={(val) =>
                                      setSeleccionEdades(val as string)
                                    }
                                    label="Filtrar por edad"
                                  />
                                </div>
                                <div className="col">
                                  <SingleSelect
                                    options={opciones_tipos_filtro}
                                    selectedValue={seleccionTipoFiltro}
                                    onChange={(val) =>
                                      setSeleccionTipoFiltro(val as string)
                                    }
                                    label="Tipo de Filtro"
                                  />
                                </div>
                              </div>
                              {seleccionTipoFiltro === "campaña" && (
                                <Row>
                                  <Col md={6}>
                                    <Form.Group controlId="nombre">
                                      <Form.Label>Campaña</Form.Label>
                                      <Form.Control
                                        type="text"
                                        placeholder="Ingrese nombre"
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>
                              )}
                              {seleccionTipoFiltro === "vencimiento" && (
                                <Row>
                                  <Col md={6}>
                                    <Form.Group controlId="nombre">
                                      <CustomDatePicker
                                        selectedDate={
                                          filtroGenericoStringPorTipo
                                        }
                                        label="Fecha de Vencimiento"
                                        onDateChange={(dateStr) =>
                                          setFiltroGenericoStringPorTipo(
                                            dateStr
                                          )
                                        }
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>
                              )}
                            </Form>
                          </Form>
                        </Card.Body>
                      </Accordion.Collapse>
                    </Card>
                  </Accordion>
                </Accordion>
                {/* <DynamicTable columns={columns} rows={rows} /> */}

                <div className="d-flex align-items-center mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Buscar"
                    value={tablaSearch}
                    onChange={(e) => setTablaSearch(e.target.value)}
                    style={{ maxWidth: 200, marginRight: 8 }}
                    // size="sm"
                  />
                  <Button
                    variant="primary"
                    // size="sm"
                    onClick={fetchFacturas}
                    disabled={tablaLoading}
                    style={{ minWidth: 40 }}
                    title="Consultar"
                  >
                    <i className="fas fa-search" />
                  </Button>
                </div>

                <DynamicTablePagination
                  columns={columns}
                  rows={tablaRows}
                  searchText={tablaSearch}
                  onSearchChange={setTablaSearch}
                  rowsPerPage={tablaRowsPerPage}
                  onRowsPerPageChange={setTablaRowsPerPage}
                  rowPageOptions={[50, 100, 150, 200]}
                  withSearch={false}
                  maxHeight={"80vh"}
                  page={tablaPage}
                  onPageChange={setTablaPage}
                />
                {/* {!collapsed && <DynamicTable columns={columns} rows={rows} />} */}
              </div>
            </div>

            <div className="col main-panel">
              <Tabs defaultActiveKey="info" id="tabs" className="mb-3">
                <Tab eventKey="info" title="Información General">
                  <Row className="mb-3">
                    <Col xs={12} md={3}>
                      <CustomDatePicker
                        label="Seleccione la fecha"
                        selectedDate={fechaConsultaFacturas}
                        onDateChange={setFechaConsultaFacturas}
                      />
                    </Col>
                    <Col xs={12} md={3}>
                      <NumericField
                        value={intMora}
                        onChange={(int) => setIntMora(int)}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <div className="d-flex justify-content-between align-items-center">
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
                      </div>
                    </Col>
                  </Row>

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
                                value={clienteInfo.nombre}
                                readOnly
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Dirección</Form.Label>
                              <Form.Control
                                type="text"
                                value={clienteInfo.direccion}
                                readOnly
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Ciudad</Form.Label>
                              <Form.Control
                                type="text"
                                value={clienteInfo.ciudad}
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

                  <ClienteEstadoCuenta
                    cliente={selectedValue}
                    fecha={fechaConsultaFacturas}
                    intmora={intMora}
                    ref={tablaFacturasRef}
                  />
                </Tab>
                <Tab
                  eventKey="seguimiento"
                  title={
                    <span>
                      Seguimiento
                      {!registroSeleccionado && (
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id="tooltip-seguimiento">
                              Seleccione un cliente para ver sus seguimientos
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
                  disabled={!registroSeleccionado}
                >
                  <TimelineSeguimientos
                    seguimientos={seguimientos}
                    onNuevoSeguimiento={handleNuevoSeguimiento}
                  />
                </Tab>
                <Tab eventKey="bitacora" title="Bitácora">
                  {registroSeleccionado ? (
                    <TablaBitacoras cliente={registroSeleccionado.cliente} />
                  ) : (
                    <div className="text-center p-4">
                      <p>Seleccione un cliente para ver su bitácora</p>
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
      <Modal
        show={showModalCorreo}
        onHide={handleCerrarModalCorreo}
        centered
        
      >
        <Modal.Header  {...({ closeButton: true } as any)}>
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
