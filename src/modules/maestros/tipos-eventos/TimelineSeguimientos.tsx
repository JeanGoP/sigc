import React from "react";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import Tooltip from "react-bootstrap/Tooltip";
// import {
//   obtenerTiposEvento,
//   TipoEvento,
// } from "@app/services/TipoEventoService";

import {
  useListarTiposEvento,
  TipoEvento,
} from "@app/services/ConsultaCartera/TipoEventoService";
import {
  useHorasDispDia,
  HoraDispItem,
} from "@app/services/ConsultaCartera/HorasDispDiaService";

import { IconMap } from "@app/services/IconMap";
import { StringToMoney } from "@app/utils/formattersFunctions";
import {
  aplicarReseteosPorRequerimientosEvento,
  estaHoraOcupada,
} from "@app/utils/eventosCompartidos";
import ModalSeguimientoDetalle from "./components/VerMasComponent";
import { NuevoSeguimientoModal } from "./components/NuevoSeguimientoModal";
import { SeguimientosTimelineList } from "./components/SeguimientosTimelineList";
import { toast } from "react-toastify";
import {
  getEventoCumplidoLabel,
  getEventoCumplidoState,
} from "./utils/cumplido";
import type {
  Evento,
  Seguimiento,
  SeguimientoDraftState,
  SeguimientoEventoContext,
} from "./domain/types";
import {
  buildDefaultFormEvento,
  buildDraftFormEvento,
  createEmptyEvento,
  ensureEventosHaveIds,
  hasMeaningfulSeguimientoDraftContent,
  parseEventos,
} from "./domain/helpers";
import {
  clearSeguimientoDraft,
  readSeguimientoDraft,
  writeSeguimientoDraft,
} from "./domain/draftStorage";
import { useEventoProgramadoValidation } from "./hooks/useEventoProgramadoValidation";
import {
  buildEventoForValidation,
  buildGuardarSeguimientoBlockedMessage,
  EVENTO_VALIDATION_IN_PROGRESS_MESSAGE,
  type EventoValidationResult,
} from "./domain/validation";

export type { Evento, Seguimiento } from "./domain/types";

interface TimelineSeguimientosProps {
  seguimientos: Seguimiento[];
  onNuevoSeguimiento: (
    seguimiento: Omit<Seguimiento, "id" | "usuario" | "fecha" | "hora">
  ) => Promise<boolean>;
  onBuscar?: () => Promise<unknown> | void;
  nuevoAbiertoControlado?: boolean;
  onNuevoAbiertoChange?: (open: boolean) => void;
  ocultarBotonNuevo?: boolean;
  disableGuardarSeguimiento?: boolean;
  disableGuardarSeguimientoReason?: string;
  contextoEvento?: SeguimientoEventoContext;
  draftStorageKey?: string;
}

export const TimelineSeguimientos: React.FC<TimelineSeguimientosProps> = ({
  seguimientos,
  onNuevoSeguimiento,
  onBuscar,
  nuevoAbiertoControlado,
  onNuevoAbiertoChange,
  ocultarBotonNuevo = false,
  disableGuardarSeguimiento = false,
  disableGuardarSeguimientoReason = "",
  contextoEvento,
  draftStorageKey,
}) => {
  const [showModal, setShowModal] = React.useState(false);
  const [seguimientoActivo, setSeguimientoActivo] =
    React.useState<Seguimiento | null>(null);
  const [nuevoAbiertoInterno, setNuevoAbiertoInterno] = React.useState(false);
  const [nuevoTexto, setNuevoTexto] = React.useState("");
  const [nuevoEventos, setNuevoEventos] = React.useState<Evento[]>([]);
  const [nuevoGrabacion, setNuevoGrabacion] = React.useState<File | null>(null);
  const [tiposEvento, setTiposEvento] = React.useState<TipoEvento[]>([]);
  const [nuevoTipoContacto, setNuevoTipoContacto] = React.useState<
    string | number
  >(0);

  const { listarTiposEvento } = useListarTiposEvento();
  const {
    loadingEvento,
    isValidatingEvent,
    isValidatingEventRef,
    validateEventoProgramado,
  } = useEventoProgramadoValidation();
  const { obtenerHoras, loading: loadingHoras } = useHorasDispDia();
  const [horasDisponibles, setHorasDisponibles] = React.useState<HoraDispItem[]>([]);
  const horasFechaRef = React.useRef<string>("");
  const listarTiposEventoRef = React.useRef(listarTiposEvento);

  const emptyFormEvento: Evento = createEmptyEvento();
  const [formEvento, setFormEvento] = React.useState<Evento>(emptyFormEvento);
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const [errorValidacion, setErrorValidacion] = React.useState<string | null>(
    null
  );
  const initializedDraftKeyRef = React.useRef<string | null>(null);
  const internalSaveBlockedReason = isValidatingEvent
    ? EVENTO_VALIDATION_IN_PROGRESS_MESSAGE
    : "";
  const isGuardarSeguimientoDisabled =
    disableGuardarSeguimiento || isValidatingEvent;
  const guardarSeguimientoBlockedReason =
    disableGuardarSeguimientoReason || internalSaveBlockedReason;
  const nuevoAbierto =
    typeof nuevoAbiertoControlado === "boolean"
      ? nuevoAbiertoControlado
      : nuevoAbiertoInterno;

  const setNuevoAbierto = React.useCallback(
    (open: boolean) => {
      if (typeof nuevoAbiertoControlado !== "boolean") {
        setNuevoAbiertoInterno(open);
      }

      onNuevoAbiertoChange?.(open);
    },
    [nuevoAbiertoControlado, onNuevoAbiertoChange]
  );
  const getDefaultFormEvento = React.useCallback(
    (preferNombre?: string): Evento =>
      buildDefaultFormEvento(tiposEvento, preferNombre),
    [tiposEvento]
  );

  const resetDraftState = React.useCallback(() => {
    setNuevoTexto("");
    setNuevoEventos([]);
    setNuevoGrabacion(null);
    setNuevoTipoContacto(0);
    setEditIndex(null);
    setErrorValidacion(null);
    setFormEvento(getDefaultFormEvento());
  }, [getDefaultFormEvento]);

  const applyDraftState = React.useCallback(
    (draft: SeguimientoDraftState | null) => {
      if (!draft) {
        resetDraftState();
        return;
      }

      const draftFormEvento = buildDraftFormEvento(draft, tiposEvento);

      setNuevoTexto(String(draft.texto ?? ""));
      setNuevoEventos(Array.isArray(draft.eventos) ? draft.eventos : []);
      setNuevoGrabacion(null);
      setNuevoTipoContacto(draft.tipoContacto ?? 0);
      setEditIndex(
        typeof draft.editIndex === "number" && Number.isInteger(draft.editIndex)
          ? draft.editIndex
          : null
      );
      setErrorValidacion(null);
      setFormEvento(draftFormEvento);
    },
    [resetDraftState, tiposEvento]
  );

  const hasMeaningfulDraftContent = React.useCallback((): boolean => {
    return hasMeaningfulSeguimientoDraftContent({
      defaultEvento: getDefaultFormEvento(),
      editIndex,
      eventos: nuevoEventos,
      formEvento,
      texto: nuevoTexto,
      tipoContacto: nuevoTipoContacto,
    });
  }, [
    editIndex,
    formEvento,
    getDefaultFormEvento,
    nuevoEventos,
    nuevoTexto,
    nuevoTipoContacto,
  ]);

  React.useEffect(() => {
    listarTiposEventoRef.current = listarTiposEvento;
  }, [listarTiposEvento]);

  React.useEffect(() => {
    let isMounted = true;

    const cargarTipos = async () => {
      try {
        const resEventos = await listarTiposEventoRef.current();
        if (isMounted && resEventos?.success && resEventos.data) {
          setTiposEvento(resEventos.data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error cargando tipos:", error);
        }
      }
    };

    void cargarTipos();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (tiposEvento.length === 0) {
      return;
    }

    const effectiveDraftKey = String(draftStorageKey ?? "").trim() || "__no_draft_key__";
    if (initializedDraftKeyRef.current === effectiveDraftKey) {
      return;
    }

    initializedDraftKeyRef.current = effectiveDraftKey;
    applyDraftState(readSeguimientoDraft(draftStorageKey));
  }, [applyDraftState, draftStorageKey, tiposEvento]);

  React.useEffect(() => {
    if (tiposEvento.length === 0) {
      return;
    }

    const storageKey = String(draftStorageKey ?? "").trim();
    if (!storageKey) {
      return;
    }

    if (!hasMeaningfulDraftContent()) {
      clearSeguimientoDraft(storageKey);
      return;
    }

    writeSeguimientoDraft(storageKey, {
      texto: nuevoTexto,
      eventos: nuevoEventos,
      tipoContacto: nuevoTipoContacto,
      formEvento,
      editIndex,
      updatedAt: new Date().toISOString(),
    });
  }, [
    draftStorageKey,
    editIndex,
    formEvento,
    hasMeaningfulDraftContent,
    nuevoEventos,
    nuevoTexto,
    nuevoTipoContacto,
    tiposEvento,
  ]);

  // Carga las horas disponibles del día cuando cambia la fecha del evento
  // (solo si el tipo de evento requiere hora y hay un idUsuario en el contexto)
  React.useEffect(() => {
    const fecha = formEvento.fecha;
    const tipoObj = tiposEvento.find((t) => t.nombre === formEvento.tipo);
    const idUsuario = contextoEvento?.idUsuario;

    if (!tipoObj?.requiereHora || !fecha || !idUsuario) {
      setHorasDisponibles([]);
      horasFechaRef.current = "";
      return;
    }

    if (horasFechaRef.current === fecha) return; // ya cargadas para esta fecha

    horasFechaRef.current = fecha;
    setHorasDisponibles([]);

    obtenerHoras(fecha, idUsuario).then((res) => {
      const horasData = res?.data;
      if (!horasData) return;
      setHorasDisponibles(horasData);
      // Si la hora/minuto actual está ocupada en la nueva fecha, la blanqueamos
      setFormEvento((prev) => {
        if (!estaHoraOcupada(prev.hora, horasData)) return prev;
        if (prev.hora) return { ...prev, hora: null };
        return prev;
      });
    });
  }, [formEvento.fecha, formEvento.tipo, tiposEvento, contextoEvento?.idUsuario, obtenerHoras]);

  const handleFormCampoChange = React.useCallback(
    (campo: keyof Evento, valor: Evento[keyof Evento]) => {
      setFormEvento((prev) => ({ ...prev, [campo]: valor }));
    },
    []
  );

  const handleTipoEventoChange = React.useCallback(
    (value: string | number) => {
      const selectedTipo = tiposEvento.find((tipo) => tipo.nombre === value);
      setFormEvento((prev) =>
        aplicarReseteosPorRequerimientosEvento({
          state: {
            ...prev,
            tipo: value as string,
            id: selectedTipo ? selectedTipo.id : prev.id,
          },
          requerimientos: selectedTipo,
          fechaKey: "fecha",
          fechaVacia: "",
          horaKey: "hora",
          horaVacia: null,
          montoKey: "valor",
          montoVacio: undefined,
        })
      );
      setErrorValidacion(null);
    },
    [tiposEvento]
  );

  const handleVerMas = (seguimiento: Seguimiento) => {
    setSeguimientoActivo(seguimiento);
    setShowModal(true);
  };

  const handleAudio = (seguimiento: Seguimiento) => {
    setSeguimientoActivo(seguimiento);
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setSeguimientoActivo(null);
  };

  const handleEventoValidationResult = React.useCallback(
    (result: EventoValidationResult) => {
      if (result.ok || !result.message) {
        return;
      }

      setErrorValidacion(result.message);

      if (result.toastType === "warn") {
        toast.warn(result.toastMessage || result.message);
        return;
      }

      if (result.toastType === "error") {
        toast.error(result.toastMessage || result.message);
      }
    },
    []
  );

  const handleAgregarEventoValidado = async () => {
    if (isValidatingEventRef.current) return;
    setErrorValidacion(null);

    const eventoEnviar = buildEventoForValidation(formEvento, tiposEvento);
    const validationResult = await validateEventoProgramado({
      evento: eventoEnviar,
      eventos: nuevoEventos,
      contextoEvento,
    });

    if (!validationResult.ok) {
      handleEventoValidationResult(validationResult);
      return;
    }

    setNuevoEventos((evts) => [...evts, eventoEnviar]);
    setFormEvento(getDefaultFormEvento(eventoEnviar.tipo));
  };

  const handleActualizarEventoValidado = async () => {
    if (editIndex === null) return;
    if (isValidatingEventRef.current) return;
    setErrorValidacion(null);

    const eventoEnviar = buildEventoForValidation(formEvento, tiposEvento);
    const validationResult = await validateEventoProgramado({
      evento: eventoEnviar,
      eventos: nuevoEventos,
      contextoEvento,
      excludeIndex: editIndex,
    });

    if (!validationResult.ok) {
      handleEventoValidationResult(validationResult);
      return;
    }

    setNuevoEventos((evts) =>
      evts.map((evt, i) => (i === editIndex ? eventoEnviar : evt))
    );
    setEditIndex(null);
    setFormEvento(getDefaultFormEvento(eventoEnviar.tipo));
  };

  const handleCancelarEdicionEvento = () => {
    setEditIndex(null);
    setFormEvento(getDefaultFormEvento(formEvento.tipo));
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

  const handleGuardarNuevo = async () => {
    const guardarBlockedMessage = buildGuardarSeguimientoBlockedMessage({
      isValidatingEvent: isValidatingEventRef.current || isValidatingEvent,
      disableGuardarSeguimiento,
      disableGuardarSeguimientoReason,
    });

    if (guardarBlockedMessage) {
      toast.warning(guardarBlockedMessage);
      return;
    }

    const eventosConId = ensureEventosHaveIds(nuevoEventos, tiposEvento);

    const grabacionUrl = nuevoGrabacion
      ? URL.createObjectURL(nuevoGrabacion)
      : null;
    const procesoGuardado = await onNuevoSeguimiento({
      texto: nuevoTexto,
      detalle: nuevoTexto,
      eventos: eventosConId,
      tipoContacto: nuevoTipoContacto,
      grabacion: grabacionUrl,
    });
    if (grabacionUrl) {
      URL.revokeObjectURL(grabacionUrl);
    }

    if (await procesoGuardado) {
      clearSeguimientoDraft(draftStorageKey);
      setNuevoAbierto(false);
      resetDraftState();
      void onBuscar?.();
    }
  };

  const renderTooltip = (evento: Evento, idx?: number) => {
    const cumplidoLabel = getEventoCumplidoLabel(evento.cumplido);
    const cumplidoState = getEventoCumplidoState(evento.cumplido);

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
            {cumplidoLabel && (
              <span
                style={{
                  color:
                    cumplidoState === "done"
                      ? "#388e3c"
                      : cumplidoState === "pending"
                        ? "#d32f2f"
                        : "#495057",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {cumplidoState === "done" && (
                  <FontAwesomeIcon icon={faCheck} />
                )}
                {cumplidoState === "pending" && (
                  <FontAwesomeIcon icon={faTimes} />
                )}
                <span>{cumplidoLabel}</span>
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
  }

  return (
    <div style={{ padding: 24 }}>
      {!ocultarBotonNuevo && (
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

      <NuevoSeguimientoModal
        show={nuevoAbierto}
        texto={nuevoTexto}
        tipoContacto={nuevoTipoContacto}
        eventos={nuevoEventos}
        tiposEvento={tiposEvento}
        formEvento={formEvento}
        editIndex={editIndex}
        errorValidacion={errorValidacion}
        horasDisponibles={horasDisponibles}
        loadingHoras={loadingHoras}
        loadingEvento={loadingEvento}
        isValidatingEvent={isValidatingEvent}
        isGuardarDisabled={isGuardarSeguimientoDisabled}
        guardarBlockedReason={guardarSeguimientoBlockedReason}
        onTextoChange={setNuevoTexto}
        onTipoContactoChange={(value) => setNuevoTipoContacto(value)}
        onTipoEventoChange={handleTipoEventoChange}
        onFormCampoChange={handleFormCampoChange}
        onAgregarEvento={handleAgregarEventoValidado}
        onActualizarEvento={handleActualizarEventoValidado}
        onCancelarEdicion={handleCancelarEdicionEvento}
        onEditarEvento={handleEditarEvento}
        onEliminarEvento={handleEliminarEvento}
        onGuardar={handleGuardarNuevo}
        onCerrar={() => setNuevoAbierto(false)}
      />

      {/* Timeline */}
      <SeguimientosTimelineList
        seguimientos={seguimientos}
        parseEventos={parseEventos}
        renderTooltip={renderTooltip}
        onAudio={handleAudio}
        onVerMas={handleVerMas}
      />

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
