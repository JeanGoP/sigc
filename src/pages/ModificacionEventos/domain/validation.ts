import type {
  ActualizarModificacionEventoRequest,
  CrearEventoGestionRequest,
} from "@app/services/Calendario/CalendarioService";
import {
  mergeDateAndTime,
  parseNumberValue,
  toLocalDateString,
  toLocalTimeString,
} from "./helpers";
import type {
  EdicionEventoForm,
  EventoModificacion,
  FechaConsultaErrors,
  GestionModificacion,
} from "./types";

type EventValidationMode = "edit" | "add";

interface EventRequirements {
  requiereFecha: boolean;
  requiereHora: boolean;
  requiereMonto: boolean;
}

interface EventFormValidationInput {
  form: EdicionEventoForm;
  requirements: EventRequirements;
  mode: EventValidationMode;
  now?: Date;
}

interface EditValidationInput {
  eventoEditando: EventoModificacion;
  formEdicion: EdicionEventoForm;
  formEdicionInicial: EdicionEventoForm;
  requirements: EventRequirements & {
    requiereHoraInicial: boolean;
  };
  now?: Date;
}

interface AddValidationInput {
  drawerGestion: GestionModificacion;
  formAgregar: EdicionEventoForm;
  requirements: EventRequirements;
  now?: Date;
}

export interface EditValidationChanges {
  usuarioChanged: boolean;
  tipoEventoChanged: boolean;
  fechaHoraChanged: boolean;
  montoChanged: boolean;
  currentFHP: string;
  currentMonto: number | null;
}

export type EditValidationResult =
  | {
      ok: true;
      payload: ActualizarModificacionEventoRequest;
      changes: EditValidationChanges;
    }
  | { ok: false; message: string };

export type AddValidationResult =
  | { ok: true; payload: CrearEventoGestionRequest }
  | { ok: false; message: string };

export const validateFechasConsulta = (
  fechaInicio: string,
  fechaFin: string
): { isValid: boolean; errors: FechaConsultaErrors } => {
  const errors: FechaConsultaErrors = {};

  if (!fechaInicio.trim()) {
    errors.fechaInicio = "La fecha inicio es obligatoria.";
  }

  if (!fechaFin.trim()) {
    errors.fechaFin = "La fecha fin es obligatoria.";
  }

  if (
    fechaInicio &&
    fechaFin &&
    new Date(`${fechaInicio}T00:00:00`) > new Date(`${fechaFin}T23:59:59`)
  ) {
    errors.fechaFin = "La fecha fin debe ser mayor o igual a la fecha inicio.";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateEventoForm = ({
  form,
  requirements,
  mode,
  now = new Date(),
}: EventFormValidationInput): string | null => {
  const usuarioValue = String(form.usuario ?? "").trim();
  const tipoEventoValue = String(form.tipoEventoId ?? "").trim();
  const today = toLocalDateString(now);
  const currentTime = toLocalTimeString(now);

  if (!usuarioValue || usuarioValue.toLowerCase() === "todos") {
    return mode === "edit"
      ? "Debe seleccionar un usuario valido."
      : "Debe seleccionar un usuario.";
  }

  if (!tipoEventoValue) {
    return "El tipo de evento es obligatorio.";
  }

  if (requirements.requiereFecha && !form.fechaEvento) {
    return "La fecha del evento es obligatoria.";
  }

  if (requirements.requiereFecha && form.fechaEvento < today) {
    return "La fecha del evento no puede ser menor a la fecha actual.";
  }

  if (requirements.requiereHora && !form.horaEvento) {
    return "La hora del evento es obligatoria.";
  }

  if (requirements.requiereHora) {
    if (requirements.requiereFecha) {
      const dateTime = new Date(`${form.fechaEvento}T${form.horaEvento}:00`);

      if (Number.isNaN(dateTime.getTime())) {
        return mode === "edit"
          ? "La fecha y hora del evento no son validas."
          : "La fecha y hora no son validas.";
      }

      if (dateTime < now) {
        return mode === "edit"
          ? "La fecha y hora del evento no pueden ser menores a la actual."
          : "La fecha y hora no pueden ser menores a la actual.";
      }
    } else if (form.horaEvento < currentTime) {
      return mode === "edit"
        ? "La hora del evento no puede ser menor a la hora actual."
        : "La hora no puede ser menor a la hora actual.";
    }
  }

  if (
    requirements.requiereMonto &&
    (form.monto.trim() === "" || Number.isNaN(Number(form.monto)))
  ) {
    return mode === "edit"
      ? "El monto del evento es obligatorio."
      : "El monto es obligatorio.";
  }

  return null;
};

export const buildActualizarEventoValidation = ({
  eventoEditando,
  formEdicion,
  formEdicionInicial,
  requirements,
  now,
}: EditValidationInput): EditValidationResult => {
  const formError = validateEventoForm({
    form: formEdicion,
    requirements,
    mode: "edit",
    now,
  });

  if (formError) {
    return { ok: false, message: formError };
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
    requirements.requiereHora
  );
  const initialFHP = mergeDateAndTime(
    formEdicionInicial.fechaEvento,
    formEdicionInicial.horaEvento,
    requirements.requiereHoraInicial
  );
  const fechaHoraChanged = requirements.requiereFecha && currentFHP !== initialFHP;
  const currentMonto =
    formEdicion.monto.trim() === "" ? null : Number(formEdicion.monto);
  const initialMonto =
    formEdicionInicial.monto.trim() === ""
      ? null
      : Number(formEdicionInicial.monto);
  const montoChanged = requirements.requiereMonto && currentMonto !== initialMonto;

  const payload: ActualizarModificacionEventoRequest = {
    idEvento: eventoEditando.id,
  };

  if (usuarioChanged) {
    const uid = parseNumberValue(formEdicion.usuario);
    if (uid === null) {
      return { ok: false, message: "El usuario seleccionado no es valido." };
    }
    payload.idUsuarioAsignado = uid;
  }

  if (tipoEventoChanged) {
    const tid = parseNumberValue(formEdicion.tipoEventoId);
    if (tid === null) {
      return {
        ok: false,
        message: "El tipo de evento seleccionado no es valido.",
      };
    }
    payload.idTipoEvento = tid;
  }

  if (fechaHoraChanged) payload.fechaHoraProgramada = currentFHP;
  if (montoChanged) payload.montoCompromiso = currentMonto;

  if (Object.keys(payload).length <= 1) {
    return { ok: false, message: "No hay cambios para guardar." };
  }

  return {
    ok: true,
    payload,
    changes: {
      usuarioChanged,
      tipoEventoChanged,
      fechaHoraChanged,
      montoChanged,
      currentFHP,
      currentMonto,
    },
  };
};

export const buildCrearEventoValidation = ({
  drawerGestion,
  formAgregar,
  requirements,
  now,
}: AddValidationInput): AddValidationResult => {
  const formError = validateEventoForm({
    form: formAgregar,
    requirements,
    mode: "add",
    now,
  });

  if (formError) {
    return { ok: false, message: formError };
  }

  const idUsuario = parseNumberValue(formAgregar.usuario);
  const idTipo = parseNumberValue(formAgregar.tipoEventoId);

  if (!idUsuario || !idTipo) {
    return { ok: false, message: "Datos invalidos." };
  }

  return {
    ok: true,
    payload: {
      idGestion: drawerGestion.idGestion,
      idUsuarioAsignado: idUsuario,
      idTipoEvento: idTipo,
      fechaHoraProgramada: requirements.requiereFecha
        ? mergeDateAndTime(
            formAgregar.fechaEvento,
            formAgregar.horaEvento,
            requirements.requiereHora
          )
        : undefined,
      montoCompromiso: requirements.requiereMonto
        ? formAgregar.monto.trim() === ""
          ? null
          : Number(formAgregar.monto)
        : undefined,
    },
  };
};
