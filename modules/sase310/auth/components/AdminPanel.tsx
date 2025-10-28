import React, { useEffect, useState } from 'react';
import { getPendingUsers, approveUser } from '../services/userService';

export default function AdminPanel() {
  const [pending, setPending] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    getPendingUsers().then(setPending);
  }, []);

  const handleApprove = async (uid: string) => {
    const rol = selectedRoles[uid] || 'docente';
    await approveUser(uid, rol);
    setPending(prev => prev.filter(u => u.id !== uid));
  };

  const handleRoleChange = (uid: string, rol: string) => {
    setSelectedRoles(prev => ({ ...prev, [uid]: rol }));
  };

  return (
    <section>
      <h2>Usuarios pendientes</h2>
      <ul>
        {pending.map(u => (
          <li key={u.id} style={{ marginBottom: '0.8rem' }}>
            <strong>{u.email}</strong>
            <select
              value={selectedRoles[u.id] || 'docente'}
              onChange={e => handleRoleChange(u.id, e.target.value)}
              style={{ marginLeft: '1rem' }}
            >
              <option value="docente">Docente</option>
              <option value="prefectura">Prefectura</option>
              <option value="orientacion">Orientación</option>
              <option value="direccion">Dirección</option>
            </select>
            <button onClick={() => handleApprove(u.id)} style={{ marginLeft: '0.5rem' }}>
              Aprobar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
