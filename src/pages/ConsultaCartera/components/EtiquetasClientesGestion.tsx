// EtiquetasClienteComponent
// -----------------------------------------------------------------------------
// Objetivo: Extraer TODO lo relacionado con las etiquetas de clientes que hoy
// está incrustado en ConsultaCartera.tsx, sin alterar el resto del componente.
// Este nuevo componente:
//   • Recibe por props el identificador del cliente (string).
//   • Maneja internamente: carga de catálogo de etiquetas, etiquetas asignadas
//     al cliente, UI de badges, modal de gestión (agregar / quitar), estados de
//     carga y persistencia vía API.
//   • NO altera ningún otro estado ni lógica de ConsultaCartera.
//   • Emite ningún onChange (a menos que quieras agregarlo luego). Todo se
//     mantiene encapsulado. (Se incluye prop opcional de callback deshabilitada
//     por defecto, solo por si la necesitas sin romper contratos.)
//   • Replica la apariencia existente para que la UI se vea igual.
//   • Está preparado para integración con backend (endpoints placeholders).
//
// Instrucciones de integración mínima en ConsultaCartera.tsx (ver más abajo).
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Tipos compartidos
// -----------------------------------------------------------------------------
export interface EtiquetaCliente {
  id: number;
  nombre: string;
  color: string; // hex o css
  estado?: boolean; // opcional (activo/inactivo)
}

export interface EtiquetaClienteAPIResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

// -----------------------------------------------------------------------------
// Servicio de Etiquetas (placeholder listo para backend real)
// -----------------------------------------------------------------------------
// Ajusta los paths según tu API real.
// Se asume autenticación vía token en localStorage (estilo de otros servicios).
// Retorna promesas tipadas.
// Puedes mover este bloque a un archivo aparte: "@app/services/EtiquetaClienteService".
// -----------------------------------------------------------------------------
const API_URL: string = (import.meta as any).env?.VITE_API_URL || "";

async function authHeaders() {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    accept: "*/*",
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/** Obtiene el catálogo completo de etiquetas disponibles. */
export async function fetchEtiquetasCatalogo(): Promise<EtiquetaClienteAPIResponse<EtiquetaCliente[]>> {
  try {
    const resp = await fetch(`${API_URL}/api/EtiquetaCliente/catalogo`, {
      method: "GET",
      headers: await authHeaders(),
    });
    const data = await resp.json();
    // Estructura esperada: {success:boolean, data:EtiquetaCliente[]}
    return data as EtiquetaClienteAPIResponse<EtiquetaCliente[]>;
  } catch (err) {
    console.error("fetchEtiquetasCatalogo error", err);
    return { success: false, message: "Error de red", data: [] };
  }
}

/** Obtiene las etiquetas actualmente asignadas a un cliente. */
export async function fetchEtiquetasPorCliente(
  clienteId: string
): Promise<EtiquetaClienteAPIResponse<number[]>> {
  try {
    const resp = await fetch(`${API_URL}/api/EtiquetaCliente/cliente/${encodeURIComponent(clienteId)}`, {
      method: "GET",
      headers: await authHeaders(),
    });
    const data = await resp.json();
    // Estructura esperada: {success:boolean, data:number[]} (solo ids) o data:EtiquetaCliente[]
    // Si tu API devuelve objetos, ajusta la conversión más abajo en el componente.
    return data as EtiquetaClienteAPIResponse<number[]>;
  } catch (err) {
    console.error("fetchEtiquetasPorCliente error", err);
    return { success: false, message: "Error de red", data: [] };
  }
}

/** Asigna UNA etiqueta a un cliente. */
export async function postAsignarEtiqueta(
  clienteId: string,
  etiquetaId: number
): Promise<EtiquetaClienteAPIResponse> {
  try {
    const resp = await fetch(`${API_URL}/api/EtiquetaCliente/asignar`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ cliente: clienteId, etiquetaId }),
    });
    const data = await resp.json();
    return data as EtiquetaClienteAPIResponse;
  } catch (err) {
    console.error("postAsignarEtiqueta error", err);
    return { success: false, message: "Error de red", data: null } as any;
  }
}

/** Quita UNA etiqueta de un cliente. */
export async function deleteQuitarEtiqueta(
  clienteId: string,
  etiquetaId: number
): Promise<EtiquetaClienteAPIResponse> {
  try {
    const resp = await fetch(
      `${API_URL}/api/EtiquetaCliente/quitar?cliente=${encodeURIComponent(clienteId)}&etiquetaId=${etiquetaId}`,
      {
        method: "DELETE",
        headers: await authHeaders(),
      }
    );
    const data = await resp.json();
    return data as EtiquetaClienteAPIResponse;
  } catch (err) {
    console.error("deleteQuitarEtiqueta error", err);
    return { success: false, message: "Error de red", data: null } as any;
  }
}

// -----------------------------------------------------------------------------
// Componente: EtiquetasCliente
// -----------------------------------------------------------------------------
// Props mínimos: cliente (string identificador).
// Props opcionales: disabled (bloquea UI si no hay cliente seleccionado),
// onChange? (por si en el futuro quieres notificar al padre; actualmente no indispensable).
// -----------------------------------------------------------------------------
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Form } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

interface EtiquetasClienteProps {
  cliente: string; // identificación del cliente
  disabled?: boolean;
  className?: string;
  label?: string; // por defecto "Etiquetas"
  onChangeIds?: (ids: number[]) => void; // opcional, no requerido
}

export const EtiquetasClienteGestion: React.FC<EtiquetasClienteProps> = ({
  cliente,
  disabled = false,
  className,
  label = "Etiquetas",
  onChangeIds,
}) => {
  // Catálogo total de etiquetas (se carga desde API)
  const [catalogo, setCatalogo] = useState<EtiquetaCliente[]>([]);
  // Ids asignados al cliente
  const [etiquetasCliente, setEtiquetasCliente] = useState<number[]>([]);
  // UI modal
  const [showModal, setShowModal] = useState(false);
  // loading flags
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Cargar catálogo al montar (una vez)
  useEffect(() => {
    let cancel = false;
    const load = async () => {
      setLoadingCatalogo(true);
      const resp = await fetchEtiquetasCatalogo();
      if (!cancel) {
        if (resp.success && Array.isArray(resp.data)) {
          setCatalogo(resp.data);
        } else {
          console.warn("No se pudo cargar catálogo de etiquetas", resp.message);
        }
        setLoadingCatalogo(false);
      }
    };
    load();
    return () => {
      cancel = true;
    };
  }, []);

  // Cargar etiquetas del cliente cuando cambia cliente
  useEffect(() => {
    if (!cliente) {
      setEtiquetasCliente([]);
      return;
    }
    let cancel = false;
    const load = async () => {
      setLoadingCliente(true);
      const resp = await fetchEtiquetasPorCliente(cliente);
      if (!cancel) {
        if (resp.success && Array.isArray(resp.data)) {
          // Si backend devuelve objetos, mapea aquí; asumimos ids.
          setEtiquetasCliente(resp.data as number[]);
          onChangeIds?.(resp.data as number[]);
        } else {
          console.warn("No se pudieron cargar etiquetas del cliente", resp.message);
          setEtiquetasCliente([]);
          onChangeIds?.([]);
        }
        setLoadingCliente(false);
      }
    };
    load();
    return () => {
      cancel = true;
    };
  }, [cliente, onChangeIds]);

  const handleAsignar = useCallback(
    async (idEtiqueta: number) => {
      if (!cliente) return;
      setUpdating(true);
      const resp = await postAsignarEtiqueta(cliente, idEtiqueta);
      if (resp.success) {
        setEtiquetasCliente((prev) => {
          const next = prev.includes(idEtiqueta) ? prev : [...prev, idEtiqueta];
          onChangeIds?.(next);
          return next;
        });
        toast.success("Etiqueta asignada.");
      } else {
        toast.error(`Error asignando etiqueta: ${resp.message}`);
      }
      setUpdating(false);
    },
    [cliente, onChangeIds]
  );

  const handleQuitar = useCallback(
    async (idEtiqueta: number) => {
      if (!cliente) return;
      setUpdating(true);
      const resp = await deleteQuitarEtiqueta(cliente, idEtiqueta);
      if (resp.success) {
        setEtiquetasCliente((prev) => {
          const next = prev.filter((id) => id !== idEtiqueta);
          onChangeIds?.(next);
          return next;
        });
        toast.success("Etiqueta removida.");
      } else {
        toast.error(`Error quitando etiqueta: ${resp.message}`);
      }
      setUpdating(false);
    },
    [cliente, onChangeIds]
  );

  const etiquetasAsignadas = useMemo(() => {
    return catalogo.filter((e) => etiquetasCliente.includes(e.id));
  }, [catalogo, etiquetasCliente]);

  const etiquetasDisponibles = useMemo(() => {
    return catalogo.filter((e) => !etiquetasCliente.includes(e.id));
  }, [catalogo, etiquetasCliente]);

  const abrirModal = useCallback(() => setShowModal(true), []);
  const cerrarModal = useCallback(() => setShowModal(false), []);

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
          disabled={disabled || !cliente || loadingCatalogo || loadingCliente}
        >
          <FontAwesomeIcon icon={faTag} className="me-1" /> Gestionar etiquetas
        </Button>
      </div>

      {/* Badges */}
      <div className="d-flex flex-wrap gap-2 mt-2">
        {loadingCliente ? (
          <span>Cargando...</span>
        ) : etiquetasAsignadas.length === 0 ? (
          <span className="text-muted" style={{ fontStyle: "italic" }}>
            Sin etiquetas.
          </span>
        ) : (
          etiquetasAsignadas.map((etiqueta) => (
            <Badge
              key={etiqueta.id}
              // bg="light"
              className="d-flex align-items-center"
              style={{
                backgroundColor: etiqueta.color + "20",
                color: etiqueta.color,
                border: `1px solid ${etiqueta.color}`,
                padding: "0.5rem 0.75rem",
                cursor: disabled ? "default" : "pointer",
              }}
              onClick={() => !disabled && handleQuitar(etiqueta.id)}
            >
              {etiqueta.nombre}
              {!disabled && (
                <FontAwesomeIcon icon={faTimes} className="ms-2" />
              )}
            </Badge>
          ))
        )}
      </div>

      {/* Modal de selección */}
      <Modal show={showModal} onHide={cerrarModal} centered>
        <Modal.Header closeButton={true} {...({} as any)} >
          <Modal.Title>Gestionar etiquetas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingCatalogo ? (
            <p>Cargando catálogo...</p>
          ) : etiquetasDisponibles.length === 0 ? (
            <p className="text-muted">No hay etiquetas disponibles para agregar.</p>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {etiquetasDisponibles.map((etiqueta) => (
                <div
                  key={etiqueta.id}
                  className="d-flex align-items-center"
                  style={{
                    backgroundColor: etiqueta.color + "20",
                    color: etiqueta.color,
                    border: `1px solid ${etiqueta.color}`,
                    padding: "0.5rem 0.75rem",
                    cursor: updating ? "wait" : "pointer",
                    borderRadius: "4px",
                  }}
                  onClick={() => !updating && handleAsignar(etiqueta.id)}
                >
                  {etiqueta.nombre}
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModal} disabled={updating}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Integración mínima en ConsultaCartera.tsx
// -----------------------------------------------------------------------------
// 1. IMPORTAR:
//    import { EtiquetasCliente } from "../<ruta-correcta>/EtiquetasClienteComponent";
//
// 2. ELIMINAR / COMENTAR en ConsultaCartera.tsx:
//    • const etiquetasMockup = [...]
//    • const [etiquetasCliente, setEtiquetasCliente] = useState<number[]>([]);
//    • const [showModalEtiquetas, setShowModalEtiquetas] = useState(false);
//    • handleAsignarEtiqueta, handleQuitarEtiqueta funciones.
//    • El bloque JSX dentro de la Col de 6 columnas (Información General) que
//      muestra <h6>Etiquetas</h6> + botón + badges.
//    • El modal manual (el que usa showModalEtiquetas) casi al final del return.
//
// 3. REEMPLAZA ESE BLOQUE POR:
//    <EtiquetasCliente
//       cliente={selectedValue}
//       disabled={!registroSeleccionado}
//    />
//
// 4. (Opcional) Si quieres reaccionar a cambios de etiquetas (por ejemplo para
//    filtrar facturas), agrega:
//    const handleCambioEtiquetas = (ids:number[]) => { /* TODO */ };
//    <EtiquetasCliente cliente={selectedValue} disabled={!registroSeleccionado} onChangeIds={handleCambioEtiquetas} />
//
// 5. No cambies nada más. El resto de la lógica de ConsultaCartera permanece.
// -----------------------------------------------------------------------------
