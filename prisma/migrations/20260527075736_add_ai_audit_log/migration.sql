-- CreateTable
CREATE TABLE "aIauditlog" (
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

    CONSTRAINT "aIauditlog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aIauditlog_user_id_created_at_idx" ON "aIauditlog"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "aIauditlog_task_type_created_at_idx" ON "aIauditlog"("task_type", "created_at");

-- CreateIndex
CREATE INDEX "aIauditlog_model_created_at_idx" ON "aIauditlog"("model", "created_at");
