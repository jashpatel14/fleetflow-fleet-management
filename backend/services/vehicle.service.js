// Vehicle Service — All vehicle business logic
// State machine enforced here. Controllers stay thin.

import prisma from "../middleware/prismaClient.js";

// ── Valid state transitions ───────────────────────────────────────────────────
const VALID_TRANSITIONS = {
  AVAILABLE: ["ON_TRIP", "IN_SHOP", "RETIRED"],
  ON_TRIP: [], // Only trip completion can change this
  IN_SHOP: ["AVAILABLE"],
  RETIRED: [], // Terminal — no transitions allowed
};

// ── Get all vehicles ──────────────────────────────────────────────────────────
export const getAllVehicles = async ({
  status,
  type,
  search,
  page = 1,
  limit = 10,
}) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(type && { type }),
    ...(search && {
      OR: [
        { licensePlate: { contains: search, mode: "insensitive" } },
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { trips: true, maintenanceLogs: true } },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    vehicles,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

// ── Get single vehicle ────────────────────────────────────────────────────────
export const getVehicleById = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      trips: { orderBy: { createdAt: "desc" }, take: 5 },
      maintenanceLogs: { orderBy: { openedAt: "desc" }, take: 5 },
      fuelLogs: { orderBy: { loggedAt: "desc" }, take: 5 },
    },
  });

  if (!vehicle) {
    const err = new Error("Vehicle not found.");
    err.status = 404;
    throw err;
  }

  return vehicle;
};

// ── Create vehicle ────────────────────────────────────────────────────────────
export const createVehicle = async (data) => {
  const {
    licensePlate,
    make,
    model,
    year,
    type,
    capacityTons,
    currentOdometer,
    acquisitionCost,
  } = data;

  if (capacityTons <= 0) {
    const err = new Error("Capacity must be greater than 0.");
    err.status = 400;
    throw err;
  }

  return prisma.vehicle.create({
    data: {
      licensePlate,
      make,
      model,
      year: parseInt(year),
      type,
      capacityTons: parseFloat(capacityTons),
      currentOdometer: parseFloat(currentOdometer || 0),
      acquisitionCost: parseFloat(acquisitionCost || 0),
    },
  });
};

// ── Update vehicle ────────────────────────────────────────────────────────────
export const updateVehicle = async (id, data) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    const err = new Error("Vehicle not found.");
    err.status = 404;
    throw err;
  }

  if (vehicle.status === "RETIRED") {
    const err = new Error("Cannot modify a retired vehicle.");
    err.status = 400;
    throw err;
  }

  // Guard odometer decrease
  if (
    data.currentOdometer !== undefined &&
    parseFloat(data.currentOdometer) < vehicle.currentOdometer
  ) {
    const err = new Error(
      `Odometer cannot decrease. Current: ${vehicle.currentOdometer} km.`,
    );
    err.status = 400;
    throw err;
  }

  return prisma.vehicle.update({ where: { id }, data });
};

// ── Change vehicle status (state machine) ─────────────────────────────────────
export const changeVehicleStatus = async (id, newStatus, userId) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    const err = new Error("Vehicle not found.");
    err.status = 404;
    throw err;
  }

  const allowed = VALID_TRANSITIONS[vehicle.status] || [];
  if (!allowed.includes(newStatus)) {
    const err = new Error(
      `Invalid transition: ${vehicle.status} → ${newStatus}. Allowed: ${allowed.join(", ") || "none"}.`,
    );
    err.status = 400;
    throw err;
  }

  // If retiring, check no active trips
  if (newStatus === "RETIRED") {
    const activeTrip = await prisma.trip.findFirst({
      where: {
        vehicleId: id,
        status: { in: ["DISPATCHED", "APPROVED", "SUBMITTED"] },
      },
    });
    if (activeTrip) {
      const err = new Error("Cannot retire vehicle with active trips.");
      err.status = 400;
      throw err;
    }
  }

  const [updatedVehicle] = await prisma.$transaction([
    prisma.vehicle.update({ where: { id }, data: { status: newStatus } }),
    prisma.auditLog.create({
      data: {
        userId,
        action: `VEHICLE_STATUS_CHANGED`,
        entity: "Vehicle",
        entityId: id,
        detail: JSON.stringify({ from: vehicle.status, to: newStatus }),
      },
    }),
  ]);

  return updatedVehicle;
};

// ── Get vehicle stats (for dashboard) ────────────────────────────────────────
export const getVehicleStats = async () => {
  const [total, available, onTrip, inShop, retired] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
    prisma.vehicle.count({ where: { status: "ON_TRIP" } }),
    prisma.vehicle.count({ where: { status: "IN_SHOP" } }),
    prisma.vehicle.count({ where: { status: "RETIRED" } }),
  ]);

  const utilization =
    total > 0 ? Math.round(((onTrip + available) / total) * 100) : 0;

  return { total, available, onTrip, inShop, retired, utilization };
};
