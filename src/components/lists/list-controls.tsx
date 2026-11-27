"use client";

import { deleteList } from "@/app/actions";
import { useLocale } from "@/components/i18n/locale-provider";

export function DeleteListButton({ listId, name }: { listId: string; name: string }) {
  const { t } = useLocale();
  return <form action={deleteList} onSubmit={(event) => { if (!window.confirm(t("Esborrar la llista «{name}»? Els regals que no siguin a cap altra llista ni esdeveniment s’esborraran.").replace("{name}", name))) event.preventDefault(); }}>
    <input type="hidden" name="listId" value={listId} />
    <button className="button button-outline button-small remove-member-button" type="submit">{t("Esborrar la llista")}</button>
  </form>;
}
