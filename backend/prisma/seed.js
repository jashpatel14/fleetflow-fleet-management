// FleetFlow Core — Seed File
// Run with: npm run db:seed
// Populates all tables with realistic random data (20 entries each)

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

const MAKES = ["TATA", "Ashok Leyland", "Mahindra", "Eicher", "BharatBenz", "Volvo"];
const CITIES = ["Mumbai", "Pune", "Delhi", "Jaipur", "Surat", "Ahmedabad", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Indore", "Bhopal", "Lucknow", "Patna", "Nagpur"];
const CARGO = ["Electronics", "Furniture", "Textiles", "Machinery", "FMCG", "Auto Parts", "Chemicals", "Steel", "Cement", "Agri Products"];
const FIRST_NAMES = ["Amit", "Rahul", "Vikram", "Suresh", "Ramesh", "Anil", "Sunil", "Prakash", "Rajesh", "Mukesh", "Deepak", "Sanjay", "Vinod", "Ashok", "Vijay", "Ajay", "Ravi", "Kiran", "Nitin", "Praveen"];
const LAST_NAMES = ["Sharma", "Verma", "Patel", "Singh", "Kumar", "Gupta", "Joshi", "Chauhan", "Yadav", "Tiwari", "Reddy", "Nair", "Iyer", "Rao", "Das"];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomItem(arr) { return arr[randomInt(0, arr.length - 1)]; }

async function main() {
  console.log("🌱 Seeding FleetFlow database with 7 sample entries...");

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
  const vehicleTypes = Object.values(VehicleType);
  const vehicleStatuses = Object.values(VehicleStatus);

  const vehiclePromises = Array.from({ length: 7 }).map((_, i) => {
    const make = randomItem(MAKES);
    const type = randomItem(vehicleTypes);
    return prisma.vehicle.create({
      data: {
        licensePlate: `MH-${randomInt(10, 49)}-${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}-${1000 + i}`,
        make,
        model: `${make} Pro ${randomInt(1000, 5000)}`,
        year: randomInt(2015, 2024),
        type,
        capacityTons: randomInt(5, 30),
        currentOdometer: randomInt(10000, 200000),
        status: randomItem(vehicleStatuses),
        acquisitionCost: randomInt(8, 45) * 100000,
      }
    });
  });
  const vehicles = await Promise.all(vehiclePromises);
  console.log(`✅ Created ${vehicles.length} vehicles`);

  // ── Drivers ────────────────────────────────────────────────────────────────
  const tomorrow = new Date(); tomorrow.setFullYear(tomorrow.getFullYear() + 2);
  const expired = new Date(); expired.setFullYear(expired.getFullYear() - 1);
  const driverStatuses = Object.values(DriverStatus);

  const driverPromises = Array.from({ length: 7 }).map((_, i) => {
    return prisma.driver.create({
      data: {
        name: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
        phone: `9${randomInt(100000000, 999999999)}`,
        licenseNumber: `DL${randomInt(2000, 2023)}${100000 + i}`,
        licenseExpiry: randomInt(1, 10) > 2 ? tomorrow : expired,
        vehicleCategory: randomItem(vehicleTypes),
        status: randomItem(driverStatuses),
        safetyScore: randomInt(60, 100),
      }
    });
  });
  const drivers = await Promise.all(driverPromises);
  console.log(`✅ Created ${drivers.length} drivers`);

  // ── Trips ──────────────────────────────────────────────────────────────────
  const now = new Date();
  const tripPromises = Array.from({ length: 7 }).map((_, i) => {
    const v = randomItem(vehicles);
    const d = randomItem(drivers);
    const origin = randomItem(CITIES);
    let dest = randomItem(CITIES);
    while (dest === origin) dest = randomItem(CITIES);

    const statuses = Object.values(TripStatus);
    const status = randomItem(statuses);

    return prisma.trip.create({
      data: {
        tripNumber: `TRP-2026-${String(1000 + i).padStart(4, '0')}`,
        vehicleId: v.id,
        driverId: d.id,
        origin,
        destination: dest,
        cargoDescription: randomItem(CARGO),
        cargoWeightTons: randomInt(1, Math.floor(v.capacityTons) || 1), // Avoid 0 or NaN
        startOdometer: v.currentOdometer,
        endOdometer: status === TripStatus.COMPLETED ? v.currentOdometer + randomInt(100, 1000) : null,
        revenue: randomInt(15, 80) * 1000,
        miscExpenses: randomInt(0, 5) * 1000,
        status,
        submittedAt: status !== TripStatus.DRAFT ? new Date(now.getTime() - 5 * 86400000) : null,
        approvedAt: [TripStatus.APPROVED, TripStatus.DISPATCHED, TripStatus.COMPLETED].includes(status) ? new Date(now.getTime() - 4 * 86400000) : null,
        dispatchedAt: [TripStatus.DISPATCHED, TripStatus.COMPLETED].includes(status) ? new Date(now.getTime() - 3 * 86400000) : null,
        completedAt: status === TripStatus.COMPLETED ? new Date(now.getTime() - 1 * 86400000) : null,
      }
    });
  });
  const trips = await Promise.all(tripPromises);
  console.log(`✅ Created ${trips.length} trips`);

  // ── Maintenance Logs ───────────────────────────────────────────────────────
  const maintenancePromises = Array.from({ length: 7 }).map((_, i) => {
    const status = randomItem(Object.values(MaintenanceStatus));
    return prisma.maintenanceLog.create({
      data: {
        vehicleId: randomItem(vehicles).id,
        type: randomItem(Object.values(MaintenanceType)),
        status,
        description: `Routine checkup and fixes event ${i}`,
        cost: randomInt(5, 50) * 1000,
        openedAt: new Date(now.getTime() - randomInt(1, 15) * 86400000),
        closedAt: status === MaintenanceStatus.CLOSED ? new Date(now.getTime() - randomInt(1, 5) * 86400000) : null,
      }
    });
  });
  const maintenanceLogs = await Promise.all(maintenancePromises);
  console.log(`✅ Created ${maintenanceLogs.length} maintenance logs`);

  // ── Fuel Logs ──────────────────────────────────────────────────────────────
  const fuelPromises = Array.from({ length: 7 }).map((_, i) => {
    const l = randomInt(50, 300);
    const cp = randomInt(90, 105) + Math.random();
    return prisma.fuelLog.create({
      data: {
        vehicleId: randomItem(vehicles).id,
        tripId: randomItem(trips).id,
        liters: l,
        costPerLiter: cp,
        totalCost: l * cp,
      }
    });
  });
  const fuelLogs = await Promise.all(fuelPromises);
  console.log(`✅ Created ${fuelLogs.length} fuel logs`);

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  const auditPromises = Array.from({ length: 7 }).map((_, i) => {
    return prisma.auditLog.create({
      data: {
        userId: randomItem(users).id,
        action: randomItem(["TRIP_CREATED", "TRIP_DISPATCHED", "TRIP_COMPLETED", "VEHICLE_MAINTENANCE", "DRIVER_UPDATED"]),
        entity: randomItem(["Trip", "Vehicle", "Driver"]),
        entityId: `random-id-${i}`,
        detail: JSON.stringify({ note: `Random action performed ${i}` }),
      }
    });
  });
  await Promise.all(auditPromises);
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
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
