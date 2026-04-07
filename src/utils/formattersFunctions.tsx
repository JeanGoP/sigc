// Formato moneda COP completo: $1.890.925.515,00
export const fmtCOP = (v: number, sign = false): string => {
  const abs = Math.abs(v).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const str = `$${abs}`;
  if (!sign) return str;
  return `${v >= 0 ? "+" : "-"}${str}`;
};

export function StringToMoney(valor: string | number): string {
  if (typeof valor === 'number') {
    return valor.toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (typeof valor === 'string') {
    // Detecta si el string tiene formato latino: "1.234,56"
    const esLatino = valor.includes(',') && valor.includes('.');

    let limpio = valor;
    if (esLatino) {
      limpio = valor.replace(/\./g, '').replace(',', '.'); // "1.234,56" -> "1234.56"
    }

    const numero = parseFloat(limpio);
    if (!isNaN(numero)) {
      return numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }

  return String(valor);
}
