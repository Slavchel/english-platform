-- Additive retention hold table. Existing data is not modified.

CREATE TYPE "RetentionScope" AS ENUM (
  'ACCOUNT',
  'TEST_RESULTS',
  'SPEAKING',
  'AI_ANALYSES',
  'SUPPORT',
  'CONSENT',
  'OTHER'
);

CREATE TABLE "RetentionHold" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "scope" "RetentionScope" NOT NULL,
    "reason" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetentionHold_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RetentionHold_userId_scope_releasedAt_idx"
    ON "RetentionHold"("userId", "scope", "releasedAt");

CREATE INDEX "RetentionHold_endsAt_idx"
    ON "RetentionHold"("endsAt");

ALTER TABLE "RetentionHold"
    ADD CONSTRAINT "RetentionHold_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
