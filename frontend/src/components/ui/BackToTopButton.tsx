import { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';

/**
 * BackToTopButton Component
 * 
 * Pulsante tondo che permette di tornare all'inizio della pagina.
 * Compare con un'animazione smooth slide-in dopo uno scroll di 400px.
 * Posizionato in basso a destra, adattandosi alla presenza della MobileNav.
 */
const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Mostra il pulsante quando lo scroll supera i 400px
      // (Circa l'altezza di un header o mezza schermata mobile)
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Aggiungi listener per lo scroll
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    
    // Controllo iniziale se la pagina è già scrollata (es. dopo refresh)
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed right-6 z-40
        flex items-center justify-center
        w-12 h-12 rounded-full
        bg-secondary text-white shadow-xl
        hover:bg-primary active:scale-90
        transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        
        /* Posizionamento responsive: più alto su mobile/tablet (bottom-24) per stare sopra la MobileNav (h-16) */
        bottom-24 xl:bottom-8
        
        /* Animazione slide in/out e fade */
        ${isVisible 
          ? 'translate-y-0 opacity-100 scale-100 cursor-pointer' 
          : 'translate-y-16 opacity-0 scale-50 pointer-events-none'
        }
      `}
      aria-label="Torna all'inizio"
      title="Torna su"
    >
      <FiArrowUp className="w-6 h-6 stroke-3" />
    </button>
  );
};

export default BackToTopButton;
