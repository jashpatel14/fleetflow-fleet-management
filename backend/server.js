import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "FleetFlow API running",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes (added phase by phase) ────────────────────────────────────────────
// import authRoutes       from './routes/auth.js';
// import vehicleRoutes    from './routes/vehicles.js';
// import driverRoutes     from './routes/drivers.js';
// import tripRoutes       from './routes/trips.js';
// import maintenanceRoutes from './routes/maintenance.js';
// import fuelRoutes       from './routes/fuel.js';
// import reportRoutes     from './routes/reports.js';

// app.use('/api/auth',        authRoutes);
// app.use('/api/vehicles',    vehicleRoutes);
// app.use('/api/drivers',     driverRoutes);
// app.use('/api/trips',       tripRoutes);
// app.use('/api/maintenance', maintenanceRoutes);
// app.use('/api/fuel',        fuelRoutes);
// app.use('/api/reports',     reportRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`🚛 FleetFlow API running on http://localhost:${PORT}`);
});

export default app;
