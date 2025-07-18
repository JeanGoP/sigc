import React from 'react';
import { Portfolio } from '../hooks/usePortfolios';
import { User } from '../hooks/useUsers';

interface Props {
  portfolios: Portfolio[];
  users: User[];
  onView: (userId: string) => void;
}

const PortfolioSummaryTable: React.FC<Props> = ({ portfolios, users, onView }) => {
  const resumen = users.map(u => ({
    ...u,
    cantidad: portfolios.filter(p => p.usuarioAsignado === u.id).length
  })).filter(r => r.cantidad > 0);

  return (
    <table border={1} cellPadding={4} style={{ width: '100%', marginTop: 24 }}>
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Cantidad de Carteras Asignadas</th>
          <th>Ver</th>
        </tr>
      </thead>
      <tbody>
        {resumen.map(r => (
          <tr key={r.id}>
            <td>{r.nombre}</td>
            <td>{r.cantidad}</td>
            <td>
              <button type="button" onClick={() => onView(r.id)}>Ver</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PortfolioSummaryTable; 