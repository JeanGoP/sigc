import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useNotasClienteService } from "@app/services/ConsultaCartera/NotasClienteService";
import { useAppSelector } from "@app/store/store";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Nota = {
  id: string;
  userId: number;
  userName: string;
  texto: string;
  creadoEn: string; // ISO string
};

type Props = {
  clienteId: string;
  currentUserId: number;
  currentUserName: string;
  isAdmin: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function colorDeNombre(nombre: string): string {
  const colores = [
    "#4f86c6", "#6ab187", "#d9534f", "#f0ad4e",
    "#9b59b6", "#1abc9c", "#e67e22", "#2980b9",
  ];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash += nombre.charCodeAt(i);
  return colores[hash % colores.length];
}

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d}d`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

// ─── Componente ──────────────────────────────────────────────────────────────

export const StickyNote: React.FC<Props> = ({
  clienteId,
  currentUserId,
  currentUserName,
  isAdmin,
}) => {
  const { listar, insertar, eliminar: eliminarApi } = useNotasClienteService();

  const [visible, setVisible] = useState(false);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 320, height: 420 });
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const isMobile = screenSize === "xs";
  const [, tick] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Recargar notas cuando cambia el cliente
  useEffect(() => {
    setTexto("");
    setBusqueda("");
    listar(clienteId).then((res) => {
      if (res?.success) {
        setNotas(
          (res.data ?? []).map((n) => ({
            id: n.id,
            userId: n.userId,
            userName: n.userName,
            texto: n.texto,
            creadoEn: n.creadoEn,
          }))
        );
      }
    });
  }, [clienteId]);

  // Ir al fondo antes del paint (sin parpadeo)
  useLayoutEffect(() => {
    if (visible && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visible, notas]);

  // Actualizar timestamps cada minuto mientras el panel está abierto
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => tick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [visible]);

  const scrollAbajo = () => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  const agregar = async () => {
    if (!texto.trim()) return;
    const nueva: Nota = {
      id: crypto.randomUUID(),
      userId: currentUserId,
      userName: currentUserName,
      texto: texto.trim(),
      creadoEn: new Date().toISOString(),
    };
    const res = await insertar({ id: nueva.id, cliente: clienteId, userId: nueva.userId, texto: nueva.texto });
    if (res?.success) {
      setNotas((prev) => [...prev, nueva]);
      setTexto("");
      scrollAbajo();
    }
  };

  const eliminar = async (notaId: string) => {
    const res = await eliminarApi(notaId, currentUserId, isAdmin);
    if (res?.success) {
      setNotas((prev) => prev.filter((n) => n.id !== notaId));
    }
  };

  const textoValido = texto.trim().length > 0;

  const notasFiltradas = busqueda.trim()
    ? notas.filter((n) =>
        n.texto.toLowerCase().includes(busqueda.toLowerCase()) ||
        n.userName.toLowerCase().includes(busqueda.toLowerCase())
      )
    : notas;

  const puedeEliminar = (nota: Nota) =>
    isAdmin || nota.userId === currentUserId;

  return (
    <>
      {/* ── Botón activador ── */}
      <button
        onClick={() => {
          if (!visible) {
            setPos({
              x: Math.max(0, window.innerWidth / 2 - 160),
              y: Math.max(0, window.innerHeight / 2 - 210),
            });
          }
          setVisible((v) => !v);
        }}
        title="Notas del cliente"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          background: visible ? "#343a40" : "#f5f5f5",
          color: visible ? "#fff" : "#444",
          border: "1px solid #ddd",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          transition: "all 0.15s",
        }}
      >
        <FontAwesomeIcon icon={faCommentDots} />
        Notas
        {notas.length > 0 && (
          <span
            style={{
              background: "#4f86c6",
              color: "#fff",
              borderRadius: 10,
              fontSize: 11,
              padding: "1px 6px",
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            {notas.length}
          </span>
        )}
      </button>

      {/* ── Panel flotante ── */}
      {visible && (
        <div style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none" }}>
        <Rnd
          /* En móvil el panel deja de flotar: ocupa la pantalla completa y se
             desactivan drag y resize (arrastrar una nota de 320x420 en un viewport
             de 375px no es usable, y los 420px de alto no caben en landscape). */
          size={isMobile ? { width: "100vw", height: "100dvh" } : size}
          position={isMobile ? { x: 0, y: 0 } : pos}
          minWidth={isMobile ? 0 : 320}
          minHeight={isMobile ? 0 : 420}
          bounds={isMobile ? undefined : "window"}
          disableDragging={isMobile}
          enableResizing={!isMobile}
          onDragStop={(_, d) => setPos({ x: d.x, y: d.y })}
          onResizeStop={(_, __, ref, ___, position) => {
            setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
            setPos(position);
          }}
          style={{ pointerEvents: "all" }}
          dragHandleClassName="sticky-handle"
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: isMobile ? 0 : 10,
              overflow: "hidden",
              boxShadow: isMobile ? "none" : "0 8px 32px rgba(0,0,0,0.22)",
              border: isMobile ? "none" : "1px solid #e0e0e0",
              background: "#fff",
            }}
          >
            {/* Header */}
            <div
              className="sticky-handle"
              style={{
                background: "#343a40",
                color: "#fff",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: isMobile ? "default" : "grab",
                userSelect: "none",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FontAwesomeIcon icon={faCommentDots} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Notas · <span style={{ color: "#aaa", fontWeight: 400 }}>{clienteId}</span>
                </span>
              </div>
              <button
                onClick={() => setVisible(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#aaa",
                  cursor: "pointer",
                  fontSize: isMobile ? 24 : 18,
                  lineHeight: 1,
                  /* En móvil es la única forma de cerrar el panel (ya no hay
                     drag ni área alrededor), así que necesita área de toque real. */
                  padding: isMobile ? "8px 14px" : "4px 6px",
                  borderRadius: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Buscador */}
            {notas.length > 0 && (
              <div style={{ padding: "6px 12px", borderBottom: "1px solid #eee", flexShrink: 0 }}>
                <div style={{ position: "relative" }}>
                  <FontAwesomeIcon
                    icon={faSearch}
                    style={{
                      position: "absolute",
                      left: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#bbb",
                      fontSize: 11,
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar en notas..."
                    style={{
                      width: "100%",
                      border: "1px solid #e0e0e0",
                      borderRadius: 6,
                      padding: "4px 28px",
                      fontSize: 12,
                      outline: "none",
                      background: "#f9f9f9",
                      boxSizing: "border-box",
                    }}
                  />
                  {busqueda && (
                    <button
                      onClick={() => setBusqueda("")}
                      style={{
                        position: "absolute",
                        right: 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#bbb",
                        fontSize: 11,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lista de notas */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {notas.length === 0 && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#bbb",
                    fontSize: 13,
                  }}
                >
                  Sin notas aún
                </div>
              )}

              {busqueda.trim() && notasFiltradas.length === 0 && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 13 }}>
                  Sin resultados para "{busqueda}"
                </div>
              )}

              {notasFiltradas.map((nota) => (
                <div
                  key={nota.id}
                  onMouseEnter={() => setHoveredId(nota.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: "flex",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 7,
                    background: hoveredId === nota.id ? "#f9f9f9" : "transparent",
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: colorDeNombre(nota.userName),
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {iniciales(nota.userName)}
                  </div>

                  {/* Contenido */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>
                        {nota.userName}
                      </span>
                      <span style={{ fontSize: 11, color: "#bbb" }}>
                        {tiempoRelativo(nota.creadoEn)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#444",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {nota.texto}
                    </div>
                  </div>

                  {/* Botón eliminar */}
                  {puedeEliminar(nota) && hoveredId === nota.id && (
                    <button
                      onClick={() => eliminar(nota.id)}
                      title="Eliminar nota"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#e53935",
                        fontSize: 13,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      🗑
                    </button>
                  )}
                </div>
              ))}

            </div>

            {/* Divisor */}
            <div style={{ height: 1, background: "#eee", flexShrink: 0 }} />

            {/* Input */}
            <div style={{ padding: "10px 12px", flexShrink: 0, background: "#fafafa" }}>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) agregar();
                }}
                placeholder="Escribe una nota... (Ctrl+Enter para agregar)"
                rows={3}
                style={{
                  width: "100%",
                  resize: "none",
                  border: "1px solid #e0e0e0",
                  borderRadius: 6,
                  padding: "7px 10px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={agregar}
                disabled={!textoValido}
                style={{
                  marginTop: 6,
                  width: "100%",
                  padding: "7px 0",
                  background: textoValido ? "#343a40" : "#e0e0e0",
                  color: textoValido ? "#fff" : "#aaa",
                  border: "none",
                  borderRadius: 6,
                  cursor: textoValido ? "pointer" : "default",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                Agregar
              </button>
            </div>
          </div>
        </Rnd>
        </div>
      )}
    </>
  );
};
