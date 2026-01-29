import clsx from 'clsx';

/**
 * Spinner Component
 * 
 * Indicatore di caricamento circolare animato.
 * Utilizzato nei bottoni, nei caricamenti di pagina o sezioni.
 * 
 * @param className Classi CSS aggiuntive (es. per colore o dimensione)
 */
export default function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        // Stili base: animazione rotazione, rotondo, bordo, dimensione base
        'animate-spin rounded-full border-2 border-current border-t-transparent h-5 w-5',
        className
      )}
    />
  );
}
