// ── Global Error Handler ──────────────────────────────────────────────────────
// Catches all errors thrown with next(err) or throw in async handlers.
export const errorHandler = (err, _req, res, _next) => {
  console.error(`[ERROR] ${err.message}`);

  // Prisma known errors
  if (err.code === "P2002") {
    return res.status(409).json({
      error: "A record with this value already exists.",
      field: err.meta?.target,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token." });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired." });
  }

  // Validation errors (express-validator)
  if (err.type === "validation") {
    return res.status(422).json({ errors: err.errors });
  }

  // Default
  res.status(err.status || 500).json({
    error: err.message || "Internal server error.",
  });
};

// ── Async handler wrapper ─────────────────────────────────────────────────────
// Wraps async route handlers so we don't need try/catch in every controller.
// Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
