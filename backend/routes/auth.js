// Auth Routes
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me        (protected)
// GET  /api/auth/users     (Fleet Manager only)

import { Router } from "express";
import { body } from "express-validator";
import * as authController from "../controllers/auth.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

// ── Validation rules ──────────────────────────────────────────────────────────
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("role")
    .optional()
    .isIn([
      "FLEET_MANAGER",
      "DISPATCHER",
      "SAFETY_OFFICER",
      "FINANCIAL_ANALYST",
    ])
    .withMessage("Invalid role."),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

// ── Routes ────────────────────────────────────────────────────────────────────
router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.get("/me", verifyToken, authController.getMe);
router.get(
  "/users",
  verifyToken,
  requireRole(["FLEET_MANAGER"]),
  authController.getAllUsers,
);

export default router;
