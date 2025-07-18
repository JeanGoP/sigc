// components/RecibosCajaTable.tsx

import React from 'react';
import { DynamicTable, TableColumn } from './tablaReutilizables';
import { ReciboCajaListModel } from '@app/models/recibocaja/recibocajaListoModel';
import { StringToMoney } from '@app/utils/formattersFunctions';

interface RecibosCajaTableProps {
  rows: ReciboCajaListModel[];
}

export const RecibosCajaTable: React.FC<RecibosCajaTableProps> = ({ rows }) => {
  const columns: TableColumn[] = [
    { id: 'id', label: 'Documento' },
    {id: 'DESFUENTE', label: 'Fuente'},
    {id: 'FORMAPAGO', label: 'Forma de Pago'},
    { id: 'VENCEFAC', label: 'Fecha vencimiento' },
    { id: 'FECHATRA', label: 'Fecha documento' },
    { id: 'VALOR', label: 'Valor Pagado', align: 'center', format: (value) => `$ ${StringToMoney(value)}` },
  ];

  return (


    <DynamicTable columns={columns} rows={rows} />
  );
};
