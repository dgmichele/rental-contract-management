import { Request, Response, NextFunction } from "express";
import { getStats } from "../services/dashboard.service";
import AppError from "../utils/AppError";
import { AuthenticatedRequest } from "../types/express";

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
