// FleetFlow Core — Seed File
// Run with: npm run db:seed
// Populates all 7 tables with realistic test data

import {
  PrismaClient,
  Role,
  VehicleStatus,
  VehicleType,
  DriverStatus,
  TripStatus,
  MaintenanceType,
  MaintenanceStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FleetFlow database...");

  // ── Clean existing data (order matters for FK constraints) ─────────────────
  await prisma.auditLog.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("FleetFlow@123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin Manager",
        email: "manager@fleetflow.com",
        passwordHash,
        role: Role.FLEET_MANAGER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Ravi Dispatcher",
        email: "dispatcher@fleetflow.com",
        passwordHash,
        role: Role.DISPATCHER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Neha Safety Officer",
        email: "safety@fleetflow.com",
        passwordHash,
        role: Role.SAFETY_OFFICER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Priya Analyst",
        email: "analyst@fleetflow.com",
        passwordHash,
        role: Role.FINANCIAL_ANALYST,
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // ── Vehicles ───────────────────────────────────────────────────────────────
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        licensePlate: "MH-12-AB-1234",
        make: "TATA",
        model: "LPT 1615",
        year: 2020,
        type: VehicleType.TRUCK,
        capacityTons: 10,
        currentOdometer: 45000,
        status: VehicleStatus.AVAILABLE,
        acquisitionCost: 1800000,
      },
    }),
    prisma.vehicle.create({
      data: {
        licensePlate: "MH-14-GH-5678",
        make: "Ashok Leyland",
        model: "2518",
        year: 2019,
        type: VehicleType.TRAILER,
        capacityTons: 20,
        currentOdometer: 78000,
        status: VehicleStatus.ON_TRIP,
        acquisitionCost: 3200000,
      },
    }),
    prisma.vehicle.create({
      data: {
        licensePlate: "GJ-01-CD-9012",
        make: "TATA",
        model: "Ultra 1012",
        year: 2021,
        type: VehicleType.MINI_TRUCK,
        capacityTons: 5,
        currentOdometer: 22000,
        status: VehicleStatus.IN_SHOP,
        acquisitionCost: 900000,
      },
    }),
    prisma.vehicle.create({
      data: {
        licensePlate: "DL-05-EF-3456",
        make: "Mahindra",
        model: "Blazo 31",
        year: 2018,
        type: VehicleType.TRUCK,
        capacityTons: 12,
        currentOdometer: 112000,
        status: VehicleStatus.AVAILABLE,
        acquisitionCost: 2100000,
      },
    }),
    prisma.vehicle.create({
      data: {
        licensePlate: "KA-09-IJ-7890",
        make: "TATA",
        model: "Signa 4825",
        year: 2017,
        type: VehicleType.CONTAINER,
        capacityTons: 25,
        currentOdometer: 198000,
        status: VehicleStatus.RETIRED,
        acquisitionCost: 4500000,
      },
    }),
  ]);
  console.log(`✅ Created ${vehicles.length} vehicles`);

  // ── Drivers ────────────────────────────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setFullYear(tomorrow.getFullYear() + 2);
  const expired = new Date();
  expired.setFullYear(expired.getFullYear() - 1);

  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: "John Sharma",
        phone: "9876543210",
        licenseNumber: "MH2020123456",
        licenseExpiry: tomorrow,
        vehicleCategory: VehicleType.TRUCK,
        status: DriverStatus.ON_DUTY,
        safetyScore: 92,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Raju Verma",
        phone: "9876543211",
        licenseNumber: "MH2019234567",
        licenseExpiry: tomorrow,
        vehicleCategory: VehicleType.TRAILER,
        status: DriverStatus.ON_DUTY,
        safetyScore: 85,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Suresh Patel",
        phone: "9876543212",
        licenseNumber: "GJ2021345678",
        licenseExpiry: tomorrow,
        vehicleCategory: VehicleType.MINI_TRUCK,
        status: DriverStatus.OFF_DUTY,
        safetyScore: 96,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Mahesh Singh",
        phone: "9876543213",
        licenseNumber: "DL2018456789",
        licenseExpiry: tomorrow,
        vehicleCategory: VehicleType.TRUCK,
        status: DriverStatus.OFF_DUTY,
        safetyScore: 78,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Ajay Kumar",
        phone: "9876543214",
        licenseNumber: "KA2020567890",
        licenseExpiry: expired,
        vehicleCategory: VehicleType.CONTAINER,
        status: DriverStatus.SUSPENDED,
        safetyScore: 55,
      },
    }),
  ]);
  console.log(`✅ Created ${drivers.length} drivers`);

  // ── Trips ──────────────────────────────────────────────────────────────────
  const now = new Date();
  const trips = await Promise.all([
    // Completed trip
    prisma.trip.create({
      data: {
        tripNumber: "TRP-2026-0001",
        vehicleId: vehicles[3].id,
        driverId: drivers[3].id,
        origin: "Mumbai",
        destination: "Pune",
        cargoDescription: "Electronics",
        cargoWeightTons: 8,
        startOdometer: 111000,
        endOdometer: 112000,
        revenue: 45000,
        miscExpenses: 2000,
        status: TripStatus.COMPLETED,
        submittedAt: new Date(now.getTime() - 5 * 86400000),
        approvedAt: new Date(now.getTime() - 4 * 86400000),
        dispatchedAt: new Date(now.getTime() - 3 * 86400000),
        completedAt: new Date(now.getTime() - 1 * 86400000),
      },
    }),
    // Active dispatched trip
    prisma.trip.create({
      data: {
        tripNumber: "TRP-2026-0002",
        vehicleId: vehicles[1].id,
        driverId: drivers[1].id,
        origin: "Delhi",
        destination: "Jaipur",
        cargoDescription: "Furniture",
        cargoWeightTons: 15,
        startOdometer: 78000,
        revenue: 75000,
        miscExpenses: 0,
        status: TripStatus.DISPATCHED,
        submittedAt: new Date(now.getTime() - 2 * 86400000),
        approvedAt: new Date(now.getTime() - 1 * 86400000),
        dispatchedAt: new Date(now.getTime() - 6 * 3600000),
      },
    }),
    // Draft trip
    prisma.trip.create({
      data: {
        tripNumber: "TRP-2026-0003",
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        origin: "Surat",
        destination: "Ahmedabad",
        cargoDescription: "Textiles",
        cargoWeightTons: 7,
        revenue: 28000,
        status: TripStatus.DRAFT,
      },
    }),
  ]);
  console.log(`✅ Created ${trips.length} trips`);

  // ── Maintenance Logs ───────────────────────────────────────────────────────
  const maintenanceLogs = await Promise.all([
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[2].id,
        type: MaintenanceType.CORRECTIVE,
        status: MaintenanceStatus.OPEN,
        description: "Engine oil leak and brake pad replacement",
        cost: 18000,
        openedAt: new Date(now.getTime() - 2 * 86400000),
      },
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[0].id,
        type: MaintenanceType.PREVENTIVE,
        status: MaintenanceStatus.CLOSED,
        description:
          "Scheduled 45,000km service — oil change, filter replacement",
        cost: 7500,
        openedAt: new Date(now.getTime() - 10 * 86400000),
        closedAt: new Date(now.getTime() - 8 * 86400000),
      },
    }),
  ]);
  console.log(`✅ Created ${maintenanceLogs.length} maintenance logs`);

  // ── Fuel Logs ──────────────────────────────────────────────────────────────
  const fuelLogs = await Promise.all([
    prisma.fuelLog.create({
      data: {
        vehicleId: vehicles[3].id,
        tripId: trips[0].id,
        liters: 180,
        costPerLiter: 95.5,
        totalCost: 17190,
      },
    }),
    prisma.fuelLog.create({
      data: {
        vehicleId: vehicles[1].id,
        tripId: trips[1].id,
        liters: 220,
        costPerLiter: 96.0,
        totalCost: 21120,
      },
    }),
    prisma.fuelLog.create({
      data: {
        vehicleId: vehicles[0].id,
        tripId: null,
        liters: 100,
        costPerLiter: 95.0,
        totalCost: 9500,
      },
    }),
  ]);
  console.log(`✅ Created ${fuelLogs.length} fuel logs`);

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: users[1].id,
        action: "TRIP_DISPATCHED",
        entity: "Trip",
        entityId: trips[1].id,
        detail: JSON.stringify({ status: "DISPATCHED" }),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: users[0].id,
        action: "TRIP_COMPLETED",
        entity: "Trip",
        entityId: trips[0].id,
        detail: JSON.stringify({ status: "COMPLETED", distance: 1000 }),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: users[0].id,
        action: "VEHICLE_RETIRED",
        entity: "Vehicle",
        entityId: vehicles[4].id,
        detail: JSON.stringify({ status: "RETIRED" }),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: users[2].id,
        action: "DRIVER_SUSPENDED",
        entity: "Driver",
        entityId: drivers[4].id,
        detail: JSON.stringify({ reason: "License violations" }),
      },
    }),
  ]);
  console.log("✅ Created audit logs");

  console.log("\n🚛 FleetFlow database seeded successfully!");
  console.log("\n📋 Login credentials (all use password: FleetFlow@123)");
  console.log("   Fleet Manager     → manager@fleetflow.com");
  console.log("   Dispatcher        → dispatcher@fleetflow.com");
  console.log("   Safety Officer    → safety@fleetflow.com");
  console.log("   Financial Analyst → analyst@fleetflow.com");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
