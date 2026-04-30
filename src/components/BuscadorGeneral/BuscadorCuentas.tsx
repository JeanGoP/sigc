import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Form } from "react-bootstrap";
import {
  useBuscadorGeneralService,
  BuscadorParams,
} from "../../services/General/BuscadorGeneralService";

// Interfaz para los items normalizados
interface BuscadorItem {
  id: string;
  codigo: string;
  descripcion: string;
}

export type Props = {
  opcion: string;
  op?: string;
  op2?: string;
  placeholder?: string;
  label?: string;
  value?: string;
  onChange?: (cuenta: string | null) => void;
  onSelect?: (id: string, item: BuscadorItem) => void;
};

const BuscadorCuentas = React.memo((props: Props): JSX.Element => {
  const {
    opcion,
    op,
    op2,
    placeholder = "Buscar...",
    label,
    value,
    onChange,
    onSelect,
  } = props;

  const { loading, error, buscarGeneral } = useBuscadorGeneralService();

  const [items, setItems] = useState<BuscadorItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedItem, setSelectedItem] = useState<BuscadorItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxIdRef = useRef(
    `buscador-listbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Función para normalizar los datos de la respuesta API
  const normalizeData = useCallback((responseData: any): BuscadorItem[] => {
    if (!responseData) return [];

    let dataArray: any[] = [];

    // Si responseData es un array directamente
    if (Array.isArray(responseData)) {
      dataArray = responseData;
    }
    // Si responseData es un objeto, buscar la primera propiedad que sea un array
    else if (typeof responseData === "object" && responseData !== null) {
      for (const key in responseData) {
        if (Array.isArray(responseData[key])) {
          dataArray = responseData[key];
          break;
        }
      }
    }

    // Normalizar cada item: mapear codicta -> codigo/id, descripcion -> descripcion
    return dataArray
      .map((item: any) => ({
        id: item.codicta || item.id || item.descripcion || "",
        codigo: item.codicta || item.codigo || item.id || "",
        descripcion: item.descripcion || item.nombre || "",
      }))
      .filter((item: BuscadorItem) => item.id && item.descripcion);
  }, []);

  // Cargar datos UNA SOLA VEZ al montar
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const loadData = async () => {
      try {
        const params: BuscadorParams = {
          opcion,
          op,
          op2,
        };

        const response = await buscarGeneral(params);

        if (response?.data) {
          const normalizedItems = normalizeData(response.data);
          setItems(normalizedItems);
          hasLoadedRef.current = true;
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta una vez al montar

  // Filtrar items localmente basado en el texto de búsqueda (optimizado con useMemo)
  const filteredItems = useMemo(() => {
    if (!searchText.trim()) {
      return [];
    }

    const searchLower = searchText.toLowerCase().trim();
    return items.filter((item) => {
      return (
        item.descripcion.toLowerCase().includes(searchLower) ||
        item.codigo.toLowerCase().includes(searchLower) ||
        item.id.toLowerCase().includes(searchLower)
      );
    });
  }, [items, searchText]);

  // Determinar si mostrar sugerencias (solo si hay texto y está activo)
  const shouldShowSuggestions = useMemo(() => {
    return showSuggestions && searchText.trim().length > 0;
  }, [showSuggestions, searchText]);

  // Sincronizar selectedItem con value externo
  useEffect(() => {
    if (value && items.length > 0) {
      const item = items.find((i) => i.id === value || i.codigo === value);
      if (item) {
        setSelectedItem(item);
        setSearchText(item.descripcion);
      }
    } else if (!value) {
      setSelectedItem(null);
      setSearchText("");
    }
  }, [value, items]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    if (!showSuggestions) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        // Si hay un item seleccionado, restaurar su descripción
        if (selectedItem) {
          setSearchText(selectedItem.descripcion);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions, selectedItem]);

  // Scroll al item destacado
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const itemElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (itemElement) {
        itemElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedIndex]);

  // Manejar selección de item (optimizado con useCallback)
  const handleSelectItem = useCallback(
    (item: BuscadorItem) => {
      setSelectedItem(item);
      setSearchText(item.descripcion);
      setShowSuggestions(false);
      setHighlightedIndex(-1);

      if (onChange) {
        onChange(item.codigo);
      }
      if (onSelect) {
        onSelect(item.id, item);
      }
    },
    [onChange, onSelect]
  );

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchText(newValue);
      setShowSuggestions(true);
      setHighlightedIndex(-1);

      // Si el usuario borra todo, limpiar selección
      if (!newValue.trim()) {
        setSelectedItem(null);
        if (onChange) {
          onChange(null);
        }
      }
    },
    [onChange]
  );

  // Manejar eventos de teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || filteredItems.length === 0) {
        if (e.key === "Escape") {
          setShowSuggestions(false);
          if (selectedItem) {
            setSearchText(selectedItem.descripcion);
          }
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
          setShowSuggestions(true);
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredItems.length
          ) {
            handleSelectItem(filteredItems[highlightedIndex]);
          } else if (filteredItems.length === 1) {
            handleSelectItem(filteredItems[0]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          setHighlightedIndex(-1);
          if (selectedItem) {
            setSearchText(selectedItem.descripcion);
          }
          break;
      }
    },
    [
      showSuggestions,
      filteredItems,
      highlightedIndex,
      selectedItem,
      handleSelectItem,
    ]
  );

  // Manejar focus del input
  const handleFocus = useCallback(() => {
    // Solo mostrar sugerencias si hay texto
    if (searchText.trim().length >= 0) {
      setShowSuggestions(true);
    }
    setHighlightedIndex(-1);
  }, [searchText]);

  // Manejar blur (permitir tiempo para clicks en items)
  const handleBlur = useCallback(() => {
    // Pequeño delay para permitir que el click en un item se procese
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (selectedItem !== null) {
      setSelectedItem(null);
      setSearchText("");
      setShowSuggestions(false);
      onChange && onChange(null);
    }

  }, [selectedItem, onChange]);

  return (
    <div
      className="position-relative"
      ref={containerRef}
      style={{ minWidth: 220 }}
    >
      {label && <label className="form-label mb-1">{label} </label>}

      <input
        ref={inputRef}
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={searchText}
        onChange={handleSearchChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shouldShowSuggestions}
        aria-haspopup="listbox"
        aria-controls={shouldShowSuggestions ? listboxIdRef.current : undefined}
        style={{ marginTop: "4px" }}
      />

      {shouldShowSuggestions && (
        <div
          ref={listRef}
          id={listboxIdRef.current}
          className="shadow border bg-white rounded position-absolute w-100 mt-1"
          style={{ zIndex: 1050, maxHeight: 300, overflowY: "auto" }}
          role="listbox"
        >
          {loading && items.length === 0 && (
            <div className="text-center p-3">
              <div
                className="spinner-border spinner-border-sm text-primary"
                role="status"
              >
                <span className="visually-hidden">Cargando...</span>
              </div>
              <span className="ms-2 text-muted">Cargando...</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-danger p-2">
              <small>Error: {error}</small>
            </div>
          )}

          {!loading && filteredItems.length === 0 && searchText.trim() && (
            <div className="text-muted p-3 text-center">
              No se encontraron resultados
            </div>
          )}

          {!loading && filteredItems.length > 0 && (
            <div style={{ maxHeight: 250, overflowY: "auto" }}>
              {filteredItems.map((item, index) => {
                const isSelected = selectedItem?.id === item.id;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={item.id}
                    className={`px-3 py-2 ${
                      isHighlighted
                        ? "bg-primary text-white"
                        : isSelected
                          ? "bg-light"
                          : ""
                    }`}
                    style={{
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                      backgroundColor: isHighlighted
                        ? "#007bff"
                        : isSelected
                          ? "#f8f9fa"
                          : "transparent",
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseLeave={() => setHighlightedIndex(-1)}
                    onClick={() => handleSelectItem(item)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text">{item.descripcion}</span>
                      {isSelected && !isHighlighted && (
                        <i className="bi bi-check2 ms-2 flex-shrink-0 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

BuscadorCuentas.displayName = "BuscadorGeneral";

export default BuscadorCuentas;
