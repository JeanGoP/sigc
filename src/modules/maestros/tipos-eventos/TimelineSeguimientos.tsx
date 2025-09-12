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
// import {
//   obtenerTiposEvento,
//   TipoEvento,
// } from "@app/services/TipoEventoService";

import {
  useListarTiposEvento,
  TipoEvento,
} from "@app/services/ConsultaCartera/TipoEventoService";
import { useValidarEvento } from "@app/services/ConsultaCartera/ValidarEventoNuevoService";

import { convertirEventoAXml } from "@app/pages/ConsultaCartera/functions/convertEventoToXML";
import { IconMap } from "@app/services/IconMap";
import { RenderTooltip } from "./components/RenderTooltip";
import { StringToMoney } from "@app/utils/formattersFunctions";
import ModalSeguimientoDetalle from "./components/VerMasComponent";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import {
  useListarTiposContacto,
  TipoContacto,
} from "@app/services/ObtenerTiposContacto";
import { toast } from "react-toastify";
import SpeechToText from "@app/components/SpeechToText/SpeechToText";

const API_URL = import.meta.env.VITE_API_URL;

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

interface TimelineSeguimientosProps {
  seguimientos: Seguimiento[];
  onNuevoSeguimiento: (
    seguimiento: Omit<Seguimiento, "id" | "usuario" | "fecha" | "hora">
  ) => Promise<boolean>;
  contextoEvento?: {
    idUsuario?: string | number;
    cliente?: string;
    factura?: string;
    cuenta?: string;
  };
}

export const TimelineSeguimientos: React.FC<TimelineSeguimientosProps> = ({
  seguimientos,
  onNuevoSeguimiento,
  contextoEvento,
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

  const { loading: loadingEventos, listarTiposEvento } = useListarTiposEvento();
  const { loading: loadingTipoCont, listarTiposContacto } =
    useListarTiposContacto();
  const { validarEvento, loading } = useValidarEvento();

  const emptyFormEvento: Evento = {
    id: 0,
    tipo: "",
    fecha: "",
    hora: null,
    valor: undefined,
  };
  const [formEvento, setFormEvento] = React.useState<Evento>(emptyFormEvento);
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const [errorValidacion, setErrorValidacion] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    const cargarTipos = async () => {
      try {
        const resEventos = await listarTiposEvento();
        if (resEventos?.success && resEventos.data) {
          setTiposEvento(resEventos.data);
          if (resEventos.data.length > 0) {
            setFormEvento((prev) => ({
              ...prev,
              tipo:
                resEventos.data && resEventos.data[0]
                  ? resEventos.data[0].nombre
                  : "",
              id:
                resEventos.data && resEventos.data[0]
                  ? resEventos.data[0].id
                  : 0,
            }));
          }
        }

        // contactos
        const resContactos = await listarTiposContacto("w");
        if (resContactos?.success && resContactos.data) {
          setTiposContacto(resContactos.data);
        }
      } catch (error) {
        console.error("Error cargando tipos:", error);
      }
    };
    cargarTipos();
  }, [listarTiposEvento, listarTiposContacto]);

  function setFormCampo<K extends keyof Evento>(campo: K, valor: Evento[K]) {
    setFormEvento((prev) => ({ ...prev, [campo]: valor }));
  }

  // async function validarEventoBackend(
  //   e: Evento
  // ): Promise<{ ok: boolean; message?: string }> {
  //   const url = `${API_URL}/api/v1/validar-evento`;
  //   const tipoObj = tiposEvento.find(
  //     (t) => t.nombre === e.tipo || t.id === e.id
  //   );
  //   // normalizar fecha a YYYY/MM/DD
  //   const fechaApi = e.fecha; //? e.fecha.replace(/-/g, "/") : "";
  //   const payload = {
  //     tipo: tipoObj?.id ?? e.id ?? 0,
  //     fecha: fechaApi || null,
  //     hora: e.hora ?? null,
  //     monto: typeof e.valor === "number" ? e.valor : 0,
  //     idUsuario: contextoEvento?.idUsuario ?? null,
  //     cliente: contextoEvento?.cliente ?? null,
  //     factura: contextoEvento?.factura ?? null,
  //     cuenta: contextoEvento?.cuenta ?? null,
  //   };

  //   try {
  //     const resp = await fetch(url, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     });
  //     const json = await resp.json();
  //     if (json?.success) return { ok: true };
  //     toast.error(json.message || "Error, valide los campos.");
  //     return { ok: false, message: json?.message || "Validación fallida." };
  //   } catch (err: any) {
  //     toast.error(err?.message || "Error, valide los campos.");
  //     return { ok: false, message: err?.message || "Error de red al validar." };
  //   }
  // }

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

  // const handleAgregarEvento = () => {
  //   if (tiposEvento.length > 0) {
  //     setNuevoEventos((evts) => [
  //       ...evts,
  //       {
  //         id: tiposEvento[0].id,
  //         tipo: tiposEvento[0].nombre,
  //         hora: null,
  //         fecha: "",
  //         valor: undefined,
  //       },
  //     ]);
  //   }
  // };

  const handleAgregarEventoValidado = async () => {
    setErrorValidacion(null);
    const eventoEnviar = { ...formEvento };

    // Si aún no se seleccionó tipo, usamos el primero (como hacías antes)
    if (!eventoEnviar.tipo && tiposEvento.length > 0) {
      eventoEnviar.id = tiposEvento[0].id;
      eventoEnviar.tipo = tiposEvento[0].nombre;
    }

    try {
      const resp = await validarEvento({
        tipo: eventoEnviar.id,
        fecha: eventoEnviar.fecha || null,
        hora: eventoEnviar.hora ?? null,
        monto: typeof eventoEnviar.valor === "number" ? eventoEnviar.valor : 0,
        idUsuario: contextoEvento?.idUsuario ?? null,
        cliente: contextoEvento?.cliente ?? null,
        factura: contextoEvento?.factura ?? null,
        cuenta: contextoEvento?.cuenta ?? null,
      });

      if (!resp || !resp.success) {
        setErrorValidacion(resp?.message || "No se pudo validar el evento.");
        toast.error(resp?.message || "Error, valide los campos.");
        return;
      }
    } catch (err: any) {
      setErrorValidacion(err?.message || "Error al validar.");
      toast.error(err?.message || "Error al validar.");
      return;
    }

    // if (!ok) {
    //   setErrorValidacion(message || "No se pudo validar el evento.");
    //   return;
    // }

    // Validado: agregamos
    setNuevoEventos((evts) => [...evts, eventoEnviar]);
    setFormEvento(emptyFormEvento);
  };

  const handleActualizarEventoValidado = async () => {
    if (editIndex === null) return;
    setErrorValidacion(null);

    const eventoEnviar = { ...formEvento };

    try {
      const resp = await validarEvento({
        tipo: eventoEnviar.id,
        fecha: eventoEnviar.fecha || null,
        hora: eventoEnviar.hora ?? null,
        monto: typeof eventoEnviar.valor === "number" ? eventoEnviar.valor : 0,
        idUsuario: contextoEvento?.idUsuario ?? null,
        cliente: contextoEvento?.cliente ?? null,
        factura: contextoEvento?.factura ?? null,
        cuenta: contextoEvento?.cuenta ?? null,
      });

      if (!resp || !resp.success) {
        setErrorValidacion(resp?.message || "No se pudo validar el evento.");
        toast.error(resp?.message || "Error, valide los campos.");
        return;
      }
    } catch (err: any) {
      setErrorValidacion(err?.message || "Error al validar.");
      toast.error(err?.message || "Error al validar.");
      return;
    }


    // if (!ok) {
    //   setErrorValidacion(message || "No se pudo validar el evento.");
    //   return;
    // }

    setNuevoEventos((evts) =>
      evts.map((evt, i) => (i === editIndex ? eventoEnviar : evt))
    );
    setEditIndex(null);
    setFormEvento(emptyFormEvento);
  };

  const handleCancelarEdicionEvento = () => {
    setEditIndex(null);
    setFormEvento(emptyFormEvento);
    setErrorValidacion(null);
  };

  const handleEditarEvento = (idx: number) => {
    const evt = nuevoEventos[idx];
    setFormEvento({ ...evt });
    setEditIndex(idx);
    setErrorValidacion(null);
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
            {/* <div className="p-4"> */}
            <Row>
              <Col xs={12} sm={12} md={12} lg={12} xl={1}>
                <SpeechToText
                  value={nuevoTexto}
                  onResult={(nuevoTexto) => setNuevoTexto(nuevoTexto)}
                />
              </Col>
              <Col xs={12} sm={12} md={12} lg={12} xl={1}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setNuevoTexto("")}
                >
                  Limpiar
                </Button>
              </Col>
            </Row>
            <br />

            {/* <p className="mt-4 border p-2 rounded">📝 {nuevoTexto}</p> */}
            {/*</div>*/}
            <textarea
              id="textoSeguimiento"
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

            {/* --- Formulario fijo de captura/edición --- */}
            <div
              style={{
                display: "flex",
                alignItems: "end",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
                background: "#fff",
                borderRadius: 8,
                padding: 12,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <SingleSelect
                options={tiposEvento.map((tipo) => ({
                  label: tipo.nombre,
                  value: tipo.nombre, // seguimos usando nombre para no romper nada
                }))}
                selectedValue={formEvento.tipo}
                label="Tipo de evento"
                onChange={(val) => {
                  const selectedTipo = tiposEvento.find(
                    (t) => t.nombre === val
                  );
                  setFormCampo("tipo", val as any);
                  if (selectedTipo) {
                    setFormCampo("id", selectedTipo.id as any);
                  }
                }}
              />

              {/* Campos condicionales como en la versión actual */}
              {(() => {
                const t = tiposEvento.find(
                  (tt) => tt.nombre === formEvento.tipo
                );
                return (
                  <>
                    {t?.requiereFecha && (
                      <Form.Group>
                        <Form.Label>Fecha</Form.Label>
                        <input
                          type="date"
                          className="form-control"
                          style={{ width: 140, borderRadius: 6, margin: 0 }}
                          value={formEvento.fecha || ""}
                          onChange={(e) =>
                            setFormCampo("fecha", e.target.value as any)
                          }
                        />
                      </Form.Group>
                    )}

                    {t?.requiereHora && (
                      <Form.Group>
                        <Form.Label>Hora</Form.Label>
                        <input
                          type="time"
                          className="form-control"
                          style={{ width: 110, borderRadius: 6 }}
                          value={formEvento.hora || ""}
                          onChange={(e) =>
                            setFormCampo("hora", e.target.value as any)
                          }
                        />
                      </Form.Group>
                    )}

                    {t?.requiereMonto && (
                      <Form.Group>
                        <Form.Label>Monto</Form.Label>
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: 120, borderRadius: 6 }}
                          placeholder="Valor"
                          value={formEvento.valor ?? ""}
                          onChange={(e) =>
                            setFormCampo("valor", Number(e.target.value) as any)
                          }
                        />
                      </Form.Group>
                    )}
                  </>
                );
              })()}

              {/* Botones Agregar / Actualizar */}
              <Form.Group>
                {editIndex === null ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAgregarEventoValidado}
                    style={{ borderRadius: 6 }}
                  >
                    + Agregar
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={handleActualizarEventoValidado}
                      style={{ borderRadius: 6, marginRight: 4 }}
                    >
                      Actualizar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={handleCancelarEdicionEvento}
                      style={{ borderRadius: 6 }}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </Form.Group>
            </div>

            {/* Mensaje de validación backend */}
            {errorValidacion && (
              <div style={{ color: "#d32f2f", fontSize: 12, marginBottom: 8 }}>
                {errorValidacion}
              </div>
            )}

            {/* --- Lista de eventos agregados (solo lectura) --- */}
            {nuevoEventos.map((evt, idx) => {
              const t = tiposEvento.find((tt) => tt.nombre === evt.tipo);
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 8,
                    background: "#fff",
                    borderRadius: 8,
                    padding: 12,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    opacity: editIndex === idx ? 0.6 : 1,
                  }}
                >
                  <div style={{ minWidth: 160, fontWeight: 500 }}>
                    {evt.tipo}
                  </div>
                  {t?.requiereFecha && (
                    <div style={{ minWidth: 100 }}>
                      Fecha: {evt.fecha || "-"}
                    </div>
                  )}
                  {t?.requiereHora && (
                    <div style={{ minWidth: 80 }}>Hora: {evt.hora || "-"}</div>
                  )}
                  {t?.requiereMonto && (
                    <div style={{ minWidth: 100 }}>
                      Monto: {evt.valor ?? "-"}
                    </div>
                  )}

                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleEditarEvento(idx)}
                      style={{ borderRadius: 6 }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleEliminarEvento(idx)}
                      style={{ borderRadius: 6 }}
                      title="Eliminar evento"
                    >
                      &times;
                    </Button>
                  </div>
                </div>
              );
            })}
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
        IconMap={IconMap}
        StringToMoney={StringToMoney}
      />
    </div>
  );
};

export default TimelineSeguimientos;
