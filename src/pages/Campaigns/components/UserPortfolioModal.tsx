import React from 'react';
import { Portfolio } from '../hooks/usePortfolios';
import { User } from '../hooks/useUsers';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  portfolios: Portfolio[];
}

const UserPortfolioModal: React.FC<Props> = ({ open, onClose, user, portfolios }) => {
  if (!open || !user) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 400 }}>
        <h3>Carteras de {user.nombre}</h3>
        <table border={1} cellPadding={4} style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente (ID)</th>
              <th>Factura</th>
              <th>Saldo</th>
              <th>Edad</th>
              <th>Cuenta</th>
            </tr>
          </thead>
          <tbody>
            {portfolios.map((p, idx) => (
              <tr key={p.id}>
                <td>{idx + 1}</td>
                <td>{p.clienteId}</td>
                <td>{p.factura}</td>
                <td>{p.saldo.toLocaleString()}</td>
                <td>{p.edad}</td>
                <td>{p.cuentaContable}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={onClose} style={{ marginTop: 16 }}>Cerrar</button>
      </div>
    </div>
  );
};

export default UserPortfolioModal; 