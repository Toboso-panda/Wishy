import Link from "next/link";
import { claimManagedProfile } from "@/app/actions";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { translate } from "@/lib/dictionary";

export default async function ClaimProfilePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const locale = await getLocale();
  const t = (s: string) => translate(locale, s);
  const [{ error }, profile] = await Promise.all([
    searchParams,
    prisma.user.findUnique({ where: { profileClaimToken: token }, select: { id: true, name: true, isManagedProfile: true } }),
  ]);
  if (!profile?.isManagedProfile) return <div className="card form-card"><p className="eyebrow">{t("Perfil familiar")}</p><h2>{t("L’enllaç ja no és vàlid")}</h2><p className="muted">{t("Demana a qui gestiona el perfil que et generi un enllaç nou.")}</p><Link className="button button-outline" href="/">{t("Tornar a l’inici")}</Link></div>;
  return <form action={claimManagedProfile} className="card form-card form-stack">
    <input type="hidden" name="token" value={token} />
    <div><p className="eyebrow">{t("El teu perfil familiar")}</p><h2>{t("Activa el perfil de")} {profile.name}</h2><p className="muted small">{t("Afegeix correu i contrasenya per entrar-hi directament i conservar la seva llista.")}</p></div>
    {error && <p className="alert" role="alert">{error}</p>}
    <div className="field"><label htmlFor="email">{t("Correu electrònic")}</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
    <div className="field"><label htmlFor="password">{t("Contrasenya")}</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></div>
    <div className="field"><label htmlFor="confirmPassword">{t("Repeteix la contrasenya")}</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></div>
    <button className="button button-primary" type="submit">{t("Activar el meu compte")}</button>
  </form>;
}
