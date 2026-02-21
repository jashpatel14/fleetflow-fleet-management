// Driver Controller

import { asyncHandler } from "../middleware/errorHandler.js";
import { validationResult } from "express-validator";
import * as driverService from "../services/driver.service.js";

export const getAllDrivers = asyncHandler(async (req, res) => {
  const { status, search, page, limit } = req.query;
  const result = await driverService.getAllDrivers({
    status,
    search,
    page,
    limit,
  });
  res.json(result);
});

export const getDriverStats = asyncHandler(async (_req, res) => {
  const stats = await driverService.getDriverStats();
  res.json(stats);
});

export const getDriverById = asyncHandler(async (req, res) => {
  const driver = await driverService.getDriverById(req.params.id);
  res.json({ driver });
});

export const createDriver = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const driver = await driverService.createDriver(req.body);
  res.status(201).json({ message: "Driver registered.", driver });
});

export const updateDriver = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const driver = await driverService.updateDriver(req.params.id, req.body);
  res.json({ message: "Driver updated.", driver });
});

export const changeDriverStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required." });

  const driver = await driverService.changeDriverStatus(
    req.params.id,
    status,
    req.user.id,
  );
  res.json({ message: `Driver status changed to ${status}.`, driver });
});
