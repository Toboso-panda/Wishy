"use client";

import { useState } from "react";
import { createAccount, loginAccount } from "@/app/actions";

export function AuthPanel({ error, initialMode, inviteToken, inviteName }: { error?: string; initialMode: "login" | "register"; inviteToken?: string; inviteName?: string }) {
  const [mode, setMode] = useState(initialMode);
  const registering = mode === "register";
  return <section className="auth-panel card">
    <div className="auth-heading"><p className="eyebrow">{inviteName ? `T’han convidat a ${inviteName}` : "Wishy, en família"}</p><h2>{inviteName ? (registering ? "Crea un compte per unir-t’hi" : "Entra per unir-t’hi") : (registering ? "Comencem?" : "Benvingut/da de nou")}</h2><p className="muted">{inviteName ? "El compte et servirà per tornar a entrar i conservar les teves llistes." : (registering ? "Crea el teu compte per guardar les teves llistes." : "Entra al teu compte per continuar.")}</p></div>
    <div className="auth-tabs" role="tablist" aria-label="Accés al compte">
      <button className={registering ? "active" : ""} type="button" role="tab" aria-selected={registering} onClick={() => setMode("register")}>Crear compte</button>
      <button className={!registering ? "active" : ""} type="button" role="tab" aria-selected={!registering} onClick={() => setMode("login")}>Iniciar sessió</button>
    </div>
    <form action={registering ? createAccount : loginAccount} className="form-stack auth-form">
      {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
      {error && <p className="alert" role="alert">{error}</p>}
      {registering && <div className="field"><label htmlFor="name">Com et dius?</label><input id="name" name="name" autoComplete="name" required maxLength={60} placeholder="El teu nom" /></div>}
      <div className="field"><label htmlFor="email">Correu electrònic</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="tu@exemple.cat" /></div>
      <div className="field"><label htmlFor="password">Contrasenya</label><input id="password" name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} required minLength={registering ? 8 : undefined} maxLength={128} placeholder={registering ? "Com a mínim 8 caràcters" : "La teva contrasenya"} /></div>
      {registering && <div className="field"><label htmlFor="confirmPassword">Repeteix la contrasenya</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} placeholder="Torna-la a escriure" /></div>}
      <button className="button button-primary auth-submit" type="submit">{registering ? "Crear compte" : "Iniciar sessió"}<span aria-hidden>→</span></button>
    </form>
    <p className="auth-footnote">No cal verificar el correu. Fem servir el teu email només per iniciar sessió.</p>
  </section>;
}
