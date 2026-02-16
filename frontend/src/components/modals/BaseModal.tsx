import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';
import clsx from 'clsx';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Componente Base per tutti i Modal dell'applicazione.
 * Utilizza Headless UI per accessibilità e transizioni fluide.
 * 
 * @param isOpen Stato di apertura
 * @param onClose Funzione per chiudere il modal
 * @param title Titolo visualizzato nell'header
 * @param children Contenuto del modal
 * @param size Larghezza massima del modal (default: 'md')
 */
export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: BaseModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay scuro con blur */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                className={clsx(
                  'relative transform overflow-hidden rounded-lg bg-bg-main text-left shadow-xl transition-all sm:my-8 w-full',
                  sizeClasses[size]
                )}
              >
                {/* Header del Modal */}
                <div className="bg-bg-main px-4 py-4 sm:px-6 border-b border-border sticky top-0 z-10 shadow-sm flex items-center justify-between">
                  <DialogTitle as="h3" className="text-lg font-bold leading-6 text-text-title font-heading">
                    {title}
                  </DialogTitle>
                  <button
                    type="button"
                    className="text-text-subtle hover:text-primary transition-colors p-2 rounded-full hover:bg-bg-card cursor-pointer"
                    onClick={onClose}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                {/* Body del Modal */}
                <div className="px-4 py-5 sm:p-6 mb-2">
                  {children}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
