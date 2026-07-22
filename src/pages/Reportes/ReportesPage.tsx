import React, { useEffect, useRef, useState } from "react";
import { BuscadorSelect } from "@app/components/BuscadorSelect/BuscadorSelect";
import { useReportesPage } from "./hooks/useReportesPage";

function resaltarCoincidencia(texto: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return texto;
  const idx = texto.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return texto;
  return (
    <>
      {texto.slice(0, idx)}
      <mark style={{ backgroundColor: "#fff3a0", padding: 0, borderRadius: 2 }}>
        {texto.slice(idx, idx + q.length)}
      </mark>
      {texto.slice(idx + q.length)}
    </>
  );
}

const ReportesPage: React.FC = () => {
  const {
    reportes,
    tipos,
    tipoSeleccionado,
    reporteSeleccionado,
    filtros,
    filtrosValues,
    cargando,
    generando,
    pdfPreviewUrl,
    seleccionarTipo,
    seleccionarReporte,
    actualizarFiltro,
    generarPDF,
    generarExcel,
    generarCSV,
    descargarPDF,
    fetchOpcionesFiltro,
  } = useReportesPage();

  const [busquedaReportes, setBusquedaReportes] = useState("");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const selectorRef = useRef<HTMLDivElement>(null);
  const busquedaInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setSelectorAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  useEffect(() => {
    if (selectorAbierto) {
      setIndiceActivo(0);
      requestAnimationFrame(() => busquedaInputRef.current?.focus());
    }
  }, [selectorAbierto]);

  const busquedaLower = busquedaReportes.trim().toLowerCase();
  const reportesFiltrados =
    (tipoSeleccionado === "Todas" ? reportes : reportes.filter((r) => r.tipo === tipoSeleccionado))
      .filter(
        (r) =>
          !busquedaLower ||
          r.nombre.toLowerCase().includes(busquedaLower) ||
          r.descripcion?.toLowerCase().includes(busquedaLower) ||
          r.tipo.toLowerCase().includes(busquedaLower)
      );

  useEffect(() => {
    setIndiceActivo((i) => Math.min(i, Math.max(reportesFiltrados.length - 1, 0)));
  }, [reportesFiltrados.length]);

  useEffect(() => {
    const codigo = reportesFiltrados[indiceActivo]?.codigoReporte;
    if (codigo) {
      itemRefs.current.get(codigo)?.scrollIntoView({ block: "nearest" });
    }
  }, [indiceActivo, reportesFiltrados]);

  const tipoOptions = tipos.map((t) => ({ label: t, value: t }));
  const hayFiltrosObligatorios = filtros.some((f) => f.obligatorio);
  const obligatoriosCompletados = hayFiltrosObligatorios
    ? filtros
        .filter((f) => f.obligatorio)
        .every((f) => filtrosValues[f.paramName]?.trim())
    : true;
  const puedeGenerar = !generando && obligatoriosCompletados;

  const handleSeleccionarReporte = (codigo: string) => {
    seleccionarReporte(codigo);
    setSelectorAbierto(false);
    setBusquedaReportes("");
  };

  const handleBusquedaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceActivo((i) => Math.min(i + 1, reportesFiltrados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const seleccionado = reportesFiltrados[indiceActivo];
      if (seleccionado) handleSeleccionarReporte(seleccionado.codigoReporte);
    } else if (e.key === "Escape") {
      setSelectorAbierto(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <section className="content" style={{ flex: 1, overflow: "hidden", paddingTop: 12, paddingBottom: 12 }}>
        <div className="container-fluid" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Selector de reporte - combobox desplegable */}
          <div className="mb-3 flex-shrink-0" style={{ position: "relative", maxWidth: 640 }} ref={selectorRef}>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100 d-flex justify-content-between align-items-center"
              style={{
                borderRadius: 8,
                boxShadow: selectorAbierto ? "0 0 0 3px rgba(13, 110, 253, 0.15)" : undefined,
                borderColor: selectorAbierto ? "#86b7fe" : undefined,
              }}
              onClick={() => setSelectorAbierto((v) => !v)}
              disabled={cargando}
            >
              <span className="d-flex align-items-center gap-2 text-truncate">
                {cargando ? (
                  "Cargando reportes..."
                ) : reporteSeleccionado ? (
                  <>
                    <i className={reporteSeleccionado.iconClass ?? "fas fa-file-alt"} />
                    <span className="text-truncate">{reporteSeleccionado.nombre}</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-search" />
                    Seleccionar un reporte...
                  </>
                )}
              </span>
              <i className={`fas fa-chevron-${selectorAbierto ? "up" : "down"} small`} />
            </button>

            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                zIndex: 1050,
                display: "flex",
                flexDirection: "column",
                maxHeight: "min(60vh, 480px)",
                overflow: "hidden",
                opacity: selectorAbierto ? 1 : 0,
                transform: selectorAbierto ? "translateY(0)" : "translateY(-6px)",
                pointerEvents: selectorAbierto ? "auto" : "none",
                transition: "opacity 0.15s ease, transform 0.15s ease",
              }}
            >
              <div className="p-2 d-flex flex-column flex-sm-row gap-2 border-bottom">
                <select
                  className="form-control form-control-sm"
                  style={{ maxWidth: 160, flexShrink: 0 }}
                  value={tipoSeleccionado}
                  onChange={(e) => seleccionarTipo(e.target.value)}
                >
                  {tipoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="input-group input-group-sm">
                  <span className="input-group-text">
                    <i className="fas fa-search" style={{ fontSize: 11 }} />
                  </span>
                  <input
                    ref={busquedaInputRef}
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Buscar reporte..."
                    value={busquedaReportes}
                    onChange={(e) => setBusquedaReportes(e.target.value)}
                    onKeyDown={handleBusquedaKeyDown}
                  />
                  {busquedaReportes && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setBusquedaReportes("")}
                      title="Limpiar búsqueda"
                    >
                      <i className="fas fa-times" style={{ fontSize: 11 }} />
                    </button>
                  )}
                </div>
              </div>

              <div className="list-group list-group-flush" style={{ overflowY: "auto" }}>
                {reportesFiltrados.map((r, index) => {
                  const esSeleccionado = reporteSeleccionado?.codigoReporte === r.codigoReporte;
                  const esActivo = index === indiceActivo;
                  return (
                    <button
                      key={r.codigoReporte}
                      ref={(el) => {
                        if (el) itemRefs.current.set(r.codigoReporte, el);
                        else itemRefs.current.delete(r.codigoReporte);
                      }}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${
                        esSeleccionado ? "active" : esActivo ? "bg-light" : ""
                      }`}
                      onMouseEnter={() => setIndiceActivo(index)}
                      onClick={() => handleSeleccionarReporte(r.codigoReporte)}
                    >
                      <i className={r.iconClass ?? "fas fa-file-alt"} style={{ width: 20, textAlign: "center" }} />
                      <div className="text-start">
                        <div className="fw-semibold small">{resaltarCoincidencia(r.nombre, busquedaReportes)}</div>
                        {r.descripcion && (
                          <small className={esSeleccionado ? "text-white-50" : "text-muted"}>
                            {r.descripcion}
                          </small>
                        )}
                      </div>
                    </button>
                  );
                })}
                {reportesFiltrados.length === 0 && (
                  <div className="text-muted small py-3 text-center">Sin reportes en esta categoría</div>
                )}
              </div>
            </div>
          </div>

          {/* Panel principal: filtros del reporte y preview PDF */}
          <div className="card" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            {reporteSeleccionado?.descripcion && (
              <div className="card-header py-2">
                <small className="text-muted">{reporteSeleccionado.descripcion}</small>
              </div>
            )}
            <div className="card-body" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", minHeight: 0 }}>
              {!reporteSeleccionado ? (
                <p className="text-muted text-center py-5">
                  Seleccione un reporte arriba para ver sus filtros.
                </p>
              ) : filtros.length === 0 ? (
                <p className="text-muted text-center py-3">Este reporte no tiene filtros configurados.</p>
              ) : (
                <div className="row g-3">
                  {filtros.map((f) => (
                    <div key={f.filtroId} className="col-md-4 col-lg-3">
                      <label className="form-label small fw-semibold">
                        {f.label}
                        {f.obligatorio && <span className="text-danger ms-1">*</span>}
                      </label>
                      {f.tipoFiltro === "select" ? (
                        <BuscadorSelect
                          spName={f.spOpciones}
                          codigoOpcion={f.codigoOpcion}
                          subOpcion={f.subOpcion}
                          value={filtrosValues[f.paramName] ?? f.valorDefault ?? ""}
                          onChange={(v) => actualizarFiltro(f.paramName, v)}
                          onFetchOpciones={fetchOpcionesFiltro}
                          compact
                        />
                      ) : f.tipoFiltro === "date" ? (
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={filtrosValues[f.paramName] ?? f.valorDefault ?? ""}
                          onChange={(e) => actualizarFiltro(f.paramName, e.target.value)}
                        />
                      ) : f.tipoFiltro === "number" ? (
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={filtrosValues[f.paramName] ?? f.valorDefault ?? ""}
                          onChange={(e) => actualizarFiltro(f.paramName, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={filtrosValues[f.paramName] ?? f.valorDefault ?? ""}
                          onChange={(e) => actualizarFiltro(f.paramName, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                  <div className="col-12 mt-3 d-flex align-items-center" style={{ gap: "12px" }}>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={!puedeGenerar}
                      onClick={generarPDF}
                      title="Generar PDF"
                      style={{ width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {generando ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-file-pdf" />}
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      disabled={!puedeGenerar}
                      onClick={generarExcel}
                      title="Generar Excel"
                      style={{ width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {generando ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-file-excel" />}
                    </button>
                    <button
                      className="btn btn-info btn-sm"
                      disabled={!puedeGenerar}
                      onClick={generarCSV}
                      title="Generar CSV"
                      style={{ width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {generando ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-file-csv" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Preview PDF - debajo de filtros y botones */}
              {pdfPreviewUrl && (
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #eee", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <small className="text-muted fw-semibold">Vista previa del PDF</small>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={descargarPDF}
                        title="Descargar PDF"
                        style={{ width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <i className="fas fa-download" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => window.open(pdfPreviewUrl, "_blank")}
                        title="Abrir en pestaña"
                        style={{ width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <i className="fas fa-external-link-alt" />
                      </button>
                    </div>
                  </div>
                  <iframe
                    src={pdfPreviewUrl}
                    style={{ width: "100%", height: "85vh", border: "1px solid #dee2e6", borderRadius: "4px" }}
                    title="PDF Preview"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReportesPage;
