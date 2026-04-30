import moment from "moment";
import type { Evento } from "@app/services/Calendario/CalendarioService";
import { buildConsultaCarteraUrl } from "../../../utils/consultaCarteraNavigation";
import type { CalendarioRangeInput, CalendarioVisibleRange } from "./types";

export const isValidCalendarUserFilter = (
  value: string | number | null | undefined,
): boolean =>
  value !== "" &&
  value !== null &&
  value !== undefined &&
  value !== 0 &&
  value !== "0";

export function normalizeCalendarRange(
  range: CalendarioRangeInput,
): CalendarioVisibleRange {
  if (Array.isArray(range)) {
    if (range.length === 0) {
      const today = moment();
      return {
        start: today.startOf("day").toDate(),
        end: today.endOf("day").toDate(),
      };
    }

    const times = range.map((date) => date.getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      start: moment(new Date(minTime)).startOf("day").toDate(),
      end: moment(new Date(maxTime)).endOf("day").toDate(),
    };
  }

  return {
    start: moment(range.start).startOf("day").toDate(),
    end: moment(range.end).endOf("day").toDate(),
  };
}

export function buildInitialCalendarRange(
  baseDate: Date = new Date(),
): CalendarioVisibleRange {
  const base = moment(baseDate);

  return {
    start: base.clone().startOf("month").startOf("week").toDate(),
    end: base.clone().endOf("month").endOf("week").toDate(),
  };
}

export function buildCalendarioEventosParams({
  cuentaFiltro,
  eventosAnteriores,
  eventosCumplidos,
  fechaInicio,
  fechaFin,
  userId,
}: {
  cuentaFiltro: string;
  eventosAnteriores: boolean;
  eventosCumplidos: boolean;
  fechaInicio: Date;
  fechaFin: Date;
  userId: string | number;
}) {
  return {
    eventosAnteriores,
    eventosCumplidos,
    cuentaFiltro: cuentaFiltro || null,
    fechaInicio: moment(fechaInicio).format("YYYY-MM-DD"),
    fechaFin: moment(fechaFin).format("YYYY-MM-DD"),
    ...(isValidCalendarUserFilter(userId) && { userId }),
  };
}

export function mapCalendarioEventos(eventos: any[]): Evento[] {
  return eventos.map((evento) => ({
    ...evento,
    start: new Date(evento.start),
    end: new Date(evento.end),
  }));
}

export function getEventosDelDia(
  eventos: readonly Evento[],
  fecha: Date,
): Evento[] {
  const dia = moment(fecha).startOf("day");

  return eventos.filter((evento) => moment(evento.start).isSame(dia, "day"));
}

export function buildCalendarioConsultaCarteraUrl(evento: Evento): string {
  return buildConsultaCarteraUrl({
    cuenta: (evento as any).cuenta,
    factura: (evento as any).factura,
    identificacionCliente: (evento as any).identificacionCliente,
  });
}
