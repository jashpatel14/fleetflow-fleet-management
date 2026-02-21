// Maintenance Service

import prisma from "../middleware/prismaClient.js";

// ── Get all maintenance logs ────────────────────────────────────────────────
export const getAllMaintenance = async ({
  status,
  type,
  vehicleId,
  page = 1,
  limit = 10,
}) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(status && { status }),
    ...(type && { type }),
    ...(vehicleId && { vehicleId }),
  };

  const [logs, total] = await Promise.all([
    prisma.maintenanceLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { openedAt: "desc" },
      include: {
        vehicle: {
          select: { id: true, licensePlate: true, make: true, model: true },
        },
      },
    }),
    prisma.maintenanceLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

// ── Create maintenance log → vehicle goes IN_SHOP ──────────────────────────
export const createMaintenance = async (data, userId) => {
  const { vehicleId, type, description, cost } = data;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle)
    throw Object.assign(new Error("Vehicle not found."), { status: 404 });

  if (vehicle.status === "RETIRED")
    throw Object.assign(
      new Error("Cannot create maintenance for a retired vehicle."),
      { status: 400 },
    );

  if (vehicle.status === "ON_TRIP")
    throw Object.assign(
      new Error("Cannot start maintenance while vehicle is on a trip."),
      { status: 400 },
    );

  // Check no open maintenance already exists
  const existing = await prisma.maintenanceLog.findFirst({
    where: { vehicleId, status: "OPEN" },
  });
  if (existing)
    throw Object.assign(
      new Error("Vehicle already has an open maintenance record."),
      { status: 400 },
    );

  // Transaction: create log + set vehicle IN_SHOP
  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: {
        vehicleId,
        type,
        description,
        cost: parseFloat(cost || 0),
        status: "OPEN",
      },
    }),
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: "IN_SHOP" },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        action: "MAINTENANCE_OPENED",
        entity: "Vehicle",
        entityId: vehicleId,
        detail: JSON.stringify({ type, description }),
      },
    }),
  ]);

  return log;
};

// ── Close maintenance → vehicle back to AVAILABLE ──────────────────────────
export const closeMaintenance = async (id, closingData, userId) => {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!log)
    throw Object.assign(new Error("Maintenance log not found."), {
      status: 404,
    });
  if (log.status === "CLOSED")
    throw Object.assign(new Error("Maintenance already closed."), {
      status: 400,
    });

  const [updatedLog] = await prisma.$transaction([
    prisma.maintenanceLog.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        cost: parseFloat(closingData.cost ?? log.cost),
        description: closingData.description ?? log.description,
      },
    }),
    prisma.vehicle.update({
      where: { id: log.vehicleId },
      data: { status: "AVAILABLE" },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        action: "MAINTENANCE_CLOSED",
        entity: "Vehicle",
        entityId: log.vehicleId,
        detail: JSON.stringify({
          maintenanceId: id,
          finalCost: closingData.cost ?? log.cost,
        }),
      },
    }),
  ]);

  return updatedLog;
};

// ── Maintenance stats ──────────────────────────────────────────────────────
export const getMaintenanceStats = async () => {
  const [total, open, closed, totalCostAgg] = await Promise.all([
    prisma.maintenanceLog.count(),
    prisma.maintenanceLog.count({ where: { status: "OPEN" } }),
    prisma.maintenanceLog.count({ where: { status: "CLOSED" } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
  ]);

  return { total, open, closed, totalCost: totalCostAgg._sum.cost || 0 };
};
