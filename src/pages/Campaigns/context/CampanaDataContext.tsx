import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ListadoDeCuentas,ListadoDeEdades } from './CampanaContextTypes';

// Simulación de APIs
const fetchClientes = async (): Promise<ListadoDeCuentas[]> =>
  await Promise.resolve([{ value: '1105', label: 'Cuenta 1105' },
  { value: '1305', label: 'Cuenta 1305' },
  { value: '1405', label: 'Cuenta 1405' },]);

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const cargarClientes = async () => {
    const data = await fetchClientes();
    setClientes(data);
  };

  return (
    <DataContext.Provider
      value={{ clientes, productos, cargarClientes }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useDataContext debe usarse dentro de <DataProvider>');
  return context;
};