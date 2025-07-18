export const saveObjectToLocalStorage = (key: string, value: any): void => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      console.log(`Objeto guardado con la clave "${key}"`);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }