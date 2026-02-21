// Maintenance Routes
import { Router } from "express";
import * as maintenanceController from "../controllers/maintenance.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

router.get("/", maintenanceController.getAllMaintenance);
router.get("/stats", maintenanceController.getMaintenanceStats);

router.post(
  "/",
  requireRole(["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER"]),
  maintenanceController.createMaintenance,
);

router.patch(
  "/:id/close",
  requireRole(["FLEET_MANAGER", "SAFETY_OFFICER"]),
  maintenanceController.closeMaintenance,
);

export default router;
