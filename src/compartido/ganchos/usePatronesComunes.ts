import { useState, useCallback, useEffect } from 'react';

/**
 * Gancho personalizado para gestionar estado de modal
 * 
 * Encapsula lógica común de abrir/cerrar modal
 * Elimina código repetitivo de useState + useCallback
 * 
 * Uso:
 *   const modal = useModal();
 *   
 *   <button onClick={modal.open}>Abrir</button>
 *   <Modal isOpen={modal.isOpen} onClose={modal.close} />
 *   <Modal isOpen={modal.isOpen} onClose={modal.toggle} />
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
};

/**
 * Gancho personalizado para gestionar estado booleano con toggle
 * 
 * Encapsula lógica de toggle (isEditing, isExpanded, etc.)
 * 
 * Uso:
 *   const editing = useToggle();
 *   
 *   <button onClick={editing.toggle}>Editar</button>
 *   <input disabled={!editing.value} />
 */
export const useToggle = (initialState = false) => {
  const [value, setValue] = useState(initialState);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue
  };
};

/**
 * Gancho personalizado para gestionar datos de formulario
 * 
 * Encapsula estado del formulario y manejadores
 * Crea automáticamente handlers onChange para inputs
 * 
 * Uso:
 *   const form = useFormularioDatos({ nombre: '', correo: '' });
 *   
 *   <input name="nombre" value={form.data.nombre} onChange={form.handleChange} />
 *   <input name="correo" value={form.data.correo} onChange={form.handleChange} />
 *   <button onClick={() => form.reset()}>Limpiar</button>
 */
export const useFormularioDatos = <T extends Record<string, any>>(initialData: T) => {
  const [data, setData] = useState<T>(initialData);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setData(prev => ({
        ...prev,
        [name]: value
      }));
    },
    []
  );

  const handleChangeField = useCallback(
    (field: keyof T, value: any) => {
      setData(prev => ({
        ...prev,
        [field]: value
      }));
    },
    []
  );

  const reset = useCallback(() => {
    setData(initialData);
  }, [initialData]);

  const setField = useCallback(
    (field: keyof T, value: any) => {
      setData(prev => ({
        ...prev,
        [field]: value
      }));
    },
    []
  );

  return {
    data,
    setData,
    handleChange,
    handleChangeField,
    setField,
    reset
  };
};

/**
 * Gancho personalizado para gestionar estado de expansión de lista
 * 
 * Gestiona qué items están expandidos (tabla, acordeones)
 * Solo un item puede estar expandido a la vez (expandId = id | null)
 * 
 * Uso:
 *   const expanded = useExpandido();
 *   
 *   {rows.map(row => (
 *     <div
 *       onClick={() => expanded.toggle(row.id)}
 *       className={expanded.isExpanded(row.id) ? 'expanded' : ''}
 *     >
 *       {expanded.isExpanded(row.id) && <Detalles row={row} />}
 *     </div>
 *   ))}
 */
export const useExpandido = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const expand = useCallback((id: string) => {
    setExpandedId(id);
  }, []);

  const collapse = useCallback(() => {
    setExpandedId(null);
  }, []);

  const isExpanded = useCallback((id: string) => {
    return expandedId === id;
  }, [expandedId]);

  return {
    expandedId,
    toggle,
    expand,
    collapse,
    isExpanded,
    setExpandedId
  };
};

/**
 * Gancho personalizado para gestionar estado de carga asincrónica
 * 
 * Gestiona states de loading, data y error para operaciones async
 * 
 * Uso:
 *   const { loading, data, error, execute } = useAsincrono(fetchData);
 *   
 *   <button onClick={() => execute()}>Cargar</button>
 *   {loading && <Spinner />}
 *   {data && <Resultados data={data} />}
 *   {error && <Error message={error} />}
 */
export const useAsincrono = <T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = false
) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err as E);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  // Execute immediately if flag is set
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    data,
    error,
    execute,
    reset,
    setData,
    setError,
    setLoading
  };
};

// Backward compatibility aliases
export const useCommonPatterns = null; // This was a collection export
export const useFormData = useFormularioDatos;
export const useExpanded = useExpandido;
export const useAsync = useAsincrono;
