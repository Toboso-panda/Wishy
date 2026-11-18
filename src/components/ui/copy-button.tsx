"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";

export function CopyButton({ value }: { value: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  return <button className="button button-secondary button-small" type="button" onClick={async () => {
    const absolute = new URL(value, window.location.origin).toString();
    try { await navigator.clipboard.writeText(absolute); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt(t("Copia aquest enllaç:"), absolute); }
  }}>{copied ? `${t("Copiat!")} ✓` : t("Copiar enllaç")}</button>;
}
