// Fuel & Reports Controller
import { asyncHandler } from "../middleware/errorHandler.js";
import * as fuelService from "../services/fuel.service.js";

export const logFuel = asyncHandler(async (req, res) => {
  const log = await fuelService.logFuel(req.body);
  res.status(201).json({ message: "Fuel logged.", log });
});

export const getFuelLogs = asyncHandler(async (req, res) => {
  const { vehicleId, tripId, page, limit } = req.query;
  const result = await fuelService.getFuelLogs({
    vehicleId,
    tripId,
    page,
    limit,
  });
  res.json(result);
});

export const getVehicleReport = asyncHandler(async (req, res) => {
  const report = await fuelService.getVehicleReport(req.params.vehicleId);
  res.json({ report });
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const report = await fuelService.getMonthlyReport(req.query.year);
  res.json({ report });
});

export const getDashboardSummary = asyncHandler(async (_req, res) => {
  const summary = await fuelService.getDashboardSummary();
  res.json({ summary });
});
