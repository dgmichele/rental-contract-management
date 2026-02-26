import { type RefObject } from 'react';
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
  /**
   * Se fornito, al click di paginazione fa scroll smooth verso quell'elemento
   * (utile per sezioni interne alla pagina, es. Dashboard).
   * Se non fornito, porta smooth in cima alla finestra.
   */
  scrollTargetRef?: RefObject<HTMLElement | null>;
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
export default function Pagination({ currentPage, totalPages, onPageChange, className, scrollTargetRef }: PaginationProps) {
  // Se c'è solo una pagina, non mostrare la paginazione
  if (totalPages <= 1) return null;

  /**
   * Gestore click pagina.
   * Esegue il cambio pagina e anima lo scroll:
   * - verso il ref fornito (sezioni interne, es. Dashboard), tenendo conto dell'header sticky
   * - oppure verso la cima della finestra
   * Lo scroll viene eseguito DOPO il re-render tramite doppio rAF per evitare
   * che il cambio di stato interrompa l'animazione smooth.
   */
  const handlePageClick = (page: number) => {
    onPageChange(page);

    // Doppio rAF: il primo aspetta che React abbia aggiornato il DOM,
    // il secondo attende che il browser abbia fatto il layout,
    // garantendo che lo scroll non venga annullato dal re-render.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollTargetRef?.current) {
          // Legge l'altezza dell'header sticky dal DOM per compensarla
          const stickyHeader = document.querySelector('header');
          const headerHeight = stickyHeader ? stickyHeader.getBoundingClientRect().height : 0;
          const elementTop = scrollTargetRef.current.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementTop - headerHeight - 8, // 8px di margine visivo
            behavior: 'smooth',
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
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


