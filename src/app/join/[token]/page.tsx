import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";

export default async function JoinPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string; mode?: string }> }) {
  const { token } = await params;
  const [{ error, mode }, user, event] = await Promise.all([
    searchParams, currentUser(), prisma.event.findUnique({ where: { inviteToken: token }, select: { id: true, name: true, description: true } }),
  ]);
  if (!event) return <div className="card form-card"><p className="eyebrow">Invitació</p><h2>L’enllaç no és vàlid</h2><p className="muted">Comprova que l’adreça sigui correcta o demana un enllaç nou a qui t’ha convidat.</p><Link className="button button-outline" href="/">Tornar a l’inici</Link></div>;
  if (user) {
    await prisma.eventMember.upsert({ where: { eventId_userId: { eventId: event.id, userId: user.id } }, create: { eventId: event.id, userId: user.id }, update: {} });
    redirect(`/events/${event.id}`);
  }
  return <div className="join-layout">
    <section className="join-copy"><p className="eyebrow">Una invitació familiar</p><h1>{event.name}</h1><p className="lead">{event.description || "Uneix-te per veure les idees de regal i participar en la celebració."}</p><Link href="/" className="back-link">← Tornar a l’inici</Link></section>
    <AuthPanel error={error} initialMode={mode === "login" ? "login" : "register"} inviteToken={token} inviteName={event.name} />
  </div>;
}
