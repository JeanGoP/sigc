
// import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// import { useTranslation } from 'react-i18next';
// import { MessagesMenu as EventsMenu } from '@app/styles/dropdown-menus';
// import Modal from 'react-bootstrap/Modal';
// import Table from 'react-bootstrap/Table';
// import Button from 'react-bootstrap/Button';
// import { useAppSelector } from '@app/store/store';

// /* ------------------------------------------------------------------
//  * API payload shape (según ejemplo provisto por el usuario)
//  * ------------------------------------------------------------------ */
// export interface ApiEventoDiario {
//   id: number;
//   icono: string;           // nombre lógico del icono ("phone", "calendar", etc.)
//   color: string;           // color asociado al tipo
//   tipo: string;            // nombre del tipo de evento
//   cliente: string;         // nombre del cliente
//   fechaHoraProgramada: string; // ISO (sin zona -> se interpreta local)
//   fechaCumplimiento: string;   // ISO, puede ser igual o distinto
//   cumplido: boolean;       // flag de cumplimiento
//   minutos: number;         // duración/ventana activa en minutos
// }

// /* ------------------------------------------------------------------
//  * Estructura "ligera" que usa el dropdown para render rápido.
//  * Nota: sólo los campos que el dropdown realmente necesita.
//  * ------------------------------------------------------------------ */
// interface EventLite {
//   id: number;
//   icon: string;    // clase FontAwesome completa
//   type: string;    // etiqueta tipo
//   client: string;  // cliente
//   date: string;    // fecha programada (ISO)
// }

// /* ------------------------------------------------------------------
//  * Estructura enriquecida para render modal y cálculos.
//  * ------------------------------------------------------------------ */
// interface ProcessedEvent extends ApiEventoDiario {
//   start: number;       // ms epoch fechaHoraProgramada
//   end: number;         // start + minutos * 60_000
//   active: boolean;     // dentro de ventana
//   finished: boolean;   // ya pasó ventana
//   label: string;       // texto estado/tiempo restante
//   hourLabel: string;   // hora formateada
//   minutesToStart?: number; // <=0 si ya inició
// }

// /* ------------------------------------------------------------------
//  * Configuración de columnas para la TABLA del modal.
//  * Ajusta según tu necesidad sin tocar la lógica principal.
//  * ------------------------------------------------------------------ */
// const MODAL_COLUMNS = {
//   showTipo: true,
//   showCliente: true,
//   showHoraProgramada: true,
//   showEstadoTiempo: true,
//   showCumplido: true,
//   showMinutos: false,        // muestra columna con duración (minutos)
//   showColorSwatch: true,     // círculo de color en la primera columna
// };

// /* ------------------------------------------------------------------
//  * Utilidades de iconos.
//  * Puedes ampliar este mapa o inyectar desde afuera.
//  * Si el valor ya viene con "fa-" se respeta.
//  * ------------------------------------------------------------------ */
// const iconMap: Record<string, string> = {
//   phone: 'fas fa-phone',
//   calendar: 'fas fa-calendar-alt',
//   meeting: 'fas fa-users',
//   info: 'fas fa-info-circle',
//   warning: 'fas fa-exclamation-triangle',
// };

// function toFaClass(icono: string): string {
//   if (!icono) return 'fas fa-info-circle';
//   if (icono.includes('fa-')) return icono.trim(); // ya viene completo
//   return iconMap[icono] ?? `fas fa-${icono}`; // fallback
// }

// /* ------------------------------------------------------------------
//  * Formateadores de tiempo.
//  * ------------------------------------------------------------------ */
// const BOGOTA_TZ = 'America/Bogota'; // puedes parametrizar

// function buildHourFormatter(timeZone?: string) {
//   return new Intl.DateTimeFormat(undefined, {
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: false,
//     timeZone,
//   });
// }

// function humanStartsIn(diffMs: number, t: (k: string, d?: string | any, o?: any) => string) {
//   if (diffMs <= 0) return t('events.started', 'Iniciado');
//   const diffMin = Math.floor(diffMs / 60_000);
//   if (diffMin < 60) {
//     return t('events.startsInMinutes', 'Dentro de {{count}} min', { count: diffMin });
//   }
//   const hours = Math.floor(diffMin / 60);
//   return t('events.startsInHours', 'Dentro de {{count}} h', { count: hours });
// }

// /* ------------------------------------------------------------------
//  * Constantes
//  * ------------------------------------------------------------------ */
// const DEFAULT_ACTIVE_WINDOW_MINUTES = 3; // fallback cuando API trae minutos <=0 o null

// /* ------------------------------------------------------------------
//  * Componente principal
//  * ------------------------------------------------------------------ */
// const EventsDropdown: React.FC = () => {
//   const [t] = useTranslation();

//   /* ----------------------------------
//    * Estado de tiempo "ahora"
//    * ---------------------------------- */
//   const [now, setNow] = useState(() => Date.now());
//   const currentUser = useAppSelector((state) => state.auth.currentUser);
//   useEffect(() => {
//     const id = setInterval(() => setNow(Date.now()), 15_000); // refresco cada 15s
//     return () => clearInterval(id);
//   }, []);

//   /* ----------------------------------
//    * Estado de fetch
//    * ---------------------------------- */
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   /* ----------------------------------
//    * Eventos crudos desde la API (guardamos TODO)
//    * ---------------------------------- */
//   const [rawEvents, setRawEvents] = useState<ApiEventoDiario[]>([]);

//   // señal para abortar fetch en desmontaje
//   const abortRef = useRef<AbortController | null>(null);

//   /* ----------------------------------
//    * Fetch al montar (y cuando quieras refrescar)
//    * Nota: localhost -> asegúrate de que el cert https funcione
//    * Puedes reemplazar URL por import.meta.env.VITE_API_BASE_URL, etc.
//    * ---------------------------------- */
//  const API_URL_BASE = import.meta.env.VITE_API_URL;
//   // const USER_ID = 2; // si quieres parametrizar
//   const endpoint = `${API_URL_BASE}/api/v1/eventos-diarios?idUser=${currentUser?.id}`;

//   const fetchEvents = useCallback(async () => {
//     abortRef.current?.abort();
//     const controller = new AbortController();
//     abortRef.current = controller;

//     setLoading(true);
//     setError(null);
//     try {
//       const resp = await fetch(endpoint, {
//         method: 'GET',
//         headers: { accept: 'application/json' },
//         signal: controller.signal,
//       });
//       if (!resp.ok) {
//         throw new Error(`HTTP ${resp.status}`);
//       }
//       const json = await resp.json();
//       if (!json?.success) {
//         throw new Error(json?.message || 'Error en la respuesta de la API');
//       }
//       const data = Array.isArray(json.data) ? json.data : [];
//       setRawEvents(data as ApiEventoDiario[]);
//     } catch (err: any) {
//       if (err?.name === 'AbortError') return; // cancelado
//       console.error('fetchEvents error', err);
//       setError(String(err?.message || err));
//     } finally {
//       setLoading(false);
//     }
//   }, [endpoint]);

//   useEffect(() => {
//     fetchEvents();
//     return () => abortRef.current?.abort();
//   }, [fetchEvents]);

//   /* ----------------------------------
//    * Procesamiento: calculamos start/end/estado/labels.
//    * Se recalcula cuando cambian los eventos o el tiempo actual.
//    * ---------------------------------- */
//   const hourFmt = useMemo(() => buildHourFormatter(BOGOTA_TZ), []);

//   const processedEvents: ProcessedEvent[] = useMemo(() => {
//     return rawEvents
//       .map((e) => {
//         const start = Date.parse(e.fechaHoraProgramada);
//         const durMin = Number.isFinite(e.minutos) && e.minutos > 0 ? e.minutos : DEFAULT_ACTIVE_WINDOW_MINUTES;
//         const end = start + durMin * 60_000;
//         const active = now >= start && now < end;
//         const finished = now >= end;
//         const label = active
//           ? t('events.inProgress', 'En curso')
//           : finished
//             ? t('events.finished', 'Finalizado')
//             : humanStartsIn(start - now, t as any);
//         const hourLabel = hourFmt.format(start);
//         const minutesToStart = Math.floor((start - now) / 60_000);
//         return {
//           ...e,
//           start,
//           end,
//           active,
//           finished,
//           label,
//           hourLabel,
//           minutesToStart,
//         } as ProcessedEvent;
//       })
//       .sort((a, b) => a.start - b.start);
//   }, [rawEvents, now, t, hourFmt]);

//   /* ----------------------------------
//    * *** CAMBIO PEDIDO ***
//    * Sólo mostrar en el MENÚ DESPLEGABLE los eventos cuya fechaHoraProgramada sea > ahora.
//    * No afecta la tabla del modal (que sigue mostrando todos los eventos procesados).
//    * ---------------------------------- */
//   const upcomingProcessed: ProcessedEvent[] = useMemo(() => {
//     return processedEvents.filter((ev) => ev.start > now);
//   }, [processedEvents, now]);

//   /* ----------------------------------
//    * Estructura ligera para el dropdown (sólo eventos futuros).
//    * ---------------------------------- */
//   const dropdownEvents: EventLite[] = useMemo(() => {
//     return upcomingProcessed.map((e) => ({
//       id: e.id,
//       icon: toFaClass(e.icono),
//       type: e.tipo,
//       client: e.cliente,
//       date: e.fechaHoraProgramada,
//     }));
//   }, [upcomingProcessed]);

//   /* ----------------------------------
//    * Utilidades (usando processedEvents para precisión completa)
//    * ---------------------------------- */
//   const getLiteById = useCallback((id: number) => dropdownEvents.find((e) => e.id === id), [dropdownEvents]);

//   const isActive = useCallback((iso: string) => {
//     // usamos processed para precisión; fallback simple
//     const p = processedEvents.find((p) => p.fechaHoraProgramada === iso);
//     if (p) return p.active; // aunque en dropdown sólo habrá futuros (active=false), mantenemos lógica genérica
//     const start = Date.parse(iso);
//     const end = start + DEFAULT_ACTIVE_WINDOW_MINUTES * 60_000;
//     return now >= start && now < end;
//   }, [processedEvents, now]);

//   const getTimeRemaining = useCallback((iso: string) => {
//     const p = processedEvents.find((p) => p.fechaHoraProgramada === iso);
//     if (p) return p.label;
//     return humanStartsIn(Date.parse(iso) - now, t as any); // fallback
//   }, [processedEvents, now, t]);

//   const getHour = useCallback((iso: string) => {
//     const p = processedEvents.find((p) => p.fechaHoraProgramada === iso);
//     if (p) return p.hourLabel;
//     return hourFmt.format(Date.parse(iso));
//   }, [processedEvents, hourFmt]);

//   /* ----------------------------------
//    * Modal visible?
//    * ---------------------------------- */
//   const [showModal, setShowModal] = useState(false);

//   /* ----------------------------------
//    * Estilos inline reusados del ejemplo previo
//    * ---------------------------------- */
//   const activeStyles: React.CSSProperties = {
//     background: 'linear-gradient(90deg, #e6f7ff 0%, #ffffff 90%)',
//     borderLeft: '4px solid #17a2b8',
//     paddingLeft: '0.75rem',
//   };

//   /* ----------------------------------
//    * Render
//    * ---------------------------------- */
//   return (
//     <>
//       <style>
//         {`
//           /* Punto animado para eventos activos */
//           .event-active-dot {
//             width: 10px;
//             height: 10px;
//             background: #28a745;
//             border-radius: 50%;
//             position: relative;
//             margin-right: 6px;
//             flex-shrink: 0;
//             box-shadow: 0 0 0 0 rgba(40,167,69,.6);
//             animation: pulse-green 1.5s infinite;
//           }
//           @keyframes pulse-green {
//             0% { box-shadow: 0 0 0 0 rgba(40,167,69,.6); }
//             70% { box-shadow: 0 0 0 8px rgba(40,167,69,0); }
//             100% { box-shadow: 0 0 0 0 rgba(40,167,69,0); }
//           }
//           .badge-live {
//             background: #28a745;
//             color: #fff;
//             font-size: 0.55rem;
//             letter-spacing: .5px;
//             padding: .25rem .4rem;
//             border-radius: .25rem;
//             text-transform: uppercase;
//             font-weight: 600;
//           }
//           .row-active {
//             background-color: #f2fcff;
//           }
//           .row-active td {
//             border-top: 2px solid #17a2b8 !important;
//           }
//           .events-color-swatch {
//             display:inline-block;
//             width:14px;height:14px;
//             border-radius:50%;
//             border:1px solid rgba(0,0,0,.15);
//           }
//         `}
//       </style>

//       <EventsMenu hideArrow>
//         <div slot="head">
//           <i className="far fa-calendar-alt" />
//           {loading ? (
//             <span className="badge badge-secondary navbar-badge">…</span>
//           ) : (
//             <span className="badge badge-primary navbar-badge">{dropdownEvents.length}</span>
//           )}
//         </div>

//         <div slot="body" style={{ padding: 0 }}>
//           {/* Cuerpo scrollable */}
//           <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.5rem 0' }}>
//             {error && (
//               <div className="dropdown-item text-danger text-sm">{t('common.error', 'Error')}: {error}</div>
//             )}
//             {!error && dropdownEvents.length === 0 && !loading && (
//               // Texto por defecto reutilizado; si prefieres un mensaje específico: t('events.noneUpcoming', 'Sin próximos eventos')
//               <div className="dropdown-item text-muted text-sm">{t('events.noneToday', 'Sin eventos')}</div>
//             )}
//             {dropdownEvents.map((event, index) => {
//               const active = isActive(event.date); // siempre false para futuros, pero mantenido por compatibilidad
//               return (
//                 <div key={event.id}>
//                   <div
//                     className="dropdown-item"
//                     style={active ? activeStyles : undefined}
//                     onClick={() => setShowModal(true)}
//                   >
//                     <div className="media align-items-start">
//                       <div
//                         className="mr-3 d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
//                         style={{ width: 40, height: 40, position: 'relative' }}
//                       >
//                         <i className={event.icon} style={{ fontSize: 16 }} />
//                         {active && (
//                           <span
//                             style={{
//                               position: 'absolute',
//                               bottom: -2,
//                               right: -2,
//                               width: 14,
//                               height: 14,
//                               background: '#28a745',
//                               border: '2px solid #fff',
//                               borderRadius: '50%',
//                             }}
//                             title={t('events.inProgress', 'En curso')}
//                           />
//                         )}
//                       </div>
//                       <div className="media-body">
//                         <h3 className="dropdown-item-title mb-1 d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
//                           {active && <span className="event-active-dot" />}
//                           <span>{event.type}</span>
//                           {active && <span className="ml-2 badge-live">{t('events.inProgress', 'En curso')}</span>}
//                         </h3>
//                         <p className="text-sm mb-0">{event.client}</p>
//                         <div className="d-flex justify-content-between mt-1">
//                           <p className="text-sm text-muted mb-0">
//                             <i className="far fa-clock mr-1" />
//                             {getHour(event.date)}
//                           </p>
//                           <p
//                             className={`text-sm mb-0 ${
//                               active ? 'text-success' : 'text-primary'
//                             }`}
//                             style={{ fontWeight: 600 }}
//                           >
//                             {getTimeRemaining(event.date)}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                   {index < dropdownEvents.length - 1 && <div className="dropdown-divider m-0" />}
//                 </div>
//               );
//             })}
//           </div>

//           {/* Footer del dropdown */}
//           <div
//             className="dropdown-footer text-center"
//             style={{
//               position: 'sticky',
//               bottom: 0,
//               backgroundColor: '#fff',
//               borderTop: '1px solid #e9ecef',
//               padding: '0.5rem',
//               cursor: 'pointer',
//             }}
//             onClick={() => setShowModal(true)}
//           >
//             {t('header.events.seeAll', 'Ver todos')}
//           </div>
//         </div>
//       </EventsMenu>

//       {/* Modal con tabla configurable */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered scrollable>
//         <Modal.Header closeButton {...({} as any)}>
//           <Modal.Title>{t('header.events.allToday', 'Eventos de hoy')}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ paddingTop: '0.5rem' }}>
//           <Table striped hover responsive size="sm" className="mb-2">
//             <thead>
//               <tr>
//                 {MODAL_COLUMNS.showColorSwatch && <th style={{ width: 32 }}></th>}
//                 {MODAL_COLUMNS.showTipo && <th>{t('events.type', 'Tipo')}</th>}
//                 {MODAL_COLUMNS.showCliente && <th>{t('events.client', 'Cliente')}</th>}
//                 {MODAL_COLUMNS.showHoraProgramada && <th>{t('events.time', 'Hora')}</th>}
//                 {MODAL_COLUMNS.showEstadoTiempo && <th>{t('events.statusTime', 'Estado / Tiempo')}</th>}
//                 {MODAL_COLUMNS.showCumplido && <th>{t('events.done', 'Cumplido')}</th>}
//                 {MODAL_COLUMNS.showMinutos && <th>{t('events.duration', 'Min')}</th>}
//               </tr>
//             </thead>
//             <tbody>
//               {processedEvents.map((ev) => {
//                 const urgentSoon = !ev.active && !ev.finished && (ev.minutesToStart ?? 999) >= 0 && (ev.minutesToStart ?? 999) < 5; // <5 min rojo
//                 const labelClass = ev.active
//                   ? 'text-success font-weight-bold'
//                   : urgentSoon
//                     ? 'text-danger font-weight-bold'
//                     : 'text-primary font-weight-bold';
//                 return (
//                   <tr key={ev.id} className={ev.active ? 'row-active' : undefined}>
//                     {MODAL_COLUMNS.showColorSwatch && (
//                       <td className="text-center align-middle">
//                         <span
//                           className="events-color-swatch"
//                           style={{ backgroundColor: ev.color || '#ccc' }}
//                           title={ev.tipo}
//                         />
//                       </td>
//                     )}
//                     {MODAL_COLUMNS.showTipo && (
//                       <td className="align-middle">
//                         <i className={toFaClass(ev.icono)} style={{ marginRight: 4 }} />
//                         {ev.tipo}{' '}
//                         {ev.active && <span className="badge-live ml-1">{t('events.inProgress', 'En curso')}</span>}
//                       </td>
//                     )}
//                     {MODAL_COLUMNS.showCliente && <td className="align-middle">{ev.cliente}</td>}
//                     {MODAL_COLUMNS.showHoraProgramada && <td className="align-middle">{ev.hourLabel}</td>}
//                     {MODAL_COLUMNS.showEstadoTiempo && (
//                       <td className="align-middle">
//                         <span className={labelClass}>{ev.label}</span>
//                       </td>
//                     )}
//                     {MODAL_COLUMNS.showCumplido && (
//                       <td className="align-middle text-center">
//                         {ev.cumplido ? (
//                           <i className="fas fa-check text-success" title={t('common.yes', 'Sí')} />
//                         ) : (
//                           <i className="fas fa-times text-muted" title={t('common.no', 'No')} />
//                         )}
//                       </td>
//                     )}
//                     {MODAL_COLUMNS.showMinutos && <td className="align-middle text-right">{ev.minutos}</td>}
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </Table>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
//             {t('common.close', 'Cerrar')}
//           </Button>
//           <Button variant="outline-primary" size="sm" onClick={fetchEvents} disabled={loading}>
//             {loading ? t('common.loading', 'Cargando…') : t('common.refresh', 'Refrescar')}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </>
//   );
// };

// export default EventsDropdown;

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessagesMenu as EventsMenu } from '@app/styles/dropdown-menus';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { useAppSelector } from '@app/store/store';
import { useEventosDiariosService, ApiEventoDiario } from '@app/services/Calendario/eventosDiariosService';

/* ------------------------------------------------------------------
 * Estructura "ligera" que usa el dropdown para render rápido.
 * ------------------------------------------------------------------ */
interface EventLite {
  id: number;
  icon: string;
  type: string;
  client: string;
  date: string;
}

interface ProcessedEvent extends ApiEventoDiario {
  start: number;
  end: number;
  active: boolean;
  finished: boolean;
  label: string;
  hourLabel: string;
  minutesToStart?: number;
}

/* ------------------------------------------------------------------
 * Configuración de columnas
 * ------------------------------------------------------------------ */
const MODAL_COLUMNS = {
  showTipo: true,
  showCliente: true,
  showHoraProgramada: true,
  showEstadoTiempo: true,
  showCumplido: true,
  showMinutos: false,
  showColorSwatch: true,
};

/* ------------------------------------------------------------------
 * Utilidades de iconos.
 * ------------------------------------------------------------------ */
const iconMap: Record<string, string> = {
  phone: 'fas fa-phone',
  calendar: 'fas fa-calendar-alt',
  meeting: 'fas fa-users',
  info: 'fas fa-info-circle',
  warning: 'fas fa-exclamation-triangle',
};

function toFaClass(icono: string): string {
  if (!icono) return 'fas fa-info-circle';
  if (icono.includes('fa-')) return icono.trim();
  return iconMap[icono] ?? `fas fa-${icono}`;
}

/* ------------------------------------------------------------------
 * Formateadores de tiempo.
 * ------------------------------------------------------------------ */
const BOGOTA_TZ = 'America/Bogota';

function buildHourFormatter(timeZone?: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  });
}

function humanStartsIn(diffMs: number, t: (k: string, d?: string | any, o?: any) => string) {
  if (diffMs <= 0) return t('events.started', 'Iniciado');
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) {
    return t('events.startsInMinutes', 'Dentro de {{count}} min', { count: diffMin });
  }
  const hours = Math.floor(diffMin / 60);
  return t('events.startsInHours', 'Dentro de {{count}} h', { count: hours });
}

const DEFAULT_ACTIVE_WINDOW_MINUTES = 3;

/* ------------------------------------------------------------------
 * Componente principal
 * ------------------------------------------------------------------ */
const EventsDropdown: React.FC = () => {
  const [t] = useTranslation();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  /* Tiempo "ahora" */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  /* Estado de fetch */
  const { loading, error, obtenerEventosDiarios } = useEventosDiariosService();
  const [rawEvents, setRawEvents] = useState<ApiEventoDiario[]>([]);

  const fetchEvents = useCallback(async () => {
  if (!currentUser?.id) return;
  const resp = await obtenerEventosDiarios(Number(currentUser.id));
  if (resp && resp.success) {
    setRawEvents(resp.data ?? []);
  }
}, [currentUser?.id]); // 👈 ahora solo depende del id

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* Procesamiento */
  const hourFmt = useMemo(() => buildHourFormatter(BOGOTA_TZ), []);
  const processedEvents: ProcessedEvent[] = useMemo(() => {
    return rawEvents
      .map((e) => {
        const start = Date.parse(e.fechaHoraProgramada);
        const durMin = Number.isFinite(e.minutos) && e.minutos > 0 ? e.minutos : DEFAULT_ACTIVE_WINDOW_MINUTES;
        const end = start + durMin * 60_000;
        const active = now >= start && now < end;
        const finished = now >= end;
        const label = active
          ? t('events.inProgress', 'En curso')
          : finished
            ? t('events.finished', 'Finalizado')
            : humanStartsIn(start - now, t as any);
        const hourLabel = hourFmt.format(start);
        const minutesToStart = Math.floor((start - now) / 60_000);
        return { ...e, start, end, active, finished, label, hourLabel, minutesToStart };
      })
      .sort((a, b) => a.start - b.start);
  }, [rawEvents, now, t, hourFmt]);

  const upcomingProcessed: ProcessedEvent[] = useMemo(() => {
    return processedEvents.filter((ev) => ev.start > now);
  }, [processedEvents, now]);

  const dropdownEvents: EventLite[] = useMemo(() => {
    return upcomingProcessed.map((e) => ({
      id: e.id,
      icon: toFaClass(e.icono),
      type: e.tipo,
      client: e.cliente,
      date: e.fechaHoraProgramada,
    }));
  }, [upcomingProcessed]);

  const getLiteById = useCallback((id: number) => dropdownEvents.find((e) => e.id === id), [dropdownEvents]);
  const isActive = useCallback(
    (iso: string) => {
      const p = processedEvents.find((p) => p.fechaHoraProgramada === iso);
      if (p) return p.active;
      const start = Date.parse(iso);
      const end = start + DEFAULT_ACTIVE_WINDOW_MINUTES * 60_000;
      return now >= start && now < end;
    },
    [processedEvents, now]
  );
  const getTimeRemaining = useCallback(
    (iso: string) => {
      const p = processedEvents.find((p) => p.fechaHoraProgramada === iso);
      if (p) return p.label;
      return humanStartsIn(Date.parse(iso) - now, t as any);
    },
    [processedEvents, now, t]
  );
  const getHour = useCallback(
    (iso: string) => {
      const p = processedEvents.find((p) => p.fechaHoraProgramada === iso);
      if (p) return p.hourLabel;
      return hourFmt.format(Date.parse(iso));
    },
    [processedEvents, hourFmt]
  );

  const [showModal, setShowModal] = useState(false);

  /* Estilos inline (sin cambios) */
  const activeStyles: React.CSSProperties = {
    background: 'linear-gradient(90deg, #e6f7ff 0%, #ffffff 90%)',
    borderLeft: '4px solid #17a2b8',
    paddingLeft: '0.75rem',
  };

  /* Render (idéntico a tu versión, sin cambios visuales) */
  return (
        <>
      <style>
        {`
          /* Punto animado para eventos activos */
          .event-active-dot {
            width: 10px;
            height: 10px;
            background: #28a745;
            border-radius: 50%;
            position: relative;
            margin-right: 6px;
            flex-shrink: 0;
            box-shadow: 0 0 0 0 rgba(40,167,69,.6);
            animation: pulse-green 1.5s infinite;
          }
          @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(40,167,69,.6); }
            70% { box-shadow: 0 0 0 8px rgba(40,167,69,0); }
            100% { box-shadow: 0 0 0 0 rgba(40,167,69,0); }
          }
          .badge-live {
            background: #28a745;
            color: #fff;
            font-size: 0.55rem;
            letter-spacing: .5px;
            padding: .25rem .4rem;
            border-radius: .25rem;
            text-transform: uppercase;
            font-weight: 600;
          }
          .row-active {
            background-color: #f2fcff;
          }
          .row-active td {
            border-top: 2px solid #17a2b8 !important;
          }
          .events-color-swatch {
            display:inline-block;
            width:14px;height:14px;
            border-radius:50%;
            border:1px solid rgba(0,0,0,.15);
          }
        `}
      </style>

      <EventsMenu hideArrow>
        <div slot="head">
          <i className="far fa-calendar-alt" />
          {loading ? (
            <span className="badge badge-secondary navbar-badge">…</span>
          ) : (
            <span className="badge badge-primary navbar-badge">{dropdownEvents.length}</span>
          )}
        </div>

        <div slot="body" style={{ padding: 0 }}>
          {/* Cuerpo scrollable */}
          <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.5rem 0' }}>
            {error && (
              <div className="dropdown-item text-danger text-sm">{t('common.error', 'Error')}: {error}</div>
            )}
            {!error && dropdownEvents.length === 0 && !loading && (
              // Texto por defecto reutilizado; si prefieres un mensaje específico: t('events.noneUpcoming', 'Sin próximos eventos')
              <div className="dropdown-item text-muted text-sm">{t('events.noneToday', 'Sin eventos')}</div>
            )}
            {dropdownEvents.map((event, index) => {
              const active = isActive(event.date); // siempre false para futuros, pero mantenido por compatibilidad
              return (
                <div key={event.id}>
                  <div
                    className="dropdown-item"
                    style={active ? activeStyles : undefined}
                    onClick={() => setShowModal(true)}
                  >
                    <div className="media align-items-start">
                      <div
                        className="mr-3 d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                        style={{ width: 40, height: 40, position: 'relative' }}
                      >
                        <i className={event.icon} style={{ fontSize: 16 }} />
                        {active && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 14,
                              height: 14,
                              background: '#28a745',
                              border: '2px solid #fff',
                              borderRadius: '50%',
                            }}
                            title={t('events.inProgress', 'En curso')}
                          />
                        )}
                      </div>
                      <div className="media-body">
                        <h3 className="dropdown-item-title mb-1 d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                          {active && <span className="event-active-dot" />}
                          <span>{event.type}</span>
                          {active && <span className="ml-2 badge-live">{t('events.inProgress', 'En curso')}</span>}
                        </h3>
                        <p className="text-sm mb-0">{event.client}</p>
                        <div className="d-flex justify-content-between mt-1">
                          <p className="text-sm text-muted mb-0">
                            <i className="far fa-clock mr-1" />
                            {getHour(event.date)}
                          </p>
                          <p
                            className={`text-sm mb-0 ${
                              active ? 'text-success' : 'text-primary'
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {getTimeRemaining(event.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < dropdownEvents.length - 1 && <div className="dropdown-divider m-0" />}
                </div>
              );
            })}
          </div>

          {/* Footer del dropdown */}
          <div
            className="dropdown-footer text-center"
            style={{
              position: 'sticky',
              bottom: 0,
              backgroundColor: '#fff',
              borderTop: '1px solid #e9ecef',
              padding: '0.5rem',
              cursor: 'pointer',
            }}
            onClick={() => setShowModal(true)}
          >
            {t('header.events.seeAll', 'Ver todos')}
          </div>
        </div>
      </EventsMenu>

      {/* Modal con tabla configurable */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton {...({} as any)}>
          <Modal.Title>{t('header.events.allToday', 'Eventos de hoy')}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ paddingTop: '0.5rem' }}>
          <Table striped hover responsive size="sm" className="mb-2">
            <thead>
              <tr>
                {MODAL_COLUMNS.showColorSwatch && <th style={{ width: 32 }}></th>}
                {MODAL_COLUMNS.showTipo && <th>{t('events.type', 'Tipo')}</th>}
                {MODAL_COLUMNS.showCliente && <th>{t('events.client', 'Cliente')}</th>}
                {MODAL_COLUMNS.showHoraProgramada && <th>{t('events.time', 'Hora')}</th>}
                {MODAL_COLUMNS.showEstadoTiempo && <th>{t('events.statusTime', 'Estado / Tiempo')}</th>}
                {MODAL_COLUMNS.showCumplido && <th>{t('events.done', 'Cumplido')}</th>}
                {MODAL_COLUMNS.showMinutos && <th>{t('events.duration', 'Min')}</th>}
              </tr>
            </thead>
            <tbody>
              {processedEvents.map((ev) => {
                const urgentSoon = !ev.active && !ev.finished && (ev.minutesToStart ?? 999) >= 0 && (ev.minutesToStart ?? 999) < 5; // <5 min rojo
                const labelClass = ev.active
                  ? 'text-success font-weight-bold'
                  : urgentSoon
                    ? 'text-danger font-weight-bold'
                    : 'text-primary font-weight-bold';
                return (
                  <tr key={ev.id} className={ev.active ? 'row-active' : undefined}>
                    {MODAL_COLUMNS.showColorSwatch && (
                      <td className="text-center align-middle">
                        <span
                          className="events-color-swatch"
                          style={{ backgroundColor: ev.color || '#ccc' }}
                          title={ev.tipo}
                        />
                      </td>
                    )}
                    {MODAL_COLUMNS.showTipo && (
                      <td className="align-middle">
                        <i className={toFaClass(ev.icono)} style={{ marginRight: 4 }} />
                        {ev.tipo}{' '}
                        {ev.active && <span className="badge-live ml-1">{t('events.inProgress', 'En curso')}</span>}
                      </td>
                    )}
                    {MODAL_COLUMNS.showCliente && <td className="align-middle">{ev.cliente}</td>}
                    {MODAL_COLUMNS.showHoraProgramada && <td className="align-middle">{ev.hourLabel}</td>}
                    {MODAL_COLUMNS.showEstadoTiempo && (
                      <td className="align-middle">
                        <span className={labelClass}>{ev.label}</span>
                      </td>
                    )}
                    {MODAL_COLUMNS.showCumplido && (
                      <td className="align-middle text-center">
                        {ev.cumplido ? (
                          <i className="fas fa-check text-success" title={t('common.yes', 'Sí')} />
                        ) : (
                          <i className="fas fa-times text-muted" title={t('common.no', 'No')} />
                        )}
                      </td>
                    )}
                    {MODAL_COLUMNS.showMinutos && <td className="align-middle text-right">{ev.minutos}</td>}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
            {t('common.close', 'Cerrar')}
          </Button>
          <Button variant="outline-primary" size="sm" onClick={fetchEvents} disabled={loading}>
            {loading ? t('common.loading', 'Cargando…') : t('common.refresh', 'Refrescar')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EventsDropdown;
