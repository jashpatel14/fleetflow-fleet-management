// Fuel Log Service + Reports Service

import prisma from "../middleware/prismaClient.js";

// ── Log fuel ────────────────────────────────────────────────────────────────
export const logFuel = async (data) => {
  const { vehicleId, tripId, liters, costPerLiter } = data;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle)
    throw Object.assign(new Error("Vehicle not found."), { status: 404 });
  if (vehicle.status === "RETIRED")
    throw Object.assign(new Error("Cannot log fuel for a retired vehicle."), {
      status: 400,
    });

  const l = parseFloat(liters);
  const cpl = parseFloat(costPerLiter);
  if (l <= 0)
    throw Object.assign(new Error("Liters must be greater than 0."), {
      status: 400,
    });
  if (cpl <= 0)
    throw Object.assign(new Error("Cost per liter must be greater than 0."), {
      status: 400,
    });

  return prisma.fuelLog.create({
    data: {
      vehicleId,
      tripId: tripId || null,
      liters: l,
      costPerLiter: cpl,
      totalCost: l * cpl,
    },
  });
};

// ── Get fuel logs ───────────────────────────────────────────────────────────
export const getFuelLogs = async ({
  vehicleId,
  tripId,
  page = 1,
  limit = 10,
}) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(vehicleId && { vehicleId }),
    ...(tripId && { tripId }),
  };

  const [logs, total] = await Promise.all([
    prisma.fuelLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { loggedAt: "desc" },
      include: {
        vehicle: { select: { licensePlate: true, make: true } },
        trip: { select: { tripNumber: true, origin: true, destination: true } },
      },
    }),
    prisma.fuelLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

// ── Reports: Vehicle financial summary ─────────────────────────────────────
export const getVehicleReport = async (vehicleId) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      trips: { where: { status: "COMPLETED" }, include: { fuelLogs: true } },
      maintenanceLogs: { where: { status: "CLOSED" } },
    },
  });

  if (!vehicle)
    throw Object.assign(new Error("Vehicle not found."), { status: 404 });

  let totalRevenue = 0,
    totalFuelCost = 0,
    totalMaintCost = 0,
    totalDistance = 0;

  for (const trip of vehicle.trips) {
    totalRevenue += trip.revenue;
    totalDistance += (trip.endOdometer || 0) - (trip.startOdometer || 0);
    for (const f of trip.fuelLogs) totalFuelCost += f.totalCost;
    totalFuelCost += trip.miscExpenses;
  }

  for (const m of vehicle.maintenanceLogs) totalMaintCost += m.cost;

  const totalCost = totalFuelCost + totalMaintCost;
  const profit = totalRevenue - totalCost;
  const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;
  const fuelEfficiency =
    vehicle.trips.reduce((sum, t) => {
      const dist = (t.endOdometer || 0) - (t.startOdometer || 0);
      const fuel = t.fuelLogs.reduce((s, f) => s + f.liters, 0);
      return fuel > 0 ? sum + dist / fuel : sum;
    }, 0) / (vehicle.trips.length || 1);

  return {
    vehicle: {
      id: vehicle.id,
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model,
    },
    completedTrips: vehicle.trips.length,
    totalDistance,
    totalRevenue,
    totalFuelCost,
    totalMaintCost,
    totalCost,
    profit,
    costPerKm: Math.round(costPerKm * 100) / 100,
    fuelEfficiency: Math.round(fuelEfficiency * 100) / 100,
  };
};

// ── Reports: Fleet monthly financial summary ───────────────────────────────
export const getMonthlyReport = async (year) => {
  const targetYear = parseInt(year || new Date().getFullYear());

  const trips = await prisma.trip.findMany({
    where: {
      status: "COMPLETED",
      completedAt: {
        gte: new Date(`${targetYear}-01-01`),
        lte: new Date(`${targetYear}-12-31`),
      },
    },
    include: { fuelLogs: true },
  });

  const maintenanceLogs = await prisma.maintenanceLog.findMany({
    where: {
      status: "CLOSED",
      closedAt: {
        gte: new Date(`${targetYear}-01-01`),
        lte: new Date(`${targetYear}-12-31`),
      },
    },
  });

  // Group by month
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: new Date(targetYear, i, 1).toLocaleString("default", {
      month: "short",
    }),
    revenue: 0,
    fuelCost: 0,
    maintCost: 0,
    netPL: 0,
    trips: 0,
  }));

  for (const trip of trips) {
    const m = new Date(trip.completedAt).getMonth();
    months[m].revenue += trip.revenue;
    months[m].fuelCost +=
      trip.fuelLogs.reduce((s, f) => s + f.totalCost, 0) + trip.miscExpenses;
    months[m].trips += 1;
  }

  for (const log of maintenanceLogs) {
    const m = new Date(log.closedAt).getMonth();
    months[m].maintCost += log.cost;
  }

  months.forEach((m) => {
    m.netPL = m.revenue - m.fuelCost - m.maintCost;
  });

  return { year: targetYear, months };
};

// ── Reports: Dashboard summary ─────────────────────────────────────────────
export const getDashboardSummary = async () => {
  const [
    vehicleStats,
    driverAlerts,
    maintenanceOpen,
    activeTripCount,
    revenueAgg,
  ] = await Promise.all([
    prisma.vehicle.groupBy({ by: ["status"], _count: true }),
    prisma.driver.count({
      where: {
        isActive: true,
        licenseExpiry: { lte: new Date(Date.now() + 30 * 86400000) },
      },
    }),
    prisma.maintenanceLog.count({ where: { status: "OPEN" } }),
    prisma.trip.count({ where: { status: "DISPATCHED" } }),
    prisma.trip.aggregate({
      where: { status: "COMPLETED" },
      _sum: { revenue: true },
    }),
  ]);

  const statMap = Object.fromEntries(
    vehicleStats.map((s) => [s.status, s._count]),
  );

  return {
    vehicles: {
      total: Object.values(statMap).reduce((a, b) => a + b, 0),
      available: statMap.AVAILABLE || 0,
      onTrip: statMap.ON_TRIP || 0,
      inShop: statMap.IN_SHOP || 0,
      retired: statMap.RETIRED || 0,
    },
    activeTrips: activeTripCount,
    maintenanceOpen,
    expiringLicenses: driverAlerts,
    totalRevenue: revenueAgg._sum.revenue || 0,
  };
};
