// import React, { useEffect, useMemo, useState } from "react";
// import { Alert, Spinner } from "react-bootstrap";
// import {
//   DynamicTable,
//   TableColumn,
// } from "@app/pages/ConsultaClientes/components/tablaReutilizables";
// import { StringToMoney } from "@app/utils/formattersFunctions";
// import {
//   CompromisoDePagoPorClave,
//   CompromisosDePagoPorClaveRequest,
//   useGetCompromisosDePagoPorClaveConsultaCarteraService,
// } from "@app/services/ConsultaCartera/GetCompromisosDePagoPorClaveConsultaCarteraService";

// interface TablaEventosPorClaveProps {
//   cliente: string;
//   cuenta: string;
//   factura: string;
//   idTipoEvento?: number | null;
//   estadoEspecifico?: string | null;
// }

// const formatDateTime = (value?: string | null) => {
//   if (!value) return "";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;
//   return date.toLocaleString();
// };

// const formatPercent = (value?: number | null) => {
//   if (value == null) return "";
//   const parsed = Number(value);
//   if (Number.isNaN(parsed)) return String(value);
//   return `${parsed.toFixed(2)}%`;
// };

// export const TablaEventosPorClave: React.FC<TablaEventosPorClaveProps> = ({
//   cliente,
//   cuenta,
//   factura,
//   idTipoEvento = null,
//   estadoEspecifico = null,
// }) => {
//   const { loading, error, getCompromisosDePagoPorClave } =
//     useGetCompromisosDePagoPorClaveConsultaCarteraService();
//   const [rows, setRows] = useState<CompromisoDePagoPorClave[]>([]);
//   const [localError, setLocalError] = useState<string | null>(null);

//   const hasRequiredParams = Boolean(cliente && cuenta && factura);

//   useEffect(() => {
//     let active = true;

//     const fetchData = async () => {
//       if (!hasRequiredParams) {
//         setRows([]);
//         setLocalError(null);
//         return;
//       }

//       setLocalError(null);
//       const payload: CompromisosDePagoPorClaveRequest = {
//         cliente,
//         cuenta,
//         factura,
//         idTipoEvento,
//         estadoEspecifico,
//       };

//       try {
//         const response = await getCompromisosDePagoPorClave(payload);
//         if (!active) return;
//         if (response?.success) {
//           setRows(response.data ?? []);
//         } else {
//           setRows([]);
//           if (response?.message) setLocalError(response.message);
//         }
//       } catch (_err) {
//         if (!active) return;
//         setRows([]);
//         setLocalError("Error al consultar compromisos de pago.");
//       }
//     };

//     fetchData();
//     return () => {
//       active = false;
//     };
//   }, [
//     cliente,
//     cuenta,
//     factura,
//     idTipoEvento,
//     estadoEspecifico,
//     getCompromisosDePagoPorClave,
//     hasRequiredParams,
//   ]);

//   const columns: TableColumn[] = useMemo(
//     () => [
//     //   { id: "IdEvento", label: "Id Evento", align: "center" },
//     //   { id: "numefac", label: "Factura" },
//     //   { id: "cliente", label: "Cliente" },
//     //   { id: "cuenta", label: "Cuenta" },
//     //   {
//     //     id: "FECHAGES",
//     //     label: "Fecha gestion",
//     //     align: "center",
//     //     format: (value) => formatDateTime(value),
//     //   },
//       {
//         id: "FechaHoraProgramada",
//         label: "Fecha ",
//         align: "center",
//         format: (value) => value,
//       },
//       {
//         id: "FechaCumplimientoCalc",
//         label: "F. cumplimiento",
//         align: "center",
//         format: (value) => value,
//       },
//       { id: "IdUsuarioAsignado", label: "Usuario", align: "center" },
//       { id: "NombreTipoEvento", label: "Tipo evento", align: "center" },
//       {
//         id: "MontoCompromiso",
//         label: "Valor",
//         align: "right",
//         format: (value) =>
//           value == null ? "" : `$ ${StringToMoney(value)}`,
//       },
//       {
//         id: "TotalPagado",
//         label: "Pagado",
//         align: "right",
//         format: (value) =>
//           value == null ? "" : `$ ${StringToMoney(value)}`,
//       },
//       {
//         id: "PorcentajeDePago",
//         label: "% Pago",
//         align: "right",
//         format: (value) => formatPercent(value),
//       },
//       {
//         id: "CUMPLIDO",
//         label: "Cumplido",
//         align: "center",
//         format: (value) => (Number(value) === 1 ? "Si" : "No"),
//       },
//       { id: "EstadoDeCompromiso", label: "Estado" },
//       { id: "EstadoDePago", label: "Estado pago" },
//     ],
//     []
//   );

//   if (!hasRequiredParams) {
//     return (
//       <Alert variant="info">
//         Seleccione cliente, cuenta y factura para ver los eventos.
//       </Alert>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="text-center py-3">
//         <Spinner animation="border" variant="primary" />
//       </div>
//     );
//   }

//   if (error || localError) {
//     return <Alert variant="danger">{error || localError}</Alert>;
//   }

//   return (
//     <DynamicTable
//       columns={columns}
//       rows={rows}
//       showTittle
//       tittle={{
//         tittleText: "Compromisos de pago",
//         iconClass: "fas fa-hand-holding-usd",
//       }}
//     />
//   );
// };


import React, { useEffect, useMemo, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import {
  DynamicTable,
  TableColumn,
} from "@app/pages/ConsultaClientes/components/tablaReutilizables";
import { StringToMoney } from "@app/utils/formattersFunctions";
import {
  CompromisoDePagoPorClave,
  CompromisosDePagoPorClaveRequest,
  useGetCompromisosDePagoPorClaveConsultaCarteraService,
} from "@app/services/ConsultaCartera/GetCompromisosDePagoPorClaveConsultaCarteraService";

interface TablaEventosPorClaveProps {
  cliente: string;
  cuenta: string;
  factura: string;
  idTipoEvento?: number | null;
  estadoEspecifico?: string | null;
}

const formatPercent = (value?: number | null) => {
  if (value == null) return "";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return String(value);
  return `${parsed.toFixed(2)}%`;
};

export const TablaEventosPorClave: React.FC<TablaEventosPorClaveProps> = ({
  cliente,
  cuenta,
  factura,
  idTipoEvento = null,
  estadoEspecifico = null,
}) => {
  const { loading, error, getCompromisosDePagoPorClave } =
    useGetCompromisosDePagoPorClaveConsultaCarteraService();

  const [rows, setRows] = useState<CompromisoDePagoPorClave[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const hasRequiredParams = Boolean(cliente && cuenta && factura);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!hasRequiredParams) {
        setRows([]);
        setLocalError(null);
        return;
      }

      setLocalError(null);

      const payload: CompromisosDePagoPorClaveRequest = {
        cliente,
        cuenta,
        factura,
        idTipoEvento,
        estadoEspecifico,
      };

      try {
        const response = await getCompromisosDePagoPorClave(payload);
        if (!active) return;

        if (response?.success) {
          setRows(response.data ?? []);
        } else {
          setRows([]);
          if (response?.message) setLocalError(response.message);
        }
      } catch {
        if (!active) return;
        setRows([]);
        setLocalError("Error al consultar compromisos de pago.");
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [
    cliente,
    cuenta,
    factura,
    idTipoEvento,
    estadoEspecifico,
    getCompromisosDePagoPorClave,
    hasRequiredParams,
  ]);

  /* =======================
     📊 RESUMEN DEL CLIENTE
     ======================= */
  const resumen = useMemo(() => {
    if (!rows.length) return null;

    const totalCompromisos = rows.length;
    const cumplidos = rows.filter(r => Number(r.CUMPLIDO) === 1).length;
    const incumplidos = totalCompromisos - cumplidos;

    const totalComprometido = rows.reduce(
      (acc, r) => acc + (r.MontoCompromiso ?? 0),
      0
    );

    const totalPagado = rows.reduce(
      (acc, r) => acc + (r.TotalPagado ?? 0),
      0
    );

    const porcentajeGlobal =
      totalComprometido > 0
        ? (totalPagado * 100) / totalComprometido
        : 0;

    let nivelRiesgo: "BUENO" | "MEDIO" | "ALTO" = "BUENO";
    if (incumplidos > cumplidos) nivelRiesgo = "ALTO";
    else if (incumplidos > 0) nivelRiesgo = "MEDIO";

    return {
      totalCompromisos,
      cumplidos,
      incumplidos,
      totalComprometido,
      totalPagado,
      porcentajeGlobal,
      nivelRiesgo,
    };
  }, [rows]);

  /* =======================
     📋 COLUMNAS TABLA
     ======================= */
  const columns: TableColumn[] = useMemo(
    () => [
      { id: "FechaHoraProgramada", label: "Fecha", align: "center" },
      { id: "FechaCumplimientoCalc", label: "F. cumplimiento", align: "center" },
      { id: "IdUsuarioAsignado", label: "Usuario", align: "center" },
      { id: "NombreTipoEvento", label: "Tipo evento", align: "center" },
      {
        id: "MontoCompromiso",
        label: "Valor",
        align: "right",
        format: (v) => (v == null ? "" : `$ ${StringToMoney(v)}`),
      },
      {
        id: "TotalPagado",
        label: "Pagado",
        align: "right",
        format: (v) => (v == null ? "" : `$ ${StringToMoney(v)}`),
      },
      {
        id: "PorcentajeDePago",
        label: "% Pago",
        align: "right",
        format: (v) => formatPercent(v),
      },
    //   {
    //     id: "CUMPLIDO",
    //     label: "Cumplido",
    //     align: "center",
    //     format: (v) => (Number(v) === 1 ? "Sí" : "No"),
    //   },
      { id: "EstadoDeCompromiso", label: "Estado" },
      { id: "EstadoDePago", label: "Estado pago" },
    ],
    []
  );

  /* =======================
     🧯 ESTADOS
     ======================= */
  if (!hasRequiredParams) {
    return (
      <Alert variant="info">
        Seleccione cliente, cuenta y factura para ver los eventos.
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error || localError) {
    return <Alert variant="danger">{error || localError}</Alert>;
  }

  /* =======================
     🧩 RENDER
     ======================= */
  return (
    <>
      {/* ===== RESUMEN ===== */}
     {resumen && (
  <div className="d-flex flex-wrap gap-2 mb-3">
    <div className="p-2 border rounded">
      <div className="text-muted" style={{ fontSize: 12 }}>
        Total compromisos
      </div>
      <strong style={{ fontSize: 18 }}>
        {resumen.totalCompromisos}
      </strong>
    </div>

    <div className="p-2 border rounded bg-success text-white">
      <div style={{ fontSize: 12, opacity: 0.9 }}>
        Cumplidos
      </div>
      <strong style={{ fontSize: 18 }}>
        {resumen.cumplidos}
      </strong>
    </div>

    <div className="p-2 border rounded bg-danger text-white">
      <div style={{ fontSize: 12, opacity: 0.9 }}>
        Incumplidos
      </div>
      <strong style={{ fontSize: 18 }}>
        {resumen.incumplidos}
      </strong>
    </div>

    <div className="p-2 border rounded">
      <div className="text-muted" style={{ fontSize: 12 }}>
        Total comprometido
      </div>
      <strong>
        $ {StringToMoney(resumen.totalComprometido)}
      </strong>
    </div>

    <div className="p-2 border rounded">
      <div className="text-muted" style={{ fontSize: 12 }}>
        Total pagado
      </div>
      <strong>
        $ {StringToMoney(resumen.totalPagado)}
      </strong>
    </div>

    <div
      className={`p-2 border rounded ${
        resumen.nivelRiesgo === "BUENO"
          ? "bg-success text-white"
          : resumen.nivelRiesgo === "MEDIO"
          ? "bg-warning"
          : "bg-danger text-white"
      }`}
    >
      <div style={{ fontSize: 12, opacity: 0.9 }}>
        Riesgo
      </div>
      <strong style={{ fontSize: 16 }}>
        {resumen.nivelRiesgo}
      </strong>
    </div>
  </div>
)}


      {/* ===== TABLA ===== */}
      <DynamicTable
        columns={columns}
        rows={rows}
        showTittle
        // tittle={{
        //   tittleText: "Compromisos de pago",
        //   iconClass: "fas fa-hand-holding-usd",
        // }}
      />
    </>
  );
};
