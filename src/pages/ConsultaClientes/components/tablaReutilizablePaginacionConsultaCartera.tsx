import React, { ReactNode, useState, useEffect } from 'react';
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
  totalRows?: number;
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

  /** NUEVOS */
  onRowEnter?: (row: any) => void;
  enableKeyboardNavigation?: boolean;
}

export const DynamicTablePaginationConsultaCartera: React.FC<DynamicTableProps> = ({
  columns,
  rows = [],
  totalRows,
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
  onRowEnter,
  enableKeyboardNavigation = true,
}) => {

  const [navMode, setNavMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const paginatedRows = rows;
  const rowRefs = React.useRef<(HTMLTableRowElement | null)[]>([]);


  // --------------------------
  //   KEYBOARD HANDLERS
  // --------------------------
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handler = (e: KeyboardEvent) => {
      // Activar navegación con SHIFT + T
      if (e.shiftKey && e.key.toLowerCase() === "t") {
        setNavMode(true);
        setSelectedIndex(0);
        return;
      }

      if (!navMode) return;

      if (e.key === "Escape") {
        setNavMode(false);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, paginatedRows.length - 1)
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (onRowEnter) {
          onRowEnter(paginatedRows[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navMode, paginatedRows, selectedIndex, enableKeyboardNavigation]);

  useEffect(() => {
  if (rowRefs.current[selectedIndex]) {
    rowRefs.current[selectedIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest", // o "center"
    });
  }
}, [selectedIndex]);

  return (
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
            {paginatedRows.map((row, rowIndex) => {
              const isSelectedRow = navMode && rowIndex === selectedIndex;

              const isSelected = selectedPredicate ? selectedPredicate(row) : false;

              return (
                <TableRow
                  ref={(el) => (rowRefs.current[rowIndex] = el)}
                  key={rowIndex}
                  hover
                  selected={isSelected || isSelectedRow}
                  sx={
                    isSelectedRow
                      ? { backgroundColor: '#b3e5fc !important' } // highlight navegación
                      : isSelected
                      ? { backgroundColor: '#e3f2fd' }
                      : undefined
                  }
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

      <TablePagination
        component="div"
        count={typeof totalRows === "number" ? totalRows : rows.length}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          onRowsPerPageChange(parseInt(e.target.value, 10));
          onPageChange(0);
        }}
        rowsPerPageOptions={rowPageOptions}
        labelRowsPerPage="Filas por página"
      />
    </div>
  );
};
