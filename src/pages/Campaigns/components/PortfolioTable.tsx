import React from 'react';
import { Portfolio } from '../hooks/usePortfolios';
import { User } from '../hooks/useUsers';

interface Props {
  portfolios: Portfolio[];
  users: User[];
  seleccionados: string[];
  setSeleccionados: (ids: string[]) => void;
  onAssignUser: (userId: string) => void;
  onAssignUserToRow: (rowId: string, userId: string) => void;
}

const PortfolioTable: React.FC<Props> = ({ portfolios, users, seleccionados, setSeleccionados, onAssignUser, onAssignUserToRow }) => {
  const handleCheck = (id: string) => {
    setSeleccionados(
      seleccionados.includes(id)
        ? seleccionados.filter(sid => sid !== id)
        : [...seleccionados, id]
    );
  };

  const handleCheckAll = () => {
    if (seleccionados.length === portfolios.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(portfolios.map(p => p.id));
    }
  };

  return (
    <table border={1} cellPadding={4} style={{ width: '100%', marginTop: 16 }}>
      <thead>
        <tr>
          <th><input type="checkbox" checked={seleccionados.length === portfolios.length && portfolios.length > 0} onChange={handleCheckAll} /></th>
          <th>#</th>
          <th>Cliente (ID)</th>
          <th>Factura</th>
          <th>Saldo</th>
          <th>Edad Cartera</th>
          <th>Cuenta Contable</th>
          <th>Usuario Asignado</th>
        </tr>
      </thead>
      <tbody>
        {portfolios.map((p, idx) => (
          <tr key={p.id}>
            <td><input type="checkbox" checked={seleccionados.includes(p.id)} onChange={() => handleCheck(p.id)} /></td>
            <td>{idx + 1}</td>
            <td>{p.clienteId}</td>
            <td>{p.factura}</td>
            <td>{p.saldo.toLocaleString()}</td>
            <td>{p.edad}</td>
            <td>{p.cuentaContable}</td>
            <td>
              <select
                value={p.usuarioAsignado || ''}
                onChange={e => onAssignUserToRow(p.id, e.target.value)}
              >
                <option value="">Sin asignar</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PortfolioTable; 