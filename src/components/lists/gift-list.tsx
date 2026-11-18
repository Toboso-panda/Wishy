import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { renameManagedProfile } from "@/app/actions";
import { ClearListButton, RemoveMemberButton } from "@/components/events/member-controls";
import { ItemCard } from "@/components/items/item-card";
import { CopyButton } from "@/components/ui/copy-button";
import { prisma } from "@/lib/db";
import { isManager, listAccess } from "@/lib/permissions";
import { translate } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/shared";

// One person's gift list. Used on its own page ("page") and, in single-list events,
// directly on the event page ("embedded").
export async function GiftList({ eventId, memberId, locale, variant, flags }: {
  eventId: string; memberId: string; locale: Locale; variant: "page" | "embedded";
  flags: { error?: string; saved?: string; cleared?: string };
}) {
  const t = (s: string) => translate(locale, s);
  const { error, saved, cleared } = flags;
  const [access, targetMember] = await Promise.all([
    listAccess(eventId, memberId),
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
  // Organizer tools for someone else's list
  const viewerIsManager = isManager(access.membership.role);
  const isProfile = targetMember.user.isManagedProfile;
  const targetIsProtected = targetMember.role === "OWNER" || event.ownerId === memberId;
  const canManageTarget = viewerIsManager && !isRecipient && (access.owner || targetMember.role === "MEMBER");
  const canClear = canManageTarget;
  const canRemove = canManageTarget && !targetIsProtected && event.primaryListOwnerId !== memberId;
  const canRename = isProfile && (viewerIsManager || Boolean(access.responsibility));
  // Why this person sees the edit bar on each gift
  const editReason = !canEdit ? null
    : access.ownList ? t("És la teva llista: pots editar, ordenar i esborrar els teus regals.")
    : access.owner ? t("Pots editar aquesta llista perquè has creat l’esdeveniment.")
    : access.responsibleForAll ? t("Pots editar aquesta llista perquè ets responsable de tots els perfils.")
    : access.canEditOwnHidden ? t("Ets responsable d’aquest perfil: pots editar els regals que hi afegeixes tu.")
    : t("Pots editar aquesta llista perquè ets responsable d’aquest perfil.");
  const addHref = `/events/${eventId}/members/${memberId}/items/new`;
  return <>
    {variant === "page"
      ? <div className="list-header"><div><p className="eyebrow">{t("Llista de regals")}</p><h1>{targetMember.user.name}</h1></div>
          {canCreate && <Link href={addHref} className="button button-primary">＋ {t("Afegir regal")}</Link>}
        </div>
      : <div className="section-heading"><h2>{isRecipient ? t("La teva llista") : `${t("Llista de")} ${targetMember.user.name}`}</h2>
          {canCreate && <Link href={addHref} className="button button-primary button-small">＋ {t("Afegir regal")}</Link>}
        </div>}
    {hideReservationDetails ? <p className="privacy-note">{t("L’estat dels regals s’amaga per preservar la sorpresa.")}</p> : <p className="muted small list-progress">{reservedCount}/{activeCount} {t("regals reservats")}</p>}
    {!access.canViewList && <p className="privacy-note">{t("Només veus els regals que has afegit a aquest perfil.")}</p>}
    {canShareClaim && targetMember.user.profileClaimToken && <div className="claim-profile-note"><div><strong>{t("Perfil familiar sense compte")}</strong><p className="small">{t("Comparteix l’enllaç perquè {name} pugui activar el seu compte.").replace("{name}", targetMember.user.name)}</p></div><CopyButton value={`/claim/${targetMember.user.profileClaimToken}`} /></div>}
    {editReason && items.length > 0 && <p className="edit-access-note"><Pencil size={17} aria-hidden /> {editReason}</p>}
    {error && <p className="alert">{t(error)}</p>}
    {saved && <p className="success-note">{t("Els canvis s’han desat.")}</p>}
    {cleared && <p className="success-note">{t("S’ha buidat la llista.")}</p>}
    {(canRename || canClear || canRemove) && <details className="profile-create-details list-manage">
      <summary>{isProfile ? t("Gestionar el perfil") : t("Gestionar la llista")}</summary>
      <div className="profile-create-form">
        {canRename && <form action={renameManagedProfile} className="list-manage-rename">
          <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={memberId} />
          <label htmlFor="profile-name">{t("Nom del perfil familiar")}</label>
          <div className="inline-form"><input id="profile-name" name="name" required maxLength={60} defaultValue={targetMember.user.name} /><button className="button button-secondary button-small" type="submit">{t("Desar")}</button></div>
        </form>}
        {(canClear || canRemove) && <div className="form-actions">
          {canClear && <ClearListButton eventId={eventId} userId={memberId} name={targetMember.user.name} />}
          {canRemove && <RemoveMemberButton eventId={eventId} userId={memberId} name={targetMember.user.name} isProfile={isProfile} returnTo="event" />}
        </div>}
        {(canClear || canRemove) && <span className="field-help">{isProfile ? t("Buidar la llista esborra els regals però manté el perfil. Eliminar el perfil l’esborra de l’esdeveniment amb la seva llista.") : t("Buidar la llista esborra els regals però la persona continua a l’esdeveniment. Eliminar-la també treu les seves reserves i contribucions.")}</span>}
      </div>
    </details>}
    {items.length ? <div className="item-list">{items.map((item, index) => {
      const safeItem = hideReservationDetails ? { ...item, reservedById: null, reservedAt: null, reservedBy: null, reservationMode: "NONE" as typeof item.reservationMode, helpersNeeded: null, contributions: [] } : item;
      return <ItemCard key={item.id} item={safeItem} eventId={eventId} currentUserId={user.id} canEdit={canEdit} canModerateReservations={canModerateReservations} hideReservationDetails={hideReservationDetails} first={index === 0} last={index === items.length - 1} />;
    })}</div>
      : <div className="empty-state"><h3>{canCreate ? t("La llista encara és buida") : t("Encara no hi ha regals")}</h3><p className="small">{canCreate ? t("Afegeix una idea o un desig a aquesta llista.") : t("Torna més tard, potser apareixerà alguna idea.")}</p>{canCreate && <Link className="button button-primary" href={addHref}>{t("Afegir regal")}</Link>}</div>}
  </>;
}
