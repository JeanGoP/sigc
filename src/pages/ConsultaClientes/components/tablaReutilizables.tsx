import React, { ReactNode } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableFooter,
  Typography,
} from "@mui/material";
import { useAppSelector } from "@app/store/store";

export interface TableColumn {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
  format?: (value: any, row?: any) => ReactNode;
}

interface DynamicTableProps {
  columns: TableColumn[];
  rows: any[];
  showTittle?: boolean;
  tittle?: { tittleText: string; iconClass?: string };
  showFooter?: boolean;
  footerIdentifier?: string; // Identifier for the footer row, default is "Total"
  /** Muestra las filas como tarjetas apiladas en móvil (screenSize === 'xs'). Patrón híbrido del proyecto. */
  enableMobileCards?: boolean;
}

export const DynamicTable: React.FC<DynamicTableProps> = ({
  columns,
  rows = [],
  showTittle = false,
  tittle = { tittleText: "", iconClass: "" },
  showFooter = false,
  footerIdentifier = "Totales",
  enableMobileCards = false,
}) => {
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const showCards = enableMobileCards && screenSize === "xs";

  const footerRow = rows.find((row) => row[columns[0].id] === footerIdentifier);
  const normalRows = rows.filter(
    (row) => row[columns[0].id] !== footerIdentifier
  );

  return (
    <div>
      {showTittle && (
        <Typography
          variant="h5"
          fontWeight="bold"
          display="flex"
          alignItems="center"
          fontFamily="Roboto, Helvetica, Arial, sans-serif"
          gap={1}
          sx={{ color: "black", mt: "2px", mb: 1 }}
        >
          <Box
            component="i"
            className={tittle.iconClass}
            aria-hidden="true"
            sx={{
              fontSize: 28,
              color: "primary.main",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          <span>{tittle.tittleText}</span>
        </Typography>
      )}

      {showCards ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {normalRows.length === 0 && (
            <div style={{ textAlign: "center", color: "#9aa1ad", padding: "16px 0", fontSize: 13 }}>
              Sin datos
            </div>
          )}
          {normalRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                border: "1px solid #e6e8ec",
                borderRadius: 10,
                padding: "10px 12px",
                background: "#fff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              {columns.map((column, i) => (
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
          ))}
          {footerRow && (
            <div
              style={{
                border: "1px solid #343A40",
                borderRadius: 10,
                padding: "10px 12px",
                background: "#343A40",
                color: "#fff",
              }}
            >
              {columns.map((column, i) => (
                <div
                  key={column.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 13,
                    padding: "4px 0",
                    borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <span style={{ opacity: 0.85, fontWeight: 500 }}>{column.label}</span>
                  <span style={{ textAlign: "right", fontWeight: 700 }}>
                    {column.format ? column.format(footerRow[column.id], footerRow) : footerRow[column.id] ?? ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <TableContainer component={Paper} sx={{ maxHeight: 400, width: "100%" }}>
        <Table stickyHeader size="small" sx={{ width: "100%" }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    backgroundColor: "#343A40",
                    color: "white",
                    fontWeight: "bold",
                    // fontSize: "13px",
                  }}
                  align={column.align || "left"}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {normalRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align || "left"}
                  >
                    {/* Si la columna tiene una función de formato, se aplica. Si no, se muestra el valor directamente */}
                    {column.format
                      ? column.format(row[column.id], row)
                      : row[column.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {/* Pie con totales */}
          {footerRow && (
            <TableFooter>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || "left"}
                    sx={{
                      backgroundColor: "#343A40",
                      color: "white",
                      // fontWeight: "bold",
                      fontSize: "1rem",
                    }}
                  >
                    {column.format
                      ? column.format(footerRow[column.id], footerRow)
                      : footerRow[column.id] ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
      )}
    </div>
  );
};
