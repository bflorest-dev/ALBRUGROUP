import { useState, useCallback, useEffect } from 'react';

/**
 * Problema #7: Custom Hook for Modal State Management
 * 
 * Encapsulates common modal open/close logic
 * Eliminates repetitive useState + useCallback for isModalOpen/setIsModalOpen
 * 
 * Usage:
 *   const modal = useModal();
 *   
 *   <button onClick={modal.open}>Open</button>
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
 * Problema #7: Custom Hook for Toggle State
 * 
 * Encapsulates boolean toggle logic (e.g., isEditing, isExpanded, etc.)
 * 
 * Usage:
 *   const editing = useToggle();
 *   
 *   <button onClick={editing.toggle}>Edit</button>
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
 * Problema #7: Custom Hook for Form Data Management
 * 
 * Encapsulates form state and handlers
 * Automatically creates onChange handlers for inputs
 * 
 * Usage:
 *   const form = useFormData({ name: '', email: '' });
 *   
 *   <input name="name" value={form.data.name} onChange={form.handleChange} />
 *   <input name="email" value={form.data.email} onChange={form.handleChange} />
 *   <button onClick={() => form.reset()}>Clear</button>
 */
export const useFormData = <T extends Record<string, any>>(initialData: T) => {
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
 * Problema #7: Custom Hook for List Expansion State
 * 
 * Manages which items are expanded (e.g., table rows, accordions)
 * Only one item can be expanded at a time (expandId = id | null)
 * 
 * Usage:
 *   const expanded = useExpanded();
 *   
 *   {rows.map(row => (
 *     <div
 *       onClick={() => expanded.toggle(row.id)}
 *       className={expanded.isExpanded(row.id) ? 'expanded' : ''}
 *     >
 *       {expanded.isExpanded(row.id) && <Details row={row} />}
 *     </div>
 *   ))}
 */
export const useExpanded = () => {
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
 * Problema #7: Custom Hook for Async Loading State
 * 
 * Manages loading, data, and error states for async operations
 * 
 * Usage:
 *   const { loading, data, error, execute } = useAsync(fetchData);
 *   
 *   <button onClick={() => execute()}>Load</button>
 *   {loading && <Spinner />}
 *   {data && <Results data={data} />}
 *   {error && <Error message={error} />}
 */
export const useAsync = <T, E = string>(
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

/**
 * Problema #7: Custom Hook for Pagination
 * 
 * Manages current page and items per page
 * 
 * Usage:
 *   const pagination = usePagination(items);
 *   
 *   {items.slice(pagination.startIndex, pagination.endIndex).map(...)}
 *   <button onClick={pagination.nextPage}>Next</button>
 *   <button onClick={pagination.prevPage}>Prev</button>
 *   <span>{pagination.currentPage}/{pagination.totalPages}</span>
 */
export const usePagination = <T = any>(items: T[], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    currentItems,
    nextPage,
    prevPage,
    goToPage,
    reset,
    setCurrentPage
  };
};
