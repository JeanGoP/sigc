export type ConsultaCarteraParams = {
  cuenta?: string | number | null;
  factura?: string | number | null;
  identificacionCliente?: string | number | null;
};

const appendParam = (
  params: URLSearchParams,
  key: string,
  value: string | number | null | undefined
) => {
  if (value === null || value === undefined) return;
  const stringValue = String(value).trim();
  if (!stringValue) return;
  params.set(key, stringValue);
};

export const buildConsultaCarteraUrl = (
  params: ConsultaCarteraParams
): string => {
  const query = new URLSearchParams();

  appendParam(query, "cuenta", params.cuenta);
  appendParam(query, "factura", params.factura);
  appendParam(query, "identificacionCliente", params.identificacionCliente);

  const queryString = query.toString();
  return queryString ? `/consulta_carteras?${queryString}` : "/consulta_carteras";
};
