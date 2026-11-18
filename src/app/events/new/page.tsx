import Link from "next/link";
import { createEvent } from "@/app/actions";
import { requireUser } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n";
import { translate } from "@/lib/i18n/dictionary";

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const locale = await getLocale();
  const t = (s: string) => translate(locale, s);
  const { error } = await searchParams;
  return <>
    <Link href="/" className="back-link">← {t("Tornar als esdeveniments")}</Link>
    <form action={createEvent} className="card form-card form-stack">
      <div><p className="eyebrow">{t("Un bon començament")}</p><h2>{t("Crear esdeveniment")}</h2><p className="muted small">{t("Després podràs convidar-hi tothom amb un enllaç.")}</p></div>
      {error && <p className="alert">{t(error)}</p>}
      <div className="field"><label htmlFor="name">{t("Nom de l’esdeveniment")} *</label><input id="name" name="name" required maxLength={100} placeholder={t("Reis — Família Martínez")} /></div>
      <div className="field"><label htmlFor="description">{t("Descripció")} <span className="muted">({t("opcional")})</span></label><textarea id="description" name="description" maxLength={500} placeholder={t("Un petit detall sobre la celebració…")} /></div>
      <div className="field"><label htmlFor="date">{t("Data")} <span className="muted">({t("opcional")})</span></label><input id="date" name="date" type="date" /></div>
      <fieldset className="choice-group"><legend className="field-label">{t("Com funcionaran les llistes?")}</legend>
        <label className="radio-card"><input type="radio" name="listMode" value="EVERY_MEMBER_LIST" defaultChecked /><span><strong>{t("Cada membre té la seva llista")}</strong><span>{t("Ideal per a Reis: cadascú afegeix els seus desitjos.")}</span></span></label>
        <label className="radio-card"><input type="radio" name="listMode" value="SINGLE_LIST" /><span><strong>{t("Una sola llista principal")}</strong><span>{t("Ideal per a un aniversari o una celebració.")}</span></span></label>
      </fieldset>
      <div className="form-actions"><button className="button button-primary" type="submit">{t("Crear esdeveniment")}</button><Link className="button button-outline" href="/">{t("Cancel·lar")}</Link></div>
    </form>
  </>;
}
