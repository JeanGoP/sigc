import { useState } from "react";
import { MaximizeContext, useGlobalMax } from "./MaximizeContext";
import { useAppSelector } from "@app/store/store";

let idCounter = 0;

export default function MaximizeWrapper({ children }: { children: React.ReactNode }) {
  const [id] = useState(() => `mw-${++idCounter}`);
  const { maximizedId, setMaximizedId } = useGlobalMax();
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const isMobile = screenSize === "xs";

  const maximized = maximizedId === id;
  const canMaximize = maximizedId === null || maximized;

  return (
    <MaximizeContext.Provider value={maximized}>
      <div style={maximized ? {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#fff",
        overflow: "auto",
        padding: isMobile ? "12px" : "16px 24px",
      } : { position: "relative", height: "100%" }}>

        {canMaximize && (
          <button
            onClick={() => setMaximizedId(maximized ? null : id)}
            title={maximized ? "Minimizar" : "Maximizar"}
            style={{
              position: "absolute",
              top: maximized ? (isMobile ? 10 : 20) : 14,
              right: maximized ? (isMobile ? 10 : 28) : 14,
              zIndex: 10000,
              background: "none",
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: "2px 6px",
              cursor: "pointer",
              fontSize: 14,
              color: "#888",
              lineHeight: 1,
            }}
          >
            {maximized ? "⊡" : "⛶"}
          </button>
        )}

        {children}
      </div>
    </MaximizeContext.Provider>
  );
}
