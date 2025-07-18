import { useState, useEffect } from 'react';

export interface User {
  id: string;
  nombre: string;
}

const USERS_JSON_PATH = '/data/users.json';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch(USERS_JSON_PATH)
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return { users };
} 