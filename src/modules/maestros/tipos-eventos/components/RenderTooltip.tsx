import { Tooltip } from "react-bootstrap";
import moment from "moment";

const renderTooltip = (evento: any, idx: number) => {
  const fechaHora = moment(evento.fechaHoraProgramada);

  const tieneFecha = evento.fechaHoraProgramada != null;
  const tieneHora = fechaHora.isValid() && fechaHora.format('HH:mm') !== '00:00';
  const tieneMonto = typeof evento.montoCompromiso === 'number';

  return (

    <div id={`tooltip-${idx}`}>
      <div>sadasd<strong>{evento.tipoEvento || 'Evento'}</strong></div>
      {tieneFecha && (
        <div>Fecha: {fechaHora.format('YYYY-MM-DD')}</div>
      )}
      {tieneHora && (
        <div>Hora: {fechaHora.format('HH:mm')}</div>
      )}
      {tieneMonto && (
        <div>Monto: ${evento.montoCompromiso.toFixed(2)}</div>
      )}
    </div>
  );
};

export const RenderTooltip = ({ evento, idx }: { evento: any; idx: number }) => {
  return renderTooltip(evento, idx);
};