import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string; mode?: string }> }) {
  const { error, mode } = await searchParams;
  const user = await currentUser();
  if (!user) return <div className="welcome-layout">
    <section className="welcome-copy"><p className="eyebrow">Una manera senzilla d’organitzar els regals</p><h1>Regals pensats<br />amb estima.</h1><p className="lead">Llistes familiars per a Reis, aniversaris i tots aquells moments que val la pena celebrar.</p><div className="welcome-note"><span aria-hidden>✳</span><span>Compartiu idees. Eviteu regals repetits. Gaudiu de la sorpresa.</span></div></section>
    <AuthPanel error={error} initialMode={mode === "login" ? "login" : "register"} />
  </div>;

  const events = await prisma.event.findMany({
    where: { members: { some: { userId: user.id } } }, orderBy: [{ date: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { members: true } } },
  });
  return <>
    <section className="hero hero-grid"><div><p className="eyebrow">El teu espai familiar</p><h1>Hola, {user.name}.</h1><p className="lead">Què esteu celebrant?</p></div>
      <Link className="button button-primary" href="/events/new">＋ Crear esdeveniment</Link>
    </section>
    <div className="section-heading"><h2>Els teus esdeveniments</h2><span className="muted small">{events.length} en total</span></div>
    {events.length ? <div className="event-grid">{events.map((event) => <Link href={`/events/${event.id}`} className="card event-card" key={event.id}>
      <div><p className="eyebrow">{event.listMode === "SINGLE_LIST" ? "Llista principal" : "Llistes familiars"}</p><div className="event-card-title">{event.name}</div>{event.description && <p className="muted small">{event.description}</p>}</div>
      <div className="muted small">{event.date ? new Intl.DateTimeFormat("ca-ES", { dateStyle: "long" }).format(event.date) : ""}　·　{event._count.members} membres <span style={{ float: "right", color: "var(--green)" }}>Obrir →</span></div>
    </Link>)}</div> : <div className="empty-state"><h3>Encara no tens cap esdeveniment</h3><p className="small">Crea’n un i convida la família amb un sol enllaç.</p><Link className="button button-primary" href="/events/new">Crear esdeveniment</Link></div>}
  </>;
}
