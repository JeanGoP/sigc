import {
  buildDefaultFormEvento,
  buildDraftFormEvento,
  buildEventoKey,
  buildEventosXml,
  convertirHoraA24,
  ensureEventosHaveIds,
  hasMeaningfulSeguimientoDraftContent,
  isDuplicateEvento,
  parseEventos,
} from "../domain/helpers";
import type { Evento, SeguimientoDraftState } from "../domain/types";

const tiposEvento = [
  { id: 10, nombre: "Promesa de pago" },
  { id: 20, nombre: "Visita" },
];

describe("tipos eventos timeline helpers", () => {
  it("builds default event forms from available event types", () => {
    expect(buildDefaultFormEvento(tiposEvento)).toEqual({
      id: 10,
      tipo: "Promesa de pago",
      fecha: "",
      hora: null,
      valor: undefined,
    });

    expect(buildDefaultFormEvento(tiposEvento, "Visita")).toEqual({
      id: 20,
      tipo: "Visita",
      fecha: "",
      hora: null,
      valor: undefined,
    });
  });

  it("prefills the suggested amount only for event types that require it", () => {
    const tiposConMonto = [
      { id: 10, nombre: "Promesa de pago", requiereMonto: true },
      { id: 20, nombre: "Visita", requiereMonto: false },
    ];

    expect(buildDefaultFormEvento(tiposConMonto, "Promesa de pago", 45000)).toEqual({
      id: 10,
      tipo: "Promesa de pago",
      fecha: "",
      hora: null,
      valor: 45000,
    });

    expect(buildDefaultFormEvento(tiposConMonto, "Visita", 45000)).toEqual({
      id: 20,
      tipo: "Visita",
      fecha: "",
      hora: null,
      valor: undefined,
    });
  });

  it("merges draft form data over the default form for that event type", () => {
    const draft: SeguimientoDraftState = {
      texto: "",
      eventos: [],
      tipoContacto: 0,
      formEvento: {
        id: 20,
        tipo: "Visita",
        fecha: "2026-04-27",
        hora: "10:00",
      },
      editIndex: null,
      updatedAt: "",
    };

    expect(buildDraftFormEvento(draft, tiposEvento)).toEqual({
      id: 20,
      tipo: "Visita",
      fecha: "2026-04-27",
      hora: "10:00",
      valor: undefined,
    });
  });

  it("detects meaningful draft content", () => {
    const defaultEvento = buildDefaultFormEvento(tiposEvento);

    expect(
      hasMeaningfulSeguimientoDraftContent({
        defaultEvento,
        editIndex: null,
        eventos: [],
        formEvento: defaultEvento,
        texto: "",
        tipoContacto: 0,
      })
    ).toBe(false);

    expect(
      hasMeaningfulSeguimientoDraftContent({
        defaultEvento,
        editIndex: null,
        eventos: [],
        formEvento: { ...defaultEvento, fecha: "2026-04-27" },
        texto: "",
        tipoContacto: 0,
      })
    ).toBe(true);
  });

  it("builds event duplicate keys and ignores the edited index", () => {
    const evento: Evento = {
      id: 10,
      tipo: "Promesa de pago",
      fecha: "2026-04-27",
      hora: "10:00",
      valor: 1000,
    };

    expect(buildEventoKey(evento)).toBe("10|2026-04-27|10:00|1000");
    expect(isDuplicateEvento([evento], { ...evento })).toBe(true);
    expect(isDuplicateEvento([evento], { ...evento }, 0)).toBe(false);
  });

  it("converts 12 hour times to 24 hour times", () => {
    expect(convertirHoraA24("1:05 p.m.")).toBe("13:05");
    expect(convertirHoraA24("12:00 a. m.")).toBe("00:00");
    expect(convertirHoraA24("09:15")).toBeNull();
  });

  it("fills missing event ids from event type names", () => {
    expect(
      ensureEventosHaveIds(
        [
          { id: 0, tipo: "Visita" },
          { id: 99, tipo: "Otro" },
        ],
        tiposEvento
      )
    ).toEqual([
      { id: 20, tipo: "Visita" },
      { id: 99, tipo: "Otro" },
    ]);
  });

  it("serializes events to the legacy XML shape", () => {
    expect(
      buildEventosXml([
        {
          id: 10,
          tipo: "Promesa de pago",
          fecha: "2026-04-27",
          hora: "1:05 p.m.",
          valor: 1000,
        },
      ])
    ).toContain("<Hora>13:05</Hora>");
  });

  it("parses events from arrays, JSON, XML and newline JSON fragments", () => {
    const arrayEventos: Evento[] = [{ id: 1, tipo: "A" }];
    expect(parseEventos(arrayEventos)).toBe(arrayEventos);

    expect(parseEventos('[{"id":1,"tipo":"A"}]')).toEqual([
      { id: 1, tipo: "A" },
    ]);

    expect(
      parseEventos(
        "<Evento><Id>2</Id><Tipo>B</Tipo><Fecha>2026-04-27</Fecha><Hora>10:00</Hora><Valor>5</Valor><Cumplido>true</Cumplido></Evento>"
      )
    ).toEqual([
      {
        id: 2,
        tipo: "B",
        fecha: "2026-04-27",
        hora: "10:00",
        valor: 5,
        cumplido: "true",
      },
    ]);

    expect(
      parseEventos('{"id":3,"tipo":"C"}\n{"id":4,"tipo":"D","valor":8}')
    ).toEqual([
      {
        id: 3,
        tipo: "C",
        fecha: undefined,
        hora: undefined,
        valor: undefined,
        cumplido: undefined,
      },
      {
        id: 4,
        tipo: "D",
        fecha: undefined,
        hora: undefined,
        valor: 8,
        cumplido: undefined,
      },
    ]);
  });
});
