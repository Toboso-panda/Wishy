-- Personal lists: gifts belong to people, not to events.
--   Item      = the gift (content), owned by the person who wants it
--   WishList  = a person's own list; ListItem = which gifts are in it
--   EventItem = a gift shown in an event, with that event's order/active/essential/reservation
--
-- Hand-written so that NO data is lost: every value is copied to its new place first,
-- the counts are checked (the migration aborts if they don't match) and only then the
-- old columns are removed.

BEGIN;

-- 1. New tables
CREATE TABLE "WishList" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WishList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListItem" (
    "listId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListItem_pkey" PRIMARY KEY ("listId","itemId")
);

CREATE TABLE "EventItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEssential" BOOLEAN NOT NULL DEFAULT false,
    "reservationMode" "ReservationMode" NOT NULL DEFAULT 'NONE',
    "helpersNeeded" INTEGER,
    "reservedById" TEXT,
    "reservedAt" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventItem_pkey" PRIMARY KEY ("id")
);

-- 2. Every gift stays in its event, with everything that belonged to the event.
--    The entry reuses the gift's id, so contributions keep pointing to the same row.
INSERT INTO "EventItem" ("id", "eventId", "itemId", "sortOrder", "isActive", "isEssential", "reservationMode", "helpersNeeded", "reservedById", "reservedAt", "addedAt")
SELECT "id", "eventId", "id", "sortOrder", "isActive", "isEssential", "reservationMode", "helpersNeeded", "reservedById", "reservedAt", "createdAt"
FROM "Item";

-- 3. Each person gets one personal list per event where they had gifts, named after the event,
--    with the same gifts in the same order. Surprises (hidden from the owner) stay out of the
--    owner's lists, otherwise the owner would see them.
CREATE TEMP TABLE "_list_map" ON COMMIT DROP AS
SELECT gen_random_uuid()::text AS "listId", i."eventId", i."listOwnerId", e."name", min(i."createdAt") AS "createdAt"
FROM "Item" i
JOIN "Event" e ON e."id" = i."eventId"
WHERE NOT i."isHiddenFromListOwner"
GROUP BY i."eventId", i."listOwnerId", e."name";

INSERT INTO "WishList" ("id", "ownerId", "name", "createdAt", "updatedAt")
SELECT "listId", "listOwnerId", "name", "createdAt", CURRENT_TIMESTAMP
FROM "_list_map";

INSERT INTO "ListItem" ("listId", "itemId", "sortOrder", "addedAt")
SELECT m."listId", i."id", i."sortOrder", i."createdAt"
FROM "Item" i
JOIN "_list_map" m ON m."eventId" = i."eventId" AND m."listOwnerId" = i."listOwnerId"
WHERE NOT i."isHiddenFromListOwner";

-- 4. Safety check before removing anything: everything must have been copied
DO $$
DECLARE
    items INTEGER; entries INTEGER; copied INTEGER; visible INTEGER; listed INTEGER;
BEGIN
    SELECT count(*) INTO items FROM "Item";
    SELECT count(*) INTO entries FROM "EventItem";
    SELECT count(*) INTO copied FROM "EventItem" ei JOIN "Item" i ON i."id" = ei."id"
      WHERE ei."eventId" = i."eventId" AND ei."itemId" = i."id" AND ei."sortOrder" = i."sortOrder"
        AND ei."isActive" = i."isActive" AND ei."isEssential" = i."isEssential"
        AND ei."reservationMode" = i."reservationMode"
        AND ei."helpersNeeded" IS NOT DISTINCT FROM i."helpersNeeded"
        AND ei."reservedById" IS NOT DISTINCT FROM i."reservedById"
        AND ei."reservedAt" IS NOT DISTINCT FROM i."reservedAt";
    SELECT count(*) INTO visible FROM "Item" WHERE NOT "isHiddenFromListOwner";
    SELECT count(*) INTO listed FROM "ListItem";
    IF entries <> items OR copied <> items OR listed <> visible THEN
        RAISE EXCEPTION 'personal_lists: copy check failed (items %, entries %, copied %, visible %, listed %)', items, entries, copied, visible, listed;
    END IF;
END $$;

-- 5. Contributions now belong to the event entry (same ids, so only the column is renamed)
ALTER TABLE "ItemContribution" DROP CONSTRAINT "ItemContribution_itemId_fkey";
DROP INDEX "ItemContribution_itemId_userId_key";
ALTER TABLE "ItemContribution" RENAME COLUMN "itemId" TO "eventItemId";
CREATE UNIQUE INDEX "ItemContribution_eventItemId_userId_key" ON "ItemContribution"("eventItemId", "userId");

-- 6. The gift keeps only its own content. The owner column is renamed (its data is kept);
--    the event columns were copied to EventItem in step 2.
ALTER TABLE "Item" DROP CONSTRAINT "Item_eventId_fkey";
ALTER TABLE "Item" DROP CONSTRAINT "Item_reservedById_fkey";
DROP INDEX "Item_eventId_listOwnerId_isActive_idx";
ALTER TABLE "Item" RENAME COLUMN "listOwnerId" TO "ownerId";
ALTER TABLE "Item" RENAME CONSTRAINT "Item_listOwnerId_fkey" TO "Item_ownerId_fkey";
ALTER TABLE "Item"
    DROP COLUMN "eventId",
    DROP COLUMN "sortOrder",
    DROP COLUMN "isActive",
    DROP COLUMN "isEssential",
    DROP COLUMN "reservationMode",
    DROP COLUMN "helpersNeeded",
    DROP COLUMN "reservedById",
    DROP COLUMN "reservedAt";
CREATE INDEX "Item_ownerId_idx" ON "Item"("ownerId");

-- 7. Indexes and foreign keys of the new tables
CREATE INDEX "WishList_ownerId_idx" ON "WishList"("ownerId");
CREATE INDEX "ListItem_itemId_idx" ON "ListItem"("itemId");
CREATE INDEX "EventItem_itemId_idx" ON "EventItem"("itemId");
CREATE UNIQUE INDEX "EventItem_eventId_itemId_key" ON "EventItem"("eventId", "itemId");

ALTER TABLE "WishList" ADD CONSTRAINT "WishList_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "WishList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventItem" ADD CONSTRAINT "EventItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventItem" ADD CONSTRAINT "EventItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventItem" ADD CONSTRAINT "EventItem_reservedById_fkey" FOREIGN KEY ("reservedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ItemContribution" ADD CONSTRAINT "ItemContribution_eventItemId_fkey" FOREIGN KEY ("eventItemId") REFERENCES "EventItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
