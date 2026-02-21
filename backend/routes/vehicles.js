// Vehicle Routes
// GET    /api/vehicles              — list with filter/search/pagination
// GET    /api/vehicles/stats        — dashboard counts
// GET    /api/vehicles/:id          — single vehicle + recent trips/maintenance
// POST   /api/vehicles              — register new vehicle
// PATCH  /api/vehicles/:id          — update vehicle details
// PATCH  /api/vehicles/:id/status   — state machine transition

import { Router } from "express";
import { body } from "express-validator";
import * as vehicleController from "../controllers/vehicle.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

// All vehicle routes require authentication
router.use(verifyToken);

// ── Validation ─────────────────────────────────────────────────────────────────
const createValidation = [
  body("licensePlate")
    .trim()
    .notEmpty()
    .withMessage("License plate is required."),
  body("make").trim().notEmpty().withMessage("Make is required."),
  body("model").trim().notEmpty().withMessage("Model is required."),
  body("year")
    .isInt({ min: 1990, max: 2030 })
    .withMessage("Valid year required."),
  body("type")
    .isIn(["MINI_TRUCK", "TRUCK", "TRAILER", "TANKER", "CONTAINER", "VAN"])
    .withMessage("Invalid vehicle type."),
  body("capacityTons")
    .isFloat({ min: 0.1 })
    .withMessage("Capacity must be > 0."),
];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.get("/", vehicleController.getAllVehicles);
router.get("/stats", vehicleController.getVehicleStats);
router.get("/:id", vehicleController.getVehicleById);

router.post(
  "/",
  requireRole(["FLEET_MANAGER", "DISPATCHER"]),
  createValidation,
  vehicleController.createVehicle,
);

router.patch(
  "/:id",
  requireRole(["FLEET_MANAGER"]),
  vehicleController.updateVehicle,
);

router.patch(
  "/:id/status",
  requireRole(["FLEET_MANAGER", "DISPATCHER"]),
  vehicleController.changeVehicleStatus,
);

export default router;
