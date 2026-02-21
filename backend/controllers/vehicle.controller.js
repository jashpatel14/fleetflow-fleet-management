// Vehicle Controller — Thin. Calls service, sends response.

import { asyncHandler } from "../middleware/errorHandler.js";
import { validationResult } from "express-validator";
import * as vehicleService from "../services/vehicle.service.js";

// GET /api/vehicles
export const getAllVehicles = asyncHandler(async (req, res) => {
  const { status, type, search, page, limit } = req.query;
  const result = await vehicleService.getAllVehicles({
    status,
    type,
    search,
    page,
    limit,
  });
  res.json(result);
});

// GET /api/vehicles/stats
export const getVehicleStats = asyncHandler(async (_req, res) => {
  const stats = await vehicleService.getVehicleStats();
  res.json(stats);
});

// GET /api/vehicles/:id
export const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id);
  res.json({ vehicle });
});

// POST /api/vehicles
export const createVehicle = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const vehicle = await vehicleService.createVehicle(req.body);
  res.status(201).json({ message: "Vehicle registered.", vehicle });
});

// PATCH /api/vehicles/:id
export const updateVehicle = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
  res.json({ message: "Vehicle updated.", vehicle });
});

// PATCH /api/vehicles/:id/status
export const changeVehicleStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required." });

  const vehicle = await vehicleService.changeVehicleStatus(
    req.params.id,
    status,
    req.user.id,
  );
  res.json({ message: `Vehicle status changed to ${status}.`, vehicle });
});
