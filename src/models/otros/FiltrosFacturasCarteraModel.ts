export class FiltrosFacturasCarteraModel {
  checkIncluirSaldosCero: boolean = false;
  checkSoloAsignadas: boolean = false;
  checkSoloEventosPendientes: boolean = false;
  sinGestionDias: number | null = null;
  filtroEdadMora: string = "";
  filtroPorVencimiento: string | null = "";
  tipoEvento: string | null = "X";
  etiqueta: string | null = "X";
  cuenta: string | null = "";

  constructor(init?: Partial<FiltrosFacturasCarteraModel>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}
