import { Request, Response, NextFunction } from "express";
import { getStats, getExpiringContracts } from "../services/dashboard.service";
import AppError from "../utils/AppError";
import { AuthenticatedRequest } from "../types/express";
import { GetExpiringContractsQuery } from "../types/api";

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) throw new AppError("Utente non autenticato", 401);

    const stats = await getStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller per recuperare la lista paginata di contratti e annualità
 * in scadenza nel mese corrente o successivo.
 */
export const getExpiringContractsHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Utente non autenticato", 401);
    }

    // 1. Estrazione e validazione query params (come da istruzioni Sez. 13.1)
    const {
      period = "current",
      page = "1",
      limit = "12",
    } = req.query;

    const query: GetExpiringContractsQuery = {
      period: (period === "next" ? "next" : "current") as "current" | "next",
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    // 2. Sanitizzazione valori paginazione
    if (isNaN(query.page) || query.page < 1) {
      query.page = 1;
    }
    if (isNaN(query.limit) || query.limit < 1 || query.limit > 100) {
      // Max 100 come da istruzioni
      query.limit = 12;
    }

    // 3. Chiamata al service
    const paginatedResult = await getExpiringContracts(userId, query);

    // 4. Il service ritorna già il formato PaginatedResponse corretto
    res.status(200).json(paginatedResult);
  } catch (error) {
    next(error);
  }
};