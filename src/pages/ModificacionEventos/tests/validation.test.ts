import {
  buildActualizarEventoValidation,
  buildCrearEventoValidation,
  validateEventoForm,
  validateFechasConsulta,
} from "../domain/validation";
import type {
  EdicionEventoForm,
  EventoModificacion,
  GestionModificacion,
} from "../domain/types";

const now = new Date("2026-04-28T09:15:00");

const baseForm: EdicionEventoForm = {
  usuario: 1,
  cuenta: "CTA",
  cliente: "CLI",
  tipoEventoId: 10,
  fechaEvento: "2026-04-29",
  horaEvento: "10:30",
  monto: "100",
};

const eventoEditando: EventoModificacion = {
  id: 44,
  cliente: "CLI",
  factura: "FAC",
  cuenta: "CTA",
  tipoEventoId: "10",
  tipoEvento: "Promesa",
  fechaCreacion: "",
  fechaEvento: "2026-04-29T10:30:00",
  monto: 100,
  usuario: "Asesor",
  requiereFecha: true,
  requiereHora: true,
  requiereMonto: true,
};

const gestion: GestionModificacion = {
  idGestion: 99,
  cliente: "CLI",
  factura: "FAC",
  cuenta: "CTA",
  usuario: 1,
  Username: "Asesor",
  FechaHora: "2026-04-28T08:00:00",
  descripcion: "Gestion",
  eventos: [],
};

describe("modificacion eventos validation", () => {
  it("validates search date ranges with the existing messages", () => {
    expect(validateFechasConsulta("", "")).toEqual({
      isValid: false,
      errors: {
        fechaInicio: "La fecha inicio es obligatoria.",
        fechaFin: "La fecha fin es obligatoria.",
      },
    });

    expect(validateFechasConsulta("2026-04-29", "2026-04-28")).toEqual({
      isValid: false,
      errors: {
        fechaFin: "La fecha fin debe ser mayor o igual a la fecha inicio.",
      },
    });
  });

  it("keeps edit and add form validation message differences", () => {
    expect(
      validateEventoForm({
        form: { ...baseForm, usuario: "" },
        requirements: {
          requiereFecha: true,
          requiereHora: true,
          requiereMonto: true,
        },
        mode: "edit",
        now,
      })
    ).toBe("Debe seleccionar un usuario valido.");

    expect(
      validateEventoForm({
        form: { ...baseForm, usuario: "" },
        requirements: {
          requiereFecha: true,
          requiereHora: true,
          requiereMonto: true,
        },
        mode: "add",
        now,
      })
    ).toBe("Debe seleccionar un usuario.");

    expect(
      validateEventoForm({
        form: { ...baseForm, fechaEvento: "2026-04-28", horaEvento: "08:00" },
        requirements: {
          requiereFecha: true,
          requiereHora: true,
          requiereMonto: true,
        },
        mode: "add",
        now,
      })
    ).toBe("La fecha y hora no pueden ser menores a la actual.");
  });

  it("builds update payloads with only changed fields", () => {
    const result = buildActualizarEventoValidation({
      eventoEditando,
      formEdicion: {
        ...baseForm,
        usuario: 2,
        tipoEventoId: 20,
        fechaEvento: "2026-04-30",
        horaEvento: "11:45",
        monto: "250",
      },
      formEdicionInicial: baseForm,
      requirements: {
        requiereFecha: true,
        requiereHora: true,
        requiereMonto: true,
        requiereHoraInicial: true,
      },
      now,
    });

    expect(result).toEqual({
      ok: true,
      payload: {
        idEvento: 44,
        idUsuarioAsignado: 2,
        idTipoEvento: 20,
        fechaHoraProgramada: "2026-04-30T11:45:00",
        montoCompromiso: 250,
      },
      changes: {
        usuarioChanged: true,
        tipoEventoChanged: true,
        fechaHoraChanged: true,
        montoChanged: true,
        currentFHP: "2026-04-30T11:45:00",
        currentMonto: 250,
      },
    });
  });

  it("rejects edit saves without changes", () => {
    expect(
      buildActualizarEventoValidation({
        eventoEditando,
        formEdicion: baseForm,
        formEdicionInicial: baseForm,
        requirements: {
          requiereFecha: true,
          requiereHora: true,
          requiereMonto: true,
          requiereHoraInicial: true,
        },
        now,
      })
    ).toEqual({ ok: false, message: "No hay cambios para guardar." });
  });

  it("builds add-event payloads with optional date and amount fields", () => {
    expect(
      buildCrearEventoValidation({
        drawerGestion: gestion,
        formAgregar: {
          ...baseForm,
          usuario: 3,
          tipoEventoId: 30,
          monto: "450",
        },
        requirements: {
          requiereFecha: true,
          requiereHora: false,
          requiereMonto: true,
        },
        now,
      })
    ).toEqual({
      ok: true,
      payload: {
        idGestion: 99,
        idUsuarioAsignado: 3,
        idTipoEvento: 30,
        fechaHoraProgramada: "2026-04-29T00:00:00",
        montoCompromiso: 450,
      },
    });
  });

  it("preserves add-event invalid id behavior", () => {
    expect(
      buildCrearEventoValidation({
        drawerGestion: gestion,
        formAgregar: {
          ...baseForm,
          usuario: 0,
          tipoEventoId: 30,
        },
        requirements: {
          requiereFecha: false,
          requiereHora: false,
          requiereMonto: false,
        },
        now,
      })
    ).toEqual({ ok: false, message: "Datos invalidos." });
  });
});
