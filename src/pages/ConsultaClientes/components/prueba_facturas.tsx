import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Box, IconButton 
} from '@mui/material';

export const FacturasTablePrueba = () => {
  const rows = [
    {
      aprobacion: '0000024971',
      fecha: '2025-04-24',
      factura: 'CRFIA-10913',
      cuotas: 36,
      canceladas: 0,
      enMora: 0,
      capital: 8589000,
      interes: 3347993.01,
      fianza: 4695006.96,
      moratorio: 0,
      totalHoy: 8589000,
      totalEnMora: 0,
      totalDeuda: 16632000,
      totalDeudaMoratorio: 16632000,
    },
  ];

  return (
    <Box p={2}>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold" mr={1}>
          📄 Facturas
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#263238' }}>
              {[
                'Ver', 'Aprobacion', 'Fecha', 'Factura', 'Cuotas', 
                'Canceladas', 'EnMora', 'Capital', 'Interes', 'Fianza', 
                'Moratorio', 'Total', 'Total', 
                'Deuda', 'Moratorio', 'Pagar', 'Pdf'
              ].map((header) => (
                <TableCell
                  key={header}
                  sx={{ backgroundColor: '#263238', color: 'white', fontWeight: 'bold' }}
                  align="center"
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell align="center">
                  <IconButton>
                  </IconButton>
                </TableCell>
                <TableCell align="center">{row.aprobacion}</TableCell>
                <TableCell align="center">{row.fecha}</TableCell>
                <TableCell align="center">{row.factura}</TableCell>
                <TableCell align="center">{row.cuotas}</TableCell>
                <TableCell align="center">{row.canceladas}</TableCell>
                <TableCell align="center">{row.enMora}</TableCell>
                <TableCell align="center">{row.capital.toLocaleString()}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                  {row.interes.toLocaleString()}
                </TableCell>
                <TableCell align="center">{row.fianza.toLocaleString()}</TableCell>
                <TableCell align="center">{row.moratorio.toFixed(2)}</TableCell>
                <TableCell align="center">{row.totalHoy.toLocaleString()}</TableCell>
                <TableCell align="center">{row.totalEnMora.toFixed(2)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {row.totalDeuda.toLocaleString()}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {row.totalDeudaMoratorio.toLocaleString()}
                </TableCell>
                <TableCell align="center">
                  <IconButton>
                  </IconButton>
                </TableCell>
                <TableCell align="center">
                  <IconButton>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};