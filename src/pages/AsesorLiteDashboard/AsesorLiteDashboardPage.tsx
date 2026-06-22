import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { AGE_BUCKET_BY_KEY } from "@app/constants/ageBuckets";
import { fmtCOP } from "../../utils/formattersFunctions";
import { buildConsultaCarteraUrl } from "../../utils/consultaCarteraNavigation";
import { computeAsesorLiteDashboardKpis, type AnyRow } from "./domain/kpis";
import { useAsesorLiteDashboard } from "./hooks/useAsesorLiteDashboard";
import "./asesorLiteDashboard.css";

type AgeKey = "PV" | "30" | "60" | "90" | "+90";

type AgeRow = {
  key: AgeKey;
  label: string;
  saldo: number;
  pct: number;
  meta: number;
  recaudado: number;
  falta: number;
  avancePct: number;
  tone: "ok" | "warn" | "bad";
  pill?: { label: string; tone: "ok" | "bad" };
};

type ChannelRow = {
  name: string;
  color: string;
  today: number;
  month: number;
};

type WorkingMonthInfo = {
  total: number;
  elapsedClosed: number;
  remainingIncludingToday: number;
  progressPct: number;
};

type TaskCard = {
  cliente: string;
  cuenta: string;
  factura: string;
  meta: string;
  monto: number;
  tagLabel: string;
  tagTone: "v" | "a" | "b";
  action: string;
  description: string;
  fechaProgramada: string;
  horaProgramada: string;
};

type AccountOption = {
  key: string;
  name: string;
  label: string;
};

const PERCENT_FORMATTER = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
});

const AGE_CONFIG: Array<{
  key: AgeKey;
  label: string;
  fillColor: string;
  tone: "ok" | "warn" | "bad";
  pill?: { label: string; tone: "ok" | "bad" };
}> = [
  { key: "PV", label: "Por vencer", fillColor: AGE_BUCKET_BY_KEY.PV.fillColor, tone: "ok", pill: { label: "al día", tone: "ok" } },
  { key: "30", label: "1 a 30 días", fillColor: AGE_BUCKET_BY_KEY["30"].fillColor, tone: "ok" },
  { key: "60", label: "31 a 60 días", fillColor: AGE_BUCKET_BY_KEY["60"].fillColor, tone: "warn" },
  { key: "90", label: "61 a 90 días", fillColor: AGE_BUCKET_BY_KEY["90"].fillColor, tone: "warn" },
  { key: "+90", label: "Más de 90 días", fillColor: AGE_BUCKET_BY_KEY["+90"].fillColor, tone: "bad", pill: { label: "crítica", tone: "bad" } },
];

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(/[,%\s]/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true";
  }
  return false;
}

function readDateKey(value: unknown): string {
  const str = readString(value);
  return str ? str.slice(0, 10) : "";
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function readPositiveUserId(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function formatPercent(value: number): string {
  return `${PERCENT_FORMATTER.format(Math.max(0, value) * 100)}%`;
}

function formatPercentPoints(value: number): string {
  return `${value >= 0 ? "+" : "-"}${PERCENT_FORMATTER.format(Math.abs(value) * 100)} pts`;
}

function formatSignedMoney(value: number): string {
  return value < 0 ? fmtCOP(value, true) : fmtCOP(value);
}

function getFaltaTextClass(value: number): string {
  return value < 0 ? "asesor-mockup-text--green" : "asesor-mockup-text--red";
}

function formatDateTimeShort(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function moveToNextMonday(date: Date): Date {
  const weekDay = date.getDay();
  if (weekDay === 1) return date;
  const daysUntilMonday = weekDay === 0 ? 1 : 8 - weekDay;
  return addDays(date, daysUntilMonday);
}

function computeEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getColombiaHolidayKeys(year: number): Set<string> {
  const keys = new Set<string>();
  const addHoliday = (date: Date) => keys.add(getDateKey(date));
  const addObservedHoliday = (month: number, day: number) => addHoliday(moveToNextMonday(new Date(year, month - 1, day)));

  addHoliday(new Date(year, 0, 1));
  addHoliday(new Date(year, 4, 1));
  addHoliday(new Date(year, 6, 20));
  addHoliday(new Date(year, 7, 7));
  addHoliday(new Date(year, 11, 8));
  addHoliday(new Date(year, 11, 25));

  addObservedHoliday(1, 6);
  addObservedHoliday(3, 19);
  addObservedHoliday(6, 29);
  addObservedHoliday(8, 15);
  addObservedHoliday(10, 12);
  addObservedHoliday(11, 1);
  addObservedHoliday(11, 11);

  const easterSunday = computeEasterSunday(year);
  addHoliday(addDays(easterSunday, -3));
  addHoliday(addDays(easterSunday, -2));
  addHoliday(addDays(easterSunday, 43));
  addHoliday(addDays(easterSunday, 64));
  addHoliday(addDays(easterSunday, 71));

  return keys;
}

function getWorkingMonthInfo(now: Date): WorkingMonthInfo {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const holidayKeys = getColombiaHolidayKeys(year);
  let total = 0;
  let elapsedClosed = 0;
  let remainingIncludingToday = 0;

  for (let day = 1; day <= lastDay; day += 1) {
    const currentDate = new Date(year, month, day);
    const weekDay = currentDate.getDay();
    if (weekDay === 0) continue;
    if (holidayKeys.has(getDateKey(currentDate))) continue;
    total += 1;
    if (day < today) elapsedClosed += 1;
    else remainingIncludingToday += 1;
  }

  const progressPct = total > 0 ? elapsedClosed / total : 0;
  return { total, elapsedClosed, remainingIncludingToday, progressPct };
}

function normalizeChannelName(raw: string): string {
  const value = raw.trim();
  const lower = value.toLowerCase();
  if (lower.includes("whast") || lower.includes("whats")) return "WhatsApp";
  if (lower.includes("llamada")) return "Llamadas";
  if (lower.includes("visita")) return "Visitas";
  if (lower.includes("mensaje") || lower.includes("correo") || lower.includes("sms")) return "Correo / SMS";
  if (lower.includes("no contacto")) return "No contacto";
  return value || "Sin canal";
}

function getChannelColor(name: string): string {
  if (name === "Llamadas") return "var(--azul)";
  if (name === "WhatsApp") return "var(--verde)";
  if (name === "Visitas") return "var(--ambar)";
  if (name === "Correo / SMS") return "var(--gris2)";
  return "var(--azul-claro)";
}

function buildAgeRows(cartera: AnyRow[], recaudos: AnyRow[]): AgeRow[] {
  const saldoByAge = new Map<AgeKey, number>();
  const saldoAnteriorByAge = new Map<AgeKey, number>();
  const recaudoByAge = new Map<AgeKey, number>();

  for (const age of AGE_CONFIG) {
    saldoByAge.set(age.key, 0);
    saldoAnteriorByAge.set(age.key, 0);
    recaudoByAge.set(age.key, 0);
  }

  for (const row of cartera) {
    saldoByAge.set("PV", (saldoByAge.get("PV") ?? 0) + readNumber(row.PV ?? row.pv));
    saldoByAge.set("30", (saldoByAge.get("30") ?? 0) + readNumber(row["30"]));
    saldoByAge.set("60", (saldoByAge.get("60") ?? 0) + readNumber(row["60"]));
    saldoByAge.set("90", (saldoByAge.get("90") ?? 0) + readNumber(row["90"]));
    saldoByAge.set("+90", (saldoByAge.get("+90") ?? 0) + readNumber(row["+90"] ?? row["90_MAS"]));

    saldoAnteriorByAge.set("PV", (saldoAnteriorByAge.get("PV") ?? 0) + readNumber(row.PV_Ant ?? row.pv_Ant));
    saldoAnteriorByAge.set("30", (saldoAnteriorByAge.get("30") ?? 0) + readNumber(row["30_Ant"]));
    saldoAnteriorByAge.set("60", (saldoAnteriorByAge.get("60") ?? 0) + readNumber(row["60_Ant"]));
    saldoAnteriorByAge.set("90", (saldoAnteriorByAge.get("90") ?? 0) + readNumber(row["90_Ant"]));
    saldoAnteriorByAge.set("+90", (saldoAnteriorByAge.get("+90") ?? 0) + readNumber(row["+90_Ant"] ?? row["90_MAS_Ant"]));
  }

  for (const row of recaudos) {
    recaudoByAge.set("PV", (recaudoByAge.get("PV") ?? 0) + readNumber(row.RecaudoMesActual_PV ?? row.recaudoMesActual_PV));
    recaudoByAge.set("30", (recaudoByAge.get("30") ?? 0) + readNumber(row.RecaudoMesActual_30 ?? row.recaudoMesActual_30));
    recaudoByAge.set("60", (recaudoByAge.get("60") ?? 0) + readNumber(row.RecaudoMesActual_60 ?? row.recaudoMesActual_60));
    recaudoByAge.set("90", (recaudoByAge.get("90") ?? 0) + readNumber(row.RecaudoMesActual_90 ?? row.recaudoMesActual_90));
    recaudoByAge.set("+90", (recaudoByAge.get("+90") ?? 0) + readNumber(row.RecaudoMesActual_90_MAS ?? row.recaudoMesActual_90_MAS));
  }

  const totalSaldo = Array.from(saldoByAge.values()).reduce((acc, value) => acc + value, 0);
  const safeTotalSaldo = totalSaldo > 0 ? totalSaldo : 1;

  return AGE_CONFIG.map((config) => {
    const saldo = saldoByAge.get(config.key) ?? 0;
    const saldoAnterior = saldoAnteriorByAge.get(config.key) ?? 0;
    const pct = saldo / safeTotalSaldo;
    const recaudado = recaudoByAge.get(config.key) ?? 0;
    const meta = saldoAnterior;
    const falta = saldo - saldoAnterior;
    const avancePct = saldo > 0 ? clampPct(meta / saldo) : meta <= 0 ? 1 : 0;
    return {
      key: config.key,
      label: config.label,
      saldo,
      pct,
      meta,
      recaudado,
      falta,
      avancePct,
      tone: config.tone,
      pill: config.pill,
    };
  });
}

function readAccountKey(value: unknown): string {
  return readString(value);
}

function readRowAccountKey(row: AnyRow): string {
  return readAccountKey(row.CODICTA ?? row.codicta ?? row.Cuentas ?? row.cuentas ?? row.Cuenta ?? row.cuenta);
}

function readMonthlyCollected(row: AnyRow): number {
  const direct = Math.max(0, readNumber(row.TotalRecaudoMesActual ?? row.totalRecaudoMesActual));
  if (direct > 0) return direct;
  return Math.max(
    0,
    readNumber(row.RecaudoMesActual_PV ?? row.recaudoMesActual_PV) +
      readNumber(row.RecaudoMesActual_30 ?? row.recaudoMesActual_30) +
      readNumber(row.RecaudoMesActual_60 ?? row.recaudoMesActual_60) +
      readNumber(row.RecaudoMesActual_90 ?? row.recaudoMesActual_90) +
      readNumber(row.RecaudoMesActual_90_MAS ?? row.recaudoMesActual_90_MAS),
  );
}

function readOverdueCollected(row: AnyRow): number {
  const direct = Math.max(0, readNumber(row.RecaudoMesActual_Vencido ?? row.recaudoMesActual_Vencido));
  if (direct > 0) return direct;
  return Math.max(
    0,
    readNumber(row.RecaudoMesActual_30 ?? row.recaudoMesActual_30) +
      readNumber(row.RecaudoMesActual_60 ?? row.recaudoMesActual_60) +
      readNumber(row.RecaudoMesActual_90 ?? row.recaudoMesActual_90) +
      readNumber(row.RecaudoMesActual_90_MAS ?? row.recaudoMesActual_90_MAS),
  );
}

function readMonthlyTransactions(row: AnyRow): number {
  return Math.max(0, readNumber(row.TotalTransaccionesMesActual ?? row.totalTransaccionesMesActual));
}

function buildAccountOptions(cartera: AnyRow[], recaudos: AnyRow[]): AccountOption[] {
  const options = new Map<string, AccountOption>();

  const register = (row: AnyRow) => {
    const key = readRowAccountKey(row);
    if (!key) return;

    const name = readString(row.DESCCTA ?? row.desccta);
    const current = options.get(key);
    if (current && current.name) return;

    options.set(key, {
      key,
      name,
      label: name ? `${name} (${key})` : key,
    });
  };

  for (const row of recaudos) register(row);
  for (const row of cartera) register(row);

  return Array.from(options.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "es", { sensitivity: "base" }),
  );
}

function filterRowsByAccount(rows: AnyRow[], accountKey: string): AnyRow[] {
  if (!accountKey) return rows;
  return rows.filter((row) => readRowAccountKey(row) === accountKey);
}

function buildChannelRows(gestiones: AnyRow[], now: Date): {
  todayTotal: number;
  monthTotal: number;
  effectiveToday: number;
  effectiveMonth: number;
  rows: ChannelRow[];
} {
  const todayKey = readDateKey(now.toISOString());
  const monthKey = todayKey.slice(0, 7);
  const monthCounter = new Map<string, number>();
  const todayCounter = new Map<string, number>();
  let monthTotal = 0;
  let todayTotal = 0;
  let effectiveMonth = 0;
  let effectiveToday = 0;

  for (const row of gestiones) {
    const idGestion = readNumber(row.IdGestion ?? row.idGestion);
    if (idGestion <= 0) continue;

    const fecha = readDateKey(row.FechaGestion ?? row.fechaGestion ?? row.FechaHora ?? row.fechaHora);
    if (!fecha.startsWith(monthKey)) continue;

    const channel = normalizeChannelName(readString(row.TipoContactoNombre ?? row.tipoContactoNombre ?? row.TipoContactoCodigo));
    const group = readString(row.TipoContactoGrupo ?? row.tipoContactoGrupo).toLowerCase();
    monthTotal += 1;
    monthCounter.set(channel, (monthCounter.get(channel) ?? 0) + 1);
    if (group && group !== "no contacto") effectiveMonth += 1;

    if (fecha === todayKey) {
      todayTotal += 1;
      todayCounter.set(channel, (todayCounter.get(channel) ?? 0) + 1);
      if (group && group !== "no contacto") effectiveToday += 1;
    }
  }

  const rows = Array.from(monthCounter.entries())
    .map(([name, month]) => ({
      name,
      color: getChannelColor(name),
      today: todayCounter.get(name) ?? 0,
      month,
    }))
    .sort((a, b) => b.month - a.month);

  return { todayTotal, monthTotal, effectiveToday, effectiveMonth, rows };
}

function buildCompromisosSummary(gestiones: AnyRow[], now: Date) {
  const monthKey = readDateKey(now.toISOString()).slice(0, 7);
  let totalCompromisos = 0;
  let montoComprometido = 0;
  let cumplidos = 0;
  let montoCumplido = 0;
  let activos = 0;
  let montoActivo = 0;

  for (const row of gestiones) {
    const idGestion = readNumber(row.IdGestion ?? row.idGestion);
    const fecha = readDateKey(row.FechaGestion ?? row.fechaGestion ?? row.FechaHora ?? row.fechaHora);
    if (idGestion <= 0 || !fecha.startsWith(monthKey)) continue;
    if (!readFlag(row.EsPrincipalValor ?? row.esPrincipalValor)) continue;
    if (!readFlag(row.TieneCompromisoMonto ?? row.tieneCompromisoMonto)) continue;

    const monto = Math.max(0, readNumber(row.MontoCompromiso ?? row.montoCompromiso));
    const pagado = Math.max(0, readNumber(row.TotalPagado ?? row.totalPagado));
    const estado = readString(row.EstadoPagoCompromiso ?? row.estadoPagoCompromiso).toUpperCase();
    const eventoFuturo = readFlag(row.EventoFuturo ?? row.eventoFuturo);
    const pendiente = Math.max(0, monto - pagado);
    const cumplido = readFlag(row.PagoCumplido ?? row.pagoCumplido) || estado === "PAGO_COMPLETO";

    totalCompromisos += 1;
    montoComprometido += monto;
    if (cumplido) {
      cumplidos += 1;
      montoCumplido += pagado > 0 ? pagado : monto;
    } else if (eventoFuturo || estado === "SIN_PAGO" || estado === "ACTIVO") {
      activos += 1;
      montoActivo += pendiente > 0 ? pendiente : monto;
    }
  }

  return { totalCompromisos, montoComprometido, cumplidos, montoCumplido, activos, montoActivo };
}

function buildTaskDescription(row: AnyRow): { action: string; description: string } {
  const tipoContacto = readString(row.tipoContacto ?? row.TipoContacto ?? row.TipoContactoNombre) || "Seguimiento";
  const tipoEvento = readString(row.tipoEvento ?? row.TipoEvento ?? row.NombreTipoEvento).toLowerCase();
  const tramo = readString(row.tramo ?? row.TramoCodigoCalc).toUpperCase();
  const eventoVencido = readFlag(row.eventoVencido ?? row.EventoVencido);

  if (eventoVencido) {
    return {
      action: tipoContacto,
      description: "Reprograma el evento vencido, confirma nuevo compromiso y deja la nota de gestión.",
    };
  }
  if (tipoEvento.includes("compromiso")) {
    return {
      action: tipoContacto,
      description: "Confirma la fecha y el monto acordado para asegurar el cumplimiento del compromiso.",
    };
  }
  if (tramo === "PV") {
    return {
      action: tipoContacto,
      description: "Envía recordatorio preventivo y registra la reacción del cliente antes del vencimiento.",
    };
  }
  if (tramo === "+90") {
    return {
      action: tipoContacto,
      description: "Prioriza una gestión intensiva y define el siguiente paso documentado para esta cuenta crítica.",
    };
  }
  return {
    action: tipoContacto,
    description: "Realiza seguimiento, actualiza el resultado y deja trazabilidad clara de la siguiente acción.",
  };
}

function buildTaskCards(rows: AnyRow[]): TaskCard[] {
  return rows
    .map((row) => {
      const diasVencidos = Math.max(0, readNumber(row.diasVencidos ?? row.DiasVencidosCalc));
      const tramo = readString(row.tramo ?? row.TramoCodigoCalc) || "—";
      const cliente = readString(row.cliente) || "Cliente sin identificar";
      const cuenta = readString(row.cuenta) || "—";
      const factura = readString(row.factura) || "—";
      const monto = Math.max(
        0,
        readNumber(row.saldoPendiente ?? row.SaldoPendiente) || readNumber(row.montoCompromiso ?? row.MontoCompromiso),
      );
      const { action, description } = buildTaskDescription(row);
      const fechaHoraRaw = readString(row.FechaHoraProgramada ?? row.fechaHoraProgramada ?? row.fechaProgramada);
      const fechaRaw = readDateKey(fechaHoraRaw);
      const horaRaw = fechaHoraRaw.length >= 16 ? fechaHoraRaw.slice(11, 16) : "—";

      return {
        cliente,
        cuenta,
        factura,
        meta: `Cuenta ${cuenta} · factura ${factura} · tramo ${tramo}`,
        monto,
        tagLabel: tramo === "PV" ? "Por vencer" : `${diasVencidos} días mora`,
        tagTone: tramo === "PV" ? "v" : diasVencidos >= 90 || tramo === "+90" ? "b" : "a",
        action,
        description,
        fechaProgramada: fechaRaw || "—",
        horaProgramada: horaRaw,
      };
    })
    .sort((a, b) => {
      const dateA = a.fechaProgramada === "—" ? "9999-99-99" : a.fechaProgramada;
      const dateB = b.fechaProgramada === "—" ? "9999-99-99" : b.fechaProgramada;
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return a.horaProgramada.localeCompare(b.horaProgramada);
    });
}

function resolvePuntoVentaLabel(recaudos: AnyRow[]): string {
  const labels = Array.from(
    new Set(
      recaudos
        .map((row) => readString(row.DESCCTA ?? row.desccta))
        .filter(Boolean),
    ),
  );
  if (labels.length === 1) return labels[0];
  if (labels.length > 1) return "Multicuenta";
  return "Sin dato";
}

export function AsesorLiteDashboardPage() {
  const { currentUser, currentUserId, data, consultar, lastUpdatedAtMs, loading, error } = useAsesorLiteDashboard();
  const [selectedAccountKey, setSelectedAccountKey] = useState("");
  const [adminQueryUserId, setAdminQueryUserId] = useState("");

  const now = useMemo(() => new Date(), []);
  const nombre = String(currentUser?.fullName ?? currentUser?.username ?? "").trim() || "Asesor";
  const isAdmin = useMemo(
    () => String(currentUser?.role ?? "").trim().toLowerCase() === "administrador",
    [currentUser?.role],
  );
  const periodo = useMemo(() => {
    const value = MONTH_FORMATTER.format(now);
    return value.charAt(0).toUpperCase() + value.slice(1);
  }, [now]);
  const workingMonth = useMemo(() => getWorkingMonthInfo(now), [now]);
  const isLastFiveDays = workingMonth.remainingIncludingToday <= 5;

  const lastUpdatedLabel = useMemo(
    () => (lastUpdatedAtMs ? formatDateTimeShort(new Date(lastUpdatedAtMs)) : null),
    [lastUpdatedAtMs],
  );

  const accountOptions = useMemo(
    () => buildAccountOptions(data?.cartera ?? [], data?.recaudos ?? []),
    [data?.cartera, data?.recaudos],
  );

  useEffect(() => {
    setAdminQueryUserId(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    if (accountOptions.length === 0) {
      if (selectedAccountKey) setSelectedAccountKey("");
      return;
    }

    const hasSelected = accountOptions.some((option) => option.key === selectedAccountKey);
    if (selectedAccountKey && !hasSelected) {
      setSelectedAccountKey("");
    }
  }, [accountOptions, selectedAccountKey]);

  const selectedAccount = useMemo(
    () => accountOptions.find((option) => option.key === selectedAccountKey) ?? null,
    [accountOptions, selectedAccountKey],
  );
  const requestedUserId = useMemo(() => {
    if (!isAdmin) {
      return readPositiveUserId(currentUserId);
    }

    return readPositiveUserId(adminQueryUserId) ?? readPositiveUserId(currentUserId);
  }, [adminQueryUserId, currentUserId, isAdmin]);
  const handleConsultar = (force = false) => {
    if (!requestedUserId) {
      return;
    }

    return consultar({
      force,
      userId: requestedUserId,
    });
  };
  const activeAccountKey = selectedAccountKey;
  const filteredGestiones = useMemo(
    () => filterRowsByAccount(data?.gestiones ?? [], activeAccountKey),
    [activeAccountKey, data?.gestiones],
  );
  const filteredCartera = useMemo(
    () => filterRowsByAccount(data?.cartera ?? [], activeAccountKey),
    [activeAccountKey, data?.cartera],
  );
  const filteredRecaudos = useMemo(
    () => filterRowsByAccount(data?.recaudos ?? [], activeAccountKey),
    [activeAccountKey, data?.recaudos],
  );
  const filteredKpis = useMemo(
    () =>
      computeAsesorLiteDashboardKpis({
        gestiones: filteredGestiones,
        recaudos: filteredRecaudos,
        now,
      }),
    [filteredGestiones, filteredRecaudos, now],
  );
  const rec = filteredKpis.recaudos;

  const ageRows = useMemo(
    () => buildAgeRows(filteredCartera, filteredRecaudos),
    [filteredCartera, filteredRecaudos],
  );
  const overdueAgeRows = useMemo(() => ageRows.filter((row) => row.key !== "PV"), [ageRows]);
  const overdueSaldo = useMemo(() => overdueAgeRows.reduce((sum, row) => sum + row.saldo, 0), [overdueAgeRows]);
  const overdueRecaudado = useMemo(
    () => overdueAgeRows.reduce((sum, row) => sum + row.recaudado, 0),
    [overdueAgeRows],
  );
  const overdueFaltante = useMemo(
    () => overdueAgeRows.reduce((sum, row) => sum + row.falta, 0),
    [overdueAgeRows],
  );
  const meta = overdueSaldo + overdueRecaudado;
  const recaudado = overdueRecaudado;
  const faltante = overdueFaltante;
  const cubierto = Math.max(0, meta - faltante);
  const kpiAvancePct = meta > 0 ? clampPct(recaudado / meta) : 0;
  const monthAvancePct = meta > 0 ? clampPct(cubierto / meta) : 0;
  const expectedPct = clampPct(workingMonth.progressPct);
  const expectedAmount = meta * expectedPct;
  const aheadPts = monthAvancePct - expectedPct;
  const dailyRequired = faltante > 0 ? faltante / Math.max(1, workingMonth.remainingIncludingToday) : 0;

  const totalCartera = overdueSaldo;
  const currentMeta = useMemo(() => overdueAgeRows.reduce((sum, row) => sum + row.meta, 0), [overdueAgeRows]);
  const currentRecaudado = overdueRecaudado;
  const currentFaltante = useMemo(() => overdueAgeRows.reduce((sum, row) => sum + row.falta, 0), [overdueAgeRows]);
  const currentAvancePct = totalCartera > 0 ? clampPct(currentMeta / totalCartera) : currentMeta <= 0 ? 1 : 0;
  const accountContextLabel =
    selectedAccount
      ? `Mostrando ${selectedAccount.name || `la cuenta ${selectedAccount.key}`}.`
      : "Mostrando el consolidado de todas las cuentas del asesor.";

  const channelSummary = useMemo(
    () => buildChannelRows(filteredGestiones, now),
    [filteredGestiones, now],
  );

  const compromisos = useMemo(
    () => buildCompromisosSummary(filteredGestiones, now),
    [filteredGestiones, now],
  );

  const tasks = useMemo(
    () => buildTaskCards(filteredKpis.presionHoy as AnyRow[]),
    [filteredKpis.presionHoy],
  );

  const totalTasksAmount = useMemo(
    () => tasks.reduce((sum, item) => sum + item.monto, 0),
    [tasks],
  );

  const puntoVenta = useMemo(
    () => resolvePuntoVentaLabel(filteredRecaudos),
    [filteredRecaudos],
  );

  const metaSubtitle = meta > 0 ? "objetivo del mes" : "sin referencia disponible";
  const recaudadoSubtitle =
    meta > 0 ? `${kpiAvancePct >= 1 ? "▲" : "•"} ${formatPercent(kpiAvancePct)} de la meta` : "sin base comparativa";
  const faltanteSubtitle = meta > 0 ? `${formatPercent(meta > 0 ? faltante / meta : 0)} restante` : "sin faltante calculable";
  const contactoHoyPct = channelSummary.todayTotal > 0 ? channelSummary.effectiveToday / channelSummary.todayTotal : 0;
  const contactoMesPct = channelSummary.monthTotal > 0 ? channelSummary.effectiveMonth / channelSummary.monthTotal : 0;

  return (
    <div className="container-fluid asesor-lite-dashboard asesor-mockup">
      {error && <Alert variant="warning">{error}</Alert>}

      <div className="asesor-mockup-wrap">
        <header className="asesor-mockup-top">
          <div>
            <h1>Panel de cobranza · Asesor</h1>
            <div className="asesor-mockup-sub">
              <span>Asesor: <b>{nombre}</b></span>
              <span>Periodo: <b>{periodo}</b></span>
              <span>Punto de venta: <b>{puntoVenta}</b></span>
            </div>
            <div className="asesor-mockup-meta">
              {lastUpdatedLabel ? `Actualizado: ${lastUpdatedLabel}` : "Pendiente de consulta"}
              {` · ${filteredGestiones.length} gestiones · ${filteredRecaudos.length} recaudos · ${filteredCartera.length} cuentas cartera`}
            </div>
          </div>

          <div className={["asesor-mockup-dias", isLastFiveDays ? "asesor-mockup-dias--danger" : ""].filter(Boolean).join(" ")}>
            <div className="asesor-mockup-lab">
              <span>Días hábiles restantes</span>
              <span>{periodo}</span>
            </div>
            <div className="asesor-mockup-big">
              <strong>{workingMonth.remainingIncludingToday}</strong>
              <span>de {workingMonth.total} hábiles del mes</span>
            </div>
            <div className="asesor-mockup-track" aria-hidden="true">
              <i style={{ width: `${Math.round(clampPct(workingMonth.progressPct) * 100)}%` }} />
            </div>
            <div className="asesor-mockup-actions">
              {isAdmin ? (
                <label className="asesor-mockup-admin-field">
                  <span>Usuario ID</span>
                  <input
                    aria-label="Indicar usuario para consultar dashboard"
                    type="number"
                    min={1}
                    step={1}
                    value={adminQueryUserId}
                    onChange={(event) => setAdminQueryUserId(event.target.value)}
                  />
                </label>
              ) : null}
              <Button variant="light" size="sm" onClick={() => void handleConsultar()} disabled={!requestedUserId || loading}>
                Consultar
              </Button>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => void handleConsultar(true)}
                disabled={!requestedUserId || loading}
              >
                Forzar
              </Button>
              {loading && <Spinner animation="border" size="sm" />}
            </div>
          </div>
        </header>

        {accountOptions.length > 0 ? (
          <section className="asesor-mockup-card asesor-mockup-card--filter">
            <div className="asesor-mockup-card-head">
              <div className="asesor-mockup-card-title">
                <h2><span className="dot" />Filtro general de cuenta</h2>
                <p className="asesor-mockup-card-note">La selección afecta KPIs, cartera por edad y gestión del mes.</p>
              </div>
              <div className="asesor-mockup-card-tools">
                <label className="asesor-mockup-field">
                  <span>Cuenta</span>
                  <select
                    aria-label="Seleccionar cuenta del dashboard"
                    value={selectedAccountKey}
                    onChange={(event) => setSelectedAccountKey(event.target.value)}
                  >
                    <option value="">Todas las cuentas</option>
                    {accountOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>
        ) : null}

        <section className="asesor-mockup-kpis" aria-label="Indicadores principales de recaudo">
          <div className="asesor-mockup-kpi asesor-mockup-kpi--meta">
            <div className="t">Meta de recaudo</div>
            <div className="v">{fmtCOP(meta)}</div>
            <div className="n">{metaSubtitle}</div>
          </div>
          <div className="asesor-mockup-kpi asesor-mockup-kpi--gest">
            <div className="t">Gestión / recaudado</div>
            <div className="v g">{fmtCOP(recaudado)}</div>
            <div className="n g">{recaudadoSubtitle}</div>
          </div>
          <div className="asesor-mockup-kpi asesor-mockup-kpi--falt">
            <div className="t">Faltante para la meta</div>
            <div className="v r">{formatSignedMoney(faltante)}</div>
            <div className="n r">{faltanteSubtitle}</div>
          </div>
          <div className="asesor-mockup-kpi">
            <div className="t">Recaudo diario requerido</div>
            <div className="v">{fmtCOP(dailyRequired)}</div>
            <div className="n">por día hábil restante</div>
          </div>
        </section>

        <section className="asesor-mockup-card">
          <div className="asesor-mockup-card-head">
            <div className="asesor-mockup-card-title">
              <h2><span className="dot" />Cartera y meta de recaudo por edad</h2>
              <p className="asesor-mockup-card-note">{accountContextLabel}</p>
            </div>
          </div>
          <div className="asesor-mockup-scroll">
            <table aria-label="Cartera y meta de recaudo por edad">
              <thead>
                <tr>
                  <th>Edad de cartera</th>
                  <th>Meta</th>
                  <th>%</th>
                  <th>Saldo Actual</th>
                  <th>Recaudado</th>
                  <th>Falta</th>
                </tr>
              </thead>
              <tbody>
                {ageRows.map((row) => {
                  const config = AGE_CONFIG.find((item) => item.key === row.key)!;
                  return (
                    <tr key={row.key}>
                      <td>
                        <span className="sw" style={{ background: config.fillColor }} />
                        {row.label}
                        {row.pill && <span className={`pill ${row.pill.tone}`}>{row.pill.label}</span>}
                      </td>
                      <td>{fmtCOP(row.meta)}</td>
                      <td>{formatPercent(row.pct)}</td>
                      <td>{fmtCOP(row.saldo)}</td>
                      <td className="asesor-mockup-text--green">{fmtCOP(row.recaudado)}</td>
                      <td className={getFaltaTextClass(row.falta)}>{formatSignedMoney(row.falta)}</td>
                    </tr>
                  );
                })}
                <tr className="total">
                  <td>Total general</td>
                  <td>{fmtCOP(currentMeta)}</td>
                  <td>100,0%</td>
                  <td>{fmtCOP(totalCartera)}</td>
                  <td className="asesor-mockup-text--green">{fmtCOP(currentRecaudado)}</td>
                  <td className={getFaltaTextClass(currentFaltante)}>{formatSignedMoney(currentFaltante)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="asesor-mockup-card">
          <div className="asesor-mockup-card-head">
            <div className="asesor-mockup-card-title">
              <h2><span className="dot" />Gestión del mes frente a la meta</h2>
              <p className="asesor-mockup-card-note">{accountContextLabel}</p>
            </div>
          </div>
          <div className="asesor-mockup-gline">
            <span className="av">Avance de la meta <b>{formatPercent(monthAvancePct)}</b></span>
            <span className="av">Ritmo esperado a hoy: <b className="asesor-mockup-expected">{fmtCOP(expectedAmount)} ({formatPercent(expectedPct)})</b></span>
          </div>
          <div className="asesor-mockup-bar" aria-label="Avance frente a la meta">
            <div className="fill" style={{ width: `${Math.round(monthAvancePct * 100)}%` }}>
              <span>{`${fmtCOP(cubierto)} · ${formatPercent(monthAvancePct)}`}</span>
            </div>
            <div className="mark" style={{ left: `${Math.round(expectedPct * 100)}%` }} />
          </div>
          <div className="asesor-mockup-legend">
            <span>Recaudado: <b className="g">{fmtCOP(recaudado)}</b></span>
            <span>Faltante: <b className="r">{formatSignedMoney(faltante)} ({formatPercent(meta > 0 ? faltante / meta : 0)})</b></span>
            <span>Meta: <b className="t">{fmtCOP(meta)} (100%)</b></span>
          </div>
          <div className="asesor-mockup-mini">
            <div>
              <div className="t">Avance real vs. tiempo del mes</div>
              <div className={`v ${aheadPts >= 0 ? "g" : "r"}`}>
                {`${formatPercentPoints(aheadPts)} ${aheadPts >= 0 ? "adelante" : "atrás"}`}
              </div>
            </div>
            <div>
              <div className="t">Recaudo vencido</div>
              <div className="v">{fmtCOP(rec.recaudoVencido ?? 0)}</div>
            </div>
          </div>
        </section>

        <section className="asesor-mockup-card">
          <h2><span className="dot" />Gestiones realizadas y compromisos</h2>
          <div className="asesor-mockup-gc">
            <div>
              <h3>Gestiones del día · vínculos con clientes</h3>
              <div className="asesor-mockup-gbig">
                <span className="n">{channelSummary.todayTotal}</span>
                <span className="u">hoy · <b>{channelSummary.monthTotal}</b> en el mes</span>
              </div>
              <div className="asesor-mockup-chan">
                <div className="chead"><span>Canal</span><span>Hoy</span><span>Mes</span></div>
                {channelSummary.rows.length === 0 ? (
                  <div className="asesor-mockup-empty">Consulta para ver distribución por canal.</div>
                ) : (
                  channelSummary.rows.map((row) => (
                    <div key={row.name} className="row">
                      <span className="l">
                        <span className="sw" style={{ background: row.color }} />
                        {row.name}
                      </span>
                      <span className="hoy">{row.today}</span>
                      <span className="mes">{row.month}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="asesor-mockup-eff">
                Contacto efectivo: <b>{`${channelSummary.effectiveToday}/${channelSummary.todayTotal} hoy (${formatPercent(contactoHoyPct)})`}</b>
                {" · "}
                <b>{`${channelSummary.effectiveMonth}/${channelSummary.monthTotal} mes (${formatPercent(contactoMesPct)})`}</b>
              </div>
            </div>

            <div>
              <h3>Compromisos de pago vigentes</h3>
              <div className="asesor-mockup-gbig">
                <span className="n">{compromisos.totalCompromisos}</span>
                <span className="u">compromisos pactados</span>
              </div>
              <div className="asesor-mockup-cmp">
                <div className="r">
                  <span className="lab">Monto comprometido</span>
                  <span className="v">{fmtCOP(compromisos.montoComprometido)}</span>
                </div>
                <div className="r ok">
                  <span className="lab">{`Cumplidos (${compromisos.cumplidos})`}</span>
                  <span className="v">{fmtCOP(compromisos.montoCumplido)}</span>
                </div>
                <div className="r pend">
                  <span className="lab">{`Activos / por vencer (${compromisos.activos})`}</span>
                  <span className="v">{fmtCOP(compromisos.montoActivo)}</span>
                </div>
              </div>
            </div>
          </div>

          <details className="asesor-mockup-tareas">
            <summary>
              <span>{`Tareas de gestión del día `}<span className="badge">{tasks.length}</span></span>
              <span className="sumdia">
                {`Total a gestionar: `}
                <b>{fmtCOP(totalTasksAmount)}</b>
                <span className="chev">&#9660;</span>
              </span>
            </summary>
            <div className="asesor-mockup-tlist asesor-mockup-tlist--scroll">
              {tasks.length === 0 ? (
                <div className="asesor-mockup-empty asesor-mockup-empty--tasks">No hay tareas priorizadas para hoy.</div>
              ) : (
                tasks.map((task, index) => (
                  <div key={`${task.cliente}-${task.meta}-${index}`} className="asesor-mockup-titem">
                    <div className="head">
                      <div>
                        <div className="cli">{task.cliente}</div>
                        <div className="cmeta">
                          {task.meta}
                          <span className="cmeta-time">{task.horaProgramada}</span>
                        </div>
                      </div>
                      <div className="right">
                        <div className="monto">{fmtCOP(task.monto)}</div>
                        <div className={`tag ${task.tagTone}`}>{task.tagLabel}</div>
                      </div>
                    </div>
                    <div className="desc">
                      <span className="act">{task.action}</span>
                      {task.description}
                      <button
                        type="button"
                        className="asesor-mockup-task-link"
                        aria-label={`Abrir consulta de cartera para ${task.cliente}`}
                        title={`Abrir consulta de cartera: ${task.cliente}`}
                        onClick={() => {
                          const url = buildConsultaCarteraUrl({
                            cuenta: task.cuenta,
                            factura: task.factura,
                            identificacionCliente: task.cliente,
                          });
                          window.open(
                            `${window.location.origin}${window.location.pathname}#${url}`,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </details>
        </section>

        <p className="asesor-mockup-foot">
          Diseño replicado sobre datos reales del proyecto. El bloque de contacto efectivo y las tareas del día se construyen con reglas operativas derivadas de la información disponible.
        </p>
      </div>
    </div>
  );
}
