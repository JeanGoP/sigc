import type { PlantillaCorreo } from "@app/services/ConsultaCartera/ConsultaCarteraServices";

export interface ConsultaCarteraMailSelection {
  cliente: string;
  factura: string;
  cuenta: string;
}

interface BuildConsultaCarteraMailPayloadInput {
  fechaConsultaFacturas: string;
  plantillaSeleccionadaKey: string;
  registroSeleccionado: ConsultaCarteraMailSelection;
  currentUserId?: string | number | null;
}

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizePlantillasCorreo(
  plantillas: PlantillaCorreo[] | null | undefined
): PlantillaCorreo[] {
  if (!Array.isArray(plantillas)) {
    return [];
  }

  return plantillas.map((plantilla) => ({
    nombre: normalizeString(plantilla?.nombre),
    key: normalizeString(plantilla?.key),
  }));
}

export function getDefaultPlantillaCorreoKey(
  plantillas: PlantillaCorreo[]
): string {
  return normalizeString(plantillas[0]?.key);
}

export function buildConsultaCarteraMailPayload({
  fechaConsultaFacturas,
  plantillaSeleccionadaKey,
  registroSeleccionado,
  currentUserId,
}: BuildConsultaCarteraMailPayloadInput) {
  const parsedUserId = Number(currentUserId);

  return {
    cliente: normalizeString(registroSeleccionado.cliente),
    factura: normalizeString(registroSeleccionado.factura),
    cuenta: normalizeString(registroSeleccionado.cuenta),
    plantillaKey: normalizeString(plantillaSeleccionadaKey),
    fecha: normalizeString(fechaConsultaFacturas),
    idUser: Number.isFinite(parsedUserId) ? parsedUserId : 0,
  };
}
