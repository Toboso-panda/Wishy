"use client";

import { leaveEvent, removeEventMember } from "@/app/actions";

export function RemoveMemberButton({ eventId, userId, name }: { eventId: string; userId: string; name: string }) {
  return <form action={removeEventMember} onSubmit={(event) => { if (!window.confirm(`Eliminar ${name} de l’esdeveniment? També s’esborraran la seva llista, reserves i contribucions.`)) event.preventDefault(); }}>
    <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="userId" value={userId} />
    <button className="button button-outline button-small remove-member-button" type="submit">Eliminar</button>
  </form>;
}

export function LeaveEventButton({ eventId }: { eventId: string }) {
  return <form action={leaveEvent} onSubmit={(event) => { if (!window.confirm("Abandonar aquest esdeveniment? La teva llista, reserves i contribucions s’eliminaran.")) event.preventDefault(); }}>
    <input type="hidden" name="eventId" value={eventId} />
    <button className="button button-outline button-small" type="submit">Abandonar esdeveniment</button>
  </form>;
}
