const DEFAULT_SIN_GESTION_DIAS_OPTION = 0;
const VALID_SIN_GESTION_DIAS_OPTIONS = new Set([0, 1, 2, 3, 4]);

function normalizeSinGestionDiasOption(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return DEFAULT_SIN_GESTION_DIAS_OPTION;
  }

  const parsed = Number(value);
  return VALID_SIN_GESTION_DIAS_OPTIONS.has(parsed)
    ? parsed
    : DEFAULT_SIN_GESTION_DIAS_OPTION;
}

function normalizeOptionalNonNegativeInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.trunc(parsed);
}

export class FiltrosFacturasCarteraModel {
  checkIncluirSaldosCero: boolean = false;
  checkSoloAsignadas: boolean = false;
  checkSoloEventosPendientes: boolean = false;
  sinGestionDias: number = DEFAULT_SIN_GESTION_DIAS_OPTION;
  filtroEdadMora: string = "";
  filtroPorVencimiento: string | null = "";
  tipoEvento: string | null = "X";
  etiqueta: string | null = "X";
  cuenta: string | null = "";
  minValorCuota: number | null = null;
  maxValorCuota: number | null = null;

  constructor(init?: Partial<FiltrosFacturasCarteraModel>) {
    if (init) {
      Object.assign(this, init);
    }

    this.sinGestionDias = normalizeSinGestionDiasOption(this.sinGestionDias);
    this.minValorCuota = normalizeOptionalNonNegativeInt(this.minValorCuota);
    this.maxValorCuota = normalizeOptionalNonNegativeInt(this.maxValorCuota);
  }
}
