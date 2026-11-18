"use client";

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ArrowDown, ArrowUp, Check, ExternalLink, Eye, EyeOff, Gift, Lock, Pencil, Star, Trash2, Users } from "lucide-react";
import { addContribution, changeReservationMode, deleteItem, moveItem, removeContribution, reserveItem, toggleItemActive, toggleItemEssential, unreserveItem } from "@/app/actions";
import { useLocale } from "@/components/i18n/locale-provider";

type ItemWithPeople = Prisma.ItemGetPayload<{
  include: { reservedBy: { select: { id: true; name: true } }; contributions: { include: { user: { select: { id: true; name: true } } } } }
}>;

type Props = {
  item: ItemWithPeople; eventId: string; currentUserId: string; canEdit: boolean; canModerateReservations: boolean; hideReservationDetails: boolean; first: boolean; last: boolean;
};

export function ItemCard({ item, eventId, currentUserId, canEdit, canModerateReservations, hideReservationDetails, first, last }: Props) {
  const { t } = useLocale();
  const ids = <><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /></>;
  const isRecipient = item.listOwnerId === currentUserId;
  const isGroup = item.reservationMode !== "NONE";
  const participantCount = item.reservedById ? 1 + item.contributions.length : 0;
  const groupTarget = item.reservationMode === "HELP" ? 1 + (item.helpersNeeded ?? 0) : null;
  const groupComplete = groupTarget !== null && participantCount >= groupTarget;

  const status = !item.isActive ? { className: "inactive", label: t("Inactiu") }
    : !item.reservedById ? { className: "available", label: t("Disponible") }
    : isGroup && !groupComplete ? { className: "help", label: groupTarget ? `${t("En grup")} · ${participantCount}/${groupTarget}` : `${t("En grup")} · ${participantCount}` }
    : { className: "reserved", label: t("Reservat") };

  return <article className="card item-card" style={!item.isActive ? { opacity: .7 } : undefined}>
    {item.imagePath ? <img className="item-image" src={item.imagePath} alt={`${t("Imatge de")} ${item.name}`} /> : <div className="item-image-placeholder" aria-hidden>🎁</div>}
    <div className="item-content">
      <div className="item-heading-row">
        <div className="item-title-group">
          <h2 className="item-title">{item.name}</h2>
          <div className="item-tags">
            {!hideReservationDetails && <span className={`status-badge ${status.className}`}>{status.label}</span>}
            {hideReservationDetails && !item.isActive && <span className="status-badge inactive">{t("Inactiu")}</span>}
            {item.isEssential && <span className="essential-label"><Star size={13} fill="currentColor" aria-hidden /> {t("Imprescindible")}</span>}
            {item.isHiddenFromListOwner && !isRecipient && <span className="member-badge" title={t("La persona de la llista no veu aquest regal.")}><Lock size={12} aria-hidden /> {t("Sorpresa")}</span>}
          </div>
        </div>
        {item.price && <strong className="item-price">{item.price}</strong>}
      </div>
      {item.description && <p className="item-description">{item.description}</p>}
      {(item.category || item.priority) && <p className="item-detail">{[item.category, item.priority && `${t("Prioritat")} ${item.priority === "HIGH" ? t("alta") : item.priority === "MEDIUM" ? t("mitjana") : t("baixa")}`].filter(Boolean).join(" · ")}</p>}
      {item.notes && <p className="item-detail">{t("Nota:")} {item.notes}</p>}
      {item.url && <a className="item-link" href={item.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden /> {t("Veure on comprar-lo")}</a>}
      {!hideReservationDetails && <ReservationPanel {...{ item, ids, isRecipient, currentUserId, canModerateReservations, participantCount, groupTarget, groupComplete }} />}
    </div>
    {canEdit && <footer className="item-editbar">
      <div className="item-editbar-group" aria-label={t("Canviar l’ordre del regal")}>
        <form action={moveItem}>{ids}<input type="hidden" name="direction" value="up" /><button className="editbar-button icon-only" type="submit" disabled={first} aria-label={t("Pujar regal")} title={t("Pujar")}><ArrowUp size={17} /></button></form>
        <form action={moveItem}>{ids}<input type="hidden" name="direction" value="down" /><button className="editbar-button icon-only" type="submit" disabled={last} aria-label={t("Baixar regal")} title={t("Baixar")}><ArrowDown size={17} /></button></form>
      </div>
      <div className="item-editbar-group">
        <form action={toggleItemEssential}>{ids}<button className={`editbar-button${item.isEssential ? " selected" : ""}`} type="submit" aria-pressed={item.isEssential}><Star size={16} fill={item.isEssential ? "currentColor" : "none"} aria-hidden /> {t("Imprescindible")}</button></form>
        <Link className="editbar-button" href={`/events/${eventId}/members/${item.listOwnerId}/items/${item.id}/edit`}><Pencil size={16} aria-hidden /> {t("Editar")}</Link>
        <form action={toggleItemActive}>{ids}<button className="editbar-button" type="submit" title={item.isActive ? t("Amaga el regal sense esborrar-lo") : undefined}>{item.isActive ? <><EyeOff size={16} aria-hidden /> {t("Desactivar")}</> : <><Eye size={16} aria-hidden /> {t("Activar")}</>}</button></form>
        <form action={deleteItem} onSubmit={(event) => { if (!window.confirm(t("Vols esborrar aquest regal? Aquesta acció no es pot desfer."))) event.preventDefault(); }}>{ids}<button className="editbar-button danger" type="submit"><Trash2 size={16} aria-hidden /> {t("Esborrar")}</button></form>
      </div>
    </footer>}
  </article>;
}

// Who has the gift and what the current person can do about it.
function ReservationPanel({ item, ids, isRecipient, currentUserId, canModerateReservations, participantCount, groupTarget, groupComplete }: {
  item: ItemWithPeople; ids: React.ReactNode; isRecipient: boolean; currentUserId: string; canModerateReservations: boolean; participantCount: number; groupTarget: number | null; groupComplete: boolean;
}) {
  const { t } = useLocale();
  const isOrganizer = item.reservedById === currentUserId;
  const canManage = isOrganizer || canModerateReservations;
  const myContribution = item.contributions.find((contribution) => contribution.userId === currentUserId);
  const confirmLosingGroup = (event: React.FormEvent) => { if (item.contributions.length && !window.confirm(t("Aquest regal té més persones apuntades. Si continues, se n’esborraran. Vols continuar?"))) event.preventDefault(); };

  // Nobody has it yet
  if (!item.reservedById) {
    if (!item.isActive || isRecipient) return null;
    return <section className="reserve-panel">
      <p className="reserve-title">{t("Ningú no l’ha reservat encara.")}</p>
      <div className="reserve-actions">
        <form action={reserveItem}>{ids}<button className="button button-primary button-small" type="submit"><Gift size={16} aria-hidden /> {t("Reservar-lo")}</button></form>
        <details className="reserve-more">
          <summary className="button button-outline button-small"><Users size={16} aria-hidden /> {t("Regalar-lo en grup")}</summary>
          <form action={reserveItem} className="group-form">{ids}<input type="hidden" name="group" value="1" />
            <p className="field-help">{t("L’organitzes tu i altres persones s’hi poden apuntar per pagar-lo entre tots.")}</p>
            <GroupSizeField />
            <button className="button button-secondary button-small" type="submit">{t("Començar regal en grup")}</button>
          </form>
        </details>
      </div>
    </section>;
  }

  // Reserved by one person
  if (item.reservationMode === "NONE") {
    return <section className="reserve-panel">
      <p className="reserve-title">{isOrganizer ? <><Check size={17} aria-hidden /> {t("L’has reservat tu.")}</> : `${t("Reservat per")} ${item.reservedBy?.name ?? ""}.`}</p>
      {canManage && !isRecipient && <div className="reserve-actions">
        <form action={unreserveItem}>{ids}<button className="button button-outline button-small" type="submit">{isOrganizer ? t("Deixar la reserva") : t("Desfer la reserva")}</button></form>
        {isOrganizer && <details className="reserve-more">
          <summary className="button button-outline button-small"><Users size={16} aria-hidden /> {t("Compartir-lo amb més persones")}</summary>
          <form action={changeReservationMode} className="group-form">{ids}<input type="hidden" name="mode" value="GROUP" />
            <p className="field-help">{t("Seguiràs organitzant-lo tu i altres persones s’hi podran apuntar.")}</p>
            <GroupSizeField />
            <button className="button button-secondary button-small" type="submit">{t("Convertir en regal en grup")}</button>
          </form>
        </details>}
      </div>}
    </section>;
  }

  // Group gift
  const progress = groupTarget ? Math.min(100, Math.round((participantCount / groupTarget) * 100)) : null;
  return <section className="reserve-panel group">
    <p className="reserve-title"><Users size={17} aria-hidden /> {t("Regal en grup")}</p>
    <p className="reserve-subtitle">{groupTarget
      ? (groupComplete ? t("Ja hi ha prou persones.") : t("Hi ha {count} de {total} persones.").replace("{count}", String(participantCount)).replace("{total}", String(groupTarget)))
      : participantCount === 1 ? t("De moment només hi ets tu. Altres persones s’hi poden apuntar.") : t("Hi ha {count} persones apuntades.").replace("{count}", String(participantCount))}</p>
    {progress !== null && <div className="group-progress" aria-hidden><span style={{ width: `${progress}%` }} /></div>}
    <ul className="participant-list">
      {item.reservedBy && <li><span><b>{item.reservedBy.name}</b> <span className="muted">· {t("organitza")}</span></span></li>}
      {item.contributions.map((contribution) => <li key={contribution.id}>
        <span><b>{contribution.user.name}</b>{contribution.note ? <span className="muted"> · {contribution.note}</span> : null}</span>
        {(contribution.userId === currentUserId || canManage) && <form action={removeContribution}><input type="hidden" name="eventId" value={item.eventId} /><input type="hidden" name="contributionId" value={contribution.id} /><button className="text-button" type="submit">{contribution.userId === currentUserId ? t("Desapuntar-me") : t("Treure")}</button></form>}
      </li>)}
    </ul>
    {!isRecipient && !isOrganizer && !myContribution && !groupComplete && <form action={addContribution} className="inline-form">{ids}
      <input name="note" maxLength={160} aria-label={t("Què aportaràs?")} placeholder={t("Què aportaràs? (opcional)")} />
      <button className="button button-primary button-small" type="submit">{t("M’hi apunto")}</button>
    </form>}
    {canManage && !isRecipient && <details className="reserve-more organizer-options">
      <summary className="text-button">{isOrganizer ? t("Opcions del regal (l’organitzes tu)") : t("Opcions del regal")}</summary>
      <div className="group-form">
        <form action={changeReservationMode} className="group-size-form">{ids}<input type="hidden" name="mode" value="GROUP" />
          <GroupSizeField defaultValue={item.reservationMode === "HELP" ? item.helpersNeeded ?? undefined : undefined} />
          <button className="button button-outline button-small" type="submit">{t("Desar")}</button>
        </form>
        <div className="reserve-actions">
          <form action={changeReservationMode} onSubmit={confirmLosingGroup}>{ids}<input type="hidden" name="mode" value="NONE" /><button className="button button-outline button-small" type="submit">{t("Ja no és en grup")}</button></form>
          <form action={unreserveItem} onSubmit={confirmLosingGroup}>{ids}<button className="button button-outline button-small" type="submit">{t("Desfer la reserva")}</button></form>
        </div>
      </div>
    </details>}
  </section>;
}

function GroupSizeField({ defaultValue }: { defaultValue?: number }) {
  const { t } = useLocale();
  return <label className="group-size">
    <span>{t("Persones que necessites a més de tu")}</span>
    <input type="number" name="helpersNeeded" min={1} max={99} defaultValue={defaultValue} placeholder={t("Sense límit")} />
  </label>;
}
