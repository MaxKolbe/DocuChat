import { prisma } from "../lib/prisma.js";

export const getUserPermissions = async (userId: string): Promise<Set<string>> => {
  // Cached
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

  console.log(userRoles);

  const permissions = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.name);
    }
  }
  console.log(permissions);
  return permissions;
};
