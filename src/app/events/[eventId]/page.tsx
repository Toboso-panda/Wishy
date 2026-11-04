import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { LeaveEventButton } from "@/components/member-controls";
import { createManagedProfile } from "@/app/actions";
import { prisma } from "@/lib/db";
import { canCreateManagedProfile, requireMembership, isManager } from "@/lib/permissions";

export default async function EventDashboard({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { eventId } = await params;
  const [{ error }, { user, membership }] = await Promise.all([searchParams, requireMembership(eventId)]);
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: {
    members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
    primaryListOwner: { select: { name: true } },
    items: { where: { isActive: true }, select: { listOwnerId: true, reservedById: true, reservationMode: true, helpersNeeded: true, isHiddenFromListOwner: true, _count: { select: { contributions: true } } } },
  } });
  if (!event) notFound();
  const canManage = isManager(membership.role);
  const canCreateProfile = await canCreateManagedProfile(eventId, user.id);
  const responsibleProfileCount = await prisma.profileResponsibility.count({ where: { eventId, responsibleUserId: user.id } });
  const cannotViewProfileIds = membership.role === "OWNER" || (membership.role === "ADMIN" && membership.managesAllLists) ? new Set<string>() : new Set((await prisma.profileResponsibility.findMany({ where: { eventId, responsibleUserId: user.id, canViewList: false }, select: { profileUserId: true } })).map((entry) => entry.profileUserId));
  const visibleMembers = event.listMode === "SINGLE_LIST" ? event.members.filter((member) => member.userId === event.primaryListOwnerId) : event.members;
  const inviteUrl = `/join/${event.inviteToken}`;
  return <>
    <Link href="/" className="back-link">← Els meus esdeveniments</Link>
    <section className="event-header">
      <div className="event-header-top"><div><p className="eyebrow">{event.listMode === "SINGLE_LIST" ? "Una llista per celebrar" : "Llistes per compartir"}</p><h1>{event.name}</h1>
        {event.description && <p className="lead" style={{ marginBottom: 0 }}>{event.description}</p>}</div>
        <div className="toolbar">{canManage && <><CopyButton value={inviteUrl} /><Link className="button button-outline button-small" href={`/events/${eventId}/settings`}>Configuració</Link></>}</div>
      </div>
      <div className="event-meta">{event.date && <span>{new Intl.DateTimeFormat("ca-ES", { dateStyle: "long" }).format(event.date)}</span>}
        {event.listMode === "SINGLE_LIST" && event.primaryListOwner && <span>Llista de {event.primaryListOwner.name}</span>}
      </div>
    </section>
    {error && <p className="alert" style={{ marginTop: 16 }}>{error}</p>}
    <div className="section-heading"><h2>{event.listMode === "SINGLE_LIST" ? "La llista principal" : "Llistes de membres"}</h2>{event.listMode === "EVERY_MEMBER_LIST" && <span className="muted small">Tria una llista per veure els regals</span>}</div>
    {canCreateProfile && event.listMode === "EVERY_MEMBER_LIST" && <details className="profile-create-details"><summary>＋ Afegir perfil familiar</summary><form action={createManagedProfile} className="profile-create-form"><input type="hidden" name="eventId" value={eventId} /><label htmlFor="managed-profile-name">Nom del perfil familiar</label><input id="managed-profile-name" name="name" required maxLength={60} placeholder="Per exemple, Nil" /><span className="field-help">El perfil no necessita correu ni contrasenya. Podrà activar un compte més endavant.</span><button className="button button-primary" type="submit">Crear perfil</button></form></details>}
    <div className="member-grid">{visibleMembers.map((member) => {
      const viewerCannotSee = cannotViewProfileIds.has(member.userId) && member.userId !== user.id;
      const items = event.items.filter((item) => item.listOwnerId === member.userId && !(member.userId === user.id && item.isHiddenFromListOwner));
      const reserved = items.filter((item) => item.reservedById !== null && (item.reservationMode !== "HELP" || item._count.contributions >= (item.helpersNeeded ?? 0))).length;
      const isEmpty = !viewerCannotSee && items.length === 0;
      const hideProgress = viewerCannotSee || (event.hideReservationFromOwner && member.userId === user.id);
      return <Link href={`/events/${eventId}/members/${member.userId}`} key={member.id} className={`card member-card${isEmpty ? " empty" : ""}`}>
        <div><div className="member-name">{member.user.name}{member.userId === user.id ? " (tu)" : ""}</div>{member.user.isManagedProfile && <span className="member-badge">Perfil familiar</span>}</div>
        {viewerCannotSee ? <span className="member-badge">Accés limitat</span> : !hideProgress && <span className="progress">{reserved}/{items.length} agafats</span>}
      </Link>;
    })}</div>
    {event.listMode === "SINGLE_LIST" && <div className="section-heading" style={{ marginTop: 36 }}><h2>Participants</h2></div>}
    {event.listMode === "SINGLE_LIST" && <div className="card card-pad">{event.members.map((member) => <div className="member-setting" key={member.id}><span className="member-name">{member.user.name}{member.userId === user.id ? " (tu)" : ""}</span></div>)}</div>}
    {membership.role !== "OWNER" && event.primaryListOwnerId === user.id && <p className="privacy-note event-leave-note">Abans d’abandonar, demana al propietari que designi una altra persona per a la llista principal.</p>}
    {membership.role !== "OWNER" && responsibleProfileCount > 0 && <p className="privacy-note event-leave-note">Abans d’abandonar, reassigna els perfils familiars que gestiones.</p>}
    {membership.role !== "OWNER" && event.primaryListOwnerId !== user.id && responsibleProfileCount === 0 && <div className="event-leave"><LeaveEventButton eventId={eventId} /></div>}
  </>;
}
