//ROUTES
import express from "express";
import { authenticate } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import { appEvents } from "../../lib/events.js";
import { NotFoundError } from "../../lib/errors.js";
import { successResponse } from "../../utils/responseHandler.js";
const router = express.Router();

router.use(authenticate);
router.use(requirePermission("roles:manage"));

// List all roles with their permissions
router.get("/roles", async (req, res) => {
  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  successResponse(
    res,
    200,
    "All roles found",
    roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => rp.permission.name),
    })),
  );
});

// Assign a role to a user
router.post("/users/:userId/roles", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { roleName } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundError(`Role '${roleName}' not found`);
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: {
        userId,
        roleId: role.id,
        assignedBy: req.user!.id,
      },
    });

    // Audit event
    appEvents.emit("admin:role-assigned", {
      targetUserId: userId,
      roleName,
      assignedBy: req.user!.id,
    });
    successResponse(res, 201, `Role '${roleName}' assigned to user`);
  } catch (error) {
    next(error);
  }
});

// Revoke a role from a user
router.delete("/users/:userId/roles/:roleName", async (req, res, next) => {
  try {
    const { userId, roleName } = req.params;

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) throw new NotFoundError("Role not found");

    await prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });

    appEvents.emit("admin:role-revoked", {
      targetUserId: userId,
      roleName,
      revokedBy: req.user!.id,
    });

    successResponse(res, 200, `Role '${roleName}' revoked`);
  } catch (error) {
    next(error);
  }
});

export default router;
