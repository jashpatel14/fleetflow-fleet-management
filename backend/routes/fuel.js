// Fuel Routes
import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

router.get("/", reportController.getFuelLogs);
router.post(
  "/",
  requireRole(["FLEET_MANAGER", "DISPATCHER"]),
  reportController.logFuel,
);

export default router;
