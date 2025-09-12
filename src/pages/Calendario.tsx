import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
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
import { useEventosService, Evento } from "@app/services/Calendario/CalendarioService";
import { useNavigate } from "react-router-dom";

moment.locale("es");
const localizer = momentLocalizer(moment);

const Calendario: React.FC = () => {
  const [usuarios, setUsuarios] = useState<{ label: string; value: string | number }[]>([]);
  const [usuarioFiltro, setUsuarioFiltro] = useState<string | number>("");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mostrarModalEvento, setMostrarModalEvento] = useState(false);
  const [mostrarModalDia, setMostrarModalDia] = useState(false);
  const [incluirAnteriores, setIncluirAnteriores] = useState(false);
  const [incluirCumplidos, setIncluirCumplidos] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [eventosDelDia, setEventosDelDia] = useState<Evento[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const navigate = useNavigate();

  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { loading, error, obtenerUsuariosPorRol, obtenerEventos } = useEventosService();

  // Cargar usuarios
  useEffect(() => {
    const fetchUsuarios = async () => {
      const res = await obtenerUsuariosPorRol("Asesor", Number(currentUser?.id));
      if (res?.success && Array.isArray(res.data)) {
        const opciones = [
          { label: "Todos", value: "" },
          ...res.data.map((user: any) => ({
            label: user.fullName,
            value: user.userId,
          })),
        ];
        setUsuarios(opciones);
      }
    };
    if (currentUser?.id) {
      fetchUsuarios();
    }
  }, [currentUser]);

  // Cargar eventos
  useEffect(() => {
    const fetchEventos = async () => {
      const res = await obtenerEventos({
        eventosAnteriores: incluirAnteriores,
        eventosCumplidos: incluirCumplidos,
        ...(usuarioFiltro && { userId: usuarioFiltro }),
      });

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
  }, [usuarioFiltro, incluirAnteriores, incluirCumplidos]);

  const handleSeleccionEvento = (evento: Evento) => {
    setEventoSeleccionado(evento);
    setMostrarModalEvento(true);
  };

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
    <div className="container mt-4">
      <h3>📅 Calendario de eventos</h3>

      <Card className="shadow-sm border-0 mb-4">
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
              <Form.Group controlId="switchEventosAnteriores">
                <Form.Label>Incluir eventos anteriores</Form.Label>
                <Form.Check
                  type="switch"
                  checked={incluirAnteriores}
                  onChange={(e) => setIncluirAnteriores(e.target.checked)}
                />
              </Form.Group>
            </Col>

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
            style={{ height: 500 }}
            onShowMore={handleMostrarMas}
            eventPropGetter={(event: Evento) => ({
              style: { backgroundColor: event.color },
            })}
            messages={{
              next: "Sig.",
              previous: "Ant.",
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
                {eventoSeleccionado.title}
              </h5>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Descripción:</strong> {eventoSeleccionado.descripcion}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Usuario:</strong> {eventoSeleccionado.usuario}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Cliente:</strong> {eventoSeleccionado.nombreCliente}
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
            <Button
              variant="primary"
              onClick={() => {
                const qp = new URLSearchParams();
                if ((eventoSeleccionado as any).cuenta) qp.set("cuenta", String((eventoSeleccionado as any).cuenta));
                if ((eventoSeleccionado as any).factura) qp.set("factura", String((eventoSeleccionado as any).factura));
                if ((eventoSeleccionado as any).identificacionCliente)
                  qp.set("identificacionCliente", String((eventoSeleccionado as any).identificacionCliente));
                // Abrir ConsultaCartera con query params
                navigate(`/consulta_carteras?${qp.toString()}`);
              }}
            >
              Ir a gestión en Cartera
            </Button>
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
                      <strong>{ev.title}</strong>{" "}
                      <span className="text-muted">({ev.usuario})</span>
                      <br />
                      <span className="text-muted">
                        {moment(ev.start).format("HH:mm")} -{" "}
                        {moment(ev.end).format("HH:mm")}
                      </span>
                      <br />
                      <small className="text-secondary">{ev.descripcion}</small>
                    </div>
                    <div>
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
