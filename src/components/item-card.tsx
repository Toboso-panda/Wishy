"use client";

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { addContribution, changeReservationMode, deleteItem, moveItem, removeContribution, reserveItem, toggleItemActive, toggleItemEssential, unreserveItem } from "@/app/actions";

type ItemWithPeople = Prisma.ItemGetPayload<{
  include: { reservedBy: { select: { id: true; name: true } }; contributions: { include: { user: { select: { id: true; name: true } } } } }
}>;

export function ItemCard({ item, eventId, currentUserId, canEdit, canModerateReservations, hideReservationDetails, first, last }: {
  item: ItemWithPeople; eventId: string; currentUserId: string; canEdit: boolean; canModerateReservations: boolean; hideReservationDetails: boolean; first: boolean; last: boolean;
}) {
  const canUnreserve = item.reservedById === currentUserId || canModerateReservations;
  const canChangeMode = item.reservedById === currentUserId || canModerateReservations;
  const alreadyContributed = item.contributions.some((contribution) => contribution.userId === currentUserId);
  const participantCount = item.reservedById ? 1 + item.contributions.length : 0;
  const helpTarget = 1 + (item.helpersNeeded ?? 0);
  const helpComplete = item.reservationMode === "HELP" && participantCount >= helpTarget;
  const modeLabel = item.reservationMode === "HELP" ? (helpComplete ? "Agafat" : "Demana ajuda") : item.reservationMode === "SHARED" ? "Regal compartit" : "Agafat";
  const participantCountLabel = participantCount >= 10 ? `${participantCount}+` : `${participantCount}`;
  const participantNames = <>
    {item.reservedBy && <div className="contribution-row"><span><b>{item.reservedBy.name}</b> <span className="muted">(organitza)</span></span></div>}
    {item.contributions.map((contribution) => <div className="contribution-row" key={contribution.id}><span><b>{contribution.user.name}</b>{contribution.note ? ` — ${contribution.note}` : ""}</span>
      {(contribution.userId === currentUserId || canChangeMode) && <form action={removeContribution}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="contributionId" value={contribution.id} /><button className="quiet-button" type="submit">Sortir</button></form>}
    </div>)}
  </>;
  return <article className={`card item-card${canEdit ? " editable" : ""}`} style={!item.isActive ? { opacity: .65 } : undefined}>
    {item.imagePath ? <img className="item-image" src={item.imagePath} alt={`Imatge de ${item.name}`} /> : <div className="item-image-placeholder" aria-hidden>♡</div>}
    <div className="item-content">
      <div className="item-top">
        <div className="item-heading-row">
          <div className="item-title-group">
            <div className="item-title-line">
              <h2 className="item-title">{item.name}</h2>
              {item.isEssential && <span className="essential-label" title="Regal imprescindible">★ Imprescindible</span>}
            </div>
            <div className="item-tags">
              {!item.isActive && <span className="status-badge inactive">Inactiu</span>}
              {!hideReservationDetails && (item.reservedById ? <span className={`status-badge ${item.reservationMode === "HELP" && !helpComplete ? "help" : item.reservationMode === "SHARED" ? "shared" : "reserved"}`}>{modeLabel}{item.reservationMode === "HELP" ? ` · ${participantCount}/${helpTarget}` : item.reservationMode === "SHARED" ? ` · ${participantCountLabel}` : ""}</span> : item.isActive && <span className="status-badge available">Disponible</span>)}
            </div>
          </div>
          {item.price && <strong className="item-price">{item.price}</strong>}
        </div>
      </div>
    {item.description && <p className="item-description">{item.description}</p>}
    {(item.category || item.priority) && <p className="item-detail">{[item.category, item.priority && `Prioritat ${item.priority === "HIGH" ? "alta" : item.priority === "MEDIUM" ? "mitjana" : "baixa"}`].filter(Boolean).join(" · ")}</p>}
    {item.notes && <p className="item-detail">Nota: {item.notes}</p>}
    {!hideReservationDetails && item.reservedBy && <p className="item-detail">{item.reservedById === currentUserId ? "L’has reservat tu" : `Agafat per ${item.reservedBy.name}`}</p>}
    {item.url && <a className="button button-outline button-small" href={item.url} target="_blank" rel="noopener noreferrer">Veure enllaç ↗</a>}
    {!hideReservationDetails && item.reservationMode !== "NONE" && <div className="contributions">
      {item.reservationMode === "HELP" ? <details className="participants-details" open={participantCount <= 4}><summary>Persones: {participantCount}/{helpTarget}</summary>{participantNames}</details> : <>
        <div className="shared-summary"><strong>{participantCountLabel} participants</strong>{item.reservedBy && <span className="muted"> · Organitza {item.reservedBy.name}</span>}</div>
        {participantCount <= 4 ? participantNames : <details className="participants-details"><summary>Veure participants</summary>{participantNames}</details>}
      </>}
      {item.reservedById !== currentUserId && item.listOwnerId !== currentUserId && !alreadyContributed && !(item.reservationMode === "HELP" && helpComplete) && <form action={addContribution} className="inline-form"><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><input name="note" maxLength={160} aria-label="Què aportaràs?" placeholder="Què aportaràs? (opcional)" /><button className="button button-secondary button-small" type="submit">{item.reservationMode === "HELP" ? "Ajudar" : "Unir-me"}</button></form>}
    </div>}
    <div className="item-actions">
      {!hideReservationDetails && !item.reservedById && item.isActive && item.listOwnerId !== currentUserId && <form action={reserveItem}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><button className="button button-primary button-small" type="submit">Agafar</button></form>}
      {!hideReservationDetails && item.reservedById && canUnreserve && <form action={unreserveItem} onSubmit={(event) => { if (item.contributions.length && !window.confirm("Aquest regal té participants. En desmarcar-lo també se n’esborraran les contribucions. Vols continuar?")) event.preventDefault(); }}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><button className="button button-outline button-small" type="submit">Desmarcar</button></form>}
      {!hideReservationDetails && item.reservedById && canChangeMode && <>
        <form action={changeReservationMode} className="help-setting-form"><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="mode" value="HELP" /><label>Necessito <input type="number" name="helpersNeeded" min={1} max={99} defaultValue={item.reservationMode === "HELP" ? (item.helpersNeeded ?? 2) : 2} required aria-label="Nombre de persones que necessito" /> persones més</label><button className="button button-outline button-small" type="submit">{item.reservationMode === "HELP" ? "Actualitzar" : "Demanar ajuda"}</button></form>
        {item.reservationMode !== "SHARED" && <form action={changeReservationMode}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="mode" value="SHARED" /><button className="button button-outline button-small" type="submit">Regal compartit</button></form>}
        {item.reservationMode !== "NONE" && <form action={changeReservationMode} onSubmit={(event) => { if (item.contributions.length && !window.confirm("En treure l’ajuda s’esborraran les contribucions. Vols continuar?")) event.preventDefault(); }}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="mode" value="NONE" /><button className="quiet-button" type="submit">Treure l’ajuda</button></form>}
      </>}
      {canEdit && <details className="item-manage"><summary>Gestionar regal</summary><div className="item-manage-actions">
        <form action={toggleItemEssential}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><button className="button button-outline button-small" type="submit">{item.isEssential ? "★ Imprescindible · Desmarcar" : "☆ Marcar imprescindible"}</button></form>
        <Link className="button button-outline button-small" href={`/events/${eventId}/members/${item.listOwnerId}/items/${item.id}/edit`}>Editar</Link>
        <form action={toggleItemActive}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><button className="button button-outline button-small" type="submit">{item.isActive ? "Desactivar" : "Activar"}</button></form>
        <form action={deleteItem} onSubmit={(event) => { if (!window.confirm("Vols esborrar aquest regal? Aquesta acció no es pot desfer.")) event.preventDefault(); }}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><button className="button button-danger button-small" type="submit">Esborrar</button></form>
      </div></details>}
    </div></div>
    {canEdit && <div className="card-order-controls" aria-label="Canviar l’ordre del regal">
      <form action={moveItem}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="direction" value="up" /><button className="icon-button" type="submit" disabled={first} aria-label="Pujar regal" title="Pujar">↑</button></form>
      <form action={moveItem}><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="direction" value="down" /><button className="icon-button" type="submit" disabled={last} aria-label="Baixar regal" title="Baixar">↓</button></form>
    </div>}
  </article>;
}
