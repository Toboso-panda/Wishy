"use client";

import { leaveEvent, removeEventMember } from "@/app/actions";
import { useLocale } from "@/components/locale-provider";

export function RemoveMemberButton({ eventId, userId, name }: { eventId: string; userId: string; name: string }) {
  const { t } = useLocale();
  return <form action={removeEventMember} onSubmit={(event) => { if (!window.confirm(`${t("Eliminar")} ${name} ${t("de l’esdeveniment? També s’esborraran la seva llista, reserves i contribucions.")}`)) event.preventDefault(); }}>
    <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={userId} />
    <button className="button button-outline button-small remove-member-button" type="submit">{t("Eliminar")}</button>
  </form>;
}

export function LeaveEventButton({ eventId }: { eventId: string }) {
  const { t } = useLocale();
  return <form action={leaveEvent} onSubmit={(event) => { if (!window.confirm(t("Abandonar aquest esdeveniment? La teva llista, reserves i contribucions s’eliminaran."))) event.preventDefault(); }}>
    <input type="hidden" name="eventId" value={eventId} />
    <button className="button button-outline button-small" type="submit">{t("Abandonar esdeveniment")}</button>
  </form>;
}
