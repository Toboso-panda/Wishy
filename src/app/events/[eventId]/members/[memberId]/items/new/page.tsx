import { notFound } from "next/navigation";
import { ItemForm } from "@/components/items/item-form";
import { prisma } from "@/lib/db";
import { requireItemEditor } from "@/lib/permissions";

export default async function NewItem({ params, searchParams }: { params: Promise<{ eventId: string; memberId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { eventId, memberId } = await params;
  const [{ error }, context] = await Promise.all([searchParams, requireItemEditor(eventId, memberId)]);
  if (context.event.listMode === "SINGLE_LIST" && context.event.primaryListOwnerId !== memberId) notFound();
  // On my own display I can also keep the new gift in one of my lists
  const myLists = context.ownList ? await prisma.wishList.findMany({ where: { ownerId: context.user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }) : [];
  return <ItemForm place={{ kind: "event", eventId, ownerId: memberId }} myLists={myLists} error={error} />;
}
