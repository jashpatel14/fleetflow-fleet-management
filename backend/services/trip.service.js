// Trip Service — Core state machine logic
// Most complex module. Orchestrates vehicle + driver state changes.

import prisma from "../middleware/prismaClient.js";
import { validateDriverForAssignment } from "./driver.service.js";

// ── Trip number generator ──────────────────────────────────────────────────────
const generateTripNumber = async () => {
  const count = await prisma.trip.count();
  const year = new Date().getFullYear();
  return `TRP-${year}-${String(count + 1).padStart(4, "0")}`;
};

// ── Valid status transitions ───────────────────────────────────────────────────
const VALID_TRANSITIONS = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["APPROVED", "CANCELLED"],
  APPROVED: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

// ── Get all trips ──────────────────────────────────────────────────────────────
export const getAllTrips = async ({
  status,
  vehicleId,
  driverId,
  search,
  page = 1,
  limit = 10,
}) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(vehicleId && { vehicleId }),
    ...(driverId && { driverId }),
    ...(search && {
      OR: [
        { tripNumber: { contains: search, mode: "insensitive" } },
        { origin: { contains: search, mode: "insensitive" } },
        { destination: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true,
            type: true,
          },
        },
        driver: {
          select: { id: true, name: true, phone: true, licenseNumber: true },
        },
        _count: { select: { fuelLogs: true } },
      },
    }),
    prisma.trip.count({ where }),
  ]);

  return {
    trips,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

// ── Get single trip ────────────────────────────────────────────────────────────
export const getTripById = async (id) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
      fuelLogs: { orderBy: { loggedAt: "desc" } },
    },
  });

  if (!trip) throw Object.assign(new Error("Trip not found."), { status: 404 });

  // Compute financials if completed
  let computed = {};
  if (trip.status === "COMPLETED" && trip.startOdometer && trip.endOdometer) {
    const distance = trip.endOdometer - trip.startOdometer;
    const totalFuelCost = trip.fuelLogs.reduce(
      (sum, f) => sum + f.totalCost,
      0,
    );
    const totalCost = totalFuelCost + trip.miscExpenses;
    const profit = trip.revenue - totalCost;
    const costPerKm = distance > 0 ? totalCost / distance : 0;
    computed = { distance, totalFuelCost, totalCost, profit, costPerKm };
  }

  return { ...trip, ...computed };
};

// ── Create trip (Draft) ────────────────────────────────────────────────────────
export const createTrip = async (data) => {
  const {
    vehicleId,
    driverId,
    origin,
    destination,
    cargoDescription,
    cargoWeightTons,
    revenue,
  } = data;

  // Validate vehicle
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle)
    throw Object.assign(new Error("Vehicle not found."), { status: 404 });
  if (vehicle.status === "RETIRED")
    throw Object.assign(new Error("Cannot assign a retired vehicle."), {
      status: 400,
    });
  if (parseFloat(cargoWeightTons) > vehicle.capacityTons)
    throw Object.assign(
      new Error(
        `Cargo (${cargoWeightTons}t) exceeds vehicle capacity (${vehicle.capacityTons}t).`,
      ),
      { status: 400 },
    );

  // Validate driver
  await validateDriverForAssignment(driverId, vehicle.type);

  const tripNumber = await generateTripNumber();

  return prisma.trip.create({
    data: {
      tripNumber,
      vehicleId,
      driverId,
      origin,
      destination,
      cargoDescription,
      cargoWeightTons: parseFloat(cargoWeightTons),
      revenue: parseFloat(revenue || 0),
      status: "DRAFT",
    },
    include: {
      vehicle: { select: { licensePlate: true, make: true, model: true } },
      driver: { select: { name: true, licenseNumber: true } },
    },
  });
};

// ── Advance trip status (state machine) ───────────────────────────────────────
export const advanceTripStatus = async (
  id,
  newStatus,
  extraData = {},
  userId,
) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true },
  });

  if (!trip) throw Object.assign(new Error("Trip not found."), { status: 404 });
  if (trip.status === "COMPLETED")
    throw Object.assign(new Error("Completed trip cannot be modified."), {
      status: 400,
    });

  const allowed = VALID_TRANSITIONS[trip.status] || [];
  if (!allowed.includes(newStatus))
    throw Object.assign(
      new Error(
        `Invalid transition: ${trip.status} → ${newStatus}. Allowed: ${allowed.join(", ")}.`,
      ),
      { status: 400 },
    );

  const now = new Date();
  const operations = [];

  // ── DISPATCHED: validate, lock vehicle + driver ───────────────────────────
  if (newStatus === "DISPATCHED") {
    if (trip.vehicle.status !== "AVAILABLE")
      throw Object.assign(
        new Error(
          `Vehicle is ${trip.vehicle.status}. Must be AVAILABLE to dispatch.`,
        ),
        { status: 400 },
      );

    await validateDriverForAssignment(trip.driverId, trip.vehicle.type);

    const startOdo = parseFloat(
      extraData.startOdometer ?? trip.vehicle.currentOdometer,
    );

    operations.push(
      prisma.trip.update({
        where: { id },
        data: {
          status: "DISPATCHED",
          startOdometer: startOdo,
          dispatchedAt: now,
        },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "ON_TRIP" },
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: "ON_DUTY" },
      }),
    );
  }

  // ── COMPLETED: record distance, release vehicle + driver ──────────────────
  else if (newStatus === "COMPLETED") {
    const endOdo = parseFloat(extraData.endOdometer);
    if (!endOdo)
      throw Object.assign(
        new Error("End odometer is required to complete a trip."),
        { status: 400 },
      );
    if (endOdo <= (trip.startOdometer || 0))
      throw Object.assign(
        new Error("End odometer must be greater than start odometer."),
        { status: 400 },
      );

    operations.push(
      prisma.trip.update({
        where: { id },
        data: {
          status: "COMPLETED",
          endOdometer: endOdo,
          completedAt: now,
          revenue: parseFloat(extraData.revenue ?? trip.revenue),
          miscExpenses: parseFloat(extraData.miscExpenses ?? trip.miscExpenses),
        },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "AVAILABLE", currentOdometer: endOdo },
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: "OFF_DUTY" },
      }),
    );
  }

  // ── CANCELLED: release if dispatched ─────────────────────────────────────
  else if (newStatus === "CANCELLED") {
    operations.push(
      prisma.trip.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: now },
      }),
    );
    if (trip.status === "DISPATCHED") {
      operations.push(
        prisma.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: "AVAILABLE" },
        }),
        prisma.driver.update({
          where: { id: trip.driverId },
          data: { status: "OFF_DUTY" },
        }),
      );
    }
  }

  // ── SUBMITTED / APPROVED ──────────────────────────────────────────────────
  else {
    const timestampField =
      newStatus === "SUBMITTED" ? "submittedAt" : "approvedAt";
    operations.push(
      prisma.trip.update({
        where: { id },
        data: { status: newStatus, [timestampField]: now },
      }),
    );
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  operations.push(
    prisma.auditLog.create({
      data: {
        userId,
        action: `TRIP_${newStatus}`,
        entity: "Trip",
        entityId: id,
        detail: JSON.stringify({
          from: trip.status,
          to: newStatus,
          ...extraData,
        }),
      },
    }),
  );

  const results = await prisma.$transaction(operations);
  return results[0]; // Updated trip
};

// ── Trip stats for dashboard ───────────────────────────────────────────────────
export const getTripStats = async () => {
  const [total, draft, submitted, approved, dispatched, completed, cancelled] =
    await Promise.all([
      prisma.trip.count(),
      prisma.trip.count({ where: { status: "DRAFT" } }),
      prisma.trip.count({ where: { status: "SUBMITTED" } }),
      prisma.trip.count({ where: { status: "APPROVED" } }),
      prisma.trip.count({ where: { status: "DISPATCHED" } }),
      prisma.trip.count({ where: { status: "COMPLETED" } }),
      prisma.trip.count({ where: { status: "CANCELLED" } }),
    ]);

  // Revenue from completed trips
  const revenueAgg = await prisma.trip.aggregate({
    where: { status: "COMPLETED" },
    _sum: { revenue: true, miscExpenses: true },
  });

  return {
    total,
    draft,
    submitted,
    approved,
    dispatched,
    completed,
    cancelled,
    totalRevenue: revenueAgg._sum.revenue || 0,
    totalExpenses: revenueAgg._sum.miscExpenses || 0,
  };
};
