import {
  buildDuplicateEventoValidationResult,
  buildEventoForValidation,
  buildEventoValidationPayload,
  buildGuardarSeguimientoBlockedMessage,
  DUPLICATE_EVENTO_MESSAGE,
  EVENTO_VALIDATION_EXCEPTION_MESSAGE,
  EVENTO_VALIDATION_FAILED_MESSAGE,
  EVENTO_VALIDATION_IN_PROGRESS_MESSAGE,
  EVENTO_VALIDATION_TOAST_FALLBACK,
  mapBackendEventoValidationResult,
  mapEventoValidationException,
  SEGUIMIENTO_SAVE_BLOCKED_MESSAGE,
} from "../domain/validation";
import type { Evento } from "../domain/types";

const tiposEvento = [
  { id: 10, nombre: "Promesa de pago" },
  { id: 20, nombre: "Visita" },
];

describe("tipos eventos validation helpers", () => {
  it("builds the event to validate with the first type when no type is selected", () => {
    expect(
      buildEventoForValidation(
        { id: 0, tipo: "", fecha: "2026-04-28", hora: null },
        tiposEvento
      )
    ).toEqual({
      id: 10,
      tipo: "Promesa de pago",
      fecha: "2026-04-28",
      hora: null,
    });

    expect(
      buildEventoForValidation({ id: 20, tipo: "Visita" }, tiposEvento)
    ).toEqual({ id: 20, tipo: "Visita" });
  });

  it("builds the backend validation payload using the legacy null and zero defaults", () => {
    expect(
      buildEventoValidationPayload(
        {
          id: 10,
          tipo: "Promesa de pago",
          fecha: "",
          hora: undefined,
          valor: undefined,
        },
        {
          idUsuario: 7,
          cliente: "100",
          factura: "F-1",
          cuenta: "C-1",
        }
      )
    ).toEqual({
      tipo: 10,
      fecha: null,
      hora: null,
      monto: 0,
      idUsuario: 7,
      cliente: "100",
      factura: "F-1",
      cuenta: "C-1",
    });
  });

  it("reports duplicate events while ignoring the edited index", () => {
    const evento: Evento = {
      id: 10,
      tipo: "Promesa de pago",
      fecha: "2026-04-28",
      hora: "10:00",
      valor: 500,
    };

    expect(buildDuplicateEventoValidationResult([evento], evento)).toEqual({
      ok: false,
      message: DUPLICATE_EVENTO_MESSAGE,
      toastMessage: DUPLICATE_EVENTO_MESSAGE,
      toastType: "warn",
    });

    expect(buildDuplicateEventoValidationResult([evento], evento, 0)).toBeNull();
  });

  it("maps backend validation responses to UI-safe result messages", () => {
    expect(mapBackendEventoValidationResult({ success: true })).toEqual({
      ok: true,
    });

    expect(mapBackendEventoValidationResult({ success: false, message: "Fecha ocupada" })).toEqual({
      ok: false,
      message: "Fecha ocupada",
      toastMessage: "Fecha ocupada",
      toastType: "error",
    });

    expect(mapBackendEventoValidationResult(null)).toEqual({
      ok: false,
      message: EVENTO_VALIDATION_FAILED_MESSAGE,
      toastMessage: EVENTO_VALIDATION_TOAST_FALLBACK,
      toastType: "error",
    });
  });

  it("maps thrown validation errors to the existing fallback message", () => {
    expect(mapEventoValidationException(new Error("Sin red"))).toEqual({
      ok: false,
      message: "Sin red",
      toastMessage: "Sin red",
      toastType: "error",
    });

    expect(mapEventoValidationException(null)).toEqual({
      ok: false,
      message: EVENTO_VALIDATION_EXCEPTION_MESSAGE,
      toastMessage: EVENTO_VALIDATION_EXCEPTION_MESSAGE,
      toastType: "error",
    });
  });

  it("keeps the save blocking priority stable", () => {
    expect(
      buildGuardarSeguimientoBlockedMessage({
        isValidatingEvent: true,
        disableGuardarSeguimiento: true,
        disableGuardarSeguimientoReason: "Gestion inactiva",
      })
    ).toBe(EVENTO_VALIDATION_IN_PROGRESS_MESSAGE);

    expect(
      buildGuardarSeguimientoBlockedMessage({
        isValidatingEvent: false,
        disableGuardarSeguimiento: true,
        disableGuardarSeguimientoReason: "",
      })
    ).toBe(SEGUIMIENTO_SAVE_BLOCKED_MESSAGE);

    expect(
      buildGuardarSeguimientoBlockedMessage({
        isValidatingEvent: false,
        disableGuardarSeguimiento: false,
      })
    ).toBe("");
  });
});
