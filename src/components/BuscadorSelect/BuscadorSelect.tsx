import React, { useCallback, useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";

export interface BuscadorSelectOption {
  value: string;
  label: string;
}

interface BuscadorSelectProps {
  /** SP que retorna las opciones. Si no se pasa, se usan las options estáticas. */
  spName?: string | null;
  /** Opciones estáticas (cuando no hay SP o como fallback). */
  options?: BuscadorSelectOption[];
  /** Valor seleccionado actualmente. */
  value?: string;
  /** Callback al seleccionar una opción. */
  onChange: (value: string) => void;
  /** Función para obtener opciones desde el backend. */
  onFetchOpciones?: (spName: string | null, codigoOpcion: string | null, subOpcion: string | null, query: string) => Promise<BuscadorSelectOption[]>;
  /** Código de opción para el SP central. */
  codigoOpcion?: string | null;
  /** Sub-opción para el SP central. */
  subOpcion?: string | null;
  /** Etiqueta del campo. */
  label?: string;
  /** Placeholder del input. */
  placeholder?: string;
  /** Modo compacto. */
  compact?: boolean;
}

const DEBOUNCE_MS = 350;

export const BuscadorSelect: React.FC<BuscadorSelectProps> = ({
  spName,
  options: staticOptions = [],
  value = "",
  onChange,
  onFetchOpciones,
  codigoOpcion = null,
  subOpcion = null,
  label,
  placeholder = "Buscar...",
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchIdRef = useRef(0);

  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchedOptions, setFetchedOptions] = useState<BuscadorSelectOption[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Determinar qué opciones mostrar
  const displayOptions = spName && onFetchOpciones ? fetchedOptions : staticOptions;

  // Filtrar localmente para búsqueda rápida
  const filteredOptions = searchText
    ? displayOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchText.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchText.toLowerCase())
      )
    : displayOptions;

  // Carga inicial si hay SP
  useEffect(() => {
    if (!spName || !onFetchOpciones) return;

    let cancelled = false;
    const currentFetchId = ++fetchIdRef.current;

    setLoading(true);
    onFetchOpciones(spName, codigoOpcion, subOpcion, "")
      .then((opts) => {
        if (cancelled || currentFetchId !== fetchIdRef.current) return;
        setFetchedOptions(opts);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled || currentFetchId !== fetchIdRef.current) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [spName, onFetchOpciones]);

  // Búsqueda con debounce cuando hay SP
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);

      if (!spName || !onFetchOpciones) return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        const currentFetchId = ++fetchIdRef.current;
        setLoading(true);

        try {
          const opts = await onFetchOpciones(spName, codigoOpcion, subOpcion, text);
          if (currentFetchId !== fetchIdRef.current) return;
          setFetchedOptions(opts);
        } catch {
          // ignorar
        } finally {
          if (currentFetchId === fetchIdRef.current) {
            setLoading(false);
          }
        }
      }, DEBOUNCE_MS);
    },
    [spName, onFetchOpciones]
  );

  // Click outside cierra el dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredOptions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectOption(filteredOptions[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const selectOption = (opt: BuscadorSelectOption) => {
    onChange(opt.value);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const selectedLabel = displayOptions.find((o) => o.value === value)?.label ?? "";

  return (
    <Form.Group ref={containerRef} style={compact ? { marginBottom: 0 } : undefined}>
      {label && (
        <Form.Label style={compact ? { fontSize: 12, marginBottom: 4 } : undefined}>
          {label}
        </Form.Label>
      )}
      <div style={{ position: "relative" }}>
        <Form.Control
          ref={inputRef}
          type="text"
          size={compact ? "sm" : undefined}
          placeholder={placeholder}
          value={isOpen ? searchText : selectedLabel}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true);
            handleSearchChange(e.target.value);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchText("");
            setHighlightIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {loading && (
          <span
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12,
              color: "#6c757d",
            }}
          >
            <i className="fas fa-spinner fa-spin" />
          </span>
        )}
        {isOpen && (
          <ul
            className="list-group"
            style={{
              position: "absolute",
              zIndex: 1050,
              width: "100%",
              maxHeight: 200,
              overflowY: "auto",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {filteredOptions.length === 0 ? (
              <li className="list-group-item small text-muted">
                {loading ? "Buscando..." : "Sin resultados"}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => (
                <li
                  key={opt.value}
                  className={`list-group-item list-group-item-action small py-1 px-2 ${
                    idx === highlightIndex ? "active" : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(opt);
                  }}
                  onMouseEnter={() => setHighlightIndex(idx)}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </Form.Group>
  );
};
