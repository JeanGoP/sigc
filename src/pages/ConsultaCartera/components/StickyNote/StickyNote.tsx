import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";

type Entrada = {
  id: string;
  user: string;
  text: string;
  timestamp: string;
};

type Props = {
  clientId: string;
  currentUser: string;
};

export const StickyNote: React.FC<Props> = ({ clientId, currentUser }) => {
  // =========================
  // 🔹 "Base de datos" en memoria
  // =========================
  const [dbNotas, setDbNotas] = useState<Record<string, Entrada[]>>({});

  // Contenido local de esta nota
  const [loading, setLoading] = useState(true);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [nuevoTexto, setNuevoTexto] = useState("");

  // Control de visibilidad
  const [visible, setVisible] = useState(false);

  // Para scroll automático al final
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // =========================
  // 🔹 Cargar datos en memoria
  // =========================
  useEffect(() => {
    if (!visible) return;

    setLoading(true);

    // Simula GET
    const data = dbNotas[clientId] ?? [];
    setEntradas(data);

    setTimeout(() => setLoading(false), 200);
    setTimeout(() => scrollBottom(), 250);
  }, [visible]);

  const scrollBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // =========================
  // 🔹 Guardar nuevo texto (append)
  // =========================
  const agregarEntrada = () => {
    if (!nuevoTexto.trim()) return;

    const nueva: Entrada = {
      id: crypto.randomUUID(),
      user: currentUser,
      text: nuevoTexto,
      timestamp: new Date().toISOString(),
    };

    const lista = [...(dbNotas[clientId] ?? []), nueva];

    // Simula POST
    setDbNotas({
      ...dbNotas,
      [clientId]: lista,
    });

    setEntradas(lista);
    setNuevoTexto("");
    scrollBottom();
  };

  // =========================
  // 🔹 Función para centrar el sticky
  // =========================
  const [pos, setPos] = useState({ x: 300, y: 100 });
  const centerNote = () => {
    setPos({ x: window.innerWidth / 2 - 175, y: 120 });
  };

  // =========================
  // 🔹 Render
  // =========================
  return (
    <>
      {/* Botón que abre la nota */}
      <button
        onClick={() => setVisible(true)}
        style={{
          padding: "10px 15px",
          background: "#ffd54f",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        📝 Nota del Cliente
      </button>

      {visible && (
        <Rnd
          size={{ width: 350, height: 400 }}
          position={pos}
          onDragStop={(_, d) => setPos({ x: d.x, y: d.y })}
          onResizeStop={(_, __, ref) => {}}
          bounds="window"
          style={{
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#fff8a6",
              border: "2px solid #e8d26c",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
              padding: 8,
            }}
          >
            {/* HEADER */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <strong>Sticky Note - Cliente {clientId}</strong>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={centerNote}
                  style={{
                    padding: "3px 6px",
                    fontSize: 12,
                    border: "none",
                    background: "#ffe066",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Centrar
                </button>

                <button
                  onClick={() => setVisible(false)}
                  style={{
                    padding: "3px 6px",
                    fontSize: 12,
                    border: "none",
                    background: "#ff6b6b",
                    borderRadius: 4,
                    cursor: "pointer",
                    color: "#fff",
                  }}
                >
                  X
                </button>
              </div>
            </div>

            {/* CUERPO: LISTA DE ENTRADAS */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                background: "#fffad1",
                padding: 6,
                borderRadius: 6,
                border: "1px solid #e2d480",
              }}
            >
              {loading && <p>Cargando...</p>}

              {!loading &&
                entradas.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      marginBottom: 10,
                      padding: 6,
                      background: "#fff5b1",
                      borderRadius: 5,
                      borderLeft: "4px solid #d4b100",
                    }}
                  >
                    <div style={{ fontSize: 12, marginBottom: 3 }}>
                      <b>{e.user}</b>{" "}
                      <span style={{ opacity: 0.6 }}>
                        {new Date(e.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ fontSize: 14 }}>{e.text}</div>
                  </div>
                ))}

              <div ref={bottomRef}></div>
            </div>

            {/* INPUT PARA NUEVA ENTRADA */}
            <div style={{ marginTop: 6 }}>
              <textarea
                value={nuevoTexto}
                onChange={(e) => setNuevoTexto(e.target.value)}
                placeholder="Escribe algo..."
                style={{
                  width: "100%",
                  height: 50,
                  borderRadius: 6,
                  border: "1px solid #d5c676",
                  padding: 6,
                  resize: "none",
                }}
              />

              <button
                onClick={agregarEntrada}
                style={{
                  marginTop: 4,
                  width: "100%",
                  padding: "6px 0",
                  background: "#ffd54f",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Agregar
              </button>
            </div>
          </div>
        </Rnd>
      )}
    </>
  );
};
