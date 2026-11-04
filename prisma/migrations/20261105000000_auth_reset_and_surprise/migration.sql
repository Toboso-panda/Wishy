-- The user explicitly requested a clean start when moving from provisional profiles to accounts.
DELETE FROM "ItemContribution";
DELETE FROM "Item";
DELETE FROM "EventMember";
DELETE FROM "Event";
DELETE FROM "User";

ALTER TABLE "Event" RENAME COLUMN "hideReservationNames" TO "hideReservationFromOwner";
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "isProvisional";
