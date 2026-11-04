ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD COLUMN "isManagedProfile" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "profileClaimToken" TEXT;

ALTER TABLE "EventMember"
  ADD COLUMN "managesAllLists" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Item"
  ADD COLUMN "isHiddenFromListOwner" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "User_profileClaimToken_key" ON "User"("profileClaimToken");

CREATE TABLE "ProfileResponsibility" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "profileUserId" TEXT NOT NULL,
  "responsibleUserId" TEXT NOT NULL,
  "canViewList" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileResponsibility_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProfileResponsibility_eventId_profileUserId_responsibleUserId_key" ON "ProfileResponsibility"("eventId", "profileUserId", "responsibleUserId");
CREATE INDEX "ProfileResponsibility_eventId_responsibleUserId_idx" ON "ProfileResponsibility"("eventId", "responsibleUserId");
ALTER TABLE "ProfileResponsibility" ADD CONSTRAINT "ProfileResponsibility_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileResponsibility" ADD CONSTRAINT "ProfileResponsibility_profileUserId_fkey" FOREIGN KEY ("profileUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileResponsibility" ADD CONSTRAINT "ProfileResponsibility_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
