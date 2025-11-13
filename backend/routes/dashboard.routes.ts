import express, { RequestHandler } from "express";
import {
  getDashboardStats,
  getExpiringContractsHandler,
} from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// GET /api/dashboard/stats
router.get("/stats", authMiddleware as RequestHandler, getDashboardStats as RequestHandler);

// GET /api/dashboard/expiring-contracts
// Aggiunto come da istruzioni Fase 3.5
router.get(
  "/expiring-contracts",
  authMiddleware as RequestHandler,
  getExpiringContractsHandler as RequestHandler
);

export default router;