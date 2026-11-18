"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "@/app/actions";
import { useLocale } from "@/components/i18n/locale-provider";

// The delete button only unlocks once the event name is typed, so it can't be pressed by accident.
export function DeleteEventForm({ eventId, eventName }: { eventId: string; eventName: string }) {
  const { t } = useLocale();
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === eventName;
  return <form action={deleteEvent} className="form-stack">
    <input type="hidden" name="eventId" value={eventId} />
    <div className="field">
      <label htmlFor="confirmName">{t("Escriu «{name}» per confirmar").replace("{name}", eventName)}</label>
      <input id="confirmName" name="confirmName" autoComplete="off" value={typed} onChange={(event) => setTyped(event.target.value)} />
    </div>
    <button className="button button-danger danger-solid" type="submit" disabled={!matches}><Trash2 size={17} aria-hidden /> {t("Eliminar l’esdeveniment")}</button>
  </form>;
}
