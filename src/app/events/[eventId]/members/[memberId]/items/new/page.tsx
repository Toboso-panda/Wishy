import { notFound } from "next/navigation";
import { ItemForm } from "@/components/items/item-form";
import { prisma } from "@/lib/db";
import { requireItemEditor } from "@/lib/permissions";

export default async function NewItem({ params, searchParams }: { params: Promise<{ eventId: string; memberId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { eventId, memberId } = await params;
  const [{ error }, context] = await Promise.all([searchParams, requireItemEditor(eventId, memberId)]);
  if (context.event.listMode === "SINGLE_LIST" && context.event.primaryListOwnerId !== memberId) notFound();
  return <ItemForm eventId={eventId} listOwnerId={memberId} error={error} />;
}
