//ROUTES
import express, { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { appEvents } from "../../lib/events.js";
import { NotFoundError } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validate.js";
import { successResponse } from "../../utils/responseHandler.js";
import { createRoleSchema, deleteRoleSchema } from "./admin.schema.js";
const router = express.Router();

router.use(requirePermission("roles:manage"));

/**
 * @swagger
 * /admin/roles:
 *   get:
 *     summary: List all roles with their permissions
 *     tags: [admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *       401:
 *         description: Not authenticated
 */
router.get("/roles", async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /admin/users/{userId}/roles:
 *   post:
 *     summary: Assign a role to a user
 *     tags: [admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleName:
 *                 type: string
 *                 example: admin
 *     responses:
 *       201:
 *         description: Role assigned to user successfully
 *       401:
 *         description: Not authenticated
 */
router.post("/users/:userId/roles", 
  // validateRequest(createRoleSchema), 
  async (req, res, next) => {
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

/**
 * @swagger
 * /admin/users/{userId}/roles/{roleName}:
 *   delete:
 *     summary: Revoke a role from a user
 *     tags: [admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *       - name: roleName
 *         in: path
 *         required: true
 *         description: the role to revoke
 *         schema:
 *           type: string
 *           enum: [admin, member, viewer]
 *     responses:
 *       200:
 *         description: Role revoked from user successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Role not found
 */
router.delete(
  "/users/:userId/roles/:roleName",
  // validateRequest(deleteRoleSchema),
  async (req, res, next) => {
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
  },
);

export default router;