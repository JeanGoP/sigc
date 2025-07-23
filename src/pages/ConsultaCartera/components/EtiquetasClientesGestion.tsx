// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { Badge, Button, Spinner } from "react-bootstrap";
// import Modal from "react-bootstrap/Modal";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faTag, faTimes } from "@fortawesome/free-solid-svg-icons";
// import { toast } from "react-toastify";

// // -----------------------------------------------------------------------------
// // Tipos compartidos
// // -----------------------------------------------------------------------------
// export interface EtiquetaCliente {
//   id: number;
//   nombre: string;
//   color: string | null; // hex o css; puede venir null -> usamos fallback
//   estado?: boolean; // opcional (activo/inactivo) — no usado aquí pero se respeta
// }

// export interface EtiquetaClienteListado extends EtiquetaCliente {
//   asignado: boolean; // true => cliente tiene la etiqueta
// }

// export interface EtiquetaClienteAPIResponse<T = unknown> {
//   success: boolean;
//   message: string;
//   data: T;
//   statusCode?: number;
//   errors?: any;
// }

// // -----------------------------------------------------------------------------
// // Config base API
// // -----------------------------------------------------------------------------
// const API_URL: string = (import.meta as any).env?.VITE_API_URL || ""; // ajusta según tu build

// async function authHeaders(): Promise<HeadersInit> {
//   const token = localStorage.getItem("token");
//   const headers: HeadersInit = {
//     accept: "*/*",
//     "Content-Type": "application/json",
//   };
//   if (token) headers["Authorization"] = `Bearer ${token}`;
//   return headers;
// }

// // -----------------------------------------------------------------------------
// // Servicio: Listar etiquetas para un cliente (devuelve asignado true/false)
// // GET /api/EtiquetaCliente/listar-etiquetas-cliente?idUser=2&cliente=1000184575
// // -----------------------------------------------------------------------------
// export async function fetchEtiquetasListar(
//   idUser: number | string,
//   cliente: string
// ): Promise<EtiquetaClienteAPIResponse<EtiquetaClienteListado[]>> {
//   try {
//     const resp = await fetch(
//       `${API_URL}/api/EtiquetaCliente/listar-etiquetas-cliente?idUser=${encodeURIComponent(
//         String(idUser)
//       )}&cliente=${encodeURIComponent(cliente)}`,
//       {
//         method: "GET",
//         headers: await authHeaders(),
//       }
//     );
//     const data = await resp.json();
//     return data as EtiquetaClienteAPIResponse<EtiquetaClienteListado[]>;
//   } catch (err) {
//     console.error("fetchEtiquetasListar error", err);
//     return {
//       success: false,
//       message: "Error de red al cargar etiquetas.",
//       data: [],
//     } as EtiquetaClienteAPIResponse<EtiquetaClienteListado[]>;
//   }
// }

// // -----------------------------------------------------------------------------
// // Servicio: Toggle asignación etiqueta
// // POST /api/EtiquetaCliente/gestionarEtiquetaCliente
// // Body: { idUser:number, cliente:string, idEtiqueta:number }
// // Backend decide: si la tiene -> quita; si no -> asigna.
// // -----------------------------------------------------------------------------
// export async function postGestionarEtiquetaCliente(
//   idUser: number | string,
//   cliente: string,
//   idEtiqueta: number
// ): Promise<EtiquetaClienteAPIResponse<null>> {
//   let data: any;
//   try {
//     if(window.confirm("¿Seguro que desea gestionar la etiqueta?"))
//     {

//       const resp = await fetch(`${API_URL}/api/EtiquetaCliente/gestionarEtiquetaCliente`, {
//         method: "POST",
//         headers: await authHeaders(),
//         body: JSON.stringify({ idUser, cliente, idEtiqueta }),
//       });
//       data = await resp.json();
//       return data as EtiquetaClienteAPIResponse<null>;
//     }
//     return data as EtiquetaClienteAPIResponse<null>;

//   } catch (err) {
//     console.error("postGestionarEtiquetaCliente error", err);
//     return {
//       success: false,
//       message: "Error de red al gestionar etiqueta.",
//       data: null,
//     } as EtiquetaClienteAPIResponse<null>;
//   }
// }

// // -----------------------------------------------------------------------------
// // Props del componente
// // -----------------------------------------------------------------------------
// export interface EtiquetasClienteProps {
//   cliente: string; // identificación del cliente
//   idUser: number | string; // requerido por la API
//   disabled?: boolean;
//   className?: string;
//   label?: string; // por defecto "Etiquetas"
//   onChangeIds?: (ids: number[]) => void; // opcional; no requerido
// }

// // -----------------------------------------------------------------------------
// // Helpers: normalización de datos
// // -----------------------------------------------------------------------------
// function coerceBoolean(v: any): boolean {
//   // Acepta: true/false, 1/0, "1"/"0", "true"/"false"
//   if (typeof v === "boolean") return v;
//   if (typeof v === "number") return v === 1;
//   if (typeof v === "string") {
//     const low = v.trim().toLowerCase();
//     return low === "1" || low === "true" || low === "t" || low === "si" || low === "sí";
//   }
//   return false;
// }

// function normalizarLista(raw: any[]): EtiquetaClienteListado[] {
//   if (!Array.isArray(raw)) return [];
//   return raw.map((r) => ({
//     id: Number(r.id),
//     nombre: r.nombre ?? String(r.id),
//     color: r.color ?? null,
//     asignado: coerceBoolean(r.asignado),
//     estado: r.estado ?? true,
//   }));
// }

// // -----------------------------------------------------------------------------
// // Componente principal
// // -----------------------------------------------------------------------------
// export const EtiquetasClienteGestion: React.FC<EtiquetasClienteProps> = ({
//   cliente,
//   idUser,
//   disabled = false,
//   className,
//   label = "Etiquetas",
//   onChangeIds,
// }) => {
//   // Estado principal: lista completa con flag asignado
//   const [lista, setLista] = useState<EtiquetaClienteListado[]>([]);

//   // Flags
//   const [loading, setLoading] = useState(false); // carga inicial / recargas
//   const [updatingId, setUpdatingId] = useState<number | null>(null); // id en gestión
//   const [showModal, setShowModal] = useState(false);

//   // Cargar / recargar lista
//   const cargarLista = useCallback(async () => {
//     if (!cliente) {
//       setLista([]);
//       onChangeIds?.([]);
//       return;
//     }
//     setLoading(true);
//     const resp = await fetchEtiquetasListar(idUser, cliente);

//     // Debug opcional:
//     // console.log("[EtiquetasClienteGestion] raw resp", resp);

//     if (resp.success && Array.isArray(resp.data)) {
//       const listaNorm = normalizarLista(resp.data as any[]);
//       setLista(listaNorm);
//       const idsAsignados = listaNorm.filter((e) => e.asignado).map((e) => e.id);
//       onChangeIds?.(idsAsignados);
//     } else {
//       console.warn("No se pudo cargar etiquetas", resp.message);
//       toast.error(resp.message || "No se pudo cargar etiquetas.");
//       setLista([]);
//       onChangeIds?.([]);
//     }
//     setLoading(false);
//   }, [cliente, idUser, onChangeIds]);

//   // Cargar al montar y cuando cambie cliente
//   useEffect(() => {
//     cargarLista();
//   }, [cargarLista]);

//   // Derivados
//   const etiquetasAsignadas = useMemo(() => lista.filter((e) => e.asignado), [lista]);
//   const etiquetasNoAsignadas = useMemo(() => lista.filter((e) => !e.asignado), [lista]);

//   // Toggle etiqueta
//   const toggleEtiqueta = useCallback(
//     async (idEtiqueta: number) => {
//       if (!cliente || updatingId !== null) return; // evita doble click
//       setUpdatingId(idEtiqueta);
//       const resp = await postGestionarEtiquetaCliente(idUser, cliente, idEtiqueta);
//       if (resp.success) {
//         toast.success("Operación exitosa.");
//         await cargarLista(); // re-consultar estado real
//       } else {
//         toast.error(resp.message || "Error gestionando etiqueta.");
//       }
//       setUpdatingId(null);
//     },
//     [cliente, idUser, updatingId, cargarLista]
//   );

//   // Modal open/close
//   const abrirModal = useCallback(() => setShowModal(true), []);
//   const cerrarModal = useCallback(() => setShowModal(false), []);

//   // Color helper
//   const resolveColor = (hex?: string | null) => {
//     if (!hex) return "#6c757d"; // fallback gris Bootstrap-ish
//     return hex;
//   };

//   // Estilos comunes badge
//   const makeStyle = (hex?: string | null): React.CSSProperties => {
//     const c = resolveColor(hex);
//     return {
//       backgroundColor: c + "20", // leve tint
//       color: c,
//       border: `1px solid ${c}`,
//       padding: "0.5rem 0.75rem",
//       cursor: disabled ? "default" : "pointer",
//       display: "inline-flex",
//       alignItems: "center",
//       gap: "0.25rem",
//     };
//   };

//   // ---------------------------------------------------------------------------
//   // Render
//   // ---------------------------------------------------------------------------
//   return (
//     <div className={className}>
//       <div className="d-flex justify-content-between align-items-center">
//         <h6 className="mb-0">{label}</h6>
//         <Button
//           variant="outline-primary"
//           size="sm"
//           onClick={abrirModal}
//           disabled={disabled || !cliente || loading}
//         >
//           <FontAwesomeIcon icon={faTag} className="me-1" /> Gestionar etiquetas
//         </Button>
//       </div>

//       {/* Badges asignadas */}
//       <div className="d-flex flex-wrap gap-2 mt-2">
//         {loading ? (
//           <span className="d-inline-flex align-items-center gap-2">
//             <Spinner animation="border" size="sm" /> Cargando...
//           </span>
//         ) : etiquetasAsignadas.length === 0 ? (
//           <span className="text-muted" style={{ fontStyle: "italic" }}>
//             Sin etiquetas.
//           </span>
//         ) : (
//           etiquetasAsignadas.map((etiqueta) => (
//             <Badge
//               key={etiqueta.id}
//               className="d-flex align-items-center"
//               style={makeStyle(etiqueta.color)}
//               onClick={() => !disabled && toggleEtiqueta(etiqueta.id)}
//             >
//               {etiqueta.nombre}
//               {!disabled && (
//                 <FontAwesomeIcon
//                   icon={faTimes}
//                   className="ms-2"
//                   style={{ pointerEvents: "none" }}
//                 />
//               )}
//             </Badge>
//           ))
//         )}
//       </div>

//       {/* Modal de selección / gestión */}
//       <Modal show={showModal} onHide={cerrarModal} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Gestionar etiquetas</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {loading ? (
//             <p className="d-flex align-items-center gap-2 mb-0">
//               <Spinner animation="border" size="sm" className="me-2" /> Cargando...
//             </p>
//           ) : (
//             <>
//               {/* SOLO DISPONIBLES (no asignadas) */}
//               {etiquetasNoAsignadas.length === 0 ? (
//                 <p className="text-muted mb-0" style={{ fontStyle: "italic" }}>
//                   No hay etiquetas disponibles para agregar.
//                 </p>
//               ) : (
//                 <div className="d-flex flex-wrap gap-2">
//                   {etiquetasNoAsignadas.map((e) => (
//                     <Button
//                       key={e.id}
//                       variant="light"
//                       size="sm"
//                       disabled={updatingId === e.id}
//                       onClick={() => toggleEtiqueta(e.id)}
//                       style={{
//                         ...makeStyle(e.color),
//                         borderRadius: 4,
//                         padding: "0.25rem 0.5rem",
//                         cursor: updatingId === e.id ? "wait" : "pointer",
//                       }}
//                       title="Asignar etiqueta"
//                     >
//                       {updatingId === e.id ? (
//                         <Spinner animation="border" size="sm" />
//                       ) : (
//                         e.nombre
//                       )}
//                     </Button>
//                   ))}
//                 </div>
//               )}
//             </>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={cerrarModal} disabled={updatingId !== null}>
//             Cerrar
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Spinner } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

// -----------------------------------------------------------------------------
// Tipos compartidos
// -----------------------------------------------------------------------------
export interface EtiquetaCliente {
  id: number;
  nombre: string;
  color: string | null; // hex o css; puede venir null -> usamos fallback
  estado?: boolean; // opcional (activo/inactivo) — no usado aquí pero se respeta
}

export interface EtiquetaClienteListado extends EtiquetaCliente {
  asignado: boolean; // true => cliente tiene la etiqueta
}

export interface EtiquetaClienteAPIResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
  errors?: any;
}

// -----------------------------------------------------------------------------
// Config base API
// -----------------------------------------------------------------------------
const API_URL: string = (import.meta as any).env?.VITE_API_URL || ""; // ajusta según tu build

async function authHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    accept: "*/*",
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// -----------------------------------------------------------------------------
// Servicio: Listar etiquetas para un cliente (devuelve asignado true/false)
// GET /api/EtiquetaCliente/listar-etiquetas-cliente?idUser=2&cliente=1000184575
// -----------------------------------------------------------------------------
export async function fetchEtiquetasListar(
  idUser: number | string,
  cliente: string
): Promise<EtiquetaClienteAPIResponse<EtiquetaClienteListado[]>> {
  try {
    const resp = await fetch(
      `${API_URL}/api/v1/listar-etiquetas-cliente?idUser=${encodeURIComponent(
        String(idUser)
      )}&cliente=${encodeURIComponent(cliente)}`,
      {
        method: "GET",
        headers: await authHeaders(),
      }
    );
    const data = await resp.json();
    return data as EtiquetaClienteAPIResponse<EtiquetaClienteListado[]>;
  } catch (err) {
    console.error("fetchEtiquetasListar error", err);
    return {
      success: false,
      message: "Error de red al cargar etiquetas.",
      data: [],
    } as EtiquetaClienteAPIResponse<EtiquetaClienteListado[]>;
  }
}

// -----------------------------------------------------------------------------
// Servicio: Toggle asignación etiqueta (SIN confirm UI)
// POST /api/EtiquetaCliente/gestionarEtiquetaCliente
// Body: { idUser:number, cliente:string, idEtiqueta:number }
// Backend decide: si la tiene -> quita; si no -> asigna.
// -----------------------------------------------------------------------------
export async function postGestionarEtiquetaCliente(
  idUser: number | string,
  cliente: string,
  idEtiqueta: number
): Promise<EtiquetaClienteAPIResponse<null>> {
  try {
    const resp = await fetch(`${API_URL}/api/v1/gestionarEtiquetaCliente`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ idUser, cliente, idEtiqueta }),
    });
    const data = await resp.json();
    return data as EtiquetaClienteAPIResponse<null>;
  } catch (err) {
    console.error("postGestionarEtiquetaCliente error", err);
    return {
      success: false,
      message: "Error de red al gestionar etiqueta.",
      data: null,
    } as EtiquetaClienteAPIResponse<null>;
  }
}

// -----------------------------------------------------------------------------
// Props del componente
// -----------------------------------------------------------------------------
export interface EtiquetasClienteProps {
  cliente: string; // identificación del cliente
  idUser: number | string; // requerido por la API
  disabled?: boolean;
  className?: string;
  label?: string; // por defecto "Etiquetas"
  onChangeIds?: (ids: number[]) => void; // opcional; no requerido
}

// -----------------------------------------------------------------------------
// Helpers: normalización de datos
// -----------------------------------------------------------------------------
function coerceBoolean(v: any): boolean {
  // Acepta: true/false, 1/0, "1"/"0", "true"/"false"
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const low = v.trim().toLowerCase();
    return low === "1" || low === "true" || low === "t" || low === "si" || low === "sí";
  }
  return false;
}

function normalizarLista(raw: any[]): EtiquetaClienteListado[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => ({
    id: Number(r.id),
    nombre: r.nombre ?? String(r.id),
    color: r.color ?? null,
    asignado: coerceBoolean(r.asignado),
    estado: r.estado ?? true,
  }));
}

// -----------------------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------------------
export const EtiquetasClienteGestion: React.FC<EtiquetasClienteProps> = ({
  cliente,
  idUser,
  disabled = false,
  className,
  label = "Etiquetas",
  onChangeIds,
}) => {
  // Estado principal: lista completa con flag asignado
  const [lista, setLista] = useState<EtiquetaClienteListado[]>([]);

  // Flags
  const [loading, setLoading] = useState(false); // carga inicial / recargas
  const [updatingId, setUpdatingId] = useState<number | null>(null); // id en gestión
  const [showModal, setShowModal] = useState(false);

  // Cargar / recargar lista
  const cargarLista = useCallback(async () => {
    if (!cliente) {
      setLista([]);
      onChangeIds?.([]);
      return;
    }
    setLoading(true);
    const resp = await fetchEtiquetasListar(idUser, cliente);

    if (resp.success && Array.isArray(resp.data)) {
      const listaNorm = normalizarLista(resp.data as any[]);
      setLista(listaNorm);
      const idsAsignados = listaNorm.filter((e) => e.asignado).map((e) => e.id);
      onChangeIds?.(idsAsignados);
    } else {
      console.warn("No se pudo cargar etiquetas", resp.message);
      toast.error(resp.message || "No se pudo cargar etiquetas.");
      setLista([]);
      onChangeIds?.([]);
    }
    setLoading(false);
  }, [cliente, idUser, onChangeIds]);

  // Cargar al montar y cuando cambie cliente
  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  // Derivados
  const etiquetasAsignadas = useMemo(() => lista.filter((e) => e.asignado), [lista]);
  const etiquetasNoAsignadas = useMemo(() => lista.filter((e) => !e.asignado), [lista]);

  // Toggle etiqueta con confirm contextual
  const toggleEtiqueta = useCallback(
    async (idEtiqueta: number) => {
      if (!cliente || updatingId !== null) return; // evita doble click durante update

      // Determinar si actualmente está asignada o no
      const etiqueta = lista.find((x) => x.id === idEtiqueta);
      const esAsignada = !!etiqueta?.asignado;
      const nombre = etiqueta?.nombre ?? "esta etiqueta";
      const msg = esAsignada
        ? `¿Quitar la etiqueta "${nombre}" de este cliente?`
        : `¿Asignar la etiqueta "${nombre}" a este cliente?`;

      // Confirmar con el usuario
      const ok = window.confirm(msg);
      if (!ok) return; // cancelado por el usuario

      setUpdatingId(idEtiqueta);
      const resp = await postGestionarEtiquetaCliente(idUser, cliente, idEtiqueta);
      if (resp.success) {
        toast.success("Operación exitosa.");
        await cargarLista(); // re-consultar estado real
      } else {
        toast.error(resp.message || "Error gestionando etiqueta.");
      }
      setUpdatingId(null);
    },
    [cliente, idUser, lista, updatingId, cargarLista]
  );

  // Modal open/close
  const abrirModal = useCallback(() => setShowModal(true), []);
  const cerrarModal = useCallback(() => setShowModal(false), []);

  // Color helper
  const resolveColor = (hex?: string | null) => {
    if (!hex) return "#6c757d"; // fallback gris Bootstrap-ish
    return hex;
  };

  // Estilos comunes badge
  const makeStyle = (hex?: string | null): React.CSSProperties => {
    const c = resolveColor(hex);
    return {
      backgroundColor: c + "20", // leve tint
      color: c,
      border: `1px solid ${c}`,
      padding: "0.5rem 0.75rem",
      cursor: disabled ? "default" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
    };
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className={className}>
      <div className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">{label}</h6>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={abrirModal}
          disabled={disabled || !cliente || loading}
        >
          <FontAwesomeIcon icon={faTag} className="me-1" /> Gestionar etiquetas
        </Button>
      </div>

      {/* Badges asignadas */}
      <div className="d-flex flex-wrap gap-2 mt-2">
        {loading ? (
          <span className="d-inline-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" /> Cargando...
          </span>
        ) : etiquetasAsignadas.length === 0 ? (
          <span className="text-muted" style={{ fontStyle: "italic" }}>
            Sin etiquetas.
          </span>
        ) : (
          etiquetasAsignadas.map((etiqueta) => (
            <Badge
              key={etiqueta.id}
              className="d-flex align-items-center"
              style={makeStyle(etiqueta.color)}
              onClick={() => !disabled && toggleEtiqueta(etiqueta.id)}
            >
              {etiqueta.nombre}
              {!disabled && (
                <FontAwesomeIcon
                  icon={faTimes}
                  className="ms-2"
                  style={{ pointerEvents: "none" }}
                />
              )}
            </Badge>
          ))
        )}
      </div>

      {/* Modal de selección / gestión */}
      <Modal show={showModal} onHide={cerrarModal} centered>
        <Modal.Header {...({ closeButton: true } as any)}>
          <Modal.Title>Gestionar etiquetas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <p className="d-flex align-items-center gap-2 mb-0">
              <Spinner animation="border" size="sm" className="me-2" /> Cargando...
            </p>
          ) : (
            <>
              {/* SOLO DISPONIBLES (no asignadas) */}
              {etiquetasNoAsignadas.length === 0 ? (
                <p className="text-muted mb-0" style={{ fontStyle: "italic" }}>
                  No hay etiquetas disponibles para agregar.
                </p>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {etiquetasNoAsignadas.map((e) => (
                    <Button
                      key={e.id}
                      variant="light"
                      size="sm"
                      disabled={updatingId === e.id}
                      onClick={() => toggleEtiqueta(e.id)}
                      style={{
                        ...makeStyle(e.color),
                        borderRadius: 4,
                        padding: "0.25rem 0.5rem",
                        cursor: updatingId === e.id ? "wait" : "pointer",
                      }}
                      title="Asignar etiqueta"
                    >
                      {updatingId === e.id ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        e.nombre
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModal} disabled={updatingId !== null}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};