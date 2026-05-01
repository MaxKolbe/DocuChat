import { CACHE_TTL, cacheGetOrSet } from "../lib/cache.js";
import { prisma } from "../lib/prisma.js";
import logger from "../configs/logger.config.js";

// Simpler permissions fetch with stampede protection
export const getUserPermissions = async (userId: string): Promise<Set<string>> => {
  const cacheKey = `docuchat:permissions:${userId}`;

  const permissions = await cacheGetOrSet(cacheKey, CACHE_TTL.PERMISSIONS, async () => {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    // console.log(userRoles);

    const permissions = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.permissions) {
        permissions.add(rp.permission.name);
      }
    }
    logger.debug("User Permissions", {userId, permissions: [...permissions]})

    return [...permissions]; // Return as array for serialization
  });
 
  // console.log(permissions);
  return new Set(permissions);
};
