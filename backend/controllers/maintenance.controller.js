// Maintenance Controller
import { asyncHandler } from "../middleware/errorHandler.js";
import * as maintenanceService from "../services/maintenance.service.js";

export const getAllMaintenance = asyncHandler(async (req, res) => {
  const { status, type, vehicleId, page, limit } = req.query;
  const result = await maintenanceService.getAllMaintenance({
    status,
    type,
    vehicleId,
    page,
    limit,
  });
  res.json(result);
});

export const getMaintenanceStats = asyncHandler(async (_req, res) => {
  const stats = await maintenanceService.getMaintenanceStats();
  res.json(stats);
});

export const createMaintenance = asyncHandler(async (req, res) => {
  const log = await maintenanceService.createMaintenance(req.body, req.user.id);
  res
    .status(201)
    .json({
      message: "Maintenance log created. Vehicle moved to IN_SHOP.",
      log,
    });
});

export const closeMaintenance = asyncHandler(async (req, res) => {
  const log = await maintenanceService.closeMaintenance(
    req.params.id,
    req.body,
    req.user.id,
  );
  res.json({
    message: "Maintenance closed. Vehicle restored to AVAILABLE.",
    log,
  });
});
