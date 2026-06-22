import { computeAsesorLiteDashboardKpis, computeEficienciaGestiones, computeRecaudoPace } from "./kpis";

describe("computeAsesorLiteDashboardKpis", () => {
  it("computes hoy vs mtd metrics and recaudos totals", () => {
    const now = new Date(2026, 4, 2, 10, 0, 0);

    const gestiones = [
      {
        IdGestion: 1,
        cliente: "C1",
        FechaGestion: "2026-05-02",
        FechaHoraProgramada: "2026-05-02T09:10:00",
        HoraGestion: "09:10:00",
        TieneCompromisoMonto: 1,
        TieneEvento: 1,
        EventoVencido: 0,
        TramoCodigoCalc: "30",
        EsPrincipalValor: 1,
        MontoCompromiso: 1000,
        TotalPagado: 200,
      },
      {
        IdGestion: 2,
        cliente: "C2",
        FechaGestion: "2026-05-02",
        FechaHoraProgramada: "2026-05-02T10:05:00",
        HoraGestion: "10:05:00",
        TieneCompromisoMonto: 0,
        TieneEvento: 1,
        EventoVencido: 1,
        TramoCodigoCalc: "+90",
        EsPrincipalValor: 1,
        MontoCompromiso: 0,
        TotalPagado: 0,
      },
      {
        IdGestion: 3,
        cliente: "C1",
        FechaGestion: "2026-05-01",
        HoraGestion: "14:22:00",
        TieneCompromisoMonto: 1,
        TieneEvento: 1,
        EventoVencido: 0,
        TramoCodigoCalc: "PV",
        EsPrincipalValor: 1,
        MontoCompromiso: 500,
        TotalPagado: 500,
      },
      {
        IdGestion: 4,
        cliente: "C3",
        FechaGestion: "2026-05-01",
        HoraGestion: "15:22:00",
        TieneCompromisoMonto: 1,
        TieneEvento: 0,
        EventoVencido: 0,
        TramoCodigoCalc: "60",
        EsPrincipalValor: 0,
        MontoCompromiso: 999999,
        TotalPagado: 999999,
      },
      {
        IdGestion: 0,
        cliente: "IGNORED",
        FechaGestion: "2026-05-02",
      },
    ];

    const recaudos = [
      {
        CODICTA: "01",
        DESCCTA: "Cuenta 01",
        TotalRecaudoMesActual: 10000,
        TotalRecaudoMesAnterior: 8000,
        Diferencia: 2000,
        PorcentajeVariacion: 25,
        RecaudoMesActual_Vencido: 6000,
        RecaudoMesActual_PV: 3000,
        RecaudoMesActual_30: 2000,
        RecaudoMesActual_60: 0,
        RecaudoMesActual_90: 0,
        RecaudoMesActual_90_MAS: 0,
        RecaudoMesActual_SinEdad: 5000,
        TotalTransaccionesMesActual: 10,
      },
      {
        CODICTA: "02",
        DESCCTA: "Cuenta 02",
        TotalRecaudoMesActual: 5000,
        TotalRecaudoMesAnterior: 6000,
        PorcentajeVariacion: -16.7,
        RecaudoMesActual_Vencido: 2000,
        RecaudoMesActual_PV: 1000,
        RecaudoMesActual_30: 500,
        RecaudoMesActual_60: 0,
        RecaudoMesActual_90: 0,
        RecaudoMesActual_90_MAS: 0,
        RecaudoMesActual_SinEdad: 3500,
        TotalTransaccionesMesActual: 5,
      },
    ];

    const result = computeAsesorLiteDashboardKpis({ gestiones, recaudos, now });

    expect(result.today.dateKey).toBe("2026-05-02");
    expect(result.month.monthKey).toBe("2026-05");
    expect(result.month.diasConDatos).toBe(2);

    expect(result.today.gestiones).toBe(2);
    expect(result.today.clientesUnicos).toBe(2);
    expect(result.today.pctGestionesConCompromiso).toBe(50);
    expect(result.today.pctEventosVencidos).toBe(50);
    expect(result.today.montoComprometido).toBe(1000);

    expect(result.today.comparisons.gestiones.status).toBe("neutral");
    expect(result.today.comparisons.clientesUnicos.status).toBe("positive");
    expect(result.today.comparisons.montoComprometido.status).toBe("positive");

    expect(result.today.gestionesPorHora.map((x) => x.hour)).toEqual([9, 10]);

    expect(result.month.gestiones).toBe(4);
    expect(result.month.clientesUnicos).toBe(3);
    expect(result.month.montoCompromisos).toBe(1500);
    expect(result.month.totalPagado).toBe(700);
    expect(result.month.saldoPendiente).toBe(800);
    expect(result.month.tasaPagoMonetaria).toBeCloseTo(700 / 1500, 6);

    expect(result.recaudos.totalMesActual).toBe(15000);
    expect(result.recaudos.totalMesAnterior).toBe(14000);
    expect(result.recaudos.metaMesAnterior).toBe(14000);
    expect(result.recaudos.faltanteParaMeta).toBe(0);
    expect(result.recaudos.avanceHaciaMetaPct).toBeCloseTo(15000 / 14000, 6);
    expect(result.recaudos.variacionValor).toBe(1000);
    expect(result.recaudos.variacionPct).toBeCloseTo(1000 / 14000, 6);
    expect(result.recaudos.recaudoVencido).toBe(8000);
    expect(result.recaudos.recaudoVencidoPct).toBeCloseTo(8000 / 15000, 6);
    expect(result.recaudos.ticketPromedio).toBeCloseTo(15000 / 15, 6);

    expect(result.recaudos.metaPorCuenta.length).toBeGreaterThan(0);
    expect(result.recaudos.metaPorCuenta[0].codicta).toBe("01");
    expect(result.recaudos.faltantePorCuentaEdad.length).toBeGreaterThan(0);
    expect(result.recaudos.faltantePorCuentaEdad.some((r) => r.codicta === "01")).toBe(true);
    expect(result.recaudos.topCuentas[0].codicta).toBe("01");
  });
});

describe("computeEficienciaGestiones", () => {
  const gestiones = [
    // Llamada con compromiso pagado completo — EsPrincipalValor=1
    {
      IdGestion: 1, TipoContactoNombre: "Llamada", TipoContactoGrupo: "Contacto directo",
      TieneCompromisoMonto: 1, MontoCompromiso: 500000, TotalPagado: 500000,
      PagoCumplido: 1, EstadoPagoCompromiso: "PAGO_COMPLETO", EsPrincipalValor: 1,
    },
    // Llamada sin compromiso
    {
      IdGestion: 2, TipoContactoNombre: "Llamada", TipoContactoGrupo: "Contacto directo",
      TieneCompromisoMonto: 0, MontoCompromiso: 0, TotalPagado: 0,
      PagoCumplido: 0, EstadoPagoCompromiso: null, EsPrincipalValor: 1,
    },
    // WhatsApp con compromiso vencido sin pago
    {
      IdGestion: 3, TipoContactoNombre: "WhastsApp", TipoContactoGrupo: "Contacto directo",
      TieneCompromisoMonto: 1, MontoCompromiso: 300000, TotalPagado: 0,
      PagoCumplido: 0, EstadoPagoCompromiso: "VENCIDO_SIN_PAGO", EsPrincipalValor: 1,
    },
    // Mensaje con referencia con parcial alto
    {
      IdGestion: 4, TipoContactoNombre: "Mensaje con referencia", TipoContactoGrupo: "Contacto indirecto",
      TieneCompromisoMonto: 1, MontoCompromiso: 400000, TotalPagado: 350000,
      PagoCumplido: 0, EstadoPagoCompromiso: "VENCIDO_PARCIAL_ALTO", EsPrincipalValor: 1,
    },
    // Fila duplicada (rn=2, EsPrincipalValor=0) — debe ignorarse
    {
      IdGestion: 1, TipoContactoNombre: "Llamada", TipoContactoGrupo: "Contacto directo",
      TieneCompromisoMonto: 1, MontoCompromiso: 999999, TotalPagado: 999999,
      PagoCumplido: 1, EstadoPagoCompromiso: "PAGO_COMPLETO", EsPrincipalValor: 0,
    },
    // IdGestion inválido — debe ignorarse
    { IdGestion: 0, TipoContactoNombre: "Llamada", EsPrincipalValor: 1 },
  ];

  it("agrupa gestiones por tipo de contacto ignorando filas no principales", () => {
    const result = computeEficienciaGestiones(gestiones);

    const llamada = result.porTipoContacto.find((r) => r.nombre === "Llamada");
    expect(llamada).toBeDefined();
    expect(llamada!.gestiones).toBe(2);
    expect(llamada!.conCompromiso).toBe(1);
    expect(llamada!.montoComprometido).toBe(500000);
    expect(llamada!.pagoCumplido).toBe(1);
    expect(llamada!.tasaCobro).toBe(1);

    const wapp = result.porTipoContacto.find((r) => r.nombre === "WhastsApp");
    expect(wapp).toBeDefined();
    expect(wapp!.tasaCobro).toBe(0);
  });

  it("agrupa por grupo de contacto correctamente", () => {
    const result = computeEficienciaGestiones(gestiones);
    const directo = result.porGrupo.find((g) => g.grupo === "Contacto directo");
    expect(directo).toBeDefined();
    expect(directo!.gestiones).toBe(3);
    expect(directo!.conCompromiso).toBe(2);
  });

  it("clasifica estados de compromiso dinámicamente", () => {
    const result = computeEficienciaGestiones(gestiones);
    const cumplido = result.estadosCompromiso.find((e) => e.clasificacion === "cumplido");
    expect(cumplido).toBeDefined();
    expect(cumplido!.compromisos).toBe(1);
    expect(cumplido!.pctPagado).toBe(1);

    const incumplido = result.estadosCompromiso.find((e) => e.clasificacion === "incumplido");
    expect(incumplido).toBeDefined();
    expect(incumplido!.pctPagado).toBe(0);

    const parcialAlto = result.estadosCompromiso.find((e) => e.clasificacion === "parcial_alto");
    expect(parcialAlto).toBeDefined();
    expect(parcialAlto!.pctPagado).toBeCloseTo(350000 / 400000, 6);
  });

  it("ordena estados: cumplido antes que incumplido", () => {
    const result = computeEficienciaGestiones(gestiones);
    const idxCumplido = result.estadosCompromiso.findIndex((e) => e.clasificacion === "cumplido");
    const idxIncumplido = result.estadosCompromiso.findIndex((e) => e.clasificacion === "incumplido");
    expect(idxCumplido).toBeLessThan(idxIncumplido);
  });
});

describe("computeRecaudoPace", () => {
  it("returns no_baseline when last month total is 0", () => {
    const now = new Date(2026, 4, 10, 10, 0, 0);
    const pace = computeRecaudoPace({ metaMesAnterior: 0, totalMesActual: 1000, now });
    expect(pace.status).toBe("no_baseline");
    expect(pace.daysRemainingIncludingToday).toBeGreaterThan(0);
  });

  it("marks on_track when the faltante is <= 0", () => {
    const now = new Date(2026, 4, 10, 10, 0, 0);
    const pace = computeRecaudoPace({ metaMesAnterior: 10000, totalMesActual: 12000, now });
    expect(pace.status).toBe("on_track");
    expect(pace.actualFaltante).toBe(0);
  });

  it("marks behind when recaudo is significantly below expected progress", () => {
    const now = new Date(2026, 4, 20, 10, 0, 0);
    const pace = computeRecaudoPace({ metaMesAnterior: 10000, totalMesActual: 2000, now });
    expect(pace.status).toBe("behind");
    expect(pace.weeklyTargets.length).toBeGreaterThan(0);
  });
});
