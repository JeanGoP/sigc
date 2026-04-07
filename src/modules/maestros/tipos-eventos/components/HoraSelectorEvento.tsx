import React from "react";
import ReactDOM from "react-dom";
import { Form, Spinner } from "react-bootstrap";
import { HoraDispItem } from "@app/services/ConsultaCartera/HorasDispDiaService";

interface HoraSelectorEventoProps {
  fecha: string;
  value: string | null;
  onChange: (hora: string | null) => void;
  horas: HoraDispItem[];
  loading: boolean;
}

const COL_H = 200;
const ITEM_H = 34;

export const HoraSelectorEvento: React.FC<HoraSelectorEventoProps> = ({
  fecha,
  value,
  onChange,
  horas,
  loading,
}) => {
  const [open, setOpen] = React.useState(false);
  const [panelPos, setPanelPos] = React.useState<{ top: number; left: number; openUp: boolean }>({
    top: 0, left: 0, openUp: false,
  });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const horaColRef = React.useRef<HTMLDivElement>(null);
  const minColRef = React.useRef<HTMLDivElement>(null);

  const horaActual = value ? parseInt(value.split(":")[0], 10) : null;
  const minutoActual = value ? parseInt(value.split(":")[1], 10) : null;

  // Calcula posición del panel relativa al viewport
  const calcPos = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelH = COL_H + 40; // altura estimada del panel
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < panelH + 10;
    setPanelPos({
      top: openUp ? rect.top + window.scrollY - panelH - 6 : rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      openUp,
    });
  }, []);

  // Cierra al hacer clic fuera
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll al item seleccionado al abrir
  React.useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      if (horaActual !== null && horaColRef.current) {
        horaColRef.current.scrollTop = horaActual * ITEM_H - COL_H / 2 + ITEM_H / 2;
      }
      if (minutoActual !== null && minColRef.current) {
        minColRef.current.scrollTop = minutoActual * ITEM_H - COL_H / 2 + ITEM_H / 2;
      }
    });
  }, [open, horaActual, minutoActual]);

  const handleOpen = () => {
    if (!fecha || loading) return;
    calcPos();
    setOpen((v) => !v);
  };

  const minutosDeHora = (h: number): HoraDispItem[] =>
    horas.filter((x) => x.hora === h);

  const horaEstaDisponible = (h: number): boolean => {
    const mins = minutosDeHora(h);
    if (mins.length === 0) return true;
    return mins.some((m) => !m.ocupado);
  };

  const handleSelectHora = (h: number) => {
    if (!horaEstaDisponible(h)) return;
    const mins = minutosDeHora(h);
    const minMantenido = mins.find((m) => m.minuto === minutoActual && !m.ocupado);
    const primerLibre = mins.find((m) => !m.ocupado);
    const min = minMantenido?.minuto ?? primerLibre?.minuto ?? 0;
    onChange(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    // scroll minutos al nuevo minuto seleccionado
    requestAnimationFrame(() => {
      if (minColRef.current) {
        minColRef.current.scrollTop = min * ITEM_H - COL_H / 2 + ITEM_H / 2;
      }
    });
  };

  const handleSelectMinuto = (item: HoraDispItem) => {
    if (item.ocupado || horaActual === null) return;
    onChange(`${String(horaActual).padStart(2, "0")}:${String(item.minuto).padStart(2, "0")}`);
    setOpen(false);
  };

  const sinFecha = !fecha;
  const disabled = sinFecha || loading;
  const minutosActivos = horaActual !== null ? minutosDeHora(horaActual) : [];

  const itemStyle = (seleccionado: boolean, ocupado: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "3px 8px",
    padding: "5px 0",
    borderRadius: 6,
    cursor: ocupado ? "not-allowed" : "pointer",
    fontSize: 14,
    fontWeight: seleccionado ? 700 : 400,
    color: seleccionado ? "#fff" : ocupado ? "#ced4da" : "#343a40",
    background: seleccionado ? "#007bff" : "transparent",
    textDecoration: ocupado ? "line-through" : "none",
    userSelect: "none",
    transition: "background 0.1s, color 0.1s",
  });

  const colHeader = (label: string) => (
    <div style={{
      padding: "8px 16px 6px",
      fontSize: 10,
      fontWeight: 700,
      color: "#9aa0a6",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      borderBottom: "1px solid #f0f0f0",
    }}>
      {label}
    </div>
  );

  const panel = open ? (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        top: panelPos.top,
        left: panelPos.left,
        zIndex: 9999,
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 8px 28px rgba(0,0,0,0.13)",
        border: "1px solid #e9ecef",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Columna horas */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {colHeader("Hora")}
        <div ref={horaColRef} style={{ overflowY: "auto", height: COL_H, width: 80 }}>
          {Array.from({ length: 24 }, (_, h) => {
            const disponible = horaEstaDisponible(h);
            return (
              <div key={h} onClick={() => handleSelectHora(h)} style={itemStyle(horaActual === h, !disponible)}>
                {String(h).padStart(2, "0")}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ width: 1, background: "#f0f0f0" }} />

      {/* Columna minutos */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {colHeader("Min")}
        <div ref={minColRef} style={{ overflowY: "auto", height: COL_H, width: 70 }}>
          {horaActual === null ? (
            <div style={{ padding: "12px 16px", fontSize: 12, color: "#adb5bd" }}>Elige hora</div>
          ) : minutosActivos.length === 0 ? (
            <div style={{ padding: "12px 16px", fontSize: 12, color: "#adb5bd" }}>Sin datos</div>
          ) : (
            minutosActivos.map((item) => (
              <div key={item.minuto} onClick={() => handleSelectMinuto(item)} style={itemStyle(minutoActual === item.minuto, item.ocupado)}>
                {String(item.minuto).padStart(2, "0")}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Form.Label>Hora evento</Form.Label>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "calc(1.5em + .75rem + 2px)",
          padding: ".375rem .75rem",
          borderRadius: ".25rem",
          border: open ? "1px solid #80bdff" : "1px solid #ced4da",
          background: disabled ? "#e9ecef" : "#fff",
          color: disabled ? "#6c757d" : value ? "#495057" : "#adb5bd",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "1rem",
          fontWeight: 400,
          lineHeight: 1.5,
          boxShadow: open ? "0 0 0 0.2rem rgba(0,123,255,.25)" : "none",
          transition: "border-color .15s ease-in-out, box-shadow .15s ease-in-out",
          outline: "none",
        }}
      >
        {loading
          ? <Spinner animation="border" size="sm" />
          : <>
              <span style={{ fontFamily: "monospace", letterSpacing: 1 }}>
                {value ?? "--:--"}
              </span>
              <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.5, flexShrink: 0 }}>
                <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </>
        }
      </button>


      {ReactDOM.createPortal(panel, document.body)}
    </>
  );
};
