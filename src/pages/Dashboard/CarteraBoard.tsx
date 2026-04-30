import { Col, Row } from "react-bootstrap";
import KpisSection from "./cartera/KpisSection";
import DistribucionSaldoChart from "./cartera/DistribucionSaldoChart";
import CarteraVencidaChart from "./cartera/CarteraVencidaChart";
import AgingChart from "./cartera/AgingChart";
import RecaudoChart from "./cartera/RecaudoChart";
import IndiceRecaudoChart from "./cartera/IndiceRecaudoChart";
import ComposicionRecaudoChart from "./cartera/ComposicionRecaudoChart";
import ConcentracionCarteraChart from "./cartera/ConcentracionCarteraChart";
import EficienciaRecuperacionChart from "./cartera/EficienciaRecuperacionChart";
import ComposicionRecaudoPorCarteraChart from "./cartera/ComposicionRecaudoPorCarteraChart";
import BubbleRiesgoChart from "./cartera/BubbleRiesgoChart";
import MixedRecaudoIndiceChart from "./cartera/MixedRecaudoIndiceChart";
import RadarSaludChart from "./cartera/RadarSaludChart";
import ComparativoSaldoChart from "./cartera/ComparativoSaldoChart";
import ComparativoAgingChart from "./cartera/ComparativoAgingChart";
import MaximizeWrapper from "./cartera/MaximizeWrapper";
import { MaximizeProvider } from "./cartera/MaximizeContext";
import { CarteraToolbar } from "./cartera/components/CarteraToolbar";
import { useCarteraBoard } from "./cartera/hooks/useCarteraBoard";

export default function CarteraBoard() {
  const {
    fecha,
    data,
    lastFecha,
    loading,
    error,
    handleFechaChange,
    handleConsultar,
  } = useCarteraBoard();

  return (
    <MaximizeProvider>
      <>
        <CarteraToolbar
          fecha={fecha}
          lastFecha={lastFecha}
          loading={loading}
          error={error}
          onFechaChange={handleFechaChange}
          onConsultar={handleConsultar}
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
            <KpisSection data={data} />

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper>
                  <ComparativoSaldoChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper>
                  <ComparativoAgingChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={5}>
                <MaximizeWrapper>
                  <DistribucionSaldoChart data={data} />
                </MaximizeWrapper>
              </Col>
              <Col md={7}>
                <MaximizeWrapper>
                  <ConcentracionCarteraChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={7}>
                <MaximizeWrapper>
                  <BubbleRiesgoChart data={data} />
                </MaximizeWrapper>
              </Col>
              <Col md={5}>
                <MaximizeWrapper>
                  <RadarSaludChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={4}>
                <MaximizeWrapper>
                  <ComposicionRecaudoChart data={data} />
                </MaximizeWrapper>
              </Col>
              <Col md={8}>
                <MaximizeWrapper>
                  <EficienciaRecuperacionChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper>
                  <ComposicionRecaudoPorCarteraChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper>
                  <MixedRecaudoIndiceChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper>
                  <CarteraVencidaChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper>
                  <IndiceRecaudoChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <MaximizeWrapper>
                  <AgingChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={12}>
                <MaximizeWrapper>
                  <RecaudoChart data={data} />
                </MaximizeWrapper>
              </Col>
            </Row>
          </>
        )}
      </>
    </MaximizeProvider>
  );
}
