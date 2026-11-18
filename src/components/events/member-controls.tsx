"use client";

import { clearMemberList, leaveEvent, removeEventMember } from "@/app/actions";
import { useLocale } from "@/components/i18n/locale-provider";

export function RemoveMemberButton({ eventId, userId, name, isProfile = false, returnTo }: { eventId: string; userId: string; name: string; isProfile?: boolean; returnTo?: "event" }) {
  const { t } = useLocale();
  const question = isProfile
    ? t("Eliminar el perfil de {name}? També s’esborraran la seva llista i els seus regals.")
    : t("Eliminar {name} de l’esdeveniment? També s’esborraran la seva llista, reserves i contribucions.");
  return <form action={removeEventMember} onSubmit={(event) => { if (!window.confirm(question.replace("{name}", name))) event.preventDefault(); }}>
    <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={userId} />
    {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
    <button className="button button-outline button-small remove-member-button" type="submit">{isProfile ? t("Eliminar perfil") : t("Eliminar de l’esdeveniment")}</button>
  </form>;
}

export function ClearListButton({ eventId, userId, name }: { eventId: string; userId: string; name: string }) {
  const { t } = useLocale();
  return <form action={clearMemberList} onSubmit={(event) => { if (!window.confirm(t("Buidar la llista de {name}? S’esborraran tots els seus regals, també els amagats per la sorpresa. Aquesta acció no es pot desfer.").replace("{name}", name))) event.preventDefault(); }}>
    <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={userId} />
    <button className="button button-outline button-small remove-member-button" type="submit">{t("Buidar la llista")}</button>
  </form>;
}

export function LeaveEventButton({ eventId }: { eventId: string }) {
  const { t } = useLocale();
  return <form action={leaveEvent} onSubmit={(event) => { if (!window.confirm(t("Abandonar aquest esdeveniment? La teva llista, reserves i contribucions s’eliminaran."))) event.preventDefault(); }}>
    <input type="hidden" name="eventId" value={eventId} />
    <button className="button button-outline button-small" type="submit">{t("Abandonar esdeveniment")}</button>
  </form>;
}
