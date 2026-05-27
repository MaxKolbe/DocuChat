/*
  Warnings:

  - You are about to drop the `aIauditlog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "aIauditlog";

-- CreateTable
CREATE TABLE "aiauditlog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cost_usd" DOUBLE PRECISION NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "fallback_used" BOOLEAN NOT NULL DEFAULT false,
    "input_summary" TEXT NOT NULL,
    "output_summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aiauditlog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aiauditlog_user_id_created_at_idx" ON "aiauditlog"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "aiauditlog_task_type_created_at_idx" ON "aiauditlog"("task_type", "created_at");

-- CreateIndex
CREATE INDEX "aiauditlog_model_created_at_idx" ON "aiauditlog"("model", "created_at");
