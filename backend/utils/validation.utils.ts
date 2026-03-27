import AppError from './AppError';

/**
 * Parsa e valida un ID numerico proveniente dai route params.
 * Lancia un AppError 400 se l'ID non è un numero valido o è <= 0.
 *
 * @param idParam Stringa rappresentante l'ID (es: da req.params.id)
 * @param errorMessage Messaggio di errore custom (opzionale)
 * @returns ID validato come type number
 */
export const parseNumericId = (idParam: string, errorMessage: string = 'ID non valido'): number => {
  const id = Number(idParam);
  if (isNaN(id) || id <= 0) {
    throw new AppError(errorMessage, 400);
  }
  return id;
};
