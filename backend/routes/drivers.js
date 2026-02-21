// Driver Routes
// GET    /api/drivers           — list with search/filter/pagination
// GET    /api/drivers/stats     — counts for dashboard
// GET    /api/drivers/:id       — single driver + trip history + computed stats
// POST   /api/drivers           — register driver
// PATCH  /api/drivers/:id       — update driver details
// PATCH  /api/drivers/:id/status — suspend / reinstate

import { Router } from "express";
import { body } from "express-validator";
import * as driverController from "../controllers/driver.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

const createValidation = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("phone").trim().notEmpty().withMessage("Phone is required."),
  body("licenseNumber")
    .trim()
    .notEmpty()
    .withMessage("License number is required."),
  body("licenseExpiry")
    .isISO8601()
    .withMessage("Valid license expiry date required (ISO 8601)."),
  body("vehicleCategory")
    .isIn(["MINI_TRUCK", "TRUCK", "TRAILER", "TANKER", "CONTAINER", "VAN"])
    .withMessage("Invalid vehicle category."),
];

router.get("/", driverController.getAllDrivers);
router.get("/stats", driverController.getDriverStats);
router.get("/:id", driverController.getDriverById);

router.post(
  "/",
  requireRole(["FLEET_MANAGER", "SAFETY_OFFICER"]),
  createValidation,
  driverController.createDriver,
);

router.patch(
  "/:id",
  requireRole(["FLEET_MANAGER", "SAFETY_OFFICER"]),
  driverController.updateDriver,
);

router.patch(
  "/:id/status",
  requireRole(["FLEET_MANAGER", "SAFETY_OFFICER"]),
  driverController.changeDriverStatus,
);

export default router;
