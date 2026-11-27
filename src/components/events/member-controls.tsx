"use client";

import { clearMemberList, leaveEvent, removeEventMember } from "@/app/actions";
import { useLocale } from "@/components/i18n/locale-provider";

export function RemoveMemberButton({ eventId, userId, name, isProfile = false, returnTo }: { eventId: string; userId: string; name: string; isProfile?: boolean; returnTo?: "event" }) {
  const { t } = useLocale();
  const question = isProfile
    ? t("Eliminar el perfil de {name}? També s’esborraran la seva llista i els seus regals.")
    : t("Eliminar {name} de l’esdeveniment? Els seus regals sortiran d’aquest esdeveniment i se n’esborraran les reserves i contribucions. Les seves llistes personals no es toquen.");
  return <form action={removeEventMember} onSubmit={(event) => { if (!window.confirm(question.replace("{name}", name))) event.preventDefault(); }}>
    <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={userId} />
    {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
    <button className="button button-outline button-small remove-member-button" type="submit">{isProfile ? t("Eliminar perfil") : t("Eliminar de l’esdeveniment")}</button>
  </form>;
}

export function ClearListButton({ eventId, userId, name }: { eventId: string; userId: string; name: string }) {
  const { t } = useLocale();
  return <form action={clearMemberList} onSubmit={(event) => { if (!window.confirm(t("Buidar la llista de {name}? Tots els seus regals sortiran d’aquest esdeveniment, també els amagats per la sorpresa. Les seves llistes personals no es toquen.").replace("{name}", name))) event.preventDefault(); }}>
    <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={userId} />
    <button className="button button-outline button-small remove-member-button" type="submit">{t("Buidar la llista")}</button>
  </form>;
}

export function LeaveEventButton({ eventId }: { eventId: string }) {
  const { t } = useLocale();
  return <form action={leaveEvent} onSubmit={(event) => { if (!window.confirm(t("Abandonar aquest esdeveniment? Els teus regals en sortiran i s’eliminaran les teves reserves i contribucions. Les teves llistes personals no es toquen."))) event.preventDefault(); }}>
    <input type="hidden" name="eventId" value={eventId} />
    <button className="button button-outline button-small" type="submit">{t("Abandonar esdeveniment")}</button>
  </form>;
}
