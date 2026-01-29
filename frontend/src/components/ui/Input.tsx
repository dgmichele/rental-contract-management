import React from 'react';
import type { UseFormRegister, FieldValues, Path } from 'react-hook-form';
import clsx from 'clsx';

interface InputProps<T extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  // Etichetta del campo input
  label: string;
  // Nome del campo per react-hook-form
  name: Path<T>;
  // Funzione di registrazione di react-hook-form
  register: UseFormRegister<T>;
  // Messaggio di errore opzionale da mostrare sotto l'input
  error?: string;
  // Testo di aiuto opzionale sotto l'input (se non c'è errore)
  helperText?: string;
  // Icona opzionale a sinistra
  startIcon?: React.ReactNode;
}

/**
 * Input Component
 * 
 * Componente input di testo integrato con react-hook-form.
 * Include label, gestione errori e helper text.
 * Supporta un'icona opzionale a sinistra.
 * 
 * @param label Etichetta visibile sopra l'input
 * @param name Nome del campo (deve corrispondere alle chiavi del form)
 * @param register Funzione register derivante da useForm
 * @param error Stringa contenente l'eventuale messaggio di errore di validazione
 * @param helperText Testo informativo opzionale
 * @param startIcon Elemento icona da mostrare all'inizio dell'input
 */
export default function Input<T extends FieldValues>({
  label,
  name,
  register,
  error,
  helperText,
  className,
  startIcon,
  type = 'text',
  ...props
}: InputProps<T>) {
  return (
    <div className={clsx('flex flex-col gap-1 w-full', className)}>
      {/* Label del campo */}
      <label htmlFor={name} className="text-sm font-semibold text-text-title">
        {label}
      </label>
      
      <div className="relative">
        {/* Icona a sinistra */}
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-subtle">
            {startIcon}
          </div>
        )}

        {/* Campo Input */}
        <input
          id={name}
          type={type}
          // Integrazione con react-hook-form, gestisce valueAsNumber se type è number
          {...register(name, { valueAsNumber: type === 'number' })}
          className={clsx(
            // Stili base: background, bordo, padding, focus styles
            'bg-bg-card border border-border rounded px-3 py-2 focus:outline-none focus:border-secondary placeholder:text-text-subtle transition-colors duration-300 w-full',
            {
              // Bordo rosso se presente errore
              'border-red-500 focus:border-red-500': error,
              // Padding extra a sinistra se c'è l'icona
              'pl-10': startIcon,
            }
          )}
          {...props}
        />
      </div>
      
      {/* Messaggi di errore o aiuto */}
      {error && <span className="text-xs text-red-500">{error}</span>}
      {!error && helperText && <span className="text-xs text-text-subtle">{helperText}</span>}
    </div>
  );
}
