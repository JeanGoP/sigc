export interface ReciboCajaListModel {
    IdRecibo: number;
    NumeroFactura: string;
    FechaPago: string; // ISO date (puedes convertirlo luego a Date si quieres)
    ValorPagado: number;
    ClienteId: string;
  }