// Trip Routes
// GET    /api/trips              — list with filter/search/pagination
// GET    /api/trips/stats        — counts + revenue for dashboard
// GET    /api/trips/:id          — trip detail with financials
// POST   /api/trips              — create trip (Draft)
// PATCH  /api/trips/:id/status   — advance state machine

import { Router } from "express";
import { body } from "express-validator";
import * as tripController from "../controllers/trip.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

const createValidation = [
  body("vehicleId").notEmpty().withMessage("Vehicle is required."),
  body("driverId").notEmpty().withMessage("Driver is required."),
  body("origin").trim().notEmpty().withMessage("Origin is required."),
  body("destination").trim().notEmpty().withMessage("Destination is required."),
  body("cargoWeightTons")
    .isFloat({ min: 0.01 })
    .withMessage("Cargo weight must be > 0."),
];

router.get("/", tripController.getAllTrips);
router.get("/stats", tripController.getTripStats);
router.get("/:id", tripController.getTripById);

router.post(
  "/",
  requireRole(["FLEET_MANAGER", "DISPATCHER"]),
  createValidation,
  tripController.createTrip,
);

router.patch(
  "/:id/status",
  requireRole(["FLEET_MANAGER", "DISPATCHER"]),
  tripController.advanceTripStatus,
);

export default router;
