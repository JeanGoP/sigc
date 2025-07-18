import React, { useState } from 'react';
import { User } from '../hooks/useUsers';

interface Props {
  users: User[];
  onAssign: (from: number, to: number, userId: string) => void;
  max: number;
  disabled?: boolean;
}

const AssignByRange: React.FC<Props> = ({ users, onAssign, max, disabled }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userId, setUserId] = useState('');

  const handleAssign = () => {
    if (from && to && userId) {
      onAssign(Number(from), Number(to), userId);
    }
  };

  return (
    <div style={{ margin: '12px 0' }}>
      <label>Asignar usuario por rango:&nbsp;</label>
      <input type="number" min={1} max={max} value={from} onChange={e => setFrom(e.target.value)} placeholder="Desde" style={{ width: 60 }} disabled={disabled} />
      <input type="number" min={1} max={max} value={to} onChange={e => setTo(e.target.value)} placeholder="Hasta" style={{ width: 60, marginLeft: 4 }} disabled={disabled} />
      <select value={userId} onChange={e => setUserId(e.target.value)} disabled={disabled} style={{ marginLeft: 4 }}>
        <option value="">Seleccione usuario</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
      </select>
      <button type="button" onClick={handleAssign} disabled={disabled || !from || !to || !userId} style={{ marginLeft: 8 }}>
        Asignar por rango
      </button>
    </div>
  );
};

export default AssignByRange; 