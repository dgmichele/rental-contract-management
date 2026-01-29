import React from 'react';
import clsx from 'clsx';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Variante visuale del bottone: 'primary' (pieno) o 'secondary' (testo colorato)
  variant?: 'primary' | 'secondary';
  // Stato di caricamento: disabilita il bottone e mostra uno spinner
  isLoading?: boolean;
}

/**
 * Button Component
 * 
 * Componente bottone riutilizzabile che supporta diverse varianti e stati.
 * Gestisce automaticamente lo stato di caricamento e disabilitazione.
 * 
 * @param variant 'primary' (default) o 'secondary'
 * @param isLoading Se true, mostra lo spinner e disabilita il click
 * @param children Contenuto del bottone
 * @param className Classi CSS aggiuntive
 * @param props Altre props standard del bottone HTML
 */
export default function Button({
  variant = 'primary',
  children,
  className,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        // Stili base: padding, arrotondamento, font, transizioni, centratura
        'px-4 py-2 rounded font-semibold transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer',
        {
          // Stile Primary: sfondo pieno brand color
          'bg-primary hover:bg-primary-hover text-bg-card': variant === 'primary',
          // Stile Secondary: sfondo trasparente, testo brand color
          'bg-transparent text-primary hover:text-primary-hover border-0': variant === 'secondary',
          // Stato disabilitato o loading
          'opacity-70 cursor-not-allowed': disabled || isLoading,
        },
        className
      )}
      {...props}
    >
      {/* Mostra lo spinner se in stato di caricamento */}
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}
