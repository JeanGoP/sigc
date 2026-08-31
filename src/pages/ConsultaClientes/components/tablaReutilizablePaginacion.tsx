import React, { ReactNode, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, TextField, Box
} from '@mui/material';
import { useAppSelector } from '@app/store/store';

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
  selectedPredicate?: (row: any) => boolean;
  /** Muestra las filas como tarjetas apiladas en móvil (screenSize === 'xs'). Patrón híbrido del proyecto. */
  enableMobileCards?: boolean;
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
  onPageChange,
  selectedPredicate,
  enableMobileCards = false,
}) => {
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const showCards = enableMobileCards && screenSize === 'xs';

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
      {showCards ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {paginatedRows.length === 0 && (
            <div style={{ textAlign: "center", color: "#9aa1ad", padding: "16px 0", fontSize: 13 }}>
              Sin datos
            </div>
          )}
          {paginatedRows.map((row, rowIndex) => {
            const isSelected = selectedPredicate ? selectedPredicate(row) : false;
            const headCols = columns.filter((c) => !c.label);
            const bodyCols = columns.filter((c) => c.label);
            return (
              <div
                key={rowIndex}
                style={{
                  border: "1px solid",
                  borderColor: isSelected ? "#4f86c6" : "#e6e8ec",
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: isSelected ? "#e3f2fd" : "#fff",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                {headCols.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: bodyCols.length ? 8 : 0,
                    }}
                  >
                    {headCols.map((column) => (
                      <span key={column.id} style={{ display: "inline-flex", alignItems: "center" }}>
                        {column.format ? column.format(row[column.id], row) : row[column.id]}
                      </span>
                    ))}
                  </div>
                )}
                {bodyCols.map((column, i) => (
                  <div
                    key={column.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 13,
                      padding: "4px 0",
                      borderTop: i === 0 ? "none" : "1px solid #f0f3f8",
                    }}
                  >
                    <span style={{ color: "#6b7280", fontWeight: 500, flexShrink: 0 }}>
                      {column.label}
                    </span>
                    <span style={{ textAlign: "right", fontWeight: 600, minWidth: 0, wordBreak: "break-word" }}>
                      {column.format ? column.format(row[column.id], row) : row[column.id]}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
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
            {paginatedRows.map((row, rowIndex) => {
              const isSelected = selectedPredicate ? selectedPredicate(row) : false;
              return (
                <TableRow
                  key={rowIndex}
                  selected={isSelected}
                  sx={
                    isSelected
                      ? { backgroundColor: '#e3f2fd' }
                      : undefined
                  }
                  hover
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align || 'left'}>
                      {column.format ? column.format(row[column.id], row) : row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      )}

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
