-- Additive consent history. Existing users/data are not modified or backfilled.

CREATE TYPE "ConsentType" AS ENUM ('PRIVACY_POLICY', 'PERSONAL_DATA');

CREATE TYPE "ConsentAction" AS ENUM ('GRANTED', 'REVOKED');

CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ConsentType" NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "action" "ConsentAction" NOT NULL DEFAULT 'GRANTED',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retainUntil" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" VARCHAR(255),
    "subjectRef" TEXT,
    "revokesConsentId" TEXT,
    "revocationReason" TEXT,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserConsent_userId_type_occurredAt_idx"
    ON "UserConsent"("userId", "type", "occurredAt");

CREATE INDEX "UserConsent_subjectRef_type_idx"
    ON "UserConsent"("subjectRef", "type");

CREATE INDEX "UserConsent_type_documentVersion_idx"
    ON "UserConsent"("type", "documentVersion");

CREATE INDEX "UserConsent_retainUntil_idx"
    ON "UserConsent"("retainUntil");

ALTER TABLE "UserConsent"
    ADD CONSTRAINT "UserConsent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
