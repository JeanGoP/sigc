import {
  areEquivalentPhoneValues,
  buildFallbackFacturaSelectionFromSearchParams,
  buildCombinedApiErrorMessage,
  buildFacturaMontoSuggestion,
  buildEventosXml,
  buildFacturaSelection,
  buildFacturasListParams,
  createSaveFallbackIdempotencyKey,
  createStartIdempotencyKey,
  createTransitionIdempotencyKey,
  findFacturaRowBySearchParams,
  formatElapsedHhMmSs,
  hasConsultaCarteraSearchSelection,
  isInboundCallDirection,
  isTerminalCallStatus,
  parseConsultaCarteraSearchParams,
  resolveConsultaCarteraSearchValue,
} from "./helpers";

describe("consulta cartera helpers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("formats elapsed seconds as HH:mm:ss", () => {
    expect(formatElapsedHhMmSs(0)).toBe("00:00:00");
    expect(formatElapsedHhMmSs(-10)).toBe("00:00:00");
    expect(formatElapsedHhMmSs(Number.NaN)).toBe("00:00:00");
    expect(formatElapsedHhMmSs(3661.8)).toBe("01:01:01");
  });

  it("identifies inbound directions and terminal call statuses", () => {
    expect(isInboundCallDirection(" inbound ")).toBe(true);
    expect(isInboundCallDirection("INCOMING_CALL")).toBe(true);
    expect(isInboundCallDirection("outbound")).toBe(false);

    expect(isTerminalCallStatus("completed")).toBe(true);
    expect(isTerminalCallStatus("NO-ANSWER")).toBe(true);
    expect(isTerminalCallStatus("in-progress")).toBe(false);
  });

  it("compares phone values using normalized digits and Colombia prefix fallback", () => {
    expect(areEquivalentPhoneValues("+57 300 123 4567", "3001234567")).toBe(true);
    expect(areEquivalentPhoneValues("00300-123-4567", "+3001234567")).toBe(true);
    expect(areEquivalentPhoneValues("111", "222")).toBe(false);
    expect(areEquivalentPhoneValues("", "3001234567")).toBe(false);
  });

  it("combines API error messages without duplicates", () => {
    expect(
      buildCombinedApiErrorMessage(
        {
          message: "Error principal",
          errors: ["Detalle uno", "error principal", "Detalle dos"],
        },
        "Fallback"
      )
    ).toBe("Error principal\nDetalle uno\nDetalle dos");

    expect(buildCombinedApiErrorMessage(null, "Fallback")).toBe("Fallback");
  });

  it("builds the facturas list payload preserving current defaults", () => {
    expect(
      buildFacturasListParams({
        fechaConsultaFacturas: "2026-04-26",
        filtros: {
          checkIncluirSaldosCero: true,
          checkSoloAsignadas: false,
          checkSoloEventosPendientes: true,
          cuenta: null,
          sinGestionDias: 3,
          filtroEdadMora: "30;60",
          tipoEvento: "EV",
          filtroPorVencimiento: null,
          etiqueta: "VIP",
        },
        currentUserId: "42",
        tablaPage: 0,
        tablaRowsPerPage: 50,
        tablaSearch: "cliente",
      })
    ).toEqual({
      fecha: "2026-04-26",
      incluirCarterasSaldoCero: true,
      user: "42",
      forUser: false,
      mostrarYaGestionados: true,
      cuenta: "",
      sinGestionDias: 3,
      edad: "30;60",
      filtroEventos: "EV",
      filtroPorVencimiento: "",
      filtroPorEtiqueta: "VIP",
      page: 1,
      numPage: 50,
      filter: "cliente",
    });
  });

  it("uses filterOverride and never sends page lower than one", () => {
    expect(
      buildFacturasListParams({
        fechaConsultaFacturas: "2026-04-26",
        filtros: {
          checkIncluirSaldosCero: false,
          checkSoloAsignadas: false,
          checkSoloEventosPendientes: false,
          sinGestionDias: 0,
        },
        tablaPage: -5,
        tablaRowsPerPage: 20,
        tablaSearch: "search",
        filterOverride: "",
      })
    ).toMatchObject({
      page: 1,
      filter: "",
    });
  });

  it("parses query params and resolves the search value with the current priority", () => {
    const params = parseConsultaCarteraSearchParams(
      "?cuenta=CU-1&factura=FAC-9&identificacionCliente=CLI-7"
    );

    expect(params).toEqual({
      cuenta: "CU-1",
      factura: "FAC-9",
      identificacionCliente: "CLI-7",
    });
    expect(hasConsultaCarteraSearchSelection(params)).toBe(true);
    expect(resolveConsultaCarteraSearchValue(params)).toBe("CLI-7");
    expect(hasConsultaCarteraSearchSelection(parseConsultaCarteraSearchParams(""))).toBe(false);
  });

  it("finds the matching factura row using the same precedence as the page", () => {
    const rows = [
      { cliente: "C-1", numefac: "F-1", cuenta: "A-1" },
      { CLIENTE: "C-2", NUMEFAC: "F-2", CUENTA: "A-2" },
    ];

    expect(
      findFacturaRowBySearchParams(rows, {
        cuenta: "A-2",
        factura: "F-2",
        identificacionCliente: "C-2",
      })
    ).toEqual(rows[1]);

    expect(
      findFacturaRowBySearchParams(rows, {
        cuenta: "A-1",
        factura: "",
        identificacionCliente: "",
      })
    ).toEqual(rows[0]);

    expect(
      findFacturaRowBySearchParams(rows, {
        cuenta: "",
        factura: "",
        identificacionCliente: "C-2",
      })
    ).toEqual(rows[1]);
  });

  it("builds the fallback selection only when the client is known", () => {
    expect(
      buildFallbackFacturaSelectionFromSearchParams({
        cuenta: "CU-1",
        factura: "",
        identificacionCliente: "CLI-1",
      })
    ).toEqual({
      cliente: "CLI-1",
      numefac: "",
      cuenta: "CU-1",
    });

    expect(
      buildFallbackFacturaSelectionFromSearchParams({
        cuenta: "CU-1",
        factura: "FA-1",
        identificacionCliente: "",
      })
    ).toBeNull();
  });

  it("normalizes selected factura rows from supported field names", () => {
    expect(
      buildFacturaSelection(
        {
          CLIENTE: 123,
          NUMEFAC: 456,
          CUENTA: 789,
        },
        "fallback"
      )
    ).toEqual({
      cliente: "123",
      numefac: "456",
      cuenta: "789",
    });

    expect(buildFacturaSelection({}, "fallback")).toEqual({
      cliente: "fallback",
      numefac: "",
      cuenta: "",
    });
  });

  it("builds the suggested event amount as saldo en mora minus interes de mora", () => {
    expect(buildFacturaMontoSuggestion({ SACTMORA: 12345 })).toBe(12345);
    expect(buildFacturaMontoSuggestion({ SACTMORA: 12345, VALMORA: 345 })).toBe(12000);
    expect(buildFacturaMontoSuggestion({ sactmora: "98,765", valmora: "765" })).toBe(98000);
    expect(buildFacturaMontoSuggestion({ SACTMORA: "" })).toBeUndefined();
    expect(buildFacturaMontoSuggestion(null)).toBeUndefined();
  });

  it("builds eventos XML exactly as the save flow expects", () => {
    expect(
      buildEventosXml([
        {
          id: 1,
          tipo: "COMPROMISO",
          fecha: "2026-04-26",
          hora: "",
          valor: 50000,
        },
      ])
    ).toBe(
      [
        "<Evento>",
        "  <Id>1</Id>",
        "  <Tipo>COMPROMISO</Tipo>",
        "  <Fecha>2026-04-26</Fecha>",
        "  <Hora>null</Hora>",
        "  <Valor>50000</Valor>",
        "</Evento>",
      ].join("\n")
    );

    expect(buildEventosXml(null)).toBe("");
  });

  it("builds idempotency keys with the existing prefixes", () => {
    jest.spyOn(Date, "now").mockReturnValue(123456);
    jest.spyOn(Math, "random").mockReturnValue(0.123456789);

    expect(createStartIdempotencyKey()).toBe("start-2n9c-4fzzzxjy");
    expect(createSaveFallbackIdempotencyKey()).toBe("save-2n9c-4fzzzxjy");
    expect(createTransitionIdempotencyKey()).toBe("transition-2n9c-4fzzzxjy");
    expect(createTransitionIdempotencyKey("custom")).toBe("custom-2n9c-4fzzzxjy");
  });
});
