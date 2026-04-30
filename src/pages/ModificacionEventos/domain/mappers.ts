import {
  parseBooleanValue,
  parseNumberValue,
  pickFirstValue,
} from "./helpers";
import type {
  EventoGestion,
  GestionModificacion,
  TipoEventoItem,
} from "./types";

export const normalizeGestionesResponse = (rawData: any) => {
  const rows =
    (Array.isArray(rawData) && rawData) ||
    (Array.isArray(rawData?.items) && rawData.items) ||
    (Array.isArray(rawData?.rows) && rawData.rows) ||
    (Array.isArray(rawData?.results) && rawData.results) ||
    (Array.isArray(rawData?.data) && rawData.data) ||
    [];
  const totalCandidates = [
    rawData?.totalRows,
    rawData?.total,
    rawData?.totalRecords,
    rawData?.count,
    rawData?.pagination?.totalRows,
    rawData?.pagination?.total,
  ];
  const total = totalCandidates.find(
    (value) => typeof value === "number" && !Number.isNaN(value)
  );
  return { rows, totalRows: typeof total === "number" ? total : rows.length };
};

export const mapTipoEventoItemFromApi = (item: any): TipoEventoItem => ({
  id: String(item?.id ?? ""),
  nombre: String(item?.nombre ?? ""),
  requiereFecha: parseBooleanValue(item?.requiereFecha),
  requiereHora: parseBooleanValue(item?.requiereHora),
  requiereMonto: parseBooleanValue(item?.requiereMonto),
});

export const mapEventoGestionFromApi = (
  item: any,
  gestionFactura: string,
  gestionCuenta: string,
  gestionCliente: string
): EventoGestion => ({
  id:
    parseNumberValue(
      pickFirstValue(item, ["id", "Id", "idEvento", "IdEvento"])
    ) ?? 0,
  idGestion:
    parseNumberValue(pickFirstValue(item, ["idGestion", "IdGestion"])) ?? 0,
  cliente: String(
    pickFirstValue(item, ["cliente", "Cliente"]) ?? gestionCliente
  ),
  factura: gestionFactura,
  cuenta: gestionCuenta,
  idUsuarioAsignado:
    parseNumberValue(
      pickFirstValue(item, ["IdUsuarioAsignado", "idUsuarioAsignado"])
    ) ?? 0,
  idTipoEvento:
    parseNumberValue(pickFirstValue(item, ["IdTipoEvento", "idTipoEvento"])) ??
    0,
  fechaHoraProgramada: String(
    pickFirstValue(item, ["FechaHoraProgramada", "fechaHoraProgramada"]) ?? ""
  ),
  montoCompromiso: parseNumberValue(
    pickFirstValue(item, ["MontoCompromiso", "montoCompromiso"])
  ),
  requiereFecha: parseBooleanValue(
    pickFirstValue(item, ["requiereFecha", "RequiereFecha"])
  ),
  requiereHora: parseBooleanValue(
    pickFirstValue(item, ["requiereHora", "RequiereHora"])
  ),
  requiereMonto: parseBooleanValue(
    pickFirstValue(item, ["RequiereMonto", "requiereMonto"])
  ),
});

export const mapGestionFromApi = (item: any): GestionModificacion => {
  const cliente = String(pickFirstValue(item, ["cliente", "Cliente"]) ?? "");
  const factura = String(pickFirstValue(item, ["factura", "Factura"]) ?? "");
  const cuenta = String(pickFirstValue(item, ["cuenta", "Cuenta"]) ?? "");

  let eventosRaw: any[] = [];
  const eventosField = pickFirstValue(item, ["eventos", "Eventos"]);
  if (typeof eventosField === "string") {
    try {
      const parsed = JSON.parse(eventosField);
      if (Array.isArray(parsed)) eventosRaw = parsed;
    } catch {
      /* empty */
    }
  } else if (Array.isArray(eventosField)) {
    eventosRaw = eventosField;
  }

  return {
    idGestion:
      parseNumberValue(pickFirstValue(item, ["idGestion", "IdGestion"])) ?? 0,
    cliente,
    factura,
    cuenta,
    usuario: parseNumberValue(pickFirstValue(item, ["usuario", "Usuario"])) ?? 0,
    Username: String(
      pickFirstValue(item, ["Username", "username", "NombreUsuario"]) ?? ""
    ),
    FechaHora: String(
      pickFirstValue(item, ["FechaHora", "fechaHora", "FechaGestion"]) ?? ""
    ),
    descripcion: String(
      pickFirstValue(item, ["Descripcion", "descripcion"]) ?? ""
    ),
    eventos: eventosRaw.map((evento) =>
      mapEventoGestionFromApi(evento, factura, cuenta, cliente)
    ),
  };
};
