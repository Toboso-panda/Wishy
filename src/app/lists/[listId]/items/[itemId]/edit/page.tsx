import { notFound } from "next/navigation";
import { ItemForm } from "@/components/items/item-form";
import { prisma } from "@/lib/db";
import { requireOwnList } from "@/lib/permissions";

export default async function EditListItem({ params, searchParams }: { params: Promise<{ listId: string; itemId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { listId, itemId } = await params;
  const [{ error }, { user, list }] = await Promise.all([searchParams, requireOwnList(listId)]);
  const entry = await prisma.listItem.findUnique({ where: { listId_itemId: { listId: list.id, itemId } }, include: { item: true } });
  if (!entry || entry.item.ownerId !== user.id) notFound();
  return <ItemForm place={{ kind: "list", listId: list.id, listName: list.name }} item={entry.item} error={error} />;
}
