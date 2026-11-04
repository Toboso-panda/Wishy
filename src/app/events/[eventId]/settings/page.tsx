import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { changeMemberRole, regenerateInvite, saveProfileResponsibles, updateEvent, updateManagerScope, updateReservationPrivacy } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";
import { RemoveMemberButton } from "@/components/member-controls";
import { prisma } from "@/lib/db";
import { requireMembership, isManager } from "@/lib/permissions";

export default async function EventSettings({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ error?: string; saved?: string; regenerated?: string }> }) {
  const { eventId } = await params;
  const [{ error, saved, regenerated }, context, event, responsibilities] = await Promise.all([
    searchParams,
    requireMembership(eventId),
    prisma.event.findUnique({ where: { id: eventId }, include: { members: { include: { user: true }, orderBy: { joinedAt: "asc" } } } }),
    prisma.profileResponsibility.findMany({ where: { eventId } }),
  ]);
  if (!event) notFound();
  if (!isManager(context.membership.role)) redirect(`/events/${eventId}`);
  const owner = context.membership.role === "OWNER";
  const responsibilityCounts = new Map<string, number>();
  for (const assignment of responsibilities) responsibilityCounts.set(assignment.responsibleUserId, (responsibilityCounts.get(assignment.responsibleUserId) || 0) + 1);
  const inviteUrl = `/join/${event.inviteToken}`;
  return <>
    <Link href={`/events/${eventId}`} className="back-link">← Tornar a {event.name}</Link>
    <p className="eyebrow">Esdeveniment</p><h1 style={{ fontSize: 42 }}>Configuració</h1>
    {error && <p className="alert">{error}</p>}{saved && <p className="success-note">Els canvis s’han desat.</p>}{regenerated && <p className="success-note">S’ha creat un enllaç d’invitació nou.</p>}
    {owner && <form action={updateEvent} className="card settings-section form-stack">
      <input type="hidden" name="eventId" value={eventId} />
      <h2>Detalls</h2>
      <div className="field"><label htmlFor="name">Nom</label><input id="name" name="name" required maxLength={100} defaultValue={event.name} /></div>
      <div className="field"><label htmlFor="description">Descripció</label><textarea id="description" name="description" maxLength={500} defaultValue={event.description || ""} /></div>
      <div className="field"><label htmlFor="date">Data</label><input id="date" name="date" type="date" defaultValue={event.date ? new Date(event.date.getTime() - event.date.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} /></div>
      {event.listMode === "SINGLE_LIST" && <div className="field"><label htmlFor="primaryListOwnerId">Propietari/ària de la llista principal</label><select id="primaryListOwnerId" name="primaryListOwnerId" required defaultValue={event.primaryListOwnerId || ""}>{event.members.map((member) => <option key={member.id} value={member.userId}>{member.user.name}</option>)}</select></div>}
      <button className="button button-primary" type="submit">Desar canvis</button>
    </form>}
    <section className="card settings-section"><h2>Enllaç d’invitació</h2><p className="muted small">Qualsevol persona amb aquest enllaç podrà unir-se a l’esdeveniment.</p><div className="invite-box">{inviteUrl}</div>
      <div className="form-actions" style={{ marginTop: 13 }}><CopyButton value={inviteUrl} />
        <form action={regenerateInvite}><input type="hidden" name="eventId" value={eventId} /><button className="button button-outline button-small" type="submit">Regenerar enllaç</button></form></div>
    </section>
    <form action={updateReservationPrivacy} className="card settings-section form-stack">
      <input type="hidden" name="eventId" value={eventId} />
      <div><h2>Mode sorpresa</h2><p className="muted small">La persona que rep els regals no veurà quins estan reservats ni qui els ha triat. La resta de convidats sí que ho veuran per coordinar-se.</p></div>
      <label className="check-row"><input type="checkbox" name="hideReservationFromOwner" defaultChecked={event.hideReservationFromOwner} /> Amagar estat i progrés al destinatari</label>
      <button className="button button-primary" type="submit">Desar preferència</button>
    </form>
    <section className="card settings-section"><h2>Membres <span className="muted small">({event.members.length})</span></h2><p className="muted small">Els administradors, si no són responsables, veuen i reserven com un membre normal.</p>
      {event.members.map((member) => <div className="member-setting" key={member.id}><div><strong>{member.user.name}</strong>{member.userId === context.user.id && <span className="muted small"> · tu</span>}<div className="muted small">{member.role === "OWNER" ? "Propietari" : member.role === "ADMIN" ? "Administrador" : "Membre"}</div>{member.managesAllLists && <span className="member-badge">Responsable de tots</span>}{!member.managesAllLists && (responsibilityCounts.get(member.userId) || 0) > 0 && <span className="member-badge">Responsable de {responsibilityCounts.get(member.userId)} perfils</span>}</div>
        {member.role !== "OWNER" && <div className="toolbar">
          {owner && <form action={changeMemberRole}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={member.userId} /><input type="hidden" name="role" value={member.role === "ADMIN" ? "MEMBER" : "ADMIN"} /><button className="button button-outline button-small" type="submit">{member.role === "ADMIN" ? "Fer membre" : "Fer administrador"}</button></form>}
          {member.role === "ADMIN" && (owner || member.userId === context.user.id) && <form action={updateManagerScope} className="manager-scope-form"><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={member.userId} /><label><input type="checkbox" name="managesAllLists" defaultChecked={member.managesAllLists} /> Responsable de tots els perfils</label><button className="button button-outline button-small" type="submit">Desar</button></form>}
          {(owner || member.role === "MEMBER") && event.primaryListOwnerId !== member.userId && <RemoveMemberButton eventId={eventId} userId={member.userId} name={member.user.name} />}
        </div>}
      </div>)}
    </section>
    <section className="card settings-section"><h2>Perfils familiars i responsables</h2><p className="muted small">Assigna un o més responsables a cada persona. Si un responsable no pot veure la llista, només veurà els regals que ell mateix hi afegeix. Els seus regals queden amagats al destinatari.</p>
      {event.members.map((profile) => {
        const assigned = new Map(responsibilities.filter((entry) => entry.profileUserId === profile.userId).map((entry) => [entry.responsibleUserId, entry]));
        const candidates = event.members.filter((candidate) => candidate.userId !== profile.userId && !candidate.user.isManagedProfile && candidate.user.email);
        return <details className="profile-settings" key={profile.id}>
          <summary>{profile.user.name}{profile.user.isManagedProfile ? " · Perfil familiar" : ""}</summary>
          {profile.user.isManagedProfile && profile.user.profileClaimToken && <div className="claim-link-row"><span className="muted small">Enllaç per activar el perfil:</span><CopyButton value={`/claim/${profile.user.profileClaimToken}`} /></div>}
          <form action={saveProfileResponsibles} className="profile-responsibility-form">
            <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="profileUserId" value={profile.userId} />
            {candidates.length ? candidates.map((candidate) => {
              const relation = assigned.get(candidate.userId);
              return <div className="responsible-choice" key={candidate.userId}>
                <label><input type="checkbox" name="responsibleUserId" value={candidate.userId} defaultChecked={Boolean(relation)} /> {candidate.user.name}{candidate.role === "ADMIN" ? " · Admin" : ""}</label>
                <label className="check-row"><input type="checkbox" name={`canViewList:${candidate.userId}`} defaultChecked={relation?.canViewList ?? true} /> Pot veure la llista</label>
              </div>;
            }) : <p className="muted small">No hi ha altres comptes als quals assignar la responsabilitat.</p>}
            <button className="button button-outline button-small" type="submit">Desar responsables</button>
          </form>
        </details>;
      })}
    </section>
  </>;
}
