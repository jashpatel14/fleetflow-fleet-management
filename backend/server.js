import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";

// --- Route Imports ---
import authRoutes from "./routes/auth.js";
import vehicleRoutes from "./routes/vehicles.js";
import driverRoutes from "./routes/drivers.js";
import tripRoutes from "./routes/trips.js";
import maintenanceRoutes from "./routes/maintenance.js";
import fuelRoutes from "./routes/fuel.js";
import reportRoutes from "./routes/reports.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware Configuration ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- System Routes ---

// Root welcome route
app.get("/", (_req, res) => {
  res.json({
    message: "🚛 Welcome to FleetFlow API",
    status: "online",
    health: "/health",
    api: "/api",
    version: "1.0.0"
  });
});

// Service health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "FleetFlow API running",
    timestamp: new Date().toISOString()
  });
});

// --- API Resource Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/fuel", fuelRoutes);
app.use("/api/reports", reportRoutes);

// --- Error Handling ---

// 404 - Not Found
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use(errorHandler);

// --- Server Lifecycle ---
app.listen(PORT, () => {
  console.log(`\n🚀 FleetFlow API — Server Started Successfully`);
  console.log(`🌍 Endpoint: http://localhost:${PORT}`);
  console.log(`🕒 Started:  ${new Date().toLocaleString()}`);

  console.log(`\n📋 Registered Routes:`);
  console.log(`   [POST] /api/auth/register`);
  console.log(`   [POST] /api/auth/login`);
  console.log(`   [GET]  /api/vehicles`);
  console.log(`   [GET]  /api/drivers`);
  console.log(`   [GET]  /api/trips`);
  console.log(`   [GET]  /api/maintenance`);
  console.log(`   [GET]  /api/fuel`);
  console.log(`   [GET]  /api/reports/dashboard\n`);
});

export default app;
