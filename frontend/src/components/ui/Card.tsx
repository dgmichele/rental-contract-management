import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Card Component
 * 
 * Contenitore generico per card, utilizzato per dashboard, liste proprietari, dettagli contratti, ecc.
 * Fornisce lo stile base di background, bordi e padding.
 * 
 * @param children Contenuto della card
 * @param className Classi CSS aggiuntive per personalizzazione (es. padding, margin)
 * @param onClick Handler opzionale per il click sulla card
 */
export default function Card({ children, className, onClick }: CardProps) {
  return (
    <div 
      className={clsx(
        // Stili base: background card, bordo sottile, bordi arrotondati, padding default
        'bg-bg-card border border-border rounded-lg p-4', 
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
