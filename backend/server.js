import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";

// ── All Routes ─────────────────────────────────────────────────────────────────
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

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "FleetFlow API running",
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/fuel", fuelRoutes);
app.use("/api/reports", reportRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚛 FleetFlow API running on http://localhost:${PORT}`);
  console.log(`\n📋 API Endpoints:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/vehicles`);
  console.log(`   GET    /api/drivers`);
  console.log(`   GET    /api/trips`);
  console.log(`   GET    /api/maintenance`);
  console.log(`   GET    /api/fuel`);
  console.log(`   GET    /api/reports/dashboard`);
});

export default app;
