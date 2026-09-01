import { Col, Row } from "react-bootstrap";
import { useCallback, useEffect, useMemo, useState } from "react";
import KpisSection from "./cartera/KpisSection";
import DistribucionSaldoChart from "./cartera/DistribucionSaldoChart";
import CarteraVencidaChart from "./cartera/CarteraVencidaChart";
import RecaudoChart from "./cartera/RecaudoChart";
import IndiceRecaudoChart from "./cartera/IndiceRecaudoChart";
import ConcentracionCarteraChart from "./cartera/ConcentracionCarteraChart";
import ComposicionRecaudoPorCarteraChart from "./cartera/ComposicionRecaudoPorCarteraChart";
import BubbleRiesgoChart from "./cartera/BubbleRiesgoChart";
import ComparativoSaldoChart from "./cartera/ComparativoSaldoChart";
import ComparativoAgingChart from "./cartera/ComparativoAgingChart";
import MaximizeWrapper from "./cartera/MaximizeWrapper";
import { MaximizeProvider } from "./cartera/MaximizeContext";
import { CarteraCuentaMultiSelect } from "./cartera/components/CarteraCuentaMultiSelect";
import { CarteraToolbar } from "./cartera/components/CarteraToolbar";
import { CarteraExclusionesModal } from "./cartera/components/CarteraExclusionesModal";
import { useCarteraBoard } from "./cartera/hooks/useCarteraBoard";

export default function CarteraBoard() {
  const {
    fecha,
    data,
    accountOptions,
    lastFecha,
    loading,
    error,
    cuentasExcluidas,
    loadingCuentasExcluidas,
    handleFechaChange,
    handleConsultar,
    handleDescargarCsv,
    handleAgregarCuentaExcluida,
    handleEliminarCuentaExcluida,
  } = useCarteraBoard();
  const [ocultasGlobales, setOcultasGlobales] = useState<Set<string>>(new Set());
  const [showExclusionesModal, setShowExclusionesModal] = useState(false);

  const visibleData = useMemo(
    () => data.filter((row) => !ocultasGlobales.has(row.codicta)),
    [data, ocultasGlobales],
  );

  const cuentaOptions = useMemo(
    () => data.map((row) => ({ value: row.codicta, label: row.desccta })),
    [data],
  );

  const selectedCodictas = useMemo(
    () =>
      new Set(
        cuentaOptions
          .map((option) => option.value)
          .filter((value) => !ocultasGlobales.has(value)),
      ),
    [cuentaOptions, ocultasGlobales],
  );

  const handleSelectedChange = useCallback(
    (nextSelected: Set<string>) => {
      const all = cuentaOptions.map((option) => option.value);
      setOcultasGlobales(new Set(all.filter((value) => !nextSelected.has(value))));
    },
    [cuentaOptions],
  );

  useEffect(() => {
    const allowed = new Set(cuentaOptions.map((option) => option.value));
    const next = new Set([...ocultasGlobales].filter((value) => allowed.has(value)));

    if (next.size !== ocultasGlobales.size) {
      setOcultasGlobales(next);
    }
  }, [cuentaOptions, ocultasGlobales]);

  return (
    <MaximizeProvider>
      <>
        <CarteraToolbar
          fecha={fecha}
          lastFecha={lastFecha}
          loading={loading}
          error={error}
          cuentasExcluidasCount={cuentasExcluidas.length}
          hasData={data.length > 0}
          onOpenExclusiones={() => setShowExclusionesModal(true)}
          onDescargarCsv={handleDescargarCsv}
          onFechaChange={handleFechaChange}
          onConsultar={handleConsultar}
        />

        <CarteraExclusionesModal
          show={showExclusionesModal}
          onHide={() => setShowExclusionesModal(false)}
          loading={loadingCuentasExcluidas}
          accountOptions={accountOptions}
          cuentasExcluidas={cuentasExcluidas}
          onAgregarCuenta={async (cuenta) =>
            handleAgregarCuentaExcluida(cuenta)
          }
          onEliminarCuenta={async (cuenta) =>
            handleEliminarCuentaExcluida(cuenta)
          }
        />

        {data.length === 0 && !loading && (
          <div
            style={{
              textAlign: "center",
              color: "#bbb",
              padding: "80px 0",
              fontSize: 14,
            }}
          >
            Selecciona una fecha y presiona{" "}
            <strong style={{ color: "#4f86c6" }}>Consultar</strong> para cargar
            el dashboard.
          </div>
        )}

        {data.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <CarteraCuentaMultiSelect
                options={cuentaOptions}
                selectedValues={selectedCodictas}
                onSelectedValuesChange={handleSelectedChange}
              />
            </div>

            <KpisSection data={visibleData} />

            <Row className="mb-3" style={{ rowGap: 16 }}>
              <Col md={12}>
                <MaximizeWrapper>
                  <ComparativoAgingChart data={visibleData} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row style={{ rowGap: 16 }}>
              <Col md={12}>
                <MaximizeWrapper>
                  <RecaudoChart data={visibleData} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="mb-3" style={{ rowGap: 16 }}>
              <Col md={12}>
                <MaximizeWrapper>
                  <ComparativoSaldoChart data={visibleData} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="mb-3" style={{ rowGap: 16 }}>
              <Col md={12}>
                <MaximizeWrapper>
                  <DistribucionSaldoChart data={visibleData} />
                </MaximizeWrapper>
              </Col>
              {/* <Col md={7}>
                <MaximizeWrapper>
                  <ConcentracionCarteraChart data={data} />
                </MaximizeWrapper>
              </Col> */}
            </Row>

            {/* RadarSaludChart ("Perfil de salud por cartera") retirado por
                decisión del usuario. BubbleRiesgoChart pasa a ancho completo
                para no dejar 5 columnas vacías a su derecha. */}
            <Row className="mb-3" style={{ rowGap: 16 }}>
              <Col md={12}>
                <MaximizeWrapper>
                  <BubbleRiesgoChart data={visibleData} />
                </MaximizeWrapper>
              </Col>
            </Row>

            {/* EficienciaRecuperacionChart ("Eficiencia de recuperacion -
                Vencida vs Recaudo") retirado por decisión del usuario. */}

            <Row className="mb-3" style={{ rowGap: 16 }}>
              <Col md={12}>
                <MaximizeWrapper>
                  <ComposicionRecaudoPorCarteraChart data={visibleData} />
                </MaximizeWrapper>
              </Col>
            </Row>

            {/* MixedRecaudoIndiceChart ("Recaudo vs Indice de recaudo por
                cartera") retirado por decisión del usuario. */}

            <Row className="mb-3" style={{ rowGap: 16 }}>
              <Col md={12}>
                <MaximizeWrapper>
                  <CarteraVencidaChart data={visibleData} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="mb-3" style={{ rowGap: 16 }}>
              <Col md={12}>
                <MaximizeWrapper>
                  <IndiceRecaudoChart data={visibleData} />
                </MaximizeWrapper>
              </Col>
            </Row>
          </>
        )}
      </>
    </MaximizeProvider>
  );
}
