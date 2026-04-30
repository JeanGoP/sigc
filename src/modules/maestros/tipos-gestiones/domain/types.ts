export type TipoContactoValue = "CD" | "CI" | "NC";

export interface TipoGestion {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  formaContacto?: string;
}

export interface TipoGestionFormState {
  nombre: string;
  descripcion: string;
  estado: boolean;
}
