import type { CarteraRow } from "@app/Data/dashboardCarteraData";

export function buildDashboardCarteraLookup(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const lookup: Record<string, unknown> = {};

  for (const key of Object.keys(raw)) {
    lookup[key.toLowerCase()] = raw[key];
  }

  return lookup;
}

export function mapApiRowToCarteraRow(raw: Record<string, unknown>): CarteraRow {
  const lookup = buildDashboardCarteraLookup(raw);
  const readNumber = (key: string) => Number(lookup[key.toLowerCase()] ?? 0);
  const readString = (key: string) => String(lookup[key.toLowerCase()] ?? "");

  return {
    codicta: readString("codicta"),
    desccta: readString("desccta"),
    obligacionesTotal: readNumber("obligaciones_total"),
    obligacionesPV: readNumber("obligaciones_pv"),
    obligaciones30: readNumber("obligaciones_30"),
    obligaciones60: readNumber("obligaciones_60"),
    obligaciones90: readNumber("obligaciones_90"),
    obligaciones90mas: readNumber("obligaciones_90_mas"),
    total: readNumber("total"),
    pv: readNumber("pv"),
    d30: readNumber("30"),
    d60: readNumber("60"),
    d90: readNumber("90"),
    d90mas: readNumber("+90"),
    carteraVencida: readNumber("carteravencida"),
    carteraVencidaPorc: readNumber("carteravencida_porc"),
    recaudoMesActual: readNumber("totalrecaudomesactual"),
    recaudoMesAnterior: readNumber("totalrecaudomesanterior"),
    porcentajeVariacion: readNumber("porcentajevariacion"),
    indiceRecaudo: readNumber("indicerecaudo_porc"),
    recaudoPV: readNumber("recaudomesactual_pv"),
    recaudo30: readNumber("recaudomesactual_30"),
    recaudo60: readNumber("recaudomesactual_60"),
    recaudo90: readNumber("recaudomesactual_90"),
    recaudo90mas: readNumber("recaudomesactual_90_mas"),
    recaudoVencido: readNumber("recaudomesactual_vencido"),
    totalAnt: readNumber("total_ant"),
    pvAnt: readNumber("pv_ant"),
    d30Ant: readNumber("30_ant"),
    d60Ant: readNumber("60_ant"),
    d90Ant: readNumber("90_ant"),
    d90masAnt: readNumber("+90_ant"),
    pvAntPorc: readNumber("pv_ant_porc"),
    d30AntPorc: readNumber("30_ant_porc"),
    d60AntPorc: readNumber("60_ant_porc"),
    d90AntPorc: readNumber("90_ant_porc"),
    d90masAntPorc: readNumber("+90_ant_porc"),
    carteraVencidaAnt: readNumber("carteravencida_ant"),
    carteraVencidaAntPorc: readNumber("carteravencida_ant_porc"),
  };
}

export function mapApiRowsToCarteraRows(
  rows: Record<string, unknown>[],
): CarteraRow[] {
  return rows.map(mapApiRowToCarteraRow);
}
