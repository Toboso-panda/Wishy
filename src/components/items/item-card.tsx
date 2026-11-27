"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Item, Prisma } from "@prisma/client";
import { ArrowDown, ArrowUp, Check, ExternalLink, Eye, EyeOff, Gift, Lock, Pencil, Star, Trash2, Users, X } from "lucide-react";
import { addContribution, changeReservationMode, deleteItem, moveItem, removeContribution, reserveItem, toggleItemActive, toggleItemEssential, unreserveItem } from "@/app/actions";
import { useLocale } from "@/components/i18n/locale-provider";

type EntryWithPeople = Prisma.EventItemGetPayload<{
  include: { item: true; reservedBy: { select: { id: true; name: true } }; contributions: { include: { user: { select: { id: true; name: true } } } } }
}>;

// Top of every gift card: square photo + text with a fixed height ("Veure més" opens the rest).
// Used in events (ItemCard) and in personal lists (ListGiftCard).
export function GiftCardShell({ gift, tags, className = "", dimmed = false, children }: {
  gift: Item; tags?: ReactNode; className?: string; dimmed?: boolean; children?: ReactNode;
}) {
  const { t } = useLocale();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  // The text area has a fixed height (christmas.css): show "Veure més" only when something is cut off
  useEffect(() => {
    const content = contentRef.current;
    if (!content || expanded) return;
    const check = () => setOverflows(content.scrollHeight > content.clientHeight + 1
      || [...content.querySelectorAll<HTMLElement>(".item-title, .item-description, .item-detail")].some((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1));
    check();
    const observer = new ResizeObserver(check);
    observer.observe(content);
    return () => observer.disconnect();
  }, [expanded, gift.name, gift.description, gift.notes, gift.category, gift.priority, gift.url, gift.price]);

  return <article className={`card item-card${expanded ? " expanded" : ""}${className ? ` ${className}` : ""}`} style={dimmed ? { opacity: .7 } : undefined}>
    {gift.imagePath ? <img className="item-image" src={gift.imagePath} alt={`${t("Imatge de")} ${gift.name}`} /> : <div className="item-image-placeholder" aria-hidden>🎁</div>}
    <div className="item-content" ref={contentRef}>
      <div className="item-heading-row">
        <div className="item-title-group">
          <h2 className="item-title">{gift.name}</h2>
          {tags && <div className="item-tags">{tags}</div>}
        </div>
        {gift.price && <strong className="item-price">{gift.price}</strong>}
      </div>
      {gift.description && <p className="item-description">{gift.description}</p>}
      {(gift.category || gift.priority) && <p className="item-detail">{[gift.category, gift.priority && `${t("Prioritat")} ${gift.priority === "HIGH" ? t("alta") : gift.priority === "MEDIUM" ? t("mitjana") : t("baixa")}`].filter(Boolean).join(" · ")}</p>}
      {gift.notes && <p className="item-detail">{t("Nota:")} {gift.notes}</p>}
      {gift.url && <a className="item-link" href={gift.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden /> {t("Veure on comprar-lo")}</a>}
      {(overflows || expanded) && <button className="item-more" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? t("Veure menys") : t("Veure més")}</button>}
    </div>
    {children}
  </article>;
}

type Props = {
  entry: EntryWithPeople; currentUserId: string; canEdit: boolean; canModerateReservations: boolean; hideReservationDetails: boolean; first: boolean; last: boolean;
  /** Someone reserved this same gift in another event: it can't be reserved here */
  reservedElsewhere: boolean;
  /** The gift is also in a list or another event: the bin only takes it out of this event */
  sharedElsewhere: boolean;
};

// A gift in an event: shared content + this event's state (active, essential, reservation)
export function ItemCard({ entry, currentUserId, canEdit, canModerateReservations, hideReservationDetails, first, last, reservedElsewhere, sharedElsewhere }: Props) {
  const { t } = useLocale();
  const { item } = entry;
  const ids = <><input type="hidden" name="eventId" value={entry.eventId} /><input type="hidden" name="itemId" value={item.id} /></>;
  const isRecipient = item.ownerId === currentUserId;
  const isGroup = entry.reservationMode !== "NONE";
  const participantCount = entry.reservedById ? 1 + entry.contributions.length : 0;
  const groupTarget = entry.reservationMode === "HELP" ? 1 + (entry.helpersNeeded ?? 0) : null;
  const groupComplete = groupTarget !== null && participantCount >= groupTarget;
  const blockedElsewhere = reservedElsewhere && !entry.reservedById && !hideReservationDetails;

  const status = !entry.isActive ? { className: "inactive", label: t("Inactiu") }
    : blockedElsewhere ? { className: "elsewhere", label: t("Ja reservat") }
    : !entry.reservedById ? { className: "available", label: t("Disponible") }
    : isGroup && !groupComplete ? { className: "help", label: groupTarget ? `${t("En grup")} · ${participantCount}/${groupTarget}` : `${t("En grup")} · ${participantCount}` }
    : { className: "reserved", label: t("Reservat") };

  const tags = <>
    {!hideReservationDetails && <span className={`status-badge ${status.className}`}>{blockedElsewhere && <Lock size={12} aria-hidden />} {status.label}</span>}
    {hideReservationDetails && !entry.isActive && <span className="status-badge inactive">{t("Inactiu")}</span>}
    {entry.isEssential && <span className="essential-label"><Star size={13} fill="currentColor" aria-hidden /> {t("Imprescindible")}</span>}
    {item.isHiddenFromListOwner && !isRecipient && <span className="member-badge" title={t("La persona de la llista no veu aquest regal.")}><Lock size={12} aria-hidden /> {t("Sorpresa")}</span>}
  </>;

  const removeQuestion = sharedElsewhere
    ? t("Vols treure aquest regal d’aquest esdeveniment? Continuarà a les llistes i altres esdeveniments on és.")
    : t("Vols esborrar aquest regal? Aquesta acció no es pot desfer.");

  return <GiftCardShell gift={item} tags={tags} dimmed={!entry.isActive} className={blockedElsewhere ? "reserved-elsewhere" : ""}>
    {blockedElsewhere
      ? <section className="reserve-panel elsewhere" role="status">
          <p className="reserve-title"><Lock size={18} aria-hidden /> {t("Ja està reservat en un altre esdeveniment")}</p>
          <p className="reserve-subtitle">{t("Algú ja ha reservat aquest mateix regal en un altre esdeveniment. No el compris: quedaria repetit.")}</p>
        </section>
      : !hideReservationDetails && <ReservationPanel {...{ entry, ids, isRecipient, currentUserId, canModerateReservations, participantCount, groupTarget, groupComplete }} />}
    {canEdit && <footer className="item-editbar">
      <div className="item-editbar-group" aria-label={t("Canviar l’ordre del regal")}>
        <form action={moveItem}>{ids}<input type="hidden" name="direction" value="up" /><button className="editbar-button icon-only" type="submit" disabled={first} aria-label={t("Pujar regal")} title={t("Pujar")}><ArrowUp size={17} /></button></form>
        <form action={moveItem}>{ids}<input type="hidden" name="direction" value="down" /><button className="editbar-button icon-only" type="submit" disabled={last} aria-label={t("Baixar regal")} title={t("Baixar")}><ArrowDown size={17} /></button></form>
      </div>
      <div className="item-editbar-group">
        <form action={toggleItemEssential}>{ids}<button className={`editbar-button${entry.isEssential ? " selected" : ""}`} type="submit" aria-pressed={entry.isEssential}><Star size={16} fill={entry.isEssential ? "currentColor" : "none"} aria-hidden /> {t("Imprescindible")}</button></form>
        <Link className="editbar-button" href={`/events/${entry.eventId}/members/${item.ownerId}/items/${item.id}/edit`}><Pencil size={16} aria-hidden /> {t("Editar")}</Link>
        <form action={toggleItemActive}>{ids}<button className="editbar-button" type="submit" title={entry.isActive ? t("Amaga el regal sense esborrar-lo") : undefined}>{entry.isActive ? <><EyeOff size={16} aria-hidden /> {t("Desactivar")}</> : <><Eye size={16} aria-hidden /> {t("Activar")}</>}</button></form>
        <form action={deleteItem} onSubmit={(event) => { if (!window.confirm(removeQuestion)) event.preventDefault(); }}>{ids}<button className="editbar-button danger" type="submit">{sharedElsewhere ? <><X size={16} aria-hidden /> {t("Treure")}</> : <><Trash2 size={16} aria-hidden /> {t("Esborrar")}</>}</button></form>
      </div>
    </footer>}
  </GiftCardShell>;
}

// Who has the gift and what the current person can do about it.
function ReservationPanel({ entry: item, ids, isRecipient, currentUserId, canModerateReservations, participantCount, groupTarget, groupComplete }: {
  entry: EntryWithPeople; ids: React.ReactNode; isRecipient: boolean; currentUserId: string; canModerateReservations: boolean; participantCount: number; groupTarget: number | null; groupComplete: boolean;
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
