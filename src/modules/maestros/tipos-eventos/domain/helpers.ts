import type {
  Evento,
  EventoXmlInput,
  SeguimientoDraftState,
  TipoEventoOption,
} from "./types";

export function convertirEventoAXml(evento: EventoXmlInput): string {
  return `
<Evento>
  <Id>${evento.id}</Id>
  <Tipo>${evento.tipo}</Tipo>
  <Fecha>${evento.fecha}</Fecha>
  <Hora>${evento.hora}</Hora>
  <Valor>${evento.valor}</Valor>
</Evento>`.trim();
}

export function createEmptyEvento(): Evento {
  return {
    id: 0,
    tipo: "",
    fecha: "",
    hora: null,
    valor: undefined,
  };
}

export function buildDefaultFormEvento(
  tiposEvento: readonly TipoEventoOption[],
  preferNombre?: string,
  montoSugerido?: number
): Evento {
  const preferred =
    (preferNombre
      ? tiposEvento.find((tipo) => tipo.nombre === preferNombre)
      : undefined) ?? tiposEvento[0];

  return {
    ...createEmptyEvento(),
    tipo: preferred?.nombre ?? "",
    id: preferred?.id ?? 0,
    valor:
      preferred?.requiereMonto && typeof montoSugerido === "number"
        ? montoSugerido
        : undefined,
  };
}

export function buildDraftFormEvento(
  draft: SeguimientoDraftState,
  tiposEvento: readonly TipoEventoOption[]
): Evento {
  const preferNombre = String(draft.formEvento?.tipo ?? "").trim() || undefined;

  return draft.formEvento && typeof draft.formEvento === "object"
    ? {
      ...buildDefaultFormEvento(tiposEvento, preferNombre),
      ...draft.formEvento,
    }
    : buildDefaultFormEvento(tiposEvento);
}

export function hasMeaningfulSeguimientoDraftContent({
  defaultEvento,
  editIndex,
  eventos,
  formEvento,
  texto,
  tipoContacto,
}: {
  defaultEvento: Evento;
  editIndex: number | null;
  eventos: readonly Evento[];
  formEvento: Evento;
  texto: string;
  tipoContacto: string | number;
}): boolean {
  const defaultTipo = String(defaultEvento.tipo ?? "").trim();
  const currentTipo = String(formEvento.tipo ?? "").trim();

  return Boolean(
    texto.trim()
      || eventos.length > 0
      || Number(tipoContacto || 0) > 0
      || editIndex !== null
      || String(formEvento.fecha ?? "").trim()
      || String(formEvento.hora ?? "").trim()
      || typeof formEvento.valor === "number"
      || (currentTipo && currentTipo !== defaultTipo)
  );
}

export function buildEventoKey(evento: Evento): string {
  const tipoKey = evento.id
    ? String(evento.id)
    : (evento.tipo || "").trim().toLowerCase();
  const fechaKey = (evento.fecha || "").trim();
  const horaKey = evento.hora ? String(evento.hora).trim() : "";
  const valorKey = typeof evento.valor === "number" ? String(evento.valor) : "";
  return `${tipoKey}|${fechaKey}|${horaKey}|${valorKey}`;
}

export function isDuplicateEvento(
  eventos: readonly Evento[],
  evento: Evento,
  excludeIndex?: number
): boolean {
  const key = buildEventoKey(evento);

  return eventos.some((current, index) => {
    if (excludeIndex !== undefined && index === excludeIndex) {
      return false;
    }

    return buildEventoKey(current) === key;
  });
}

export function convertirHoraA24(hora12: string): string | null {
  const horaLimpia = hora12.trim().toLowerCase().replace(/\s+/g, " ");
  const match = horaLimpia.match(
    /^(\d{1,2}):(\d{2})\s*(a\.?\s?m\.?|p\.?\s?m\.?)$/i
  );

  if (!match) {
    return null;
  }

  let horas = parseInt(match[1], 10);
  const minutos = match[2];
  const periodo = match[3];

  if (periodo.startsWith("p") && horas !== 12) {
    horas += 12;
  }

  if (periodo.startsWith("a") && horas === 12) {
    horas = 0;
  }

  return `${horas.toString().padStart(2, "0")}:${minutos}`;
}

export function ensureEventosHaveIds(
  eventos: readonly Evento[],
  tiposEvento: readonly TipoEventoOption[]
): Evento[] {
  return eventos.map((evento) => {
    if (evento.id) {
      return evento;
    }

    const tipo = tiposEvento.find((current) => current.nombre === evento.tipo);
    return { ...evento, id: tipo ? tipo.id : 0 };
  });
}

export function buildEventosXml(eventos: readonly Evento[]): string {
  return eventos
    .map((evento) => {
      const eventoXML: EventoXmlInput = {
        id: evento.id,
        tipo: evento.tipo,
        fecha: evento.fecha || "",
        hora: evento.hora ? convertirHoraA24(evento.hora) ?? evento.hora : null,
        valor: evento.valor ? Number(evento.valor) : undefined,
      };

      return convertirEventoAXml(eventoXML);
    })
    .join("\n");
}

export function parseEventos(eventos: string | Evento[]): Evento[] {
  if (Array.isArray(eventos)) {
    return eventos;
  }

  if (typeof eventos !== "string") {
    return [];
  }

  const raw = eventos.trim();
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    if (raw.startsWith("<")) {
      try {
        const parser = new DOMParser();
        const xmlSource = raw.includes("<Eventos")
          ? raw
          : `<Eventos>${raw}</Eventos>`;
        const xmlDoc = parser.parseFromString(xmlSource, "text/xml");
        if (xmlDoc.getElementsByTagName("parsererror").length === 0) {
          const nodes = Array.from(xmlDoc.getElementsByTagName("Evento"));
          const parsedEventos = nodes.map((node) => {
            const getText = (tag: string) =>
              node.getElementsByTagName(tag)[0]?.textContent ?? "";
            const valorText = getText("Valor");
            const valorNum = Number(valorText);
            return {
              id: Number(getText("Id")) || 0,
              tipo: getText("Tipo"),
              fecha: getText("Fecha"),
              hora: getText("Hora") || null,
              valor: Number.isFinite(valorNum) ? valorNum : undefined,
              cumplido: getText("Cumplido") || undefined,
            } as Evento;
          });
          if (parsedEventos.length > 0) {
            return parsedEventos;
          }
        }
      } catch (error) {
        console.error("Error al parsear XML de eventos:", error);
      }
    }

    return raw
      .split("\n")
      .filter((evento) => evento.trim())
      .map((eventoStr) => {
        try {
          const parsed = JSON.parse(eventoStr);
          return {
            id: parsed.id,
            tipo: parsed.tipo,
            fecha: parsed.fecha,
            hora: parsed.hora,
            valor: parsed.valor,
            cumplido: parsed.cumplido,
          } as Evento;
        } catch (error) {
          console.error("Error al parsear evento:", error);
          return null;
        }
      })
      .filter((evento): evento is Evento => evento !== null);
  }
}
