import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card } from "react-bootstrap";
import type { Evento } from "@app/services/Calendario/CalendarioService";
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

  return (
    <div className=" mt-5 col-sm-12 col-md-12 col-lg-10" style={{ margin: "auto" }}>
      <h3>Calendario de eventos</h3>

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
