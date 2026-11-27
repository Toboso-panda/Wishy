"use client";

import Link from "next/link";
import type { Item } from "@prisma/client";
import { createItem, createListItem, updateItem, updateListItem } from "@/app/actions";
import { useLocale } from "@/components/i18n/locale-provider";

// Where the gift is being added or edited: someone's display in an event, or one of my lists
type Place = { kind: "event"; eventId: string; ownerId: string } | { kind: "list"; listId: string; listName: string };

export function ItemForm({ place, item, entry, canEditContent = true, myLists = [], error }: {
  place: Place;
  item?: Item;
  /** Event only: this event's state of the gift */
  entry?: { isActive: boolean; isEssential: boolean };
  /** False when the gift is shared and the viewer isn't its owner: only the event options can change */
  canEditContent?: boolean;
  /** Event only, my own display: also save the new gift in one of my lists */
  myLists?: { id: string; name: string }[];
  error?: string;
}) {
  const { t } = useLocale();
  const inEvent = place.kind === "event";
  const action = inEvent ? (item ? updateItem : createItem) : (item ? updateListItem : createListItem);
  const backHref = inEvent ? `/events/${place.eventId}/members/${place.ownerId}` : `/lists/${place.listId}`;
  return <>
    <Link href={backHref} className="back-link">← {inEvent ? t("Tornar a la llista") : place.listName}</Link>
    <form action={action} encType="multipart/form-data" className="card form-card form-stack">
      {inEvent ? <><input type="hidden" name="eventId" value={place.eventId} /><input type="hidden" name="listOwnerId" value={place.ownerId} /></> : <input type="hidden" name="listId" value={place.listId} />}
      {item && <input type="hidden" name="itemId" value={item.id} />}
      <div><p className="eyebrow">{inEvent ? t("Llista de regals") : place.listName}</p><h2>{item ? t("Editar regal") : t("Afegir un regal")}</h2><p className="muted small">{t("Comparteix una idea; la resta de detalls són opcionals.")}</p></div>
      {error && <p className="alert">{t(error)}</p>}
      {item && !canEditContent && <p className="privacy-note">{t("Aquest regal també és a les llistes de la persona o en altres esdeveniments. Només ella en pot canviar el contingut; aquí pots canviar com es mostra en aquest esdeveniment.")}</p>}
      <fieldset className="form-stack plain-fieldset" disabled={!canEditContent}>
        <div className="field"><label htmlFor="name">{t("Nom del regal")} *</label><input id="name" name="name" required maxLength={120} defaultValue={item?.name || ""} placeholder={t("Per exemple, un llibre de cuina")} /></div>
        {item && canEditContent && <p className="field-help">{t("Els canvis es veuran a totes les llistes i esdeveniments on sigui aquest regal.")}</p>}
        <details className="optional-details">
          <summary>{t("Afegir detalls opcionals")}</summary>
          <div className="form-stack optional-fields">
            <div className="field"><label htmlFor="description">{t("Descripció")}</label><textarea id="description" name="description" maxLength={1000} defaultValue={item?.description || ""} placeholder={t("Mida, color o qualsevol detall útil…")} /></div>
            <div className="field"><label htmlFor="url">{t("Enllaç")}</label><input id="url" name="url" type="url" inputMode="url" defaultValue={item?.url || ""} placeholder="https://…" /><span className="field-help">{t("Només s’accepten enllaços http o https.")}</span></div>
            <div className="field"><label htmlFor="image">{t("Imatge")}</label><input id="image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif" /><span className="field-help">{t("JPG o JPEG, PNG, WEBP o GIF · màxim 5 MB.")}</span>{item?.imagePath && <><span className="field-help">{t("Puja’n una de nova per reemplaçar la imatge actual.")}</span><img src={item.imagePath} alt={t("Imatge actual")} style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 10 }} /></>}</div>
            <div className="field"><label htmlFor="price">{t("Preu")}</label><input id="price" name="price" maxLength={40} defaultValue={item?.price || ""} placeholder="25 €" /></div>
            <div className="field"><label htmlFor="priority">{t("Prioritat")}</label><select id="priority" name="priority" defaultValue={item?.priority || ""}><option value="">{t("Sense prioritat")}</option><option value="LOW">{t("Baixa")}</option><option value="MEDIUM">{t("Mitjana")}</option><option value="HIGH">{t("Alta")}</option></select></div>
            <div className="field"><label htmlFor="category">{t("Categoria")}</label><input id="category" name="category" maxLength={60} defaultValue={item?.category || ""} placeholder={t("Llibres, cuina, jocs…")} /></div>
            <div className="field"><label htmlFor="notes">{t("Notes")}</label><textarea id="notes" name="notes" maxLength={500} defaultValue={item?.notes || ""} placeholder={t("Qualsevol nota addicional…")} /></div>
          </div>
        </details>
      </fieldset>
      {inEvent && <div className="form-stack">
        <label className="check-row"><input type="checkbox" name="isActive" defaultChecked={entry?.isActive ?? true} /> {t("Regal actiu i visible")}</label>
        <label className="check-row"><input type="checkbox" name="isEssential" defaultChecked={entry?.isEssential ?? false} /> ★ {t("Regal imprescindible")}</label>
      </div>}
      {inEvent && !item && myLists.length > 0 && <div className="field"><label htmlFor="alsoListId">{t("Desar-lo també a una de les meves llistes")} <span className="muted">({t("opcional")})</span></label>
        <select id="alsoListId" name="alsoListId" defaultValue=""><option value="">{t("No, només en aquest esdeveniment")}</option>{myLists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select>
      </div>}
      <div className="form-actions"><button className="button button-primary" type="submit">{item ? t("Desar canvis") : t("Afegir regal")}</button><Link className="button button-outline" href={backHref}>{t("Cancel·lar")}</Link></div>
    </form>
  </>;
}
