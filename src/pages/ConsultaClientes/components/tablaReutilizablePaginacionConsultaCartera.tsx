import React, { ReactNode, useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, Box, Tooltip, IconButton, Typography
} from '@mui/material';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { fmtCOP } from '../../../utils/formattersFunctions';
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
  totalRows?: number;
  totalSaldoCartera?: number;
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
  onExportToCsv?: () => void;
  exporting?: boolean;

  /** Muestra las filas como tarjetas apiladas en móvil (screenSize === 'xs'). Patrón híbrido. */
  enableMobileCards?: boolean;
}

export const DynamicTablePaginationConsultaCartera: React.FC<DynamicTableProps> = ({
  columns,
  rows = [],
  totalRows,
  totalSaldoCartera,
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
  onExportToCsv,
  exporting = false,
  enableMobileCards = false,
}) => {

  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const showCards = enableMobileCards && screenSize === 'xs';

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

      {showCards ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "4px 2px",
          }}
        >
          {paginatedRows.length === 0 && (
            <div style={{ textAlign: "center", color: "#9aa1ad", padding: "24px 0", fontSize: 13 }}>
              Sin resultados
            </div>
          )}
          {paginatedRows.map((row, rowIndex) => {
            const isSelectedRow = navMode && rowIndex === selectedIndex;
            const isSelected = selectedPredicate ? selectedPredicate(row) : false;
            const active = isSelected || isSelectedRow;
            const headCols = columns.filter((c) => !c.label);
            const bodyCols = columns.filter((c) => c.label);
            return (
              <div
                key={rowIndex}
                ref={(el) => (rowRefs.current[rowIndex] = el as any)}
                role="button"
                tabIndex={0}
                onClick={() => onRowEnter && onRowEnter(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && onRowEnter) onRowEnter(row);
                }}
                style={{
                  border: "1px solid",
                  borderColor: active ? "#4f86c6" : "#e6e8ec",
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: active ? "#e3f2fd" : "#fff",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  cursor: onRowEnter ? "pointer" : "default",
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
      )}

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
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        px={2}
        pb={1.25}
        pt={0.25}
        sx={{
          minHeight: 44,
          borderTop: "1px solid rgba(52, 58, 64, 0.08)",
        }}
      >
        {onExportToCsv ? (
          <Tooltip title={exporting ? "Exportando CSV..." : "Exportar a CSV"}>
            <span>
              <IconButton
                size="small"
                onClick={onExportToCsv}
                disabled={exporting}
                aria-label="Exportar a CSV"
                sx={{
                  width: 34,
                  height: 34,
                  border: "1px solid",
                  borderColor: "primary.main",
                  color: "primary.main",
                  borderRadius: 1.5,
                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                  "&:hover": {
                    backgroundColor: "rgba(25, 118, 210, 0.1)",
                  },
                }}
              >
                <FontAwesomeIcon icon={faDownload} style={{ fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>
        ) : (
          <span />
        )}
        {typeof totalSaldoCartera === "number" && (
          <Typography
            component="span"
            sx={{
              fontSize: 13,
              lineHeight: 1.2,
              fontWeight: 600,
              color: "#4f86c6",
              textAlign: "right",
              whiteSpace: "nowrap",
            }}
          >
            Mora Total: {fmtCOP(totalSaldoCartera)}
          </Typography>
        )}
      </Box>
    </div>
  );
};
