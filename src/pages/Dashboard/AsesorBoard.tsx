import { Suspense, lazy } from "react";
import { Alert } from "react-bootstrap";
import { features } from "@app/config/features";

const AsesorLiteDashboardPageLazy = lazy(() =>
  import("@app/pages/AsesorLiteDashboard/AsesorLiteDashboardPage").then((m) => ({
    default: m.AsesorLiteDashboardPage,
  })),
);

export default function AsesorBoard() {
  if (!features.asesorLiteDashboardEnabled) {
    return (
      <div className="container-fluid">
        <Alert variant="info">El tablero de asesor está desactivado.</Alert>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="container-fluid py-4 text-muted">Cargando tablero...</div>}>
      <AsesorLiteDashboardPageLazy />
    </Suspense>
  );
}
