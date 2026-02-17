
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * 
 * Componente di utilità che ascolta i cambiamenti di route e
 * resetta lo scroll della finestra all'inizio (top: 0).
 * Migliora la UX nelle Single Page Application (SPA).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
