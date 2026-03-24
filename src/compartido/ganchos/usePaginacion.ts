/**
 * Hook personalizado para gestionar la paginación
 */

import { useState, useMemo } from 'react';

interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage: number;
}

export const usePaginacion = ({
  totalItems,
  itemsPerPage,
}: UsePaginationOptions) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      totalItems,
      itemsPerPage,
    };
  }, [currentPage, totalItems, itemsPerPage]);

  const goToPage = (page: number) => {
    const { totalPages } = paginationData;
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    goToPage(currentPage + 1);
  };

  const prevPage = () => {
    goToPage(currentPage - 1);
  };

  return {
    ...paginationData,
    goToPage,
    nextPage,
    prevPage,
  };
};

// Backward compatibility alias
export const usePagination = usePaginacion;
