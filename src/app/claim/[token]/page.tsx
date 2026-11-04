import Link from "next/link";
import { claimManagedProfile } from "@/app/actions";
import { prisma } from "@/lib/db";

export default async function ClaimProfilePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const [{ error }, profile] = await Promise.all([
    searchParams,
    prisma.user.findUnique({ where: { profileClaimToken: token }, select: { id: true, name: true, isManagedProfile: true } }),
  ]);
  if (!profile?.isManagedProfile) return <div className="card form-card"><p className="eyebrow">Perfil familiar</p><h2>L’enllaç ja no és vàlid</h2><p className="muted">Demana a qui gestiona el perfil que et generi un enllaç nou.</p><Link className="button button-outline" href="/">Tornar a l’inici</Link></div>;
  return <form action={claimManagedProfile} className="card form-card form-stack">
    <input type="hidden" name="token" value={token} />
    <div><p className="eyebrow">El teu perfil familiar</p><h2>Activa el perfil de {profile.name}</h2><p className="muted small">Afegeix correu i contrasenya per entrar-hi directament i conservar la seva llista.</p></div>
    {error && <p className="alert" role="alert">{error}</p>}
    <div className="field"><label htmlFor="email">Correu electrònic</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
    <div className="field"><label htmlFor="password">Contrasenya</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></div>
    <div className="field"><label htmlFor="confirmPassword">Repeteix la contrasenya</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></div>
    <button className="button button-primary" type="submit">Activar el meu compte</button>
  </form>;
}
