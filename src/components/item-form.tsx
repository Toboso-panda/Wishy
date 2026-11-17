"use client";

import Link from "next/link";
import type { Item } from "@prisma/client";
import { createItem, updateItem } from "@/app/actions";
import { useLocale } from "@/components/locale-provider";

export function ItemForm({ eventId, listOwnerId, item, error }: { eventId: string; listOwnerId: string; item?: Item; error?: string }) {
  const { t } = useLocale();
  const action = item ? updateItem : createItem;
  return <>
    <Link href={`/events/${eventId}/members/${listOwnerId}`} className="back-link">← {t("Tornar a la llista")}</Link>
    <form action={action} encType="multipart/form-data" className="card form-card form-stack">
      <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="listOwnerId" value={listOwnerId} />
      {item && <input type="hidden" name="itemId" value={item.id} />}
      <div><p className="eyebrow">{t("Llista de regals")}</p><h2>{item ? t("Editar regal") : t("Afegir un regal")}</h2><p className="muted small">{t("Comparteix una idea; la resta de detalls són opcionals.")}</p></div>
      {error && <p className="alert">{error}</p>}
      <div className="field"><label htmlFor="name">{t("Nom del regal")} *</label><input id="name" name="name" required maxLength={120} defaultValue={item?.name || ""} placeholder={t("Per exemple, un llibre de cuina")} /></div>
      <details className="optional-details">
        <summary>{t("Afegir detalls opcionals")}</summary>
        <div className="form-stack optional-fields">
          <div className="field"><label htmlFor="description">{t("Descripció")}</label><textarea id="description" name="description" maxLength={1000} defaultValue={item?.description || ""} placeholder={t("Mida, color o qualsevol detall útil…")} /></div>
          <div className="field"><label htmlFor="url">{t("Enllaç")}</label><input id="url" name="url" type="url" inputMode="url" defaultValue={item?.url || ""} placeholder="https://…" /><span className="field-help">{t("Només s’accepten enllaços http o https.")}</span></div>
          <div className="field"><label htmlFor="image">{t("Imatge")}</label><input id="image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif" /><span className="field-help">{t("JPG o JPEG, PNG, WEBP o GIF · màxim 5 MB.")}</span>{item?.imagePath && <><span className="field-help">{t("Puja’n una de nova per reemplaçar la imatge actual.")}</span><img src={item.imagePath} alt={t("Imatge actual")} style={{ width: 110, height: 85, objectFit: "cover", borderRadius: 10 }} /></>}</div>
          <div className="field"><label htmlFor="price">{t("Preu")}</label><input id="price" name="price" maxLength={40} defaultValue={item?.price || ""} placeholder="25 €" /></div>
          <div className="field"><label htmlFor="priority">{t("Prioritat")}</label><select id="priority" name="priority" defaultValue={item?.priority || ""}><option value="">{t("Sense prioritat")}</option><option value="LOW">{t("Baixa")}</option><option value="MEDIUM">{t("Mitjana")}</option><option value="HIGH">{t("Alta")}</option></select></div>
          <div className="field"><label htmlFor="category">{t("Categoria")}</label><input id="category" name="category" maxLength={60} defaultValue={item?.category || ""} placeholder={t("Llibres, cuina, jocs…")} /></div>
          <div className="field"><label htmlFor="notes">{t("Notes")}</label><textarea id="notes" name="notes" maxLength={500} defaultValue={item?.notes || ""} placeholder={t("Qualsevol nota addicional…")} /></div>
          <label className="check-row"><input type="checkbox" name="isActive" defaultChecked={item?.isActive ?? true} /> {t("Regal actiu i visible")}</label>
          <label className="check-row"><input type="checkbox" name="isEssential" defaultChecked={item?.isEssential ?? false} /> ★ {t("Regal imprescindible")}</label>
        </div>
      </details>
      <div className="form-actions"><button className="button button-primary" type="submit">{item ? t("Desar canvis") : t("Afegir regal")}</button><Link className="button button-outline" href={`/events/${eventId}/members/${listOwnerId}`}>{t("Cancel·lar")}</Link></div>
    </form>
  </>;
}
