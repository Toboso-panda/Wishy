"use client";

import { useState } from "react";
import { createAccount, loginAccount } from "@/app/actions";
import { useLocale } from "@/components/i18n/locale-provider";

export function AuthPanel({ error, initialMode, inviteToken, inviteName }: { error?: string; initialMode: "login" | "register"; inviteToken?: string; inviteName?: string }) {
  const { t } = useLocale();
  const [mode, setMode] = useState(initialMode);
  const registering = mode === "register";
  return <section className="auth-panel card">
    <div className="auth-heading"><p className="eyebrow">{inviteName ? t("T’han convidat a {name}").replace("{name}", inviteName) : t("Wishy, en família")}</p><h2>{inviteName ? (registering ? t("Crea un compte per unir-t’hi") : t("Entra per unir-t’hi")) : (registering ? t("Comencem?") : t("Benvingut/da de nou"))}</h2><p className="muted">{inviteName ? t("El compte et servirà per tornar a entrar i conservar les teves llistes.") : (registering ? t("Crea el teu compte per guardar les teves llistes.") : t("Entra al teu compte per continuar."))}</p></div>
    <div className="auth-tabs" role="tablist" aria-label={t("Accés al compte")}>
      <button className={registering ? "active" : ""} type="button" role="tab" aria-selected={registering} onClick={() => setMode("register")}>{t("Crear compte")}</button>
      <button className={!registering ? "active" : ""} type="button" role="tab" aria-selected={!registering} onClick={() => setMode("login")}>{t("Iniciar sessió")}</button>
    </div>
    <form action={registering ? createAccount : loginAccount} className="form-stack auth-form">
      {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
      {error && <p className="alert" role="alert">{t(error)}</p>}
      {registering && <div className="field"><label htmlFor="name">{t("Com et dius?")}</label><input id="name" name="name" autoComplete="name" required maxLength={60} placeholder={t("El teu nom")} /></div>}
      <div className="field"><label htmlFor="email">{t("Correu electrònic")}</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder={t("tu@exemple.cat")} /></div>
      <div className="field"><label htmlFor="password">{t("Contrasenya")}</label><input id="password" name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} required minLength={registering ? 8 : undefined} maxLength={128} placeholder={registering ? t("Com a mínim 8 caràcters") : t("La teva contrasenya")} /></div>
      {registering && <div className="field"><label htmlFor="confirmPassword">{t("Repeteix la contrasenya")}</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} placeholder={t("Torna-la a escriure")} /></div>}
      <button className="button button-primary auth-submit" type="submit">{registering ? t("Crear compte") : t("Iniciar sessió")}<span aria-hidden>→</span></button>
    </form>
    <p className="auth-footnote">{t("No cal verificar el correu. Fem servir el teu email només per iniciar sessió.")}</p>
  </section>;
}
