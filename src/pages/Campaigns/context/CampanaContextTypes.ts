

export interface ListadoDeCuentas {
    value: string;
    label: string;
}

export interface ListadoDeEdades {
    valor: string;
    descrpcion: string;
}



export interface CampanaDataContextType {
  cuentas: ListadoDeCuentas[];
  edades: ListadoDeEdades[];
}