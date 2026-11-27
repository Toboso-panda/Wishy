"use client";

import { useRef, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/locale-provider";

export type PickableGift = {
  id: string; name: string; imagePath: string | null; price: string | null;
  /** Lists the gift comes from (the same gift can be in several) */
  sources: string[];
  /** Already there: shown, but it can't be added again */
  alreadyThere: boolean;
};

// Multi-choice of gifts, all ticked by default: untick the ones you don't want to add.
// Each gift appears once even if it is in several of the chosen lists (same id).
export function GiftPicker({ gifts, action, hidden, submitLabel, alreadyLabel }: {
  gifts: PickableGift[]; action: (data: FormData) => Promise<void>; hidden: ReactNode; submitLabel: string; alreadyLabel: string;
}) {
  const { t } = useLocale();
  const form = useRef<HTMLFormElement>(null);
  const available = gifts.filter((gift) => !gift.alreadyThere);
  const setAll = (checked: boolean) => form.current?.querySelectorAll<HTMLInputElement>("input[name=itemId]").forEach((box) => { box.checked = checked; });

  return <form action={action} ref={form} className="gift-picker">
    {hidden}
    {available.length > 1 && <div className="picker-bulk">
      <span className="muted small">{available.length} {t("regals")}</span>
      <button type="button" className="text-button" onClick={() => setAll(true)}>{t("Marcar-los tots")}</button>
      <button type="button" className="text-button" onClick={() => setAll(false)}>{t("Desmarcar-los tots")}</button>
    </div>}
    <ul className="picker-list">{gifts.map((gift) => <li key={gift.id}>
      <label className={`picker-row${gift.alreadyThere ? " already" : ""}`}>
        {gift.alreadyThere ? <input type="checkbox" checked disabled readOnly /> : <input type="checkbox" name="itemId" value={gift.id} defaultChecked />}
        {gift.imagePath ? <img className="picker-thumb" src={gift.imagePath} alt="" /> : <span className="picker-thumb placeholder" aria-hidden>🎁</span>}
        <span className="picker-text">
          <strong>{gift.name}</strong>
          <span className="muted small">{gift.alreadyThere ? alreadyLabel : gift.sources.join(" · ")}</span>
        </span>
        {gift.price && <span className="picker-price">{gift.price}</span>}
      </label>
    </li>)}</ul>
    <div className="form-actions">{available.length ? <button className="button button-primary" type="submit">{submitLabel}</button> : <p className="muted small">{t("No hi ha cap regal nou per afegir.")}</p>}</div>
  </form>;
}
