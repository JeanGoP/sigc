import type { EtiquetaClientePayload } from "@app/services/Maestros/EtiquetasClientes/EtiquetasClienteService";
import type { EtiquetaCliente, EtiquetaClienteFormState } from "./types";

export const DEFAULT_ETIQUETA_CLIENTE_COLOR = "#2ecc71";

export function buildDefaultEtiquetaClienteForm(): EtiquetaClienteFormState {
  return {
    nombre: "",
    color: DEFAULT_ETIQUETA_CLIENTE_COLOR,
    estado: true,
  };
}

export function buildEtiquetaClienteForm(
  etiqueta?: EtiquetaCliente | null,
): EtiquetaClienteFormState {
  if (!etiqueta) {
    return buildDefaultEtiquetaClienteForm();
  }

  return {
    nombre: etiqueta.nombre,
    color: etiqueta.color,
    estado: etiqueta.estado,
  };
}

export function buildGuardarEtiquetaClientePayload(
  currentUserId: number,
  formData: EtiquetaClienteFormState,
  selectedEtiqueta?: EtiquetaCliente | null,
): EtiquetaClientePayload {
  return {
    id: selectedEtiqueta?.id || 0,
    nombre: formData.nombre,
    color: formData.color,
    estado: formData.estado,
    iduser: currentUserId,
  };
}

export function getEtiquetaClienteSuccessMessage(
  selectedEtiqueta?: EtiquetaCliente | null,
): string {
  return selectedEtiqueta ? "Etiqueta actualizada" : "Etiqueta creada";
}

export function getEtiquetaClienteModalTitle(
  selectedEtiqueta?: EtiquetaCliente | null,
): string {
  return `${selectedEtiqueta ? "Editar" : "Nueva"} Etiqueta`;
}
