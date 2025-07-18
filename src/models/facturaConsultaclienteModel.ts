export interface FacturaListado {
    id: number;
    numeFac: string;        // Número de factura (posiblemente alfanumérico)
    idCliPrv: string;       // ID del cliente/proveedor
    sact: number;           // Saldo actual
    cuotas: number;         // Número de cuotas
    minVenc: string;        // Fecha de vencimiento en formato 'YYYY/MM/DD'
    dias: number;           // Días hasta el vencimiento (puede ser negativo)
    edad: string;           // Estado de la deuda (ej: 'AL DIA', 'VENCIDO')
    colorCodigo: string;    // Color en formato hex (#xxxxxx)
  }