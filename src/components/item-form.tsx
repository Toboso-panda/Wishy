import Link from "next/link";
import type { Item } from "@prisma/client";
import { createItem, updateItem } from "@/app/actions";

export function ItemForm({ eventId, listOwnerId, item, error }: { eventId: string; listOwnerId: string; item?: Item; error?: string }) {
  const action = item ? updateItem : createItem;
  return <>
    <Link href={`/events/${eventId}/members/${listOwnerId}`} className="back-link">← Tornar a la llista</Link>
    <form action={action} encType="multipart/form-data" className="card form-card form-stack">
      <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="listOwnerId" value={listOwnerId} />
      {item && <input type="hidden" name="itemId" value={item.id} />}
      <div><p className="eyebrow">Llista de regals</p><h2>{item ? "Editar regal" : "Afegir un regal"}</h2><p className="muted small">Comparteix una idea; la resta de detalls són opcionals.</p></div>
      {error && <p className="alert">{error}</p>}
      <div className="field"><label htmlFor="name">Nom del regal *</label><input id="name" name="name" required maxLength={120} defaultValue={item?.name || ""} placeholder="Per exemple, un llibre de cuina" /></div>
      <details className="optional-details">
        <summary>Afegir detalls opcionals</summary>
        <div className="form-stack optional-fields">
          <div className="field"><label htmlFor="description">Descripció</label><textarea id="description" name="description" maxLength={1000} defaultValue={item?.description || ""} placeholder="Mida, color o qualsevol detall útil…" /></div>
          <div className="field"><label htmlFor="url">Enllaç</label><input id="url" name="url" type="url" inputMode="url" defaultValue={item?.url || ""} placeholder="https://…" /><span className="field-help">Només s’accepten enllaços http o https.</span></div>
          <div className="field"><label htmlFor="image">Imatge</label><input id="image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif" /><span className="field-help">JPG o JPEG, PNG, WEBP o GIF · màxim 5 MB.</span>{item?.imagePath && <><span className="field-help">Puja’n una de nova per reemplaçar la imatge actual.</span><img src={item.imagePath} alt="Imatge actual" style={{ width: 110, height: 85, objectFit: "cover", borderRadius: 10 }} /></>}</div>
          <div className="field"><label htmlFor="price">Preu</label><input id="price" name="price" maxLength={40} defaultValue={item?.price || ""} placeholder="25 €" /></div>
          <div className="field"><label htmlFor="priority">Prioritat</label><select id="priority" name="priority" defaultValue={item?.priority || ""}><option value="">Sense prioritat</option><option value="LOW">Baixa</option><option value="MEDIUM">Mitjana</option><option value="HIGH">Alta</option></select></div>
          <div className="field"><label htmlFor="category">Categoria</label><input id="category" name="category" maxLength={60} defaultValue={item?.category || ""} placeholder="Llibres, cuina, jocs…" /></div>
          <div className="field"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" maxLength={500} defaultValue={item?.notes || ""} placeholder="Qualsevol nota addicional…" /></div>
          <label className="check-row"><input type="checkbox" name="isActive" defaultChecked={item?.isActive ?? true} /> Regal actiu i visible</label>
          <label className="check-row"><input type="checkbox" name="isEssential" defaultChecked={item?.isEssential ?? false} /> ★ Regal imprescindible</label>
        </div>
      </details>
      <div className="form-actions"><button className="button button-primary" type="submit">{item ? "Desar canvis" : "Afegir regal"}</button><Link className="button button-outline" href={`/events/${eventId}/members/${listOwnerId}`}>Cancel·lar</Link></div>
    </form>
  </>;
}
