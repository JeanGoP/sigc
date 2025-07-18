import React, { ReactNode, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, TextField, Box
} from '@mui/material';

export interface TableColumn {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row?: any) => ReactNode;
}

interface DynamicTableProps {
  columns: TableColumn[];
  rows: any[];
  searchText: string;
  onSearchChange: (value: string) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (value: number) => void;
  rowPageOptions?: number[];
  withSearch?: boolean;
  maxHeight?: string;
  page: number;
  onPageChange: (value: number) => void;
}

export const DynamicTablePagination: React.FC<DynamicTableProps> = ({
  columns,
  rows = [],
  searchText,
  onSearchChange,
  rowsPerPage,
  onRowsPerPageChange,
  rowPageOptions = [10, 25, 50, 100],
  withSearch = true,
  maxHeight = '400px',
  page,
  onPageChange
}) => {
  const handleChangePage = (_event: unknown, newPage: number) => onPageChange(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    // <Paper sx={{ p: 2 }}>
    <div>
      {withSearch && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <TextField
            label="Buscar"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </Box>
      )}
      <TableContainer sx={{ maxHeight: maxHeight }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{ backgroundColor: '#343A40', color: 'white', fontWeight: 'bold' }}
                  align={column.align || 'left'}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align || 'left'}>
                    {column.format ? column.format(row[column.id], row) : row[column.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={rowPageOptions}
        labelRowsPerPage="Filas por página"
      />
    </div>
  );
};
