/**
 * Componente Pagination - Controles de paginación
 */

import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        {startItem}-{endItem} DE {totalItems.toLocaleString()} REGISTROS
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Página anterior"
        >
          PREV
        </button>

        <div className="pagination-pages">
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
            const pageNum = currentPage + i;
            if (pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Página siguiente"
        >
          NEXT
        </button>
      </div>
    </div>
  );
};
