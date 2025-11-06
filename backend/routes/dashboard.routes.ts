import express, { RequestHandler } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// GET /api/dashboard/stats
router.get("/stats", authMiddleware as RequestHandler, getDashboardStats as RequestHandler);

export default router;