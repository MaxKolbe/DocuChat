import { AUTH_EVENTS } from "../../events/auth.events.js";
import { appEvents } from "../../utils/events.js";
import { prisma } from "../../configs/prisma.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";

export const register = async (data: { email: string; password: string }) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existing) {
    return {
      code: 400,
      message: `Email already registered`,
    };
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
};

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

    return {
      code: 400,
      message: "Invalid Credentials",
    };
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    appEvents.emit(AUTH_EVENTS.LOGIN_FAILED, {
      email: data.email,
      deviceInfo: data.deviceInfo,
      reason: "wrong_password",
    });

    return {
      code: 400,
      message: "Invalid Credentials",
    };
  }

  // ... generate tokens, store refresh token (same as before) ...

  // Emit success event
  appEvents.emit(AUTH_EVENTS.USER_LOGGED_IN, {
    userId: user.id,
    deviceInfo: data.deviceInfo
  })

  return {
    code: 200,
    data: {
        // accessToken, 
        // refreshToken, 
        // user: {...}
    }
  }
};
