import React from "react";
import { DASHBOARD_ACCENT_COLOR } from "../domain/boards";
import type { DashboardBoardDefinition } from "../domain/types";

interface DashboardBoardSelectorProps {
  activeKey: string;
  hoveredKey: string | null;
  boards: DashboardBoardDefinition[];
  onSelect: (key: string) => void;
  onHoverChange: (key: string | null) => void;
}

export const DashboardBoardSelector: React.FC<DashboardBoardSelectorProps> = ({
  activeKey,
  hoveredKey,
  boards,
  onSelect,
  onHoverChange,
}) => {
  return (
    <div
      style={{
        overflowX: "auto",
        marginBottom: 4,
        paddingBottom: 2,
      }}
    >
      <div
        style={{
          display: "flex",
          minWidth: "max-content",
          borderBottom: "2px solid #e8eaed",
          gap: 0,
        }}
      >
        {boards.map((board) => {
          const isActive = board.key === activeKey;
          const isHovered = hoveredKey === board.key && !isActive;

          return (
            <button
              key={board.key}
              onClick={() => onSelect(board.key)}
              onMouseEnter={() => onHoverChange(board.key)}
              onMouseLeave={() => onHoverChange(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "11px 20px",
                border: "none",
                borderBottom: isActive
                  ? `2px solid ${DASHBOARD_ACCENT_COLOR}`
                  : "2px solid transparent",
                marginBottom: -2,
                background: isHovered ? "#f5f7fa" : "transparent",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive
                  ? DASHBOARD_ACCENT_COLOR
                  : isHovered
                    ? "#3d4a56"
                    : "#7a8a99",
                whiteSpace: "nowrap",
                transition: "color 0.15s, background 0.15s, border-color 0.15s",
                borderRadius: "6px 6px 0 0",
              }}
            >
              <i className={board.icon} style={{ fontSize: 12 }} />
              {board.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
