import { notFound } from "next/navigation";
import { ItemForm } from "@/components/items/item-form";
import { requireItemEditor } from "@/lib/permissions";

export default async function EditItem({ params, searchParams }: { params: Promise<{ eventId: string; memberId: string; itemId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { eventId, memberId, itemId } = await params;
  const [{ error }, context] = await Promise.all([searchParams, requireItemEditor(eventId, memberId, itemId)]);
  if (!context.entry || (context.event.listMode === "SINGLE_LIST" && context.event.primaryListOwnerId !== memberId)) notFound();
  return <ItemForm place={{ kind: "event", eventId, ownerId: memberId }} item={context.entry.item} entry={context.entry} canEditContent={context.canEditContent} error={error} />;
}
