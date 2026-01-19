import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import type { View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  ListGroup,
  Form,
} from "react-bootstrap";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import { StringToMoney } from "@app/utils/formattersFunctions";
import { useAppSelector } from "@app/store/store";
import {
  useEventosService,
  Evento,
} from "@app/services/Calendario/CalendarioService";
import { useNavigate } from "react-router-dom";
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";

moment.locale("es");
const localizer = momentLocalizer(moment);

// Componente reutilizable para el botón de gestión en Cartera
interface BotonGestionCarteraProps {
  type: "A" | "B";
  evento: Evento;
}

const BotonGestionCartera: React.FC<BotonGestionCarteraProps> = ({
  type = "A",
  evento,
}) => {
  const navigate = useNavigate();

  const handleIrACartera = () => {
    const qp = new URLSearchParams();
    if ((evento as any).cuenta)
      qp.set("cuenta", String((evento as any).cuenta));
    if ((evento as any).factura)
      qp.set("factura", String((evento as any).factura));
    if ((evento as any).identificacionCliente)
      qp.set(
        "identificacionCliente",
        String((evento as any).identificacionCliente)
      );
    // Abrir ConsultaCartera con query params
    navigate(`/consulta_carteras?${qp.toString()}`);
  };

  return (
    <div>
      {type.toUpperCase() === "A" ? (
        <Button variant="primary" onClick={handleIrACartera}>
          Seguimiento
        </Button>
      ) : (
        <i
          className="fas fa-search"
          onClick={handleIrACartera}
          style={{
            color: "#007bff",
            fontSize: "20px",
            cursor: "pointer",
            paddingLeft: "10px",
          }}
        ></i>
      )}
    </div>
  );
};

const Calendario: React.FC = () => {
  const [usuarios, setUsuarios] = useState<
    { label: string; value: string | number }[]
  >([]);
  const [usuarioFiltro, setUsuarioFiltro] = useState<string | number>("");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mostrarModalEvento, setMostrarModalEvento] = useState(false);
  const [mostrarModalDia, setMostrarModalDia] = useState(false);
  const [incluirAnteriores, setIncluirAnteriores] = useState(false);
  const [incluirCumplidos, setIncluirCumplidos] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(
    null
  );
  const [cuentaFiltro, setCuentaFiltro] = useState<string>("");
  const [eventosDelDia, setEventosDelDia] = useState<Evento[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [rangoVisible, setRangoVisible] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const navigate = useNavigate();

  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { loading, error, obtenerUsuariosPorRol, obtenerEventos } =
    useEventosService();

  const isValidUserFilter = (value: string | number) =>
    value !== "" && value !== null && value !== undefined && value !== 0 && value !== "0";

  const normalizeRange = (
    range: Date[] | { start: Date; end: Date }
  ): { start: Date; end: Date } => {
    if (Array.isArray(range)) {
      if (range.length === 0) {
        const today = moment();
        return {
          start: today.startOf("day").toDate(),
          end: today.endOf("day").toDate(),
        };
      }
      const times = range.map((date) => date.getTime());
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      return {
        start: moment(new Date(minTime)).startOf("day").toDate(),
        end: moment(new Date(maxTime)).endOf("day").toDate(),
      };
    }

    return {
      start: moment(range.start).startOf("day").toDate(),
      end: moment(range.end).endOf("day").toDate(),
    };
  };

  const handleRangeChange = (
    range: Date[] | { start: Date; end: Date },
    view?: View
  ) => {
    const normalized = normalizeRange(range);
    setRangoVisible(normalized);
    console.log("Calendario rango visible actualizado:", {
      view,
      start: moment(normalized.start).format("YYYY-MM-DD"),
      end: moment(normalized.end).format("YYYY-MM-DD"),
    });
  };

  // Cargar usuarios
  useEffect(() => {
    const fetchUsuarios = async () => {
      const res = await obtenerUsuariosPorRol(
        "Asesor",
        Number(currentUser?.id)
      );
      if (res?.success && Array.isArray(res.data)) {
        const opciones = [
          ...res.data.map((user: any) => ({
            label: user.fullName,
            value: user.userId,
          })),
        ];
        setUsuarios(opciones);
        if (opciones.length > 0) {
          setUsuarioFiltro((prev) => {
            if (isValidUserFilter(prev)) return prev;
            const firstValid = opciones.find((opt) => isValidUserFilter(opt.value));
            return firstValid ? firstValid.value : prev;
          });
        }
      }
    };
    if (currentUser?.id) {
      fetchUsuarios();
    }
  }, [currentUser]);

  // Rango inicial para la vista por defecto (mes)
  useEffect(() => {
    const start = moment().startOf("month").startOf("week");
    const end = moment().endOf("month").endOf("week");
    const initialRange = { start: start.toDate(), end: end.toDate() };
    setRangoVisible(initialRange);
    console.log("Calendario rango inicial:", {
      start: start.format("YYYY-MM-DD"),
      end: end.format("YYYY-MM-DD"),
    });
  }, []);

  // Cargar eventos
  useEffect(() => {
    const fetchEventos = async () => {
      if (!isValidUserFilter(usuarioFiltro) || !rangoVisible) return;
      const params = {
        eventosAnteriores: incluirAnteriores,
        eventosCumplidos: incluirCumplidos,
        cuentaFiltro: cuentaFiltro || null,
        fechaInicio: moment(rangoVisible.start).format("YYYY-MM-DD"),
        fechaFin: moment(rangoVisible.end).format("YYYY-MM-DD"),
        ...(isValidUserFilter(usuarioFiltro) && { userId: usuarioFiltro }),
      };
      console.log("Calendario obtenerEventos params:", params);
      const res = await obtenerEventos(params);

      if (res?.success && Array.isArray(res.data)) {
        const eventosConvertidos = res.data.map((ev: any) => ({
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end),
        }));
        setEventos(eventosConvertidos);
      }
    };
    fetchEventos();
  }, [
    usuarioFiltro,
    incluirAnteriores,
    incluirCumplidos,
    cuentaFiltro,
    rangoVisible,
  ]);

  const handleSeleccionEvento = (evento: Evento) => {
    setEventoSeleccionado(evento);
    setMostrarModalEvento(true);
  };

  const handleSetCuentaFiltro = (cuenta: any) => {
    console.log("Cuenta seleccionada en Calendario prueba:", cuenta);
    setCuentaFiltro(cuenta);
  }

  const handleSeleccionDia = (slotInfo: { start: Date }) => {
    const fecha = moment(slotInfo.start).startOf("day");
    const eventosEnEsaFecha = eventos.filter((ev) =>
      moment(ev.start).isSame(fecha, "day")
    );
    setEventosDelDia(eventosEnEsaFecha);
    setFechaSeleccionada(slotInfo.start);
    setMostrarModalDia(true);
  };

  const cerrarModalEvento = () => {
    setMostrarModalEvento(false);
    setEventoSeleccionado(null);
  };

  const cerrarModalDia = () => {
    setMostrarModalDia(false);
    setEventosDelDia([]);
    setFechaSeleccionada(null);
  };

  const handleMostrarMas = (eventos: any[], fecha: Date) => {
    setEventosDelDia(eventos);
    setFechaSeleccionada(fecha);
    setMostrarModalDia(true);
  };

  return (
    <div className=" mt-5 col-sm-12 col-md-12 col-lg-10" style={{margin:"auto"}}>
      <h3>📅 Calendario de eventos</h3>

      <Card className="shadow-sm border-0 mb-4" >
        <Card.Body>
          <Row>
            <Col md={4}>
              <SingleSelect
                label="Filtrar por usuario"
                options={usuarios}
                selectedValue={usuarioFiltro}
                onChange={setUsuarioFiltro}
                placeholder="Seleccione un usuario"
              />
            </Col>
            <Col md={4}>
              {/* <BuscadorGeneral opcion="CU" op="CLIENTE"/> */}
              <BuscadorCuentas
                opcion="CU"
                op="CLIENTE"
                placeholder="Buscar cuenta..."
                label="Cuenta"
                onChange={handleSetCuentaFiltro} // hacer la funcionalidad de guardar el valor seleccionado
                onSelect={() => {}} // hacer la funcionalidad de guardar el valor seleccionado
              />
            </Col>
            {/* <Col md={4}>
              <Form.Group controlId="switchEventosAnteriores">
                <Form.Label>Incluir eventos anteriores</Form.Label>
                <Form.Check
                  type="switch"
                  checked={incluirAnteriores}
                  onChange={(e) => setIncluirAnteriores(e.target.checked)}
                />
              </Form.Group>
            </Col> */}

            <Col md={4}>
              <Form.Group controlId="switchCumplidos">
                <Form.Label>Incluir cumplidos</Form.Label>
                <Form.Check
                  type="switch"
                  checked={incluirCumplidos}
                  onChange={(e) => setIncluirCumplidos(e.target.checked)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <Calendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectEvent={handleSeleccionEvento}
            onSelectSlot={handleSeleccionDia}
            onRangeChange={handleRangeChange}
            style={{ height: 500 }}
            onShowMore={handleMostrarMas}
            eventPropGetter={(event: Evento) => ({
              style: { backgroundColor: event.color },
            })}
            messages={{
              next: "Siguiente",
              previous: "Anterior",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
            }}
          />
        </Card.Body>
      </Card>

      {/* Modal evento */}
      <Modal show={mostrarModalEvento} onHide={cerrarModalEvento}>
        <Modal.Header {...({ closeButton: true } as any)}>
          <Modal.Title>Detalle del evento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {eventoSeleccionado && (
            <div className="p-2">
              <h5 className="mb-3 text-primary">
                <i className="fas fa-calendar-alt me-2"></i>
                {" " + eventoSeleccionado.tipoEvento}
              </h5>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Descripción:</strong> {eventoSeleccionado.descripcion}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Usuario:</strong> {eventoSeleccionado.usuario}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Cliente:</strong> {eventoSeleccionado.title}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Identificación:</strong>{" "}
                  {eventoSeleccionado.identificacionCliente}
                </ListGroup.Item>
                {eventoSeleccionado.monto === "0" ? null : (
                  <ListGroup.Item>
                    <strong>Monto:</strong>{" "}
                    <span className="text-success">
                      ${StringToMoney(eventoSeleccionado.monto)}
                    </span>
                  </ListGroup.Item>
                )}
                <ListGroup.Item>
                  <strong>Estado:</strong>{" "}
                  <span
                    className={
                      eventoSeleccionado.estado === "Activo"
                        ? "text-success"
                        : "text-muted"
                    }
                  >
                    {eventoSeleccionado.estado}
                  </span>
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Inicio:</strong>{" "}
                  {moment(eventoSeleccionado.start).format("YYYY-MM-DD HH:mm")}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Fin:</strong>{" "}
                  {moment(eventoSeleccionado.end).format("YYYY-MM-DD HH:mm")}
                </ListGroup.Item>
              </ListGroup>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {eventoSeleccionado && (
            <BotonGestionCartera type={"A"} evento={eventoSeleccionado} />
          )}
          <Button variant="secondary" onClick={cerrarModalEvento}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal día */}
      <Modal show={mostrarModalDia} onHide={cerrarModalDia}>
        <Modal.Header {...({ closeButton: true } as any)}>
          <Modal.Title>Eventos del día</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            <strong>Fecha:</strong>{" "}
            {fechaSeleccionada
              ? moment(fechaSeleccionada).format("YYYY-MM-DD")
              : ""}
          </p>
          {eventosDelDia.length === 0 ? (
            <p className="text-center text-secondary">
              No hay eventos para este día.
            </p>
          ) : (
            <ListGroup variant="flush">
              {eventosDelDia.map((ev, idx) => (
                <ListGroup.Item key={idx}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="row">
                        <strong>{ev.title}</strong>{" "}
                        <span className="text-muted">({ev.usuario})</span>
                        <BotonGestionCartera type="B" evento={ev} />
                      </div>
                      <span className="text-muted">
                        {moment(ev.start).format("HH:mm")} -{" "}
                        {moment(ev.end).format("HH:mm")}
                      </span>
                      <br />
                      <small className="text-secondary">{ev.descripcion}</small>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-2">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: ev.color,
                          color: "#fff",
                          padding: "0.4em 0.6em",
                          borderRadius: "0.5em",
                        }}
                      >
                        {ev.estado}
                      </span>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModalDia}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Calendario;
