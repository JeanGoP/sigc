export type AnyRow = Record<string, unknown>;

function readNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function readString(value: unknown): string {
  return String(value ?? "").trim();
}

function readDateKey(value: unknown): string {
  const raw = readString(value);
  if (!raw) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  return "";
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHourBucket(value: unknown): number | null {
  const raw = readString(value);
  if (!raw) {
    return null;
  }
  const match = raw.match(/^(\d{1,2})/);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    return null;
  }
  return hour;
}

function readFlag(value: unknown, defaultValue: boolean): boolean {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  return readNumber(value) === 1;
}

function groupCounts(
  rows: AnyRow[],
  valueResolver: (row: AnyRow) => string,
): Array<{ label: string; count: number; pct: number }> {
  const counter = new Map<string, number>();
  let total = 0;

  for (const row of rows) {
    const label = valueResolver(row);
    if (!label) {
      continue;
    }

    total += 1;
    counter.set(label, (counter.get(label) ?? 0) + 1);
  }

  const safeTotal = total || 1;
  return Array.from(counter.entries())
    .map(([label, count]) => ({
      label,
      count,
      pct: (count / safeTotal) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

export type AsesorLiteKpis = {
  totalGestiones: number;
  clientesUnicos: number;
  gestionesConEvento: number;
  gestionesConCompromiso: number;
  eventosVencidos: number;
  eventosFuturos: number;
  montoCompromisos: number;
  totalPagado: number;
  saldoPendiente: number;
  pagosCumplidos: number;
  pagosParciales: number;
  gestionesCumplidas: number;
};

export type GestionPrioritaria = {
  cliente: string;
  cuenta: string;
  factura: string;
  diasVencidos: number;
  tramo: string;
  tipoContacto: string;
  tipoEvento: string;
  estadoPago: string;
  eventoVencido: boolean;
  eventoFuturo: boolean;
  montoCompromiso: number;
  totalPagado: number;
  saldoPendiente: number;
};

export type KpiStatus = "positive" | "neutral" | "negative";

export type KpiComparison = {
  avgDailyMTD: number;
  ratioVsAvgDailyMTD: number;
  status: KpiStatus;
};

export type AsesorLiteTodayMetrics = {
  dateKey: string;
  gestiones: number;
  clientesUnicos: number;
  pctGestionesConCompromiso: number;
  montoComprometido: number;
  pctEventosVencidos: number;
  tramoMix: Array<{ tramo: string; count: number; pct: number }>;
  gestionesPorHora: Array<{ hour: number; count: number }>;
  comparisons: {
    gestiones: KpiComparison;
    clientesUnicos: KpiComparison;
    montoComprometido: KpiComparison;
  };
};

export type AsesorLiteMonthMetrics = {
  monthKey: string;
  diasConDatos: number;
  gestiones: number;
  clientesUnicos: number;
  pctGestionesConEvento: number;
  pctGestionesConCompromiso: number;
  montoCompromisos: number;
  totalPagado: number;
  tasaPagoMonetaria: number;
  saldoPendiente: number;
  pctEventosVencidos: number;
};

export type AsesorLiteRecaudoMetrics = {
  totalMesActual: number;
  totalMesAnterior: number;
  metaMesAnterior: number;
  faltanteParaMeta: number;
  avanceHaciaMetaPct: number;
  variacionValor: number;
  variacionPct: number;
  recaudoVencido: number;
  recaudoVencidoPct: number;
  ticketPromedio: number;
  mixPorEdad: Array<{ tramo: string; value: number; pct: number }>;
  metaPorEdad: Array<{
    tramo: string;
    actual: number;
    meta: number;
    faltante: number;
    avancePct: number;
  }>;
  metaPorCuenta: Array<{
    codicta: string;
    desccta: string;
    meta: number;
    faltante: number;
    avancePct: number;
  }>;
  faltantePorCuentaEdad: Array<{
    codicta: string;
    desccta: string;
    tramos: Array<{ label: string; value: number }>;
    total: number;
  }>;
  topCuentas: Array<{
    codicta: string;
    desccta: string;
    totalMesActual: number;
    totalMesAnterior: number;
    diferencia: number;
    variacionPct: number;
  }>;
};

export type AsesorLiteDashboardKpis = {
  today: AsesorLiteTodayMetrics;
  month: AsesorLiteMonthMetrics;
  recaudos: AsesorLiteRecaudoMetrics;
  presionHoy: GestionPrioritaria[];
  distribucionesMTD: {
    tipoContacto: Array<{ label: string; count: number; pct: number }>;
    tipoEvento: Array<{ label: string; count: number; pct: number }>;
    tramo: Array<{ label: string; count: number; pct: number }>;
  };
};

export type AsesorLiteSummary = {
  kpis: AsesorLiteKpis;
  gestionesPorTipoContactoGrupo: Array<{ label: string; count: number; pct: number }>;
  gestionesPorTipoContacto: Array<{ label: string; count: number; pct: number }>;
  gestionesPorTipoEvento: Array<{ label: string; count: number; pct: number }>;
  gestionesPorTramo: Array<{ label: string; count: number; pct: number }>;
  pagosPorEstado: Array<{ label: string; count: number; pct: number }>;
  prioridadesGestion: GestionPrioritaria[];
};

function getStatusFromRatio(ratio: number): KpiStatus {
  if (!Number.isFinite(ratio)) {
    return "neutral";
  }
  if (ratio >= 1.1) {
    return "positive";
  }
  if (ratio < 0.9) {
    return "negative";
  }
  return "neutral";
}

function buildPrioridades(gestiones: AnyRow[], limit: number): GestionPrioritaria[] {
  const prioridades = new Map<string, { score: number; item: GestionPrioritaria }>();

  for (const row of gestiones) {
    const idGestion = readNumber(row.IdGestion ?? row.idGestion);
    if (idGestion <= 0) {
      continue;
    }

    const clienteId = readString(row.cliente ?? row.CLIENTE ?? row.IDCLIPRV);

    const eventoVencido = readNumber(row.EventoVencido ?? row.eventoVencido) === 1;
    const eventoFuturo = readNumber(row.EventoFuturo ?? row.eventoFuturo) === 1;
    const tieneEvento = readNumber(row.TieneEvento ?? row.tieneEvento) === 1;
    const tieneCompromiso = readNumber(row.TieneCompromisoMonto ?? row.tieneCompromisoMonto) === 1;

    const isPrincipalValor = readFlag(row.EsPrincipalValor ?? row.esPrincipalValor, true);
    const monto = isPrincipalValor ? readNumber(row.MontoCompromiso ?? row.montoCompromiso) : 0;
    const pagado = isPrincipalValor ? readNumber(row.TotalPagado ?? row.totalPagado) : 0;

    const cuenta = readString(row.cuenta ?? row.Cuenta ?? row.CUENTA ?? row.CODICTA);
    const factura = readString(row.numefac ?? row.NUMEFAC ?? row.factura);
    const diasVencidos = readNumber(row.DiasVencidosCalc ?? row.diasVencidosCalc);
    const tramo = readString(row.TramoCodigoCalc ?? row.tramoCodigoCalc);
    const tipoContacto = readString(row.TipoContactoNombre ?? row.tipoContactoNombre ?? row.TipoContactoCodigo);
    const tipoEvento = readString(row.NombreTipoEvento ?? row.nombreTipoEvento);
    const estadoPago = readString(row.EstadoPagoCompromiso ?? row.estadoPagoCompromiso);
    const saldoItem = Math.max(0, Math.max(0, monto) - Math.max(0, pagado));

    const hasKeyData = Boolean(clienteId && (cuenta || factura));
    if (hasKeyData) {
      const key = `${clienteId}|${cuenta}|${factura}`;
      const tramoUpper = tramo.toUpperCase();
      const tramoScore =
        tramoUpper === "+90" ? 120 : tramoUpper === "90" ? 90 : tramoUpper === "60" ? 60 : tramoUpper === "30" ? 30 : 0;
      const estadoUpper = estadoPago.toUpperCase();
      const estadoScore = estadoUpper.includes("VENCIDO") ? 70 : estadoUpper.includes("PARCIAL") ? 40 : estadoUpper.includes("COMPLETO") ? 0 : 10;
      const score =
        (eventoVencido ? 250 : 0) +
        (eventoFuturo ? 40 : 0) +
        (tieneEvento ? 30 : 0) +
        (tieneCompromiso ? 80 : 0) +
        estadoScore +
        tramoScore +
        Math.max(0, diasVencidos) * 2 +
        Math.min(200, Math.round(saldoItem / 50000));

      const existing = prioridades.get(key);
      if (!existing || score > existing.score) {
        prioridades.set(key, {
          score,
          item: {
            cliente: clienteId,
            cuenta,
            factura,
            diasVencidos,
            tramo: tramo || "-",
            tipoContacto: tipoContacto || "-",
            tipoEvento: tipoEvento || "-",
            estadoPago: estadoPago || "-",
            eventoVencido,
            eventoFuturo,
            montoCompromiso: Math.max(0, monto),
            totalPagado: Math.max(0, pagado),
            saldoPendiente: saldoItem,
          },
        });
      }
    }
  }

  const prioridadesGestion = Array.from(prioridades.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);

  return prioridadesGestion;
}

export function buildAsesorLiteSummary(gestiones: AnyRow[]): AsesorLiteSummary {
  const clientes = new Set<string>();
  let totalGestiones = 0;
  let gestionesConEvento = 0;
  let gestionesConCompromiso = 0;
  let eventosVencidos = 0;
  let eventosFuturos = 0;
  let montoCompromisos = 0;
  let totalPagado = 0;
  let pagosCumplidos = 0;
  let pagosParciales = 0;
  let gestionesCumplidas = 0;

  for (const row of gestiones) {
    const idGestion = readNumber(row.IdGestion ?? row.idGestion);
    if (idGestion <= 0) {
      continue;
    }

    totalGestiones += 1;

    const clienteId = readString(row.cliente ?? row.CLIENTE ?? row.IDCLIPRV);
    if (clienteId) {
      clientes.add(clienteId);
    }

    const eventoVencido = readNumber(row.EventoVencido ?? row.eventoVencido) === 1;
    const eventoFuturo = readNumber(row.EventoFuturo ?? row.eventoFuturo) === 1;
    const tieneEvento = readNumber(row.TieneEvento ?? row.tieneEvento) === 1;
    const tieneCompromiso = readNumber(row.TieneCompromisoMonto ?? row.tieneCompromisoMonto) === 1;

    if (tieneEvento) {
      gestionesConEvento += 1;
    }
    if (tieneCompromiso) {
      gestionesConCompromiso += 1;
    }
    if (eventoVencido) {
      eventosVencidos += 1;
    }
    if (eventoFuturo) {
      eventosFuturos += 1;
    }

    const isPrincipalValor = readFlag(row.EsPrincipalValor ?? row.esPrincipalValor, true);
    const monto = isPrincipalValor ? readNumber(row.MontoCompromiso ?? row.montoCompromiso) : 0;
    const pagado = isPrincipalValor ? readNumber(row.TotalPagado ?? row.totalPagado) : 0;
    montoCompromisos += Math.max(0, monto);
    totalPagado += Math.max(0, pagado);

    if (readNumber(row.PagoCumplido ?? row.pagoCumplido) === 1) {
      pagosCumplidos += 1;
    }
    if (readNumber(row.PagoParcial ?? row.pagoParcial) === 1) {
      pagosParciales += 1;
    }
    if (readNumber(row.GestionCumplida ?? row.gestionCumplida) === 1) {
      gestionesCumplidas += 1;
    }
  }

  const saldoPendiente = Math.max(0, montoCompromisos - totalPagado);

  const gestionesPorTipoContactoGrupo = groupCounts(gestiones, (row) =>
    readString(row.TipoContactoGrupo ?? row.tipoContactoGrupo),
  );
  const gestionesPorTipoContacto = groupCounts(gestiones, (row) =>
    readString(row.TipoContactoNombre ?? row.tipoContactoNombre ?? row.TipoContactoCodigo),
  );
  const gestionesPorTipoEvento = groupCounts(gestiones, (row) =>
    readString(row.NombreTipoEvento ?? row.nombreTipoEvento),
  );
  const gestionesPorTramo = groupCounts(gestiones, (row) =>
    readString(row.TramoCodigoCalc ?? row.tramoCodigoCalc),
  );
  const pagosPorEstado = groupCounts(gestiones, (row) =>
    readString(row.EstadoPagoCompromiso ?? row.estadoPagoCompromiso),
  );

  const prioridadesGestion = buildPrioridades(gestiones, 12);

  return {
    kpis: {
      totalGestiones,
      clientesUnicos: clientes.size,
      gestionesConEvento,
      gestionesConCompromiso,
      eventosVencidos,
      eventosFuturos,
      montoCompromisos,
      totalPagado,
      saldoPendiente,
      pagosCumplidos,
      pagosParciales,
      gestionesCumplidas,
    },
    gestionesPorTipoContactoGrupo,
    gestionesPorTipoContacto,
    gestionesPorTipoEvento,
    gestionesPorTramo,
    pagosPorEstado,
    prioridadesGestion,
  };
}

function buildTramoMix(rows: AnyRow[]): Array<{ tramo: string; count: number; pct: number }> {
  const counter = new Map<string, number>();
  let total = 0;

  for (const row of rows) {
    const tramo = readString(row.TramoCodigoCalc ?? row.tramoCodigoCalc) || "-";
    total += 1;
    counter.set(tramo, (counter.get(tramo) ?? 0) + 1);
  }

  const safeTotal = total || 1;
  return Array.from(counter.entries())
    .map(([tramo, count]) => ({
      tramo,
      count,
      pct: (count / safeTotal) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildGestionesPorHora(rows: AnyRow[]): Array<{ hour: number; count: number }> {
  const counter = new Map<number, number>();
  for (const row of rows) {
    const hour = getHourBucket(row.HoraGestion ?? row.horaGestion);
    if (hour === null) {
      continue;
    }
    counter.set(hour, (counter.get(hour) ?? 0) + 1);
  }

  return Array.from(counter.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, count]) => ({ hour, count }));
}

/**
 * Definición de los tramos de edad del recaudo.
 * Agregar aquí si la API incorpora nuevos tramos.
 * Formato: { label: etiqueta visible, keys: [campo_API_posible, ...] }
 */
const TRAMO_DEFS: Array<{ label: string; keys: string[] }> = [
  { label: "PV",       keys: ["RecaudoMesActual_PV",      "recaudoMesActual_PV"] },
  { label: "30",       keys: ["RecaudoMesActual_30",      "recaudoMesActual_30"] },
  { label: "60",       keys: ["RecaudoMesActual_60",      "recaudoMesActual_60"] },
  { label: "90",       keys: ["RecaudoMesActual_90",      "recaudoMesActual_90"] },
  { label: "+90",      keys: ["RecaudoMesActual_90_MAS",  "recaudoMesActual_90_MAS"] },
  { label: "Sin edad", keys: ["RecaudoMesActual_SinEdad", "recaudoMesActual_SinEdad"] },
];

/**
 * Calcula todos los KPIs del dashboard de asesor (HOY + MTD + Recaudos) a partir
 * de los datos crudos entregados por la API.
 *
 * - No depende de información externa.
 * - Aplica la regla `EsPrincipalValor=1` para KPI monetarios basados en `gestiones`.
 * - Define HOY usando `FechaGestion` (YYYY-MM-DD) para evitar problemas de zona horaria.
 */
export function computeAsesorLiteDashboardKpis(params: {
  gestiones: AnyRow[];
  recaudos: AnyRow[];
  now?: Date;
}): AsesorLiteDashboardKpis {
  const now = params.now ?? new Date();
  const todayKey = getLocalDateKey(now);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const uniqueClientesMTD = new Set<string>();
  const uniqueClientesHoy = new Set<string>();
  const uniqueDaysMTD = new Set<string>();

  let totalGestionesMTD = 0;
  let totalGestionesHoy = 0;

  let gestionesConEventoMTD = 0;
  let gestionesConCompromisoMTD = 0;
  let eventosVencidosMTD = 0;

  let gestionesConCompromisoHoy = 0;
  let eventosVencidosHoy = 0;

  let montoCompromisosMTD = 0;
  let totalPagadoMTD = 0;
  let montoComprometidoHoy = 0;

  const hoyRows: AnyRow[] = [];

  for (const row of params.gestiones) {
    const idGestion = readNumber(row.IdGestion ?? row.idGestion);
    if (idGestion <= 0) {
      continue;
    }

    const fechaGestion = readDateKey(row.FechaGestion ?? row.fechaGestion) || readDateKey(row.FechaHora ?? row.fechaHora);
    if (fechaGestion) {
      uniqueDaysMTD.add(fechaGestion);
    }

    totalGestionesMTD += 1;

    const clienteId = readString(row.cliente ?? row.CLIENTE ?? row.IDCLIPRV);
    if (clienteId) {
      uniqueClientesMTD.add(clienteId);
    }

    const tieneEvento = readNumber(row.TieneEvento ?? row.tieneEvento) === 1;
    const tieneCompromiso = readNumber(row.TieneCompromisoMonto ?? row.tieneCompromisoMonto) === 1;
    const eventoVencido = readNumber(row.EventoVencido ?? row.eventoVencido) === 1;

    if (tieneEvento) {
      gestionesConEventoMTD += 1;
    }
    if (tieneCompromiso) {
      gestionesConCompromisoMTD += 1;
    }
    if (eventoVencido) {
      eventosVencidosMTD += 1;
    }

    const isPrincipalValor = readFlag(row.EsPrincipalValor ?? row.esPrincipalValor, true);
    if (isPrincipalValor) {
      montoCompromisosMTD += Math.max(0, readNumber(row.MontoCompromiso ?? row.montoCompromiso));
      totalPagadoMTD += Math.max(0, readNumber(row.TotalPagado ?? row.totalPagado));
    }

    if (fechaGestion && fechaGestion === todayKey) {
      hoyRows.push(row);
      totalGestionesHoy += 1;
      if (clienteId) {
        uniqueClientesHoy.add(clienteId);
      }
      if (tieneCompromiso) {
        gestionesConCompromisoHoy += 1;
      }
      if (eventoVencido) {
        eventosVencidosHoy += 1;
      }
      if (isPrincipalValor) {
        montoComprometidoHoy += Math.max(0, readNumber(row.MontoCompromiso ?? row.montoCompromiso));
      }
    }
  }

  const diasConDatosMTD = uniqueDaysMTD.size || 1;

  const avgDailyGestionesMTD = totalGestionesMTD / diasConDatosMTD;
  const avgDailyClientesMTD = uniqueClientesMTD.size / diasConDatosMTD;
  const avgDailyMontoComprometidoMTD = montoCompromisosMTD / diasConDatosMTD;

  const compare = (valueHoy: number, avgDaily: number): KpiComparison => {
    const ratio = avgDaily > 0 ? valueHoy / avgDaily : 0;
    return {
      avgDailyMTD: avgDaily,
      ratioVsAvgDailyMTD: ratio,
      status: getStatusFromRatio(ratio),
    };
  };

  const tramoMixHoy = buildTramoMix(hoyRows);
  const gestionesPorHoraHoy = buildGestionesPorHora(hoyRows);

  const pctGestionesConCompromisoHoy =
    totalGestionesHoy > 0 ? (gestionesConCompromisoHoy / totalGestionesHoy) * 100 : 0;
  const pctEventosVencidosHoy = totalGestionesHoy > 0 ? (eventosVencidosHoy / totalGestionesHoy) * 100 : 0;

  const saldoPendienteMTD = Math.max(0, montoCompromisosMTD - totalPagadoMTD);
  const tasaPagoMonetariaMTD = montoCompromisosMTD > 0 ? totalPagadoMTD / montoCompromisosMTD : 0;

  const pctGestionesConEventoMTD = totalGestionesMTD > 0 ? (gestionesConEventoMTD / totalGestionesMTD) * 100 : 0;
  const pctGestionesConCompromisoMTD =
    totalGestionesMTD > 0 ? (gestionesConCompromisoMTD / totalGestionesMTD) * 100 : 0;
  const pctEventosVencidosMTD = totalGestionesMTD > 0 ? (eventosVencidosMTD / totalGestionesMTD) * 100 : 0;

  const tipoContactoMTD = groupCounts(params.gestiones, (row) =>
    readString(row.TipoContactoNombre ?? row.tipoContactoNombre ?? row.TipoContactoCodigo),
  );
  const tipoEventoMTD = groupCounts(params.gestiones, (row) =>
    readString(row.NombreTipoEvento ?? row.nombreTipoEvento),
  );
  const tramoMTD = groupCounts(params.gestiones, (row) => readString(row.TramoCodigoCalc ?? row.tramoCodigoCalc));

  const presionHoy = buildPrioridades(hoyRows, 20);

  let totalRecaudoMesActual = 0;
  let totalRecaudoMesAnterior = 0;
  let totalTransaccionesMesActual = 0;
  let recaudoVencido = 0;
  const tramosAcum: number[] = TRAMO_DEFS.map(() => 0);

  const topCuentas: Array<{
    codicta: string;
    desccta: string;
    totalMesActual: number;
    totalMesAnterior: number;
    diferencia: number;
    variacionPct: number;
  }> = [];
  const metaPorCuenta: Array<{
    codicta: string;
    desccta: string;
    meta: number;
    faltante: number;
    avancePct: number;
  }> = [];
  const faltantePorCuentaEdad: Array<{
    codicta: string;
    desccta: string;
    tramos: Array<{ label: string; value: number }>;
    total: number;
  }> = [];

  for (const row of params.recaudos) {
    const actual = Math.max(0, readNumber(row.TotalRecaudoMesActual ?? row.totalRecaudoMesActual));
    const anterior = Math.max(0, readNumber(row.TotalRecaudoMesAnterior ?? row.totalRecaudoMesAnterior));
    const diferencia = readNumber(row.Diferencia ?? row.diferencia) || actual - anterior;
    const variacionPct = readNumber(row.PorcentajeVariacion ?? row.porcentajeVariacion);
    const transacciones = Math.max(0, readNumber(row.TotalTransaccionesMesActual ?? row.totalTransaccionesMesActual));

    totalRecaudoMesActual += actual;
    totalRecaudoMesAnterior += anterior;
    totalTransaccionesMesActual += transacciones;
    recaudoVencido += Math.max(0, readNumber(row.RecaudoMesActual_Vencido ?? row.recaudoMesActual_Vencido));

    const rowTramos = TRAMO_DEFS.map((def, i) => {
      const val = Math.max(0, readNumber(def.keys.reduce<unknown>((acc, k) => acc ?? row[k], undefined)));
      tramosAcum[i] = (tramosAcum[i] ?? 0) + val;
      return { label: def.label, value: val };
    });

    const codicta = readString(row.CODICTA ?? row.codicta);
    const desccta = readString(row.DESCCTA ?? row.desccta);
    if (codicta || desccta) {
      topCuentas.push({
        codicta,
        desccta,
        totalMesActual: actual,
        totalMesAnterior: anterior,
        diferencia,
        variacionPct,
      });

      const meta = anterior;
      const faltante = Math.max(0, meta - actual);
      const avancePct = meta > 0 ? actual / meta : 0;
      metaPorCuenta.push({
        codicta,
        desccta,
        meta,
        faltante,
        avancePct,
      });

      if (faltante > 0) {
        const sumEdad = rowTramos.reduce((s, t) => s + t.value, 0);
        const base = sumEdad > 0 ? sumEdad : (actual > 0 ? actual : 1);
        const tramos = rowTramos
          .map((t) => ({
            label: t.label,
            value: actual > 0 ? faltante * (t.value / base) : faltante / rowTramos.length,
          }))
          .filter((t) => t.value > 0);
        faltantePorCuentaEdad.push({ codicta, desccta, tramos, total: faltante });
      } else {
        faltantePorCuentaEdad.push({ codicta, desccta, tramos: [], total: 0 });
      }
    }
  }

  topCuentas.sort((a, b) => b.totalMesActual - a.totalMesActual);

  const variacionValor = totalRecaudoMesActual - totalRecaudoMesAnterior;
  const variacionPct = totalRecaudoMesAnterior > 0 ? variacionValor / totalRecaudoMesAnterior : 0;
  const recaudoVencidoPct = totalRecaudoMesActual > 0 ? recaudoVencido / totalRecaudoMesActual : 0;
  const ticketPromedio =
    totalTransaccionesMesActual > 0 ? totalRecaudoMesActual / totalTransaccionesMesActual : 0;

  const mixTotal = totalRecaudoMesActual || 1;
  const mixPorEdad: Array<{ tramo: string; value: number; pct: number }> = TRAMO_DEFS
    .map((def, i) => {
      const value = tramosAcum[i] ?? 0;
      return { tramo: def.label, value, pct: (value / mixTotal) * 100 };
    })
    .filter((r) => r.value > 0);

  const metaMesAnterior = Math.max(0, totalRecaudoMesAnterior);
  const faltanteParaMeta = Math.max(0, metaMesAnterior - totalRecaudoMesActual);
  const avanceHaciaMetaPct = metaMesAnterior > 0 ? totalRecaudoMesActual / metaMesAnterior : 0;

  const metaPorEdad = (() => {
    const base = mixPorEdad.length > 0 ? mixPorEdad : [
      { tramo: "PV", value: 0, pct: 0 },
      { tramo: "30", value: 0, pct: 0 },
      { tramo: "60", value: 0, pct: 0 },
      { tramo: "90", value: 0, pct: 0 },
      { tramo: "+90", value: 0, pct: 0 },
      { tramo: "Sin edad", value: 0, pct: 0 },
    ];

    return base.map((row) => {
      const meta = metaMesAnterior * (row.pct / 100);
      const actual = Math.max(0, row.value);
      const faltante = Math.max(0, meta - actual);
      const avancePct = meta > 0 ? actual / meta : 0;
      return {
        tramo: row.tramo,
        actual,
        meta,
        faltante,
        avancePct,
      };
    });
  })();

  return {
    today: {
      dateKey: todayKey,
      gestiones: totalGestionesHoy,
      clientesUnicos: uniqueClientesHoy.size,
      pctGestionesConCompromiso: pctGestionesConCompromisoHoy,
      montoComprometido: montoComprometidoHoy,
      pctEventosVencidos: pctEventosVencidosHoy,
      tramoMix: tramoMixHoy,
      gestionesPorHora: gestionesPorHoraHoy,
      comparisons: {
        gestiones: compare(totalGestionesHoy, avgDailyGestionesMTD),
        clientesUnicos: compare(uniqueClientesHoy.size, avgDailyClientesMTD),
        montoComprometido: compare(montoComprometidoHoy, avgDailyMontoComprometidoMTD),
      },
    },
    month: {
      monthKey,
      diasConDatos: diasConDatosMTD,
      gestiones: totalGestionesMTD,
      clientesUnicos: uniqueClientesMTD.size,
      pctGestionesConEvento: pctGestionesConEventoMTD,
      pctGestionesConCompromiso: pctGestionesConCompromisoMTD,
      montoCompromisos: montoCompromisosMTD,
      totalPagado: totalPagadoMTD,
      tasaPagoMonetaria: tasaPagoMonetariaMTD,
      saldoPendiente: saldoPendienteMTD,
      pctEventosVencidos: pctEventosVencidosMTD,
    },
    recaudos: {
      totalMesActual: totalRecaudoMesActual,
      totalMesAnterior: totalRecaudoMesAnterior,
      metaMesAnterior,
      faltanteParaMeta,
      avanceHaciaMetaPct,
      variacionValor,
      variacionPct,
      recaudoVencido,
      recaudoVencidoPct,
      ticketPromedio,
      mixPorEdad,
      metaPorEdad,
      metaPorCuenta: metaPorCuenta.sort((a, b) => b.meta - a.meta),
      faltantePorCuentaEdad: faltantePorCuentaEdad.sort((a, b) => b.total - a.total),
      topCuentas: topCuentas.slice(0, 50),
    },
    presionHoy,
    distribucionesMTD: {
      tipoContacto: tipoContactoMTD,
      tipoEvento: tipoEventoMTD,
      tramo: tramoMTD,
    },
  };
}

export type RecaudoPaceStatus = "on_track" | "at_risk" | "behind" | "no_baseline";

export type WeeklyTarget = {
  weekNumber: number;
  dayStart: number;
  dayEnd: number;
  daysRemainingInWeek: number;
  targetAmount: number;
};

export type RecaudoPace = {
  totalDaysInMonth: number;
  dayOfMonth: number;
  daysRemainingIncludingToday: number;
  expectedProgressPct: number;
  expectedRecaudoByToday: number;
  expectedFaltanteByToday: number;
  actualFaltante: number;
  deltaFaltanteVsPlan: number;
  ritmoDiarioSugerido: number;
  status: RecaudoPaceStatus;
  weeklyTargets: WeeklyTarget[];
};

export function computeRecaudoPace(params: {
  metaMesAnterior: number;
  totalMesActual: number;
  now?: Date;
}): RecaudoPace {
  const now = params.now ?? new Date();
  const metaMesAnterior = Math.max(0, readNumber(params.metaMesAnterior));
  const totalMesActual = Math.max(0, readNumber(params.totalMesActual));

  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = Math.max(1, Math.min(totalDaysInMonth, now.getDate()));
  const daysRemainingIncludingToday = Math.max(1, totalDaysInMonth - dayOfMonth + 1);

  const actualFaltante = Math.max(0, metaMesAnterior - totalMesActual);
  const expectedProgressPct = totalDaysInMonth > 0 ? dayOfMonth / totalDaysInMonth : 0;
  const expectedRecaudoByToday = metaMesAnterior * expectedProgressPct;
  const expectedFaltanteByToday = Math.max(0, metaMesAnterior - expectedRecaudoByToday);
  const deltaFaltanteVsPlan = actualFaltante - expectedFaltanteByToday;
  const ritmoDiarioSugerido = actualFaltante / daysRemainingIncludingToday;

  const weeklyTargets: WeeklyTarget[] = (() => {
    const weeksTotal = Math.ceil(totalDaysInMonth / 7);
    const currentWeek = Math.floor((dayOfMonth - 1) / 7) + 1;
    const targets: WeeklyTarget[] = [];

    for (let weekNumber = currentWeek; weekNumber <= weeksTotal; weekNumber += 1) {
      const dayStart = (weekNumber - 1) * 7 + 1;
      const dayEnd = Math.min(totalDaysInMonth, weekNumber * 7);
      const remainingStart = Math.max(dayOfMonth, dayStart);
      const daysRemainingInWeek = Math.max(0, dayEnd - remainingStart + 1);
      const targetAmount =
        daysRemainingInWeek > 0 ? actualFaltante * (daysRemainingInWeek / daysRemainingIncludingToday) : 0;

      targets.push({
        weekNumber,
        dayStart,
        dayEnd,
        daysRemainingInWeek,
        targetAmount,
      });
    }

    return targets;
  })();

  const status: RecaudoPaceStatus = (() => {
    if (metaMesAnterior <= 0) {
      return "no_baseline";
    }
    if (actualFaltante <= 0) {
      return "on_track";
    }
    if (deltaFaltanteVsPlan <= 0) {
      return "on_track";
    }
    const ratio = deltaFaltanteVsPlan / metaMesAnterior;
    if (ratio <= 0.06) {
      return "at_risk";
    }
    return "behind";
  })();

  return {
    totalDaysInMonth,
    dayOfMonth,
    daysRemainingIncludingToday,
    expectedProgressPct,
    expectedRecaudoByToday,
    expectedFaltanteByToday,
    actualFaltante,
    deltaFaltanteVsPlan,
    ritmoDiarioSugerido,
    status,
    weeklyTargets,
  };
}

// ── Eficiencia de gestiones ───────────────────────────────────────────────────

export type EstadoClasificacion =
  | "cumplido"
  | "activo"
  | "incumplido"
  | "parcial_alto"
  | "parcial_medio"
  | "parcial_bajo"
  | "parcial_otro"
  | "otro";

export type ContactoEficiencia = {
  nombre: string;
  grupo: string;
  gestiones: number;
  conCompromiso: number;
  pctConCompromiso: number;
  montoComprometido: number;
  totalPagado: number;
  tasaCobro: number;
  pagoCumplido: number;
};

export type ContactoGrupoSummary = {
  grupo: string;
  gestiones: number;
  conCompromiso: number;
  pctConCompromiso: number;
};

export type EstadoCompromisoItem = {
  estado: string;
  clasificacion: EstadoClasificacion;
  compromisos: number;
  montoComprometido: number;
  totalPagado: number;
  pctPagado: number;
};

export type EficienciaGestiones = {
  porTipoContacto: ContactoEficiencia[];
  porGrupo: ContactoGrupoSummary[];
  estadosCompromiso: EstadoCompromisoItem[];
};

function classifyEstadoPago(estado: string): EstadoClasificacion {
  const u = estado.toUpperCase().replace(/\s+/g, "_");
  if (u === "PAGO_COMPLETO") return "cumplido";
  if (u === "SIN_PAGO") return "activo";
  if (u === "VENCIDO_SIN_PAGO") return "incumplido";
  if (u.includes("PARCIAL_ALTO")) return "parcial_alto";
  if (u.includes("PARCIAL_MEDIO")) return "parcial_medio";
  if (u.includes("PARCIAL_BAJO")) return "parcial_bajo";
  if (u.includes("PARCIAL")) return "parcial_otro";
  if (u.includes("VENCIDO")) return "incumplido";
  return "otro";
}

export function computeEficienciaGestiones(gestiones: AnyRow[]): EficienciaGestiones {
  type TipoAcc = {
    grupo: string;
    gestiones: number;
    conCompromiso: number;
    montoComprometido: number;
    totalPagado: number;
    pagoCumplido: number;
  };
  type GrupoAcc = { gestiones: number; conCompromiso: number };
  type EstadoAcc = { compromisos: number; montoComprometido: number; totalPagado: number };

  const byTipo = new Map<string, TipoAcc>();
  const byGrupo = new Map<string, GrupoAcc>();
  const byEstado = new Map<string, EstadoAcc>();

  for (const row of gestiones) {
    const idGestion = readNumber(row.IdGestion ?? row.idGestion);
    if (idGestion <= 0) continue;

    const isPrincipal = readFlag(row.EsPrincipalValor ?? row.esPrincipalValor, true);
    if (!isPrincipal) continue;

    const nombre =
      readString(row.TipoContactoNombre ?? row.tipoContactoNombre ?? row.TipoContactoCodigo) || "Sin tipo";
    const grupo = readString(row.TipoContactoGrupo ?? row.tipoContactoGrupo) || "Sin grupo";
    const tieneCompromiso = readNumber(row.TieneCompromisoMonto ?? row.tieneCompromisoMonto) === 1;
    const monto = tieneCompromiso ? Math.max(0, readNumber(row.MontoCompromiso ?? row.montoCompromiso)) : 0;
    const pagado = tieneCompromiso ? Math.max(0, readNumber(row.TotalPagado ?? row.totalPagado)) : 0;
    const pagoCumplido = readNumber(row.PagoCumplido ?? row.pagoCumplido) === 1;

    let t = byTipo.get(nombre);
    if (!t) {
      t = { grupo, gestiones: 0, conCompromiso: 0, montoComprometido: 0, totalPagado: 0, pagoCumplido: 0 };
      byTipo.set(nombre, t);
    }
    t.gestiones += 1;
    if (tieneCompromiso) {
      t.conCompromiso += 1;
      t.montoComprometido += monto;
      t.totalPagado += pagado;
    }
    if (pagoCumplido) t.pagoCumplido += 1;

    let g = byGrupo.get(grupo);
    if (!g) {
      g = { gestiones: 0, conCompromiso: 0 };
      byGrupo.set(grupo, g);
    }
    g.gestiones += 1;
    if (tieneCompromiso) g.conCompromiso += 1;

    if (tieneCompromiso) {
      const estadoRaw = readString(row.EstadoPagoCompromiso ?? row.estadoPagoCompromiso);
      const estado = estadoRaw || "SIN_DATO";
      let e = byEstado.get(estado);
      if (!e) {
        e = { compromisos: 0, montoComprometido: 0, totalPagado: 0 };
        byEstado.set(estado, e);
      }
      e.compromisos += 1;
      e.montoComprometido += monto;
      e.totalPagado += pagado;
    }
  }

  const porTipoContacto: ContactoEficiencia[] = Array.from(byTipo.entries())
    .map(([nombre, d]) => ({
      nombre,
      grupo: d.grupo,
      gestiones: d.gestiones,
      conCompromiso: d.conCompromiso,
      pctConCompromiso: d.gestiones > 0 ? d.conCompromiso / d.gestiones : 0,
      montoComprometido: d.montoComprometido,
      totalPagado: d.totalPagado,
      tasaCobro: d.montoComprometido > 0 ? d.totalPagado / d.montoComprometido : 0,
      pagoCumplido: d.pagoCumplido,
    }))
    .sort((a, b) => b.gestiones - a.gestiones);

  const porGrupo: ContactoGrupoSummary[] = Array.from(byGrupo.entries())
    .map(([grupo, d]) => ({
      grupo,
      gestiones: d.gestiones,
      conCompromiso: d.conCompromiso,
      pctConCompromiso: d.gestiones > 0 ? d.conCompromiso / d.gestiones : 0,
    }))
    .sort((a, b) => b.gestiones - a.gestiones);

  const clasificacionOrder: EstadoClasificacion[] = [
    "cumplido", "activo", "parcial_alto", "parcial_medio", "parcial_bajo", "parcial_otro", "incumplido", "otro",
  ];

  const estadosCompromiso: EstadoCompromisoItem[] = Array.from(byEstado.entries())
    .map(([estado, d]) => ({
      estado,
      clasificacion: classifyEstadoPago(estado),
      compromisos: d.compromisos,
      montoComprometido: d.montoComprometido,
      totalPagado: d.totalPagado,
      pctPagado: d.montoComprometido > 0 ? d.totalPagado / d.montoComprometido : 0,
    }))
    .sort((a, b) => clasificacionOrder.indexOf(a.clasificacion) - clasificacionOrder.indexOf(b.clasificacion));

  return { porTipoContacto, porGrupo, estadosCompromiso };
}
