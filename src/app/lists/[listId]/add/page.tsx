import Link from "next/link";
import { addGiftsToList } from "@/app/actions";
import { GiftPicker, type PickableGift } from "@/components/lists/gift-picker";
import { prisma } from "@/lib/db";
import { requireOwnList } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n";
import { translate } from "@/lib/i18n/dictionary";

// Add gifts I already have (in my other lists or in events) to this list, without copying them
export default async function AddToList({ params, searchParams }: { params: Promise<{ listId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { listId } = await params;
  const [{ error }, { user, list }] = await Promise.all([searchParams, requireOwnList(listId)]);
  const locale = await getLocale();
  const t = (s: string) => translate(locale, s);
  const items = await prisma.item.findMany({
    where: { ownerId: user.id, isHiddenFromListOwner: false },
    orderBy: { createdAt: "desc" },
    include: { listEntries: { include: { list: { select: { id: true, name: true } } } }, eventEntries: { select: { event: { select: { name: true } } } } },
  });
  const gifts: PickableGift[] = items.map((item) => {
    const otherLists = item.listEntries.filter((entry) => entry.listId !== list.id).map((entry) => entry.list.name);
    return {
      id: item.id, name: item.name, imagePath: item.imagePath, price: item.price,
      sources: otherLists.length ? otherLists : item.eventEntries.map((entry) => entry.event.name),
      alreadyThere: item.listEntries.some((entry) => entry.listId === list.id),
    };
  }).sort((a, b) => Number(a.alreadyThere) - Number(b.alreadyThere));
  return <>
    <Link href={`/lists/${list.id}`} className="back-link">← {list.name}</Link>
    <section className="card form-card form-stack">
      <div><p className="eyebrow">{list.name}</p><h2>{t("Afegir d’altres llistes")}</h2><p className="muted small">{t("Són els teus regals de les altres llistes i dels esdeveniments. S’afegeixen sense duplicar-los: si després n’edites un, canviarà a tot arreu.")}</p></div>
      {error && <p className="alert">{t(error)}</p>}
      {gifts.length ? <GiftPicker gifts={gifts} action={addGiftsToList} hidden={<input type="hidden" name="listId" value={list.id} />}
        submitLabel={t("Afegir a la llista")} alreadyLabel={t("Ja és en aquesta llista")} />
        : <p className="muted">{t("Encara no tens cap altre regal.")}</p>}
    </section>
  </>;
}
