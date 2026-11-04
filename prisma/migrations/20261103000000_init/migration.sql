CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "ListMode" AS ENUM ('EVERY_MEMBER_LIST', 'SINGLE_LIST');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "ReservationMode" AS ENUM ('NONE', 'HELP', 'SHARED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT, "passwordHash" TEXT,
  "isProvisional" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Event" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "date" TIMESTAMP(3),
  "listMode" "ListMode" NOT NULL DEFAULT 'EVERY_MEMBER_LIST', "primaryListOwnerId" TEXT,
  "inviteToken" TEXT NOT NULL, "ownerId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EventMember" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'MEMBER', "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Item" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "listOwnerId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT, "url" TEXT, "imagePath" TEXT, "price" TEXT, "priority" "Priority", "category" TEXT,
  "notes" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "reservationMode" "ReservationMode" NOT NULL DEFAULT 'NONE', "reservedById" TEXT, "reservedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ItemContribution" (
  "id" TEXT NOT NULL, "itemId" TEXT NOT NULL, "userId" TEXT NOT NULL, "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ItemContribution_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Event_inviteToken_key" ON "Event"("inviteToken");
CREATE UNIQUE INDEX "EventMember_eventId_userId_key" ON "EventMember"("eventId", "userId");
CREATE INDEX "EventMember_eventId_idx" ON "EventMember"("eventId");
CREATE INDEX "Item_eventId_listOwnerId_isActive_idx" ON "Item"("eventId", "listOwnerId", "isActive");
CREATE UNIQUE INDEX "ItemContribution_itemId_userId_key" ON "ItemContribution"("itemId", "userId");
ALTER TABLE "Event" ADD CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_primaryListOwnerId_fkey" FOREIGN KEY ("primaryListOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_listOwnerId_fkey" FOREIGN KEY ("listOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_reservedById_fkey" FOREIGN KEY ("reservedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemContribution" ADD CONSTRAINT "ItemContribution_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemContribution" ADD CONSTRAINT "ItemContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
