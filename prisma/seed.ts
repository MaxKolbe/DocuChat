// import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const connectionString = `${process.env.PG_DATABASE_DEV_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding...");
  const adminHash = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@docuchat.dev" },
    update: {},
    create: {
      email: "admin@docuchat.dev",
      passwordHash: adminHash,
      tier: "enterprise",
      tokenLimit: 1000000,
    },
  });
  const userHash = await bcrypt.hash("Test1234!", 12);
  const user = await prisma.user.upsert({
    where: { email: "test@docuchat.dev" },
    update: {},
    create: {
      email: "test@docuchat.dev",
      passwordHash: userHash,
    },
  });
  await prisma.document.create({
    data: {
      userId: user.id,
      title: "Getting Started with DocuChat",
      filename: "getting-started.txt",
      content: "Welcome to DocuChat. This is a sample document.",
      status: "ready",
      chunkCount: 1,
    },
  });
  console.log("Done. admin:", admin.email, "user:", user.email);
}
main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

// BTW Upsert creates a record if it doesn’t exist and does nothing if it does.
