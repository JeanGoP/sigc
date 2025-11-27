// src/components/AsientoContableTable.tsx
import {
  TableColumn,
  DynamicTable,
} from "@app/pages/ConsultaClientes/components/tablaReutilizables";
import { useGetContabilidadService } from "@app/services/Contabilidad/GetContabilizacionService";
import React, { useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from "@mui/material";

// Tipo de fila según tu ejemplo
export type AsientoRow = {
  CODICTA: string;
  CCOSTO: string;
  DESCRITRA: string;
  FECHATRA: string; // viene "YYYY/MM/DD"
  NUMEFAC: string;
  VENCEFAC: string; // puede venir vacío
  DEBITO: number;
  CREDITO: number;
};

type Props = {
  numDocutra: string;
  idFuente: string;
  tercero: string;
  onClose?: () => void; // permite que el padre desmonte el componente
};

// Formateador de moneda (COP)
const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

// Formato seguro para fechas tipo string "YYYY/MM/DD" (las deja igual si viene vacío)
const formatDate = (s: string) => (s ? s : "");

const FOOTER_ID = "Totales";

export const VerAsientoContableTable: React.FC<Props> = ({
  numDocutra,
  idFuente,
  tercero,
  onClose,
}) => {
  const [rows, setRows] = React.useState<AsientoRow[]>([]);
  const [open, setOpen] = React.useState(true);

  const { loading, error, getContabilizacion } = useGetContabilidadService();

  // Cargar asiento contable al cambiar los parámetros
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (!numDocutra || !idFuente || !tercero) {
        setRows([]);
        return;
      }
      try {
        const response: any = await getContabilizacion({
          numDocutra,
          idFuente,
          tercero,
        });
        // Normalizar payload: aceptar array plano o ApiResponse con data/Data
        let dataArray: any[] = [];
        if (Array.isArray(response)) {
          dataArray = response;
        } else if (Array.isArray(response?.data)) {
          dataArray = response.data;
        } else if (Array.isArray(response?.Data)) {
          dataArray = response.Data;
        } else if (response?.success && !response?.data) {
          dataArray = [];
        }
        if (active) setRows(dataArray as AsientoRow[]);
      } catch (err) {
        console.error("Error al obtener la contabilización de asiento:", err);
        if (active) setRows([]);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [numDocutra, idFuente, tercero, getContabilizacion]);

  // Columnas para DynamicTable
  const columns: TableColumn[] = useMemo<TableColumn[]>(
    () => [
      { id: "CODICTA", label: "Cuenta", align: "left" },
      { id: "CCOSTO", label: "Centro Costo", align: "center" },
      { id: "DESCRITRA", label: "Descripción", align: "left" },
      {
        id: "FECHATRA",
        label: "Fecha",
        align: "center",
        format: (v) => formatDate(v),
      },
      { id: "NUMEFAC", label: "Factura", align: "center" },
      {
        id: "VENCEFAC",
        label: "Vence",
        align: "center",
        format: (v) => formatDate(v),
      },
      {
        id: "DEBITO",
        label: "Débito",
        align: "right",
        format: (v) => (v != null ? formatCOP(Number(v)) : ""),
      },
      {
        id: "CREDITO",
        label: "Crédito",
        align: "right",
        format: (v) => (v != null ? formatCOP(Number(v)) : ""),
      },
    ],
    []
  );

  // Totales para el footer
  const rowsWithFooter = useMemo(() => {
    const totalDebito = rows.reduce(
      (acc, r) => acc + (Number(r.DEBITO) || 0),
      0
    );
    const totalCredito = rows.reduce(
      (acc, r) => acc + (Number(r.CREDITO) || 0),
      0
    );

    const footerRow: Record<string, any> = {
      // el DynamicTable identifica el footer con la primera columna
      [columns[0].id]: FOOTER_ID,
      CCOSTO: "",
      DESCRITRA: "",
      FECHATRA: "",
      NUMEFAC: "",
      VENCEFAC: "",
      DEBITO: totalDebito,
      CREDITO: totalCredito,
    };

    return [...rows, footerRow];
  }, [rows, columns]);

  const handleClose = () => {
    if (onClose) onClose();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      aria-labelledby="ver-asiento-title"
    >
      <DialogTitle
        id="ver-asiento-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            component="i"
            className="fas fa-file-invoice-dollar"
            aria-hidden
            sx={{ color: "primary.main", fontSize: 20 }}
          />
          <Typography variant="h6" fontWeight={700}>
            Asiento contable
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar" onClick={handleClose} size="small">
          <Box
            component="i"
            className="fas fa-times"
            aria-hidden
            sx={{ fontSize: 18 }}
          />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof error === "string"
              ? error
              : "Error al cargar el asiento contable"}
          </Alert>
        ) : null}

        {loading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            py={6}
          >
            <CircularProgress color="primary" size={32} />
          </Box>
        ) : (
          <div>
            <Box sx={{ backgroundColor: 'action.hover', borderRadius: 1, px: 1.5, py: 1, mb: 1 }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <Chip
                  size="medium"
                  variant="outlined"
                  color="primary"
                  icon={<Box component="i" className="fas fa-file-invoice" aria-hidden sx={{ fontSize: 13, color: 'primary.main' }} />}
                  label={`Documento: ${numDocutra}`}
                />
                <Chip
                  size="medium"
                  variant="outlined"
                  color="primary"
                  icon={<Box component="i" className="fas fa-database" aria-hidden sx={{ fontSize: 13, color: 'primary.main' }} />}
                  label={`Fuente: ${idFuente}`}
                />
                <Chip
                  size="medium"
                  variant="outlined"
                  color="primary"
                  icon={<Box component="i" className="fas fa-user" aria-hidden sx={{ fontSize: 13, color: 'primary.main' }} />}
                  label={`Tercero: ${tercero}`}
                />
              </Stack>
            </Box>

            <DynamicTable
              columns={columns}
              rows={rowsWithFooter}
              showFooter
              footerIdentifier={FOOTER_ID}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VerAsientoContableTable;
  