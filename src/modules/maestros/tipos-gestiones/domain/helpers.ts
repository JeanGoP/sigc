import type {
  TipoContactoValue,
  TipoGestion,
  TipoGestionFormState,
} from "./types";
import { TIPO_GESTION_FORMULARIO_INICIAL } from "./constants";

export function buildTipoGestionFormData(
  tipoGestion: TipoGestion | null | undefined
): TipoGestionFormState {
  if (!tipoGestion) {
    return TIPO_GESTION_FORMULARIO_INICIAL;
  }

  return {
    nombre: tipoGestion.nombre,
    descripcion: tipoGestion.descripcion,
    estado: tipoGestion.estado,
  };
}

export function buildGuardarTipoGestionPayload(input: {
  tipoSeleccionado: TipoGestion | null;
  formulario: TipoGestionFormState;
  tipoContacto: TipoContactoValue;
  idUser: number;
}) {
  const { tipoSeleccionado, formulario, tipoContacto, idUser } = input;

  return {
    id: tipoSeleccionado?.id || 0,
    nombre: formulario.nombre,
    descripcion: formulario.descripcion,
    estado: formulario.estado,
    formaContacto: tipoContacto,
    idUser,
  };
}
