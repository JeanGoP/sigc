import { useState, useEffect } from 'react';

export interface Portfolio {
  id: string;
  clienteId: string;
  factura: string;
  saldo: number;
  edad: string;
  cuentaContable: string;
  usuarioAsignado: string | null;
}

const PORTFOLIOS_JSON_PATH = '/data/portfolios.json';

export function usePortfolios(filters: { edad: string[]; cuenta: string[] } | null) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [filtered, setFiltered] = useState<Portfolio[]>([]);

  useEffect(() => {
    fetch(PORTFOLIOS_JSON_PATH)
      .then(res => res.json())
      .then(data => setPortfolios(data));
  }, []);

  useEffect(() => {
    if (filters) {
      setFiltered(
        portfolios.filter(p =>
          (filters.edad.length === 0 || filters.edad.includes(p.edad)) &&
          (filters.cuenta.length === 0 || filters.cuenta.includes(p.cuentaContable))
        )
      );
    } else {
      setFiltered([]);
    }
  }, [filters, portfolios]);

  const assignUser = (ids: string[], userId: string) => {
    setFiltered(prev => prev.map(p => ids.includes(p.id) ? { ...p, usuarioAsignado: userId } : p));
  };

  const assignUserByRange = (from: number, to: number, userId: string) => {
    setFiltered(prev => prev.map((p, idx) => (idx + 1 >= from && idx + 1 <= to) ? { ...p, usuarioAsignado: userId } : p));
  };

  return { portfolios: filtered, assignUser, assignUserByRange };
} 