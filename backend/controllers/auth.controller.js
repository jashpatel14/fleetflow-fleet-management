// Auth Controller — Thin layer. Calls service, sends response.
// No business logic here.

import { asyncHandler } from "../middleware/errorHandler.js";
import { validationResult } from "express-validator";
import * as authService from "../services/auth.service.js";

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;
  const result = await authService.registerUser({
    name,
    email,
    password,
    role,
  });

  res.status(201).json({
    message: "Registration successful.",
    ...result,
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });

  res.status(200).json({
    message: "Login successful.",
    ...result,
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({ user });
});

// ── GET /api/auth/users (Fleet Manager only) ──────────────────────────────────
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await authService.getAllUsers();
  res.status(200).json({ users, total: users.length });
});
