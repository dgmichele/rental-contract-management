import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: number; // rimane opzionale per compatibilità, ma useremo un tipo custom nei controller
  }
}

// Tipo custom per controller che richiedono auth
export interface AuthenticatedRequest extends Request {
  userId: number; // obbligatorio
}
