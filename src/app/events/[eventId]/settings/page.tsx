import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { changeMemberRole, regenerateInvite, renameManagedProfile, saveProfileResponsibles, updateEvent, updateManagerScope, updateReservationPrivacy } from "@/app/actions";
import { CopyButton } from "@/components/ui/copy-button";
import { RemoveMemberButton } from "@/components/events/member-controls";
import { DeleteEventForm } from "@/components/events/delete-event-form";
import { prisma } from "@/lib/db";
import { requireMembership, isManager } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n";
import { translate } from "@/lib/i18n/dictionary";

export default async function EventSettings({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ error?: string; saved?: string; regenerated?: string }> }) {
  const { eventId } = await params;
  const locale = await getLocale();
  const t = (s: string) => translate(locale, s);
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
    <Link href={`/events/${eventId}`} className="back-link">← {t("Tornar a")} {event.name}</Link>
    <p className="eyebrow">{t("Esdeveniment")}</p><h1 className="page-title">{t("Configuració")}</h1>
    {error && <p className="alert">{t(error)}</p>}{saved && <p className="success-note">{t("Els canvis s’han desat.")}</p>}{regenerated && <p className="success-note">{t("S’ha creat un enllaç d’invitació nou.")}</p>}
    {owner && <form action={updateEvent} className="card settings-section form-stack">
      <input type="hidden" name="eventId" value={eventId} />
      <h2>{t("Detalls")}</h2>
      <div className="field"><label htmlFor="name">{t("Nom")}</label><input id="name" name="name" required maxLength={100} defaultValue={event.name} /></div>
      <div className="field"><label htmlFor="description">{t("Descripció")}</label><textarea id="description" name="description" maxLength={500} defaultValue={event.description || ""} /></div>
      <div className="field"><label htmlFor="date">{t("Data")}</label><input id="date" name="date" type="date" defaultValue={event.date ? new Date(event.date.getTime() - event.date.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} /></div>
      {event.listMode === "SINGLE_LIST" && <div className="field"><label htmlFor="primaryListOwnerId">{t("Propietari/ària de la llista principal")}</label><select id="primaryListOwnerId" name="primaryListOwnerId" required defaultValue={event.primaryListOwnerId || ""}>{event.members.map((member) => <option key={member.id} value={member.userId}>{member.user.name}</option>)}</select></div>}
      <button className="button button-primary" type="submit">{t("Desar canvis")}</button>
    </form>}
    <section className="card settings-section"><h2>{t("Enllaç d’invitació")}</h2><p className="muted small">{t("Qualsevol persona amb aquest enllaç podrà unir-se a l’esdeveniment.")}</p><div className="invite-box">{inviteUrl}</div>
      <div className="form-actions" style={{ marginTop: 13 }}><CopyButton value={inviteUrl} />
        <form action={regenerateInvite}><input type="hidden" name="eventId" value={eventId} /><button className="button button-outline button-small" type="submit">{t("Regenerar enllaç")}</button></form></div>
    </section>
    <form action={updateReservationPrivacy} className="card settings-section form-stack">
      <input type="hidden" name="eventId" value={eventId} />
      <div><h2>{t("Mode sorpresa")}</h2><p className="muted small">{t("La persona que rep els regals no veurà quins estan reservats ni qui els ha triat. La resta de convidats sí que ho veuran per coordinar-se.")}</p></div>
      <label className="check-row"><input type="checkbox" name="hideReservationFromOwner" defaultChecked={event.hideReservationFromOwner} /> {t("Amagar estat i progrés al destinatari")}</label>
      <button className="button button-primary" type="submit">{t("Desar preferència")}</button>
    </form>
    <section className="card settings-section"><h2>{t("Membres")} <span className="muted small">({event.members.length})</span></h2><p className="muted small">{t("Els administradors, si no són responsables, veuen i reserven com un membre normal.")}</p>
      {event.members.map((member) => <div className="member-setting" key={member.id}><div><strong>{member.user.name}</strong>{member.userId === context.user.id && <span className="muted small"> · {t("tu")}</span>}<div className="muted small">{member.role === "OWNER" ? t("Propietari") : member.role === "ADMIN" ? t("Administrador") : t("Membre")}</div>{member.managesAllLists && <span className="member-badge">{t("Responsable de tots")}</span>}{!member.managesAllLists && (responsibilityCounts.get(member.userId) || 0) > 0 && <span className="member-badge">{responsibilityCounts.get(member.userId) === 1 ? t("Responsable d’1 perfil") : t("Responsable de {count} perfils").replace("{count}", String(responsibilityCounts.get(member.userId)))}</span>}</div>
        {member.role !== "OWNER" && <div className="toolbar">
          {owner && <form action={changeMemberRole}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={member.userId} /><input type="hidden" name="role" value={member.role === "ADMIN" ? "MEMBER" : "ADMIN"} /><button className="button button-outline button-small" type="submit">{member.role === "ADMIN" ? t("Fer membre") : t("Fer administrador")}</button></form>}
          {member.role === "ADMIN" && (owner || member.userId === context.user.id) && <form action={updateManagerScope} className="manager-scope-form"><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={member.userId} /><label><input type="checkbox" name="managesAllLists" defaultChecked={member.managesAllLists} /> {t("Responsable de tots els perfils")}</label><button className="button button-outline button-small" type="submit">{t("Desar")}</button></form>}
          {(owner || member.role === "MEMBER") && event.primaryListOwnerId !== member.userId && <RemoveMemberButton eventId={eventId} userId={member.userId} name={member.user.name} isProfile={member.user.isManagedProfile} />}
        </div>}
      </div>)}
    </section>
    <section className="card settings-section"><h2>{t("Perfils familiars i responsables")}</h2><p className="muted small">{t("Assigna un o més responsables a cada persona. Si un responsable no pot veure la llista, només veurà els regals que ell mateix hi afegeix. Els seus regals queden amagats al destinatari.")}</p>
      {event.members.map((profile) => {
        const assigned = new Map(responsibilities.filter((entry) => entry.profileUserId === profile.userId).map((entry) => [entry.responsibleUserId, entry]));
        const candidates = event.members.filter((candidate) => candidate.userId !== profile.userId && !candidate.user.isManagedProfile && candidate.user.email);
        return <details className="profile-settings" key={profile.id}>
          <summary>{profile.user.name}{profile.user.isManagedProfile ? ` · ${t("Perfil familiar")}` : ""}</summary>
          {profile.user.isManagedProfile && profile.user.profileClaimToken && <div className="claim-link-row"><span className="muted small">{t("Enllaç per activar el perfil:")}</span><CopyButton value={`/claim/${profile.user.profileClaimToken}`} /></div>}
          {profile.user.isManagedProfile && <form action={renameManagedProfile} className="profile-responsibility-form">
            <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={profile.userId} /><input type="hidden" name="returnTo" value="settings" />
            <label className="field-label" htmlFor={`profile-name-${profile.userId}`}>{t("Nom del perfil familiar")}</label>
            <div className="inline-form"><input id={`profile-name-${profile.userId}`} name="name" required maxLength={60} defaultValue={profile.user.name} /><button className="button button-outline button-small" type="submit">{t("Canviar el nom")}</button></div>
          </form>}
          <form action={saveProfileResponsibles} className="profile-responsibility-form">
            <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="profileUserId" value={profile.userId} />
            {candidates.length ? candidates.map((candidate) => {
              const relation = assigned.get(candidate.userId);
              return <div className="responsible-choice" key={candidate.userId}>
                <label><input type="checkbox" name="responsibleUserId" value={candidate.userId} defaultChecked={Boolean(relation)} /> {candidate.user.name}{candidate.role === "ADMIN" ? ` · ${t("Admin")}` : ""}</label>
                <label className="check-row"><input type="checkbox" name={`canViewList:${candidate.userId}`} defaultChecked={relation?.canViewList ?? true} /> {t("Pot veure la llista")}</label>
              </div>;
            }) : <p className="muted small">{t("No hi ha altres comptes als quals assignar la responsabilitat.")}</p>}
            <button className="button button-outline button-small" type="submit">{t("Desar responsables")}</button>
          </form>
        </details>;
      })}
    </section>
    {owner && <section className="card settings-section danger-zone"><h2>{t("Eliminar l’esdeveniment")}</h2>
      <p className="muted small">{t("S’esborraran per a tothom totes les llistes, regals, fotos, reserves i perfils familiars d’aquest esdeveniment. Aquesta acció no es pot desfer.")}</p>
      <DeleteEventForm eventId={eventId} eventName={event.name} />
    </section>}
  </>;
}
