"use client";

import Link from "next/link";
import type { Item } from "@prisma/client";
import { ArrowDown, ArrowUp, CalendarHeart, Pencil, Trash2, X } from "lucide-react";
import { moveListItem, removeListItem } from "@/app/actions";
import { useLocale } from "@/components/i18n/locale-provider";
import { GiftCardShell } from "@/components/items/item-card";

// A gift in one of my personal lists. Same card as in events; the tags say in which
// events the gift already is.
export function ListGiftCard({ listId, gift, events, otherLists, first, last }: {
  listId: string; gift: Item; events: string[]; otherLists: number; first: boolean; last: boolean;
}) {
  const { t } = useLocale();
  const ids = <><input type="hidden" name="listId" value={listId} /><input type="hidden" name="itemId" value={gift.id} /></>;
  const sharedElsewhere = events.length > 0 || otherLists > 0;
  const tags = events.length > 0 && events.map((name) => <span key={name} className="member-badge event-tag"><CalendarHeart size={12} aria-hidden /> {name}</span>);
  const question = sharedElsewhere
    ? t("Vols treure aquest regal d’aquesta llista? Continuarà a les altres llistes i esdeveniments on és.")
    : t("Vols esborrar aquest regal? Aquesta acció no es pot desfer.");

  return <GiftCardShell gift={gift} tags={tags || undefined}>
    <footer className="item-editbar">
      <div className="item-editbar-group" aria-label={t("Canviar l’ordre del regal")}>
        <form action={moveListItem}>{ids}<input type="hidden" name="direction" value="up" /><button className="editbar-button icon-only" type="submit" disabled={first} aria-label={t("Pujar regal")} title={t("Pujar")}><ArrowUp size={17} /></button></form>
        <form action={moveListItem}>{ids}<input type="hidden" name="direction" value="down" /><button className="editbar-button icon-only" type="submit" disabled={last} aria-label={t("Baixar regal")} title={t("Baixar")}><ArrowDown size={17} /></button></form>
      </div>
      <div className="item-editbar-group">
        <Link className="editbar-button" href={`/lists/${listId}/items/${gift.id}/edit`}><Pencil size={16} aria-hidden /> {t("Editar")}</Link>
        <form action={removeListItem} onSubmit={(event) => { if (!window.confirm(question)) event.preventDefault(); }}>{ids}<button className="editbar-button danger" type="submit">{sharedElsewhere ? <><X size={16} aria-hidden /> {t("Treure")}</> : <><Trash2 size={16} aria-hidden /> {t("Esborrar")}</>}</button></form>
      </div>
    </footer>
  </GiftCardShell>;
}
