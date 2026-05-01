-- CreateIndex
CREATE INDEX "document_user_id_deletedAt_idx" ON "document"("user_id", "deletedAt");
