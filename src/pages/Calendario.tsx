import React, { useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card } from "react-bootstrap";
import type { Evento } from "@app/services/Calendario/CalendarioService";
import { validarDiaParaEvento } from "@app/utils/colombianHolidays";
import { CalendarioDiaModal } from "./Calendario/components/CalendarioDiaModal";
import { CalendarioEventoModal } from "./Calendario/components/CalendarioEventoModal";
import { CalendarioFilters } from "./Calendario/components/CalendarioFilters";
import { useCalendarioPage } from "./Calendario/hooks/useCalendarioPage";

moment.locale("es");

const localizer = momentLocalizer(moment);

const calendarMessages = {
  next: "Siguiente",
  previous: "Anterior",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
};

const Calendario: React.FC = () => {
  const {
    usuarios,
    usuarioFiltro,
    eventos,
    mostrarModalEvento,
    mostrarModalDia,
    eventoSeleccionado,
    cuentaFiltro,
    eventosDelDia,
    fechaSeleccionada,
    handleUsuarioFiltroChange,
    handleCuentaFiltroChange,
    handleRangeChange,
    handleSeleccionEvento,
    handleSeleccionDia,
    cerrarModalEvento,
    cerrarModalDia,
    handleMostrarMas,
  } = useCalendarioPage();

  const dayPropGetter = useCallback((date: Date) => {
    const validacion = validarDiaParaEvento(date);
    if (validacion.noHabil) {
      return {
        className: "rbc-dia-no-laborable",
        style: {
          backgroundColor: "#fff5f5",
          cursor: "not-allowed",
        },
      };
    }
    return {};
  }, []);

  const slotPropGetter = useCallback((date: Date) => {
    const validacion = validarDiaParaEvento(date);
    if (validacion.noHabil) {
      return {
        className: "rbc-slot-no-laborable",
        style: {
          backgroundColor: "#fff5f5",
          cursor: "not-allowed",
        },
      };
    }
    return {};
  }, []);

  return (
    <div className=" mt-5 col-sm-12 col-md-12 col-lg-10" style={{ margin: "auto" }}>
      <style>{`
        .rbc-day-bg.rbc-dia-no-laborable {
          background-color: #fff1f2 !important;
          cursor: not-allowed !important;
        }
        .rbc-time-slot.rbc-slot-no-laborable {
          background-color: #fff1f2 !important;
          cursor: not-allowed !important;
        }
      `}</style>
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-2">
        <h3 className="mb-0">Calendario de eventos</h3>
        <div className="d-flex align-items-center" style={{ fontSize: "0.85rem", color: "#6c757d" }}>
          <span
            style={{
              width: 14,
              height: 14,
              backgroundColor: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: 3,
              marginRight: 6,
              display: "inline-block",
            }}
          />
          <span>Domingos y festivos nacionales (No laborables)</span>
        </div>
      </div>

      <CalendarioFilters
        usuarios={usuarios}
        usuarioFiltro={usuarioFiltro}
        cuentaFiltro={cuentaFiltro}
        onUsuarioFiltroChange={handleUsuarioFiltroChange}
        onCuentaFiltroChange={handleCuentaFiltroChange}
      />

      <Card className="shadow-sm border-0">
        <Card.Body>
          <Calendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectEvent={handleSeleccionEvento}
            onSelectSlot={handleSeleccionDia}
            onRangeChange={handleRangeChange}
            style={{ height: 500 }}
            onShowMore={handleMostrarMas}
            eventPropGetter={(event: Evento) => ({
              style: { backgroundColor: event.color },
            })}
            dayPropGetter={dayPropGetter}
            slotPropGetter={slotPropGetter}
            messages={calendarMessages}
          />
        </Card.Body>
      </Card>

      <CalendarioEventoModal
        show={mostrarModalEvento}
        eventoSeleccionado={eventoSeleccionado}
        onClose={cerrarModalEvento}
      />

      <CalendarioDiaModal
        show={mostrarModalDia}
        fechaSeleccionada={fechaSeleccionada}
        eventosDelDia={eventosDelDia}
        onClose={cerrarModalDia}
      />
    </div>
  );
};

export default Calendario;
