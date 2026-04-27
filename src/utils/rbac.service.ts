import { cacheGet, cacheSet, CACHE_TTL } from "../lib/cache.js";
import { prisma } from "../lib/prisma.js";

export const getUserPermissions = async (userId: string): Promise<Set<string>> => {
  const cacheKey = `docuchat:permissions:${userId}`;
  
  // Check Cache
  const cached = await cacheGet<string[]>(cacheKey);

  // Cache hit
  if(cached){
    return new Set(cached); 
  }

  // Cache miss
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
  // store in cache
  await cacheSet(cacheKey, [...permissions], CACHE_TTL.PERMISSIONS)
  
  // console.log(permissions);
  return permissions;
};
