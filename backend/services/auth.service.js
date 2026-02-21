// Auth Service — Business logic for authentication
// All DB calls go here. Controllers stay thin.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../middleware/prismaClient.js";

// ── Generate JWT ──────────────────────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

// ── Register ──────────────────────────────────────────────────────────────────
export const registerUser = async ({ name, email, password, role }) => {
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email already registered.");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: role || "DISPATCHER" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = generateToken(user);
  return { user, token };
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

// ── Get Current User ──────────────────────────────────────────────────────────
export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  return user;
};

// ── Get All Users (Fleet Manager only) ───────────────────────────────────────
export const getAllUsers = async () => {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
};
