import Link from "next/link";
import { redirect } from "next/navigation";
import { GiftList } from "@/components/lists/gift-list";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";

export default async function MemberList({ params, searchParams }: { params: Promise<{ eventId: string; memberId: string }>; searchParams: Promise<{ error?: string; saved?: string; cleared?: string }> }) {
  const { eventId, memberId } = await params;
  const flags = await searchParams;
  const locale = await getLocale();
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { name: true, listMode: true } });
  // Single-list events show their list on the event page itself
  if (event?.listMode === "SINGLE_LIST") {
    const query = new URLSearchParams(Object.entries(flags).filter((entry): entry is [string, string] => typeof entry[1] === "string")).toString();
    redirect(`/events/${eventId}${query ? `?${query}` : ""}`);
  }
  return <>
    <Link href={`/events/${eventId}`} className="back-link">← {event?.name}</Link>
    <GiftList eventId={eventId} memberId={memberId} locale={locale} variant="page" flags={flags} />
  </>;
}
