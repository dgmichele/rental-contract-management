import React, { useState } from 'react';
import type { UseFormRegister, FieldValues, Path } from 'react-hook-form';
import clsx from 'clsx';
import { FiEye, FiEyeOff } from 'react-icons/fi';

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
 * Gestisce automaticamente il toggle della visibilità per campi password.
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
  // Stato per gestire la visibilità della password
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  // Il tipo finale dell'input dipende dallo stato se è un campo password
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={clsx('flex flex-col gap-1 w-full min-w-0', className)}>
      {/* Label del campo */}
      <label htmlFor={name} className="text-sm font-semibold text-text-title">
        {label}
      </label>
      
      <div className="relative w-full min-w-0">
        {/* Icona a sinistra */}
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-subtle">
            {startIcon}
          </div>
        )}

        {/* Campo Input */}
        <input
          id={name}
          type={inputType}
          // Integrazione con react-hook-form, gestisce valueAsNumber se type è number
          {...register(name, { valueAsNumber: type === 'number' })}
          onFocus={(e) => {
            if (type === 'number') {
              e.target.select();
            }
            // Chiamata all'eventuale onFocus passato come prop
            if (props.onFocus) props.onFocus(e);
          }}
          className={clsx(
            // Stili base: background, bordo, padding, focus styles
            'block w-0 min-w-full bg-bg-card border border-border rounded px-3 py-2 m-0 box-border focus:outline-none focus:border-secondary placeholder:text-text-subtle transition-colors duration-300',
            {
              // Bordo rosso se presente errore
              'border-red-500 focus:border-red-500': error,
              // Padding extra a sinistra se c'è l'icona
              'pl-10': startIcon,
              // Padding extra a destra se è un campo password (per l'icona dell'occhio)
              'pr-10': isPassword,
              // Safari fix per input type date
              'appearance-none': type === 'date',
            }
          )}
          {...props}
        />

        {/* Toggle Visibilità Password (mostrato solo se type="password") */}
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-subtle hover:text-primary transition-colors focus:outline-none"
            title={showPassword ? "Nascondi password" : "Mostra password"}
          >
            {showPassword ? <FiEyeOff size={20} className='cursor-pointer' /> : <FiEye size={20} className='cursor-pointer' />}
          </button>
        )}
      </div>
      
      {/* Messaggi di errore o aiuto */}
      {error && <span className="text-xs text-red-500">{error}</span>}
      {!error && helperText && <span className="text-xs text-text-subtle">{helperText}</span>}
    </div>
  );
}
