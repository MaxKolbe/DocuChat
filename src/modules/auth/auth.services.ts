import { AUTH_EVENTS } from "../../events/auth.events.js";
import { appEvents } from "../../lib/events.js";
import { prisma } from "../../configs/prisma.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../lib/token.js";
import { ConflictError, UnauthorizedError, ValidationError } from "../../lib/errors.js";
import crypto from "crypto";

// Register
export const register = async (data: { email: string; password: string }) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash,
    },
  });

  // Emit and move on. Don't wait for Listeners
  appEvents.emit(AUTH_EVENTS.USER_REGISTERED, {
    id: user.id,
    email: user.email,
    tier: user.tier,
  });

  return {
    code: 201,
    message: "User created successfully",
    data: {
      id: user.id,
      email: user.email,
      tier: user.tier,
    },
  };
};

// Login
export const login = async (data: { email: string; password: string; deviceInfo?: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (!user || !user.isActive) {
    // Emit the failure event before returning an error
    appEvents.emit(AUTH_EVENTS.LOGIN_FAILED, {
      email: data.email,
      deviceInfo: data.deviceInfo,
      reason: "user_not_found",
    });

    throw new ValidationError("Invalid credentials");
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    appEvents.emit(AUTH_EVENTS.LOGIN_FAILED, {
      email: data.email,
      deviceInfo: data.deviceInfo,
      reason: "wrong_password",
    });

    throw new ValidationError("Invalid credentials");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7days
    },
  });

  // Emit success event
  appEvents.emit(AUTH_EVENTS.USER_LOGGED_IN, {
    userId: user.id,
    deviceInfo: data.deviceInfo,
  });

  return {
    code: 200,
    message: "User logged in successfully",
    data: {
      user: { id: user.id, email: user.email, tier: user.tier },
      accessToken,
      refreshToken,
    },
  };
};

// Refresh
export const refresh = async (rawRefreshToken: string) => {
  // Verify the JWT signature and expiration
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch (err) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (payload.type !== "refresh") {
    throw new UnauthorizedError("Invalid token type");
  }

  // Check if this token exists in the database (not revoked)
  const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
  const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash } });

  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Refreshed token expired or revoked")
  }

  // Get user
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw new UnauthorizedError("User not found or inactive")
  }

  // Rotate: delete the old token, create a new one
  await prisma.refreshToken.delete({ where: { token: tokenHash } });

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const newHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: newHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    code: 201,
    message: "Refresh successful",
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  };
};

export async function logout(rawRefreshToken: string) {
  const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
  // Delete the token. If it doesn't exist, that's fine.
  await prisma.refreshToken.deleteMany({
    where: { token: tokenHash },
  });
}
