import { useState, useEffect } from 'react';

/**
 * Hook per posticipare l'aggiornamento di un valore (debounce).
 * Utile per evitare troppe chiamate API durante la digitazione in una barra di ricerca.
 * 
 * @param value Il valore da debouncare
 * @param delay Il ritardo in millisecondi (default: 400ms)
 * @returns Il valore debouncato
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
