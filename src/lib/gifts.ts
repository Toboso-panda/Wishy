import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { removeImage } from "@/lib/uploads";

type Tx = Prisma.TransactionClient;

// A gift lives while it is in some list or some event. When it is in none, it is deleted
// with its photo. Returns the photos to delete once the transaction has committed.
export async function deleteOrphanItems(tx: Tx, itemIds: string[]) {
  if (!itemIds.length) return [];
  const orphans = await tx.item.findMany({
    where: { id: { in: [...new Set(itemIds)] }, listEntries: { none: {} }, eventEntries: { none: {} } },
    select: { id: true, imagePath: true },
  });
  if (orphans.length) await tx.item.deleteMany({ where: { id: { in: orphans.map((item) => item.id) } } });
  return orphans.map((item) => item.imagePath);
}

// Takes gifts out of an event (their reservations and contributions go with them).
// The gifts themselves stay if they are still in a list or another event.
export async function removeEventEntries(tx: Tx, where: Prisma.EventItemWhereInput) {
  const entries = await tx.eventItem.findMany({ where, select: { id: true, itemId: true } });
  if (!entries.length) return [];
  await tx.eventItem.deleteMany({ where: { id: { in: entries.map((entry) => entry.id) } } });
  return deleteOrphanItems(tx, entries.map((entry) => entry.itemId));
}

// Everything a person owns (used when a family profile without an account is deleted).
export async function deleteAllItemsOf(tx: Tx, ownerId: string) {
  const items = await tx.item.findMany({ where: { ownerId }, select: { id: true, imagePath: true } });
  if (items.length) await tx.item.deleteMany({ where: { id: { in: items.map((item) => item.id) } } });
  return items.map((item) => item.imagePath);
}

export async function removeImages(paths: (string | null | undefined)[]) {
  await Promise.all(paths.map((path) => removeImage(path ?? null)));
}

// Gifts (by id) that someone has already reserved in another event. The same gift can be in
// several events: once it is reserved in one, the others show it as unavailable.
export async function reservedInOtherEvents(eventId: string, itemIds: string[]) {
  if (!itemIds.length) return new Set<string>();
  const entries = await prisma.eventItem.findMany({
    where: { itemId: { in: itemIds }, eventId: { not: eventId }, reservedById: { not: null } },
    select: { itemId: true },
  });
  return new Set(entries.map((entry) => entry.itemId));
}
