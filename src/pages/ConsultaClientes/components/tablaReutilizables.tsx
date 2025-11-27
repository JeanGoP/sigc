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
}

export const DynamicTable: React.FC<DynamicTableProps> = ({
  columns,
  rows = [],
  showTittle = false,
  tittle = { tittleText: "", iconClass: "" },
  showFooter = false,
  footerIdentifier = "Totales",
}) => {
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
          sx={{ color: "black", mb: 1 }}
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
    </div>
  );
};
