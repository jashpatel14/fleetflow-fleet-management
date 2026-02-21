// Trip Controller

import { asyncHandler } from "../middleware/errorHandler.js";
import { validationResult } from "express-validator";
import * as tripService from "../services/trip.service.js";

export const getAllTrips = asyncHandler(async (req, res) => {
  const { status, vehicleId, driverId, search, page, limit } = req.query;
  const result = await tripService.getAllTrips({
    status,
    vehicleId,
    driverId,
    search,
    page,
    limit,
  });
  res.json(result);
});

export const getTripStats = asyncHandler(async (_req, res) => {
  const stats = await tripService.getTripStats();
  res.json(stats);
});

export const getTripById = asyncHandler(async (req, res) => {
  const trip = await tripService.getTripById(req.params.id);
  res.json({ trip });
});

export const createTrip = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const trip = await tripService.createTrip(req.body);
  res.status(201).json({ message: "Trip created.", trip });
});

// PATCH /api/trips/:id/status
// Body: { status: 'SUBMITTED'|'APPROVED'|'DISPATCHED'|'COMPLETED'|'CANCELLED', ...extraData }
export const advanceTripStatus = asyncHandler(async (req, res) => {
  const { status, ...extraData } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required." });

  const trip = await tripService.advanceTripStatus(
    req.params.id,
    status,
    extraData,
    req.user.id,
  );
  res.json({ message: `Trip status updated to ${status}.`, trip });
});
