import React from "react";
import { Button, Modal, Form, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faHandHoldingUsd,
  faExclamationTriangle,
  faHome,
  faBuilding,
  faMicrophone,
  faCheck,
  faTimes,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import {
  obtenerTiposEvento,
  TipoEvento,
} from "@app/services/TipoEventoService";
import { convertirEventoAXml } from "@app/pages/ConsultaCartera/functions/convertEventoToXML";
import { IconMap } from "@app/services/IconMap";
import { RenderTooltip } from "./components/RenderTooltip";
import { StringToMoney } from "@app/utils/formattersFunctions";
import ModalSeguimientoDetalle from "./components/VerMasComponent";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import {
  obtenerTiposContacto,
  TipoContacto,
} from "@app/services/ObtenerTiposContacto";

interface EventoXML {
  id: number;
  tipo: string;
  fecha: string;
  hora: string | null;
  valor?: number;
}

export type Evento = {
  id: number;
  tipo: string;
  fecha?: string;
  hora?: string | null;
  valor?: number;
  cumplido?: boolean;
  color?: string;
  icono?: string;
};

export type Seguimiento = {
  id: number;
  usuario: string;
  fecha: string;
  hora: string;
  texto: string;
  detalle: string;
  eventos: Evento[];
  tipoContacto?: string | number;
  grabacion: string | null;
};

const iconosEventos: Record<
  string,
  { icon: any; color: string; label: string }
> = {
  agendar_llamada: {
    icon: faPhone,
    color: "#1976d2",
    label: "Agendar llamada",
  },
  compromiso_pago: {
    icon: faHandHoldingUsd,
    color: "#388e3c",
    label: "Compromiso de pago",
  },
  penalizacion: {
    icon: faExclamationTriangle,
    color: "#d32f2f",
    label: "Penalización",
  },
  visita: { icon: faHome, color: "#fbc02d", label: "Visita" },
  acercarse_oficina: {
    icon: faBuilding,
    color: "#512da8",
    label: "Acercarse a la oficina",
  },
};

interface TimelineSeguimientosProps {
  seguimientos: Seguimiento[];
  onNuevoSeguimiento: (
    seguimiento: Omit<Seguimiento, "id" | "usuario" | "fecha" | "hora">
  ) => Promise<boolean>;
}

export const TimelineSeguimientos: React.FC<TimelineSeguimientosProps> = ({
  seguimientos,
  onNuevoSeguimiento,
}) => {
  const [showModal, setShowModal] = React.useState(false);
  const [showAudio, setShowAudio] = React.useState(false);
  const [seguimientoActivo, setSeguimientoActivo] =
    React.useState<Seguimiento | null>(null);
  const [nuevoAbierto, setNuevoAbierto] = React.useState(false);
  const [nuevoTexto, setNuevoTexto] = React.useState("");
  const [nuevoEventos, setNuevoEventos] = React.useState<Evento[]>([]);
  const [nuevoGrabacion, setNuevoGrabacion] = React.useState<File | null>(null);
  const [tiposEvento, setTiposEvento] = React.useState<TipoEvento[]>([]);
  const [tiposContacto, setTiposContacto] = React.useState<TipoContacto[]>([]);
  const [nuevoTipoContacto, setNuevoTipoContacto] = React.useState<
    string | number
  >(0);

  React.useEffect(() => {
    const cargarTiposEvento = async () => {
      try {
        const tipos = await obtenerTiposEvento();
        setTiposEvento(tipos);

        const tiposCon = await obtenerTiposContacto("");
        console.log("Tipos de evento cargados: ", tiposCon);
        setTiposContacto(tiposCon);
      } catch (error) {
        console.error("Error al cargar tipos de evento: ", error);
      }
    };
    cargarTiposEvento();
  }, []);

  const handleVerMas = (seguimiento: Seguimiento) => {
    setSeguimientoActivo(seguimiento);
    setShowModal(true);
    setShowAudio(false);
  };

  const handleAudio = (seguimiento: Seguimiento) => {
    setSeguimientoActivo(seguimiento);
    setShowAudio(true);
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setShowAudio(false);
    setSeguimientoActivo(null);
  };

  const handleNuevoEventoChange = (
    idx: number,
    key: keyof Evento,
    value: any
  ) => {
    setNuevoEventos((evts) =>
      evts.map((evt, i) => (i === idx ? { ...evt, [key]: value } : evt))
    );
  };

  const handleAgregarEvento = () => {
    if (tiposEvento.length > 0) {
      setNuevoEventos((evts) => [
        ...evts,
        {
          id: tiposEvento[0].id,
          tipo: tiposEvento[0].nombre,
          hora: null,
          fecha: "",
          valor: undefined,
        },
      ]);
    }
  };

  const handleEliminarEvento = (idx: number) => {
    setNuevoEventos((evts) => evts.filter((_, i) => i !== idx));
  };

  // Función para convertir hora 12h a 24h
  function convertirHoraA24(hora12: string): string | null {
    const horaLimpia = hora12.trim().toLowerCase().replace(/\s+/g, " ");
    const match = horaLimpia.match(
      /^(\d{1,2}):(\d{2})\s*(a\.?\s?m\.?|p\.?\s?m\.?)$/i
    );
    if (!match) return null;
    let horas = parseInt(match[1], 10);
    const minutos = match[2];
    const periodo = match[3];
    if (periodo.startsWith("p") && horas !== 12) {
      horas += 12;
    }
    if (periodo.startsWith("a") && horas === 12) {
      horas = 0;
    }
    return `${horas.toString().padStart(2, "0")}:${minutos}`;
  }

  const handleGuardarNuevo = async () => {
    // Asegurar que todos los eventos tengan el id correcto
    const eventosConId = nuevoEventos.map((evt) => {
      if (!evt.id) {
        const tipo = tiposEvento.find((t) => t.nombre === evt.tipo);
        return { ...evt, id: tipo ? tipo.id : 0 };
      }
      return evt;
    });

    // Convertir los eventos a XML
    const eventosXml = eventosConId
      .map((evt) => {
        const eventoXML: EventoXML = {
          id: evt.id,
          tipo: evt.tipo,
          fecha: evt.fecha || "",
          hora: evt.hora ? convertirHoraA24(evt.hora) ?? evt.hora : null,
          valor: evt.valor ? Number(evt.valor) : undefined,
        };
        return convertirEventoAXml(eventoXML);
      })
      .join("\n");

    const procesoGuardado = await onNuevoSeguimiento({
      texto: nuevoTexto,
      detalle: nuevoTexto,
      eventos: eventosConId,
      tipoContacto: nuevoTipoContacto,
      grabacion: nuevoGrabacion ? URL.createObjectURL(nuevoGrabacion) : null,
    });

    if (await procesoGuardado) {
      setNuevoAbierto(false);
      setNuevoTexto("");
      setNuevoEventos([]);
      setNuevoGrabacion(null);
    }
  };

  const renderTooltip = (evento: Evento, idx?: number) => {
    return (
      <Tooltip id={`tooltip-evento-${evento.tipo}-${idx}`}>
        <div style={{ padding: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            {/* <b>{iconosEventos[evento.tipo]?.label || evento.tipo}</b> */}
            <b>{evento.tipo}</b>
            {evento.cumplido !== undefined && (
              <span
                style={{
                  color: evento.cumplido ? "#388e3c" : "#d32f2f",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {evento.cumplido ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    <span>Cumplido</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTimes} />
                    <span>Pendiente</span>
                  </>
                )}
              </span>
            )}
          </div>
          {evento.fecha && <div>Fecha: {evento.fecha}</div>}
          {evento.hora !== "00:00" && <div>Hora: {evento.hora}</div>}
          {typeof evento.valor === "number" && (
            <div>Valor: ${StringToMoney(evento.valor)}</div>
          )}
        </div>
      </Tooltip>
    );
  };

  function handleNewSeguimiento(): void {
    setNuevoAbierto(true);
    setNuevoTexto("");
    setNuevoEventos([]);
    setNuevoGrabacion(null);
  }

  const parseEventos = (eventos: string | Evento[]): Evento[] => {
    if (Array.isArray(eventos)) {
      return eventos;
    }
    if (typeof eventos === "string") {
      try {
        // Intentar parsear como JSON primero
        return JSON.parse(eventos);
      } catch (e) {
        // Si falla, intentar parsear como XML
        return eventos
          .split("\n")
          .filter((evento) => evento.trim())
          .map((eventoStr) => {
            try {
              const parsed = JSON.parse(eventoStr);
              return {
                id: parsed.id,
                tipo: parsed.tipo,
                fecha: parsed.fecha,
                hora: parsed.hora,
                valor: parsed.valor,
                cumplido: parsed.cumplido,
              } as Evento;
            } catch (e) {
              console.error("Error al parsear evento:", e);
              return null;
            }
          })
          .filter((evento): evento is Evento => evento !== null);
      }
    }
    return [];
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Formulario para nuevo seguimiento */}
      {nuevoAbierto ? (
        <div
          style={{
            background: "#e3f2fd",
            borderRadius: 12,
            padding: 24,
            marginBottom: 32,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "1px solid #bbdefb",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              fontSize: 20,
              marginBottom: 16,
              color: "#1565c0",
            }}
          >
            Nuevo seguimiento
          </div>
          <div className="mb-3">
            <label style={{ fontWeight: 500, marginBottom: 8 }}>
              Texto del seguimiento
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={nuevoTexto}
              onChange={(e) => setNuevoTexto(e.target.value)}
              style={{
                borderRadius: 8,
                border: "1px solid #bbdefb",
                padding: 12,
              }}
            />
          </div>
          <div>
            {/* <label style={{ fontWeight: 500, marginBottom: 8 }}>
              Tipo de contacto
            </label> */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
                background: "#fff",
                borderRadius: 8,
                padding: 12,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <Row>
                <Col xs={12} lg={4} md={4} xl={4}>
                  <Form.Group style={{ width: "200px" }}>
                    <Form.Label>Tipo de contacto</Form.Label>
                    <SingleSelect
                      options={tiposContacto.map((tipo) => ({
                        label: tipo.descripcion,
                        value: tipo.id, // Puedes usar `tipo.id` si prefieres usar el ID como valor único
                      }))}
                      selectedValue={nuevoTipoContacto}
                      onChange={(id: string | number) =>
                        setNuevoTipoContacto(id)
                      }
                    ></SingleSelect>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </div>

          <div className="mb-3" style={{ padding: 0 }}>
            <label style={{ fontWeight: 500, marginBottom: 8 }}>
              Eventos programados
            </label>
            {nuevoEventos.map((evt, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "end",
                  gap: 12,
                  marginBottom: 12,
                  background: "#fff",
                  borderRadius: 8,
                  padding: 12,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                <SingleSelect
                  options={tiposEvento.map((tipo) => ({
                    label: tipo.nombre,
                    value: tipo.nombre, // Puedes usar `tipo.id` si prefieres usar el ID como valor único
                  }))}
                  selectedValue={evt.tipo}
                  label="Tipo de evento"
                  onChange={(val) => {
                    const selectedTipo = tiposEvento.find(
                      (t) => t.nombre === val
                    );
                    handleNuevoEventoChange(idx, "tipo", val);
                    if (selectedTipo) {
                      handleNuevoEventoChange(idx, "id", selectedTipo.id);
                    }
                  }}
                />
                {tiposEvento.find((t) => t.nombre === evt.tipo)
                  ?.requiereFecha && (
                  <Form.Group>
                    <Form.Label>Fecha</Form.Label>
                    <input
                      type="date"
                      className="form-control"
                      style={{ width: 140, borderRadius: 6, margin: 0 }}
                      value={evt.fecha || ""}
                      onChange={(e) =>
                        handleNuevoEventoChange(idx, "fecha", e.target.value)
                      }
                    />
                  </Form.Group>
                )}
                {tiposEvento.find((t) => t.nombre === evt.tipo)
                  ?.requiereHora && (
                  <Form.Group>
                    <Form.Label>Hora</Form.Label>
                    <input
                      type="time"
                      className="form-control"
                      style={{ width: 110, borderRadius: 6 }}
                      value={evt.hora || ""}
                      onChange={(e) =>
                        handleNuevoEventoChange(idx, "hora", e.target.value)
                      }
                    />
                  </Form.Group>

                  // </div>
                )}
                {tiposEvento.find((t) => t.nombre === evt.tipo)
                  ?.requiereMonto && (
                  <Form.Group>
                    <Form.Label>Monto</Form.Label>
                    <input
                      type="number"
                      className="form-control"
                      style={{ width: 120, borderRadius: 6 }}
                      placeholder="Valor"
                      value={evt.valor || ""}
                      onChange={(e) =>
                        handleNuevoEventoChange(
                          idx,
                          "valor",
                          Number(e.target.value)
                        )
                      }
                    />
                  </Form.Group>
                )}
                <Form.Group>
                  <Button
                    // size="sm"
                    variant="danger"
                    onClick={() => handleEliminarEvento(idx)}
                    title="Eliminar evento"
                    style={{ borderRadius: 6 }}
                  >
                    &times;
                  </Button>
                </Form.Group>

                {/* <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip(evt, idx)}
                >
                  <span
                    style={{
                      color: iconosEventos[evt.tipo]?.color || "#666",
                      fontSize: 18,
                      marginLeft: 8,
                      cursor: "pointer",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={
                        iconosEventos[evt.tipo]?.icon || faExclamationTriangle
                      }
                    />
                  </span>
                </OverlayTrigger> */}
              </div>
            ))}
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAgregarEvento}
              style={{
                borderRadius: 6,
                marginTop: 8,
              }}
            >
              + Agregar evento
            </Button>
          </div>
          <div className="mb-3">
            <label style={{ fontWeight: 500, marginBottom: 8 }}>
              Adjuntar grabación (opcional)
            </label>
            <input
              type="file"
              accept="audio/*"
              className="form-control"
              style={{ borderRadius: 6 }}
              onChange={(e) =>
                setNuevoGrabacion(
                  e.target.files && e.target.files[0] ? e.target.files[0] : null
                )
              }
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button
              variant="success"
              onClick={handleGuardarNuevo}
              style={{ borderRadius: 6 }}
            >
              Guardar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setNuevoAbierto(false)}
              style={{ borderRadius: 6 }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="primary"
          style={{
            marginBottom: 32,
            borderRadius: 8,
            padding: "8px 16px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          onClick={() => handleNewSeguimiento()}
        >
          + Nuevo seguimiento
        </Button>
      )}

      {/* Timeline */}
      <div style={{ height: "75vh", overflowY: "auto", paddingRight: 12 }}>
        <div style={{ position: "relative" }}>
          {seguimientos.map((seg, index) => (
            <div
              key={seg.id}
              style={{ marginBottom: 32, position: "relative" }}
            >
              {/* Línea conectora */}
              {index < seguimientos.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: 7,
                    top: 24,
                    bottom: -32,
                    width: 2,
                    background: "#e0e0e0",
                    zIndex: 0,
                  }}
                />
              )}
              {/* Punto del timeline */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    background: "#1565c0",
                    borderRadius: "50%",
                    width: 16,
                    height: 16,
                    display: "inline-block",
                    border: "2px solid #fff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                ></span>
              </div>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  minWidth: 250,
                  position: "relative",
                  marginLeft: 24,
                  border: "1px solid #e0e0e0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#1565c0",
                      fontSize: 16,
                    }}
                  >
                    {seg.usuario}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginLeft: 16,
                    }}
                  >
                    {seg.eventos &&
                      parseEventos(seg.eventos).map((evento, idx) => {
                        // Si el evento tiene valor, mostrar el icono de compromiso de pago
                        const esCompromisoPago =
                          typeof evento.valor === "number" && evento.valor > 0;
                        return (
                          <OverlayTrigger
                            key={idx}
                            placement="top"
                            overlay={renderTooltip(evento, idx)}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              {/* <FontAwesomeIcon
                            icon={evento.color} color={evento.color} 
                          /> */}
                              {/* <FontAwesomeIcon icon={IconMap[evento.icono || 'home']} /> */}
                              <span
                                style={{
                                  color: evento.color,
                                  fontSize: 20,
                                  cursor: "pointer",
                                  opacity: evento.cumplido ? 0.5 : 1,
                                  marginLeft: 4,
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={IconMap[evento.icono || "home"]}
                                  color={evento.color}
                                />
                              </span>
                            </span>
                          </OverlayTrigger>
                          // <RenderTooltip evento={evento} idx={idx}/>
                          // <FontAwesomeIcon icon={IconMap[evento.icono || 'home']} />
                        );
                      })}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#666",
                    marginBottom: 8,
                  }}
                >
                  {seg.fecha} {seg.hora}
                </div>
                <div
                  style={{
                    margin: "12px 0",
                    color: "#333",
                    lineHeight: 1.5,
                  }}
                >
                  {seg.texto.length > 80
                    ? seg.texto.slice(0, 80) + "..."
                    : seg.texto}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleVerMas(seg)}
                    style={{ borderRadius: 6 }}
                  >
                    Ver más
                  </Button>
                  {seg.grabacion && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleAudio(seg)}
                      style={{ borderRadius: 6 }}
                    >
                      <FontAwesomeIcon
                        icon={faMicrophone}
                        style={{ marginRight: 4 }}
                      />
                      Escuchar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalle */}
      <ModalSeguimientoDetalle
        showModal={showModal}
        handleClose={handleClose}
        seguimientoActivo={seguimientoActivo}
        parseEventos={parseEventos}
        iconosEventos={iconosEventos}
        IconMap={IconMap}
        StringToMoney={StringToMoney}
      />
    </div>
  );
};

export default TimelineSeguimientos;
