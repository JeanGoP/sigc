import React, { useState } from 'react';
import { User } from '../hooks/useUsers';

interface Props {
  users: User[];
  onAssign: (userId: string) => void;
  disabled?: boolean;
}

const AssignBySelection: React.FC<Props> = ({ users, onAssign, disabled }) => {
  const [userId, setUserId] = useState('');

  const handleAssign = () => {
    if (userId) onAssign(userId);
  };

  return (
    <div style={{ margin: '12px 0' }}>
      <label>Asignar usuario a seleccionados:&nbsp;</label>
      <select value={userId} onChange={e => setUserId(e.target.value)} disabled={disabled}>
        <option value="">Seleccione usuario</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
      </select>
      <button type="button" onClick={handleAssign} disabled={disabled || !userId} style={{ marginLeft: 8 }}>
        Asignar a seleccionados
      </button>
    </div>
  );
};

export default AssignBySelection; 