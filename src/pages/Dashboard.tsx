import React, { useState, useEffect } from "react";
import { useAppSelector } from "@app/store/store";
import { can } from "@app/utils/security";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import CarteraBoard  from "./Dashboard/CarteraBoard";
import InicioBoard   from "./Dashboard/InicioBoard";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
);

const ACCENT = "#4f86c6";

const BOARDS: { key: string; label: string; icon: string; permission: string | null; component: React.ComponentType }[] = [
  { key: "inicio",   label: "Inicio",  icon: "fas fa-home",   permission: null,               component: InicioBoard },
  { key: "cartera",  label: "Cartera", icon: "fas fa-wallet", permission: "dashboard.cartera", component: CarteraBoard },
];

const Dashboard = () => {
  const permissions = useAppSelector((state) => state.security.permissions);

  const visibleBoards = BOARDS.filter((b) => !b.permission || can(permissions, b.permission));
  const [activeKey, setActiveKey] = useState(visibleBoards[0]?.key ?? "");

  useEffect(() => {
    setActiveKey(visibleBoards[0]?.key ?? "");
  }, [permissions]);
  const [hovered, setHovered] = useState<string | null>(null);

  const ActiveBoard = visibleBoards.find((b) => b.key === activeKey)?.component ?? null;

  return (
    <>
      <section className="content">
        <div className="container-fluid">
          {visibleBoards.length === 0 ? (
            <div className="text-center text-muted py-5">
              No tienes acceso a ningún tablero.
            </div>
          ) : (
            <>
              {/* Selector de tablero */}
              <div style={{
                overflowX: "auto",
                marginBottom: 4,
                paddingBottom: 2,
              }}>
                <div style={{
                  display: "flex",
                  minWidth: "max-content",
                  borderBottom: "2px solid #e8eaed",
                  gap: 0,
                }}>
                  {visibleBoards.map((board) => {
                    const isActive = board.key === activeKey;
                    const isHovered = hovered === board.key && !isActive;
                    return (
                      <button
                        key={board.key}
                        onClick={() => setActiveKey(board.key)}
                        onMouseEnter={() => setHovered(board.key)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "11px 20px",
                          border: "none",
                          borderBottom: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                          marginBottom: -2,
                          background: isHovered ? "#f5f7fa" : "transparent",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? ACCENT : isHovered ? "#3d4a56" : "#7a8a99",
                          whiteSpace: "nowrap",
                          transition: "color 0.15s, background 0.15s, border-color 0.15s",
                          borderRadius: "6px 6px 0 0",
                        }}
                      >
                        <i
                          className={board.icon}
                          style={{ fontSize: 12 }}
                        />
                        {board.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 20 }} />

              {ActiveBoard && <ActiveBoard />}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default Dashboard;
