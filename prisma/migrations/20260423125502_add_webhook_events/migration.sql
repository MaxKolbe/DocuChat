-- CreateTable
CREATE TABLE "webhookevent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "payload" TEXT NOT NULL,

    CONSTRAINT "webhookevent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhookevent_provider_event_type_idx" ON "webhookevent"("provider", "event_type");
