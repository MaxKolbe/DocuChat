import * as z from "zod";

export const createRoleSchema = z.object({
  params: z.object({
    userId: z.uuid("Invalid user Id")
  })
});

export const deleteRoleSchema = z.object({
  params: z.object({
    userId: z.uuid("Invalid user Id"),
    roleName: z.enum(["admin", "member", "viewer"]).default("admin")
  })
});

