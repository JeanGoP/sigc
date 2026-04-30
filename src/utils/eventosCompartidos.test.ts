import {
  aplicarReseteosPorRequerimientosEvento,
  estaHoraOcupada,
} from "./eventosCompartidos";

describe("eventosCompartidos", () => {
  it("resetea campos que el tipo no requiere", () => {
    const result = aplicarReseteosPorRequerimientosEvento({
      state: {
        tipo: "Promesa",
        fecha: "2026-04-28",
        hora: "10:30",
        monto: "9000",
      },
      requerimientos: {
        requiereFecha: false,
        requiereHora: false,
        requiereMonto: true,
      },
      fechaKey: "fecha",
      fechaVacia: "",
      horaKey: "hora",
      horaVacia: "",
      montoKey: "monto",
      montoVacio: "",
    });

    expect(result).toEqual({
      tipo: "Promesa",
      fecha: "",
      hora: "",
      monto: "9000",
    });
  });

  it("conserva campos cuando el tipo los requiere", () => {
    const result = aplicarReseteosPorRequerimientosEvento({
      state: {
        fechaEvento: "2026-04-28",
        horaEvento: "10:30",
        monto: "9000",
      },
      requerimientos: {
        requiereFecha: true,
        requiereHora: true,
        requiereMonto: true,
      },
      fechaKey: "fechaEvento",
      fechaVacia: "",
      horaKey: "horaEvento",
      horaVacia: "",
      montoKey: "monto",
      montoVacio: "",
    });

    expect(result).toEqual({
      fechaEvento: "2026-04-28",
      horaEvento: "10:30",
      monto: "9000",
    });
  });

  it("detecta hora ocupada", () => {
    expect(
      estaHoraOcupada("10:30", [
        { hora: 10, minuto: 0, ocupado: false },
        { hora: 10, minuto: 30, ocupado: true },
      ]),
    ).toBe(true);
  });

  it("ignora hora vacia o invalida", () => {
    expect(estaHoraOcupada("", [{ hora: 10, minuto: 30, ocupado: true }])).toBe(
      false,
    );
    expect(
      estaHoraOcupada("nope", [{ hora: 10, minuto: 30, ocupado: true }]),
    ).toBe(false);
  });
});
