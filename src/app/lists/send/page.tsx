import { redirect } from "next/navigation";
import { requireUser } from "@/lib/permissions";

// The "send to an event" form on /lists is a plain GET form; this just forwards it to the
// event's import page with the chosen lists.
export default async function SendLists({ searchParams }: { searchParams: Promise<{ lists?: string | string[]; event?: string }> }) {
  await requireUser();
  const { lists, event } = await searchParams;
  const chosen = (Array.isArray(lists) ? lists : lists ? [lists] : []).filter(Boolean);
  if (!event) redirect(`/lists?error=${encodeURIComponent("Tria un esdeveniment.")}`);
  if (!chosen.length) redirect(`/lists?error=${encodeURIComponent("Marca almenys una llista.")}`);
  redirect(`/events/${encodeURIComponent(event)}/import?${new URLSearchParams(chosen.map((id) => ["lists", id])).toString()}`);
}
