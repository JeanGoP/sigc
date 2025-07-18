export interface Evento {
  id: number;
  tipo: string;
  fecha: string;
  hora: string | null;
  valor?: number;
}

export const convertirEventoAXml = (evento: Evento): string => {
  return `
<Evento>
  <Id>${evento.id}</Id>
  <Tipo>${evento.tipo}</Tipo>
  <Fecha>${evento.fecha}</Fecha>
  <Hora>${evento.hora}</Hora>
  <Valor>${evento.valor}</Valor>
</Evento>`.trim();
};
