import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton Component
 * 
 * Placeholder animato per indicare il caricamento di contenuti.
 * Simula la forma del contenuto che verrà caricato (testo, immagini, card).
 * 
 * @param className Classi CSS per definire altezza, larghezza e forma
 */
export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={clsx("animate-pulse bg-gray-200 rounded", className)} />
  );
}
