import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { listAccess } from "@/lib/permissions";
import { ItemCard } from "@/components/item-card";
import { CopyButton } from "@/components/copy-button";

export default async function MemberList({ params, searchParams }: { params: Promise<{ eventId: string; memberId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { eventId, memberId } = await params;
  const [{ error }, access, targetMember] = await Promise.all([
    searchParams, listAccess(eventId, memberId),
    prisma.eventMember.findUnique({ where: { eventId_userId: { eventId, userId: memberId } }, include: { user: true } }),
  ]);
  if (!targetMember) notFound();
  const { user, event } = access;
  const isRecipient = user.id === memberId;
  const canEdit = access.canEditAll || access.canEditOwnHidden;
  const canModerateReservations = !isRecipient && (access.owner || access.canEditAll || access.canEditOwnHidden);
  const canCreate = access.canCreate;
  const canShareClaim = targetMember.user.isManagedProfile && Boolean(access.owner || access.responsibleForAll || access.responsibility);
  const items = await prisma.item.findMany({
    where: {
      eventId, listOwnerId: memberId,
      ...(isRecipient ? { isHiddenFromListOwner: false } : access.canViewList ? {} : { createdBy: user.id, isHiddenFromListOwner: true }),
      ...(canEdit ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { reservedBy: { select: { id: true, name: true } }, contributions: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } } },
  });
  const activeCount = items.filter((item) => item.isActive).length;
  const reservedCount = items.filter((item) => item.isActive && item.reservedById && (item.reservationMode !== "HELP" || item.contributions.length >= (item.helpersNeeded ?? 0))).length;
  const hideReservationDetails = event.hideReservationFromOwner && isRecipient;
  return <>
    <Link href={`/events/${eventId}`} className="back-link">← {event.name}</Link>
    <div className="list-header"><div><p className="eyebrow">Llista de regals</p><h1>{targetMember.user.name}</h1></div>
      {canCreate && <Link href={`/events/${eventId}/members/${memberId}/items/new`} className="button button-primary">＋ Afegir regal</Link>}
    </div>
    {hideReservationDetails ? <p className="privacy-note">L’estat dels regals s’amaga per preservar la sorpresa.</p> : <p className="muted small list-progress">{reservedCount}/{activeCount} regals agafats</p>}
    {!access.canViewList && <p className="privacy-note">Només veus els regals que has afegit a aquest perfil.</p>}
    {canShareClaim && targetMember.user.profileClaimToken && <div className="claim-profile-note"><div><strong>Perfil familiar sense compte</strong><p className="small">Comparteix l’enllaç perquè {targetMember.user.name} pugui activar el seu compte.</p></div><CopyButton value={`/claim/${targetMember.user.profileClaimToken}`} /></div>}
    {error && <p className="alert">{error}</p>}
    {items.length ? <div className="item-list">{items.map((item, index) => {
      const safeItem = hideReservationDetails ? { ...item, reservedById: null, reservedAt: null, reservedBy: null, reservationMode: "NONE" as typeof item.reservationMode, helpersNeeded: null, contributions: [] } : item;
      return <ItemCard key={item.id} item={safeItem} eventId={eventId} currentUserId={user.id} canEdit={canEdit} canModerateReservations={canModerateReservations} hideReservationDetails={hideReservationDetails} first={index === 0} last={index === items.length - 1} />;
    })}</div>
      : <div className="empty-state"><h3>{canCreate ? "La llista encara és buida" : "Encara no hi ha regals"}</h3><p className="small">{canCreate ? "Afegeix una idea o un desig a aquesta llista." : "Torna més tard, potser apareixerà alguna idea."}</p>{canCreate && <Link className="button button-primary" href={`/events/${eventId}/members/${memberId}/items/new`}>Afegir regal</Link>}</div>}
  </>;
}
