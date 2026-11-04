import { notFound } from "next/navigation";
import { ItemForm } from "@/components/item-form";
import { prisma } from "@/lib/db";
import { requireItemEditor } from "@/lib/permissions";

export default async function EditItem({ params, searchParams }: { params: Promise<{ eventId: string; memberId: string; itemId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { eventId, memberId, itemId } = await params;
  const [{ error }, context, item] = await Promise.all([
    searchParams, requireItemEditor(eventId, memberId, itemId), prisma.item.findFirst({ where: { id: itemId, eventId, listOwnerId: memberId } }),
  ]);
  if (!item || (context.event.listMode === "SINGLE_LIST" && context.event.primaryListOwnerId !== memberId)) notFound();
  return <ItemForm eventId={eventId} listOwnerId={memberId} item={item} error={error} />;
}
