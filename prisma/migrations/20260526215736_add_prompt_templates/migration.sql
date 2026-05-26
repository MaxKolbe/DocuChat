-- DropIndex
DROP INDEX "chunk_embedding_idx";

-- CreateTable
CREATE TABLE "prompttemplate" (
    "id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompttemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prompttemplate_task_type_is_active_idx" ON "prompttemplate"("task_type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "prompttemplate_task_type_version_key" ON "prompttemplate"("task_type", "version");
