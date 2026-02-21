// Reports Routes — Financial Analyst only
import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

router.get("/dashboard", reportController.getDashboardSummary);
router.get(
  "/monthly",
  requireRole(["FLEET_MANAGER", "FINANCIAL_ANALYST"]),
  reportController.getMonthlyReport,
);
router.get(
  "/vehicle/:vehicleId",
  requireRole(["FLEET_MANAGER", "FINANCIAL_ANALYST"]),
  reportController.getVehicleReport,
);

export default router;
