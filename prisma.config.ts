import dotenv from "dotenv";
import { defineConfig } from "prisma/config";
dotenv.config({
  path: "./.env"
})

// console.log(process.env["PG_DATABASE_DEV_URL"])
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["PG_DATABASE_DEV_URL"],
  },
});
