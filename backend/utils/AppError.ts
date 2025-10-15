/*
*Classe di errore personalizzata utilizzata nel backend.
*Assicura una gestione coerente degli errori con i codici di stato HTTP.
 */
export default class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Mantiene il corretto stack trace per le chiamate di errore
    Error.captureStackTrace(this, this.constructor);
  }
}