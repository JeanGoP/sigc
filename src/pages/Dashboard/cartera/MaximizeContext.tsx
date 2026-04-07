import { createContext, useContext, useState } from "react";

// Contexto global: controla qué gráfica está maximizada
interface GlobalMaxCtx {
  maximizedId: string | null;
  setMaximizedId: (id: string | null) => void;
}

export const GlobalMaxContext = createContext<GlobalMaxCtx>({
  maximizedId: null,
  setMaximizedId: () => {},
});

export const useGlobalMax = () => useContext(GlobalMaxContext);

export function MaximizeProvider({ children }: { children: React.ReactNode }) {
  const [maximizedId, setMaximizedId] = useState<string | null>(null);
  return (
    <GlobalMaxContext.Provider value={{ maximizedId, setMaximizedId }}>
      {children}
    </GlobalMaxContext.Provider>
  );
}

// Contexto local: le dice al chart si ÉL está maximizado
export const MaximizeContext = createContext(false);
export const useMaximize = () => useContext(MaximizeContext);
