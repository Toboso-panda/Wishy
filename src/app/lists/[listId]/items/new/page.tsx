import { ItemForm } from "@/components/items/item-form";
import { requireOwnList } from "@/lib/permissions";

export default async function NewListItem({ params, searchParams }: { params: Promise<{ listId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { listId } = await params;
  const [{ error }, { list }] = await Promise.all([searchParams, requireOwnList(listId)]);
  return <ItemForm place={{ kind: "list", listId: list.id, listName: list.name }} error={error} />;
}
