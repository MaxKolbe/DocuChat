//SERVICES
import { prisma } from "../../configs/prisma.js";
import { NotFoundError } from "../../lib/errors.js";
import { getUserPermissions } from "../../utils/rbac.service.js";

export const getDocument = async (docId: string, userId: string) => {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
  });

  if (!doc) {
    throw new NotFoundError("Document not found");
  }

  // Resource ownership check
  if (doc.userId !== userId) {
    // Admins can see everything
    const permissions = await getUserPermissions(userId);
    if (!permissions.has("users:manage")) {
      throw new NotFoundError("Document not found");
    }
  }

  return {
    code: 200,
    message: "document found successfully",
    data: doc,
  };
};

export const createService = async () => {
  return null;
};

export const updateService = async () => {
  return null;
};

export const deleteService = async () => {
  return null;
};
