import Link from "next/link";
import { createEvent } from "@/app/actions";
import { requireUser } from "@/lib/permissions";

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const { error } = await searchParams;
  return <>
    <Link href="/" className="back-link">← Tornar als esdeveniments</Link>
    <form action={createEvent} className="card form-card form-stack">
      <div><p className="eyebrow">Un bon començament</p><h2>Crear esdeveniment</h2><p className="muted small">Després podràs convidar-hi tothom amb un enllaç.</p></div>
      {error && <p className="alert">{error}</p>}
      <div className="field"><label htmlFor="name">Nom de l’esdeveniment *</label><input id="name" name="name" required maxLength={100} placeholder="Reis — Família Martinez" /></div>
      <div className="field"><label htmlFor="description">Descripció <span className="muted">(opcional)</span></label><textarea id="description" name="description" maxLength={500} placeholder="Un petit detall sobre la celebració…" /></div>
      <div className="field"><label htmlFor="date">Data <span className="muted">(opcional)</span></label><input id="date" name="date" type="date" /></div>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}><legend className="field-label" style={{ marginBottom: 8 }}>Com funcionaran les llistes?</legend>
        <label className="radio-card"><input type="radio" name="listMode" value="EVERY_MEMBER_LIST" defaultChecked /><span><strong>Cada membre té la seva llista</strong><span>Ideal per Reis: cadascú afegeix els seus desitjos.</span></span></label>
        <label className="radio-card"><input type="radio" name="listMode" value="SINGLE_LIST" /><span><strong>Una sola llista principal</strong><span>Ideal per a un aniversari o una celebració.</span></span></label>
      </fieldset>
      <div className="form-actions"><button className="button button-primary" type="submit">Crear esdeveniment</button><Link className="button button-outline" href="/">Cancel·lar</Link></div>
    </form>
  </>;
}
