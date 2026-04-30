import {
  buildCalendarioConsultaCarteraUrl,
  buildCalendarioEventosParams,
  buildInitialCalendarRange,
  getEventosDelDia,
  isValidCalendarUserFilter,
  normalizeCalendarRange,
} from "../domain/helpers";

describe("Calendario helpers", () => {
  it("valida filtro de usuario", () => {
    expect(isValidCalendarUserFilter("12")).toBe(true);
    expect(isValidCalendarUserFilter(8)).toBe(true);
    expect(isValidCalendarUserFilter("")).toBe(false);
    expect(isValidCalendarUserFilter("0")).toBe(false);
    expect(isValidCalendarUserFilter(0)).toBe(false);
  });

  it("normaliza rango de array", () => {
    const result = normalizeCalendarRange([
      new Date("2026-05-09T18:00:00"),
      new Date("2026-05-03T09:00:00"),
    ]);

    expect(result.start.getFullYear()).toBe(2026);
    expect(result.start.getMonth()).toBe(4);
    expect(result.start.getDate()).toBe(3);
    expect(result.start.getHours()).toBe(0);
    expect(result.start.getMinutes()).toBe(0);
    expect(result.end.getFullYear()).toBe(2026);
    expect(result.end.getMonth()).toBe(4);
    expect(result.end.getDate()).toBe(9);
    expect(result.end.getHours()).toBe(23);
    expect(result.end.getMinutes()).toBe(59);
  });

  it("normaliza rango de objeto", () => {
    const result = normalizeCalendarRange({
      start: new Date("2026-05-01T11:00:00"),
      end: new Date("2026-05-07T08:00:00"),
    });

    expect(result.start.getFullYear()).toBe(2026);
    expect(result.start.getMonth()).toBe(4);
    expect(result.start.getDate()).toBe(1);
    expect(result.start.getHours()).toBe(0);
    expect(result.start.getMinutes()).toBe(0);
    expect(result.end.getFullYear()).toBe(2026);
    expect(result.end.getMonth()).toBe(4);
    expect(result.end.getDate()).toBe(7);
    expect(result.end.getHours()).toBe(23);
    expect(result.end.getMinutes()).toBe(59);
  });

  it("construye rango inicial mensual", () => {
    const result = buildInitialCalendarRange(new Date("2026-05-15T10:00:00"));

    expect(result.start).toBeInstanceOf(Date);
    expect(result.end).toBeInstanceOf(Date);
    expect(result.start.getTime()).toBeLessThan(result.end.getTime());
  });

  it("construye params para eventos", () => {
    const result = buildCalendarioEventosParams({
      cuentaFiltro: "123",
      eventosAnteriores: false,
      eventosCumplidos: false,
      fechaInicio: new Date("2026-05-01T10:00:00"),
      fechaFin: new Date("2026-05-07T10:00:00"),
      userId: "5",
    });

    expect(result).toEqual({
      eventosAnteriores: false,
      eventosCumplidos: false,
      cuentaFiltro: "123",
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-07",
      userId: "5",
    });
  });

  it("filtra eventos por dia", () => {
    const eventos = [
      {
        title: "A",
        start: new Date("2026-05-03T08:00:00"),
        end: new Date("2026-05-03T09:00:00"),
      },
      {
        title: "B",
        start: new Date("2026-05-04T08:00:00"),
        end: new Date("2026-05-04T09:00:00"),
      },
    ] as any;

    expect(getEventosDelDia(eventos, new Date("2026-05-03T13:00:00"))).toHaveLength(
      1,
    );
  });

  it("construye deep link a consulta cartera", () => {
    const result = buildCalendarioConsultaCarteraUrl({
      title: "Cliente",
      start: new Date("2026-05-03T08:00:00"),
      end: new Date("2026-05-03T09:00:00"),
      monto: "0",
      descripcion: "",
      usuario: "",
      tipoEvento: "",
      identificacionCliente: "999",
      cuenta: "12345",
      factura: "A1",
      icono: "",
      color: "",
      estado: "",
    });

    expect(result).toBe(
      "/consulta_carteras?cuenta=12345&factura=A1&identificacionCliente=999",
    );
  });
});
