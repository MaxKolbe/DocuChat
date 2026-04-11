-- CreateTable
CREATE TABLE "refreshtoken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refreshtoken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refreshtoken_token_key" ON "refreshtoken"("token");

-- CreateIndex
CREATE INDEX "refreshtoken_user_id_idx" ON "refreshtoken"("user_id");

-- CreateIndex
CREATE INDEX "refreshtoken_expires_at_idx" ON "refreshtoken"("expires_at");

-- AddForeignKey
ALTER TABLE "refreshtoken" ADD CONSTRAINT "refreshtoken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
