export const saveObjectToLocalStorage = (key: string, value: any): void => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      console.log(`Objeto guardado con la clave "${key}"`);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }


const STORAGE_KEY = "filtros_carteras";

export const saveFiltrosCarteras = (data: any) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadFiltrosCarteras = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  console.log("Cargando filtros desde localStorage:", raw);
  return raw ? JSON.parse(raw) : null;
};

export const clearFiltrosCarteras = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// Para usarlo en otros componentes
export const getValorFiltro = (key: string) => {
  const data = loadFiltrosCarteras();
  return data ? data[key] : null;
};

export const saveExpecificFiltroProperty = (key: string, value: any) => {
  const data = loadFiltrosCarteras() || {};
  data[key] = value;
  saveFiltrosCarteras(data);
}

export const existsInLocalStorage = (key: string): boolean => {
  return localStorage.getItem(STORAGE_KEY) !== null;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function saveOrUpdateSessionValue<T>(key: string, value: T): void {
  if (!key || typeof key !== "string") {
    console.error("El key debe ser un string válido.");
    return;
  }

  if (
    value === undefined ||
    value === null ||
    (typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean" &&
      !(value instanceof Date))
  ) {
    console.error("El valor debe ser un tipo primitivo válido o Date.");
    return;
  }

  try {
    const toStore =
      value instanceof Date ? { __date: true, value: value.toISOString() } : value;

    sessionStorage.setItem(key, JSON.stringify(toStore));
  } catch (err) {
    console.error("Error guardando en sessionStorage:", err);
  }
}

/**
 * Obtiene un valor primitivo desde sessionStorage.
 * Reconstruye automáticamente valores Date.
 */
export function getSessionValue<T>(key: string): T | null {
  if (!key || typeof key !== "string") {
    console.error("El key debe ser un string válido.");
    return null;
  }

  const raw = sessionStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    // Reconstrucción automática para Date
    if (parsed && parsed.__date === true && parsed.value) {
      return new Date(parsed.value) as T;
    }

    return parsed as T;
  } catch (err) {
    console.error("Error leyendo sessionStorage:", err);
    return null;
  }
}

/**
 * Elimina un valor del sessionStorage.
 */
export function deleteSessionValue(key: string): void {
  if (!key || typeof key !== "string") {
    console.error("El key debe ser un string válido.");
    return;
  }

  try {
    sessionStorage.removeItem(key);
  } catch (err) {
    console.error("Error eliminando de sessionStorage:", err);
  }
}