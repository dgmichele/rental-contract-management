import clsx from 'clsx';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
  // Pagina corrente attiva (1-indexed)
  currentPage: number;
  // Numero totale di pagine disponibili
  totalPages: number;
  // Callback chiamata al cambio pagina
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination Component
 * 
 * Componente per la navigazione tra pagine di liste dati.
 * Gestisce logicamente la visualizzazione dei numeri pagina, ellissi (...) e pulsanti prev/next.
 * 
 * Logica di visualizzazione:
 * - Mostra sempre prima e ultima pagina
 * - Mostra un range attorno alla pagina corrente
 * - Mostra ellissi per saltare intervalli ampi
 */
export default function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  // Se c'è solo una pagina, non mostrare la paginazione
  if (totalPages <= 1) return null;

  /**
   * Gestore click pagina
   * Esegue il cambio pagina e riporta lo scroll all'inizio
   */
  const handlePageClick = (page: number) => {
    onPageChange(page);
    window.scrollTo(0, 0);
  };

  const renderPageNumbers = () => {
    const pages = [];
    
    // 1. Sempre mostra la prima pagina
    pages.push(
      <button
        key={1}
        onClick={() => handlePageClick(1)}
        className={clsx(
          'w-8 h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors duration-300 cursor-pointer',
          currentPage === 1
            ? 'bg-secondary text-white'
            : 'text-text-body hover:bg-border'
        )}
      >
        1
      </button>
    );

    // Calcolo del range dinamico da mostrare attorno alla pagina corrente
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Aggiustamenti per i casi limite (inizio o fine lista)
    if (currentPage <= 3) {
      endPage = Math.min(totalPages - 1, 4);
    }
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - 3);
    }

    // Mostra ellissi prima del range centrale se necessario
    if (startPage > 2) {
      pages.push(
        <span key="start-ellipsis" className="w-8 h-8 flex items-center justify-center text-text-subtle">
          ...
        </span>
      );
    }

    // Generazione pulsanti del range centrale
    for (let i = startPage; i <= endPage; i++) {
        pages.push(
            <button
              key={i}
              onClick={() => handlePageClick(i)}
              className={clsx(
                'w-8 h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors duration-300 cursor-pointer',
                currentPage === i
                  ? 'bg-secondary text-white'
                  : 'text-text-body hover:bg-border'
              )}
            >
              {i}
            </button>
          );
    }

    // Mostra ellissi dopo il range centrale se necessario
    if (endPage < totalPages - 1) {
      pages.push(
        <span key="end-ellipsis" className="w-8 h-8 flex items-center justify-center text-text-subtle">
          ...
        </span>
      );
    }

    // 2. Sempre mostra l'ultima pagina (se diversa dalla prima)
    if (totalPages > 1) {
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageClick(totalPages)}
          className={clsx(
            'w-8 h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors duration-300 cursor-pointer',
            currentPage === totalPages
              ? 'bg-secondary text-white'
              : 'text-text-body hover:bg-border'
          )}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className={clsx('flex items-center justify-center gap-2 mt-10', className)}>
      {/* Pulsante Precedente */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Previous page"
      >
        <FaChevronLeft />
      </button>
      
      {/* Numeri pagina */}
      <div className="flex items-center gap-1">
        {renderPageNumbers()}
      </div>

      {/* Pulsante Successivo */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Next page"
      >
        <FaChevronRight />
      </button>
    </div>
  );
}


