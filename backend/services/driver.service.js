// Driver Service — All driver business logic
// License expiry, suspension, and assignment checks live here.

import prisma from "../middleware/prismaClient.js";

// ── Get all drivers ────────────────────────────────────────────────────────────
export const getAllDrivers = async ({
  status,
  search,
  page = 1,
  limit = 10,
}) => {
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { licenseNumber: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { trips: true } } },
    }),
    prisma.driver.count({ where }),
  ]);

  // Compute extra fields
  const now = new Date();
  const enriched = drivers.map((d) => ({
    ...d,
    isLicenseExpired: d.licenseExpiry < now,
    licenseExpiresInDays: Math.ceil(
      (d.licenseExpiry - now) / (1000 * 60 * 60 * 24),
    ),
  }));

  return {
    drivers: enriched,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

// ── Get single driver ──────────────────────────────────────────────────────────
export const getDriverById = async (id) => {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      trips: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!driver) {
    const err = new Error("Driver not found.");
    err.status = 404;
    throw err;
  }

  // Compute stats
  const completedTrips = driver.trips.filter(
    (t) => t.status === "COMPLETED",
  ).length;
  const totalTrips = driver.trips.length;
  const completionRate =
    totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;

  const now = new Date();
  return {
    ...driver,
    isLicenseExpired: driver.licenseExpiry < now,
    completionRate,
    totalTrips,
    completedTrips,
  };
};

// ── Create driver ──────────────────────────────────────────────────────────────
export const createDriver = async (data) => {
  const { name, email, phone, licenseNumber, licenseExpiry, vehicleCategory } =
    data;

  return prisma.driver.create({
    data: {
      name,
      email,
      phone,
      licenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      vehicleCategory,
      status: "OFF_DUTY",
    },
  });
};

// ── Update driver ──────────────────────────────────────────────────────────────
export const updateDriver = async (id, data) => {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) {
    const err = new Error("Driver not found.");
    err.status = 404;
    throw err;
  }

  if (data.licenseExpiry) data.licenseExpiry = new Date(data.licenseExpiry);

  return prisma.driver.update({ where: { id }, data });
};

// ── Suspend / Reinstate driver ─────────────────────────────────────────────────
export const changeDriverStatus = async (id, newStatus, userId) => {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) {
    const err = new Error("Driver not found.");
    err.status = 404;
    throw err;
  }

  // Cannot unsuspend while on an active trip
  if (driver.status === "SUSPENDED" && newStatus === "ON_DUTY") {
    const activeTrip = await prisma.trip.findFirst({
      where: { driverId: id, status: { in: ["DISPATCHED"] } },
    });
    if (activeTrip) {
      const err = new Error("Driver is currently on an active trip.");
      err.status = 400;
      throw err;
    }
  }

  const [updatedDriver] = await prisma.$transaction([
    prisma.driver.update({ where: { id }, data: { status: newStatus } }),
    prisma.auditLog.create({
      data: {
        userId,
        action: "DRIVER_STATUS_CHANGED",
        entity: "Driver",
        entityId: id,
        detail: JSON.stringify({ from: driver.status, to: newStatus }),
      },
    }),
  ]);

  return updatedDriver;
};

// ── Validate driver for assignment (called by Trip service) ────────────────────
export const validateDriverForAssignment = async (driverId, vehicleType) => {
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });

  if (!driver)
    throw Object.assign(new Error("Driver not found."), { status: 404 });

  const now = new Date();
  if (driver.licenseExpiry < now)
    throw Object.assign(
      new Error("Driver license has expired. Cannot assign."),
      { status: 400 },
    );

  if (driver.status === "SUSPENDED")
    throw Object.assign(new Error("Driver is suspended. Cannot assign."), {
      status: 400,
    });

  if (driver.status === "ON_DUTY")
    throw Object.assign(
      new Error("Driver is already on duty. Cannot assign."),
      { status: 400 },
    );

  if (driver.vehicleCategory !== vehicleType)
    throw Object.assign(
      new Error(
        `Driver category (${driver.vehicleCategory}) does not match vehicle type (${vehicleType}).`,
      ),
      { status: 400 },
    );

  return driver;
};

// ── Driver stats ───────────────────────────────────────────────────────────────
export const getDriverStats = async () => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [total, onDuty, offDuty, suspended, expiringLicenses] =
    await Promise.all([
      prisma.driver.count({ where: { isActive: true } }),
      prisma.driver.count({ where: { isActive: true, status: "ON_DUTY" } }),
      prisma.driver.count({ where: { isActive: true, status: "OFF_DUTY" } }),
      prisma.driver.count({ where: { isActive: true, status: "SUSPENDED" } }),
      prisma.driver.count({
        where: {
          isActive: true,
          licenseExpiry: { lte: thirtyDaysFromNow, gte: now },
        },
      }),
    ]);

  return { total, onDuty, offDuty, suspended, expiringLicenses };
};
