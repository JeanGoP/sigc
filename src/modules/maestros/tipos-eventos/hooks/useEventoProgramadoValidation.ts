import React from "react";
import { useValidarEvento } from "@app/services/ConsultaCartera/ValidarEventoNuevoService";
import {
  buildDuplicateEventoValidationResult,
  buildEventoValidationPayload,
  mapBackendEventoValidationResult,
  mapEventoValidationException,
  type EventoValidationResult,
} from "../domain/validation";
import type { Evento, SeguimientoEventoContext } from "../domain/types";

interface ValidateEventoProgramadoInput {
  evento: Evento;
  eventos: readonly Evento[];
  contextoEvento?: SeguimientoEventoContext;
  excludeIndex?: number;
}

export function useEventoProgramadoValidation() {
  const { validarEvento, loading } = useValidarEvento();
  const [isValidatingEvent, setIsValidatingEvent] = React.useState(false);
  const isValidatingEventRef = React.useRef(false);

  const validateEventoProgramado = React.useCallback(
    async ({
      evento,
      eventos,
      contextoEvento,
      excludeIndex,
    }: ValidateEventoProgramadoInput): Promise<EventoValidationResult> => {
      if (isValidatingEventRef.current) {
        return { ok: false };
      }

      isValidatingEventRef.current = true;
      setIsValidatingEvent(true);

      try {
        const duplicateResult = buildDuplicateEventoValidationResult(
          eventos,
          evento,
          excludeIndex
        );
        if (duplicateResult) {
          return duplicateResult;
        }

        const response = await validarEvento(
          buildEventoValidationPayload(evento, contextoEvento)
        );

        return mapBackendEventoValidationResult(response);
      } catch (error) {
        return mapEventoValidationException(error);
      } finally {
        isValidatingEventRef.current = false;
        setIsValidatingEvent(false);
      }
    },
    [validarEvento]
  );

  return {
    loadingEvento: loading,
    isValidatingEvent,
    isValidatingEventRef,
    validateEventoProgramado,
  };
}
