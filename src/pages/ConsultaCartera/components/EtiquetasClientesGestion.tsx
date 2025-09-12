import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Spinner } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import {
  EtiquetaClienteListado,
  useListarEtiquetasCliente,
  useGestionarEtiquetaCliente,
} from "@app/services/ConsultaCartera/GestionEtiquetasClienteService";

// -----------------------------------------------------------------------------
// Props del componente
// -----------------------------------------------------------------------------
export interface EtiquetasClienteProps {
  cliente: string;
  idUser: number | string;
  disabled?: boolean;
  className?: string;
  label?: string;
  onChangeIds?: (ids: number[]) => void;
}

// -----------------------------------------------------------------------------
// Helpers: normalización de datos
// -----------------------------------------------------------------------------
function coerceBoolean(v: any): boolean {
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
  const [lista, setLista] = useState<EtiquetaClienteListado[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  // hooks de servicio
  const { loading, listarEtiquetasCliente } = useListarEtiquetasCliente();
  const { gestionarEtiquetaCliente } = useGestionarEtiquetaCliente();

  // Cargar / recargar lista
  const cargarLista = useCallback(async () => {
    if (!cliente) {
      setLista([]);
      onChangeIds?.([]);
      return;
    }

    try {
      const resp = await listarEtiquetasCliente(idUser, cliente);

      if (resp && resp.success && Array.isArray(resp.data)) {
        const listaNorm = normalizarLista(resp.data as any[]);
        setLista(listaNorm);
        const idsAsignados = listaNorm.filter((e) => e.asignado).map((e) => e.id);
        onChangeIds?.(idsAsignados);
      } else {
        const errorMsg = resp?.message || "No se pudo cargar etiquetas.";
        toast.error(errorMsg);
        setLista([]);
        onChangeIds?.([]);
      }
    } catch (err) {
      console.error("Error cargando etiquetas:", err);
      toast.error("No se pudo cargar etiquetas.");
      setLista([]);
      onChangeIds?.([]);
    }
  }, [cliente, idUser, listarEtiquetasCliente, onChangeIds]);

  // se ejecuta solo cuando cambia cliente o idUser
  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  const etiquetasAsignadas = useMemo(() => lista.filter((e) => e.asignado), [lista]);
  const etiquetasNoAsignadas = useMemo(() => lista.filter((e) => !e.asignado), [lista]);

  // Toggle etiqueta
  const toggleEtiqueta = useCallback(
    async (idEtiqueta: number) => {
      if (!cliente || updatingId !== null) return;

      const etiqueta = lista.find((x) => x.id === idEtiqueta);
      const esAsignada = !!etiqueta?.asignado;
      const nombre = etiqueta?.nombre ?? "esta etiqueta";
      const msg = esAsignada
        ? `¿Quitar la etiqueta "${nombre}" de este cliente?`
        : `¿Asignar la etiqueta "${nombre}" a este cliente?`;

      const ok = window.confirm(msg);
      if (!ok) return;

      setUpdatingId(idEtiqueta);
      const resp = await gestionarEtiquetaCliente(idUser, cliente, idEtiqueta);

      if (resp && resp.success) {
        toast.success("Operación exitosa.");
        await cargarLista();
      } else {
        const errorMsg = resp?.message || "Error gestionando etiqueta.";
        toast.error(errorMsg);
      }
      setUpdatingId(null);
    },
    [cliente, idUser, lista, updatingId, cargarLista, gestionarEtiquetaCliente]
  );

  const abrirModal = useCallback(() => setShowModal(true), []);
  const cerrarModal = useCallback(() => setShowModal(false), []);

  const resolveColor = (hex?: string | null) => (!hex ? "#6c757d" : hex);

  const makeStyle = (hex?: string | null): React.CSSProperties => {
    const c = resolveColor(hex);
    return {
      backgroundColor: c + "20",
      color: c,
      border: `1px solid ${c}`,
      padding: "0.5rem 0.75rem",
      cursor: disabled ? "default" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
    };
  };

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

      {/* Modal */}
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
