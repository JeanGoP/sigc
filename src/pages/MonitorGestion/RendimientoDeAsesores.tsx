import React from "react";
import { Card, Spinner, Alert } from "react-bootstrap";
import { RendimientoAsesoresFilters } from "./components/RendimientoAsesoresFilters";
import { RendimientoAsesoresTable } from "./components/RendimientoAsesoresTable";
import { useRendimientoAsesoresPage } from "./hooks/useRendimientoAsesoresPage";

export const RendimientoDeAsesores: React.FC = () => {
  const {
    columns,
    error,
    filters,
    handleConsultar,
    loading,
    rows,
    setFilterValue,
  } = useRendimientoAsesoresPage();

  return (
    <div className="container-fluid mt-3">
      <Card className="p-3 mb-3">
        <RendimientoAsesoresFilters
          filters={filters}
          onChange={setFilterValue}
          onConsultar={() => {
            void handleConsultar();
          }}
        />
      </Card>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && <RendimientoAsesoresTable columns={columns} rows={rows} />}
    </div>
  );
};
