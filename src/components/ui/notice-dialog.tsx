"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";

// Pop-up that tells the user something happened (e.g. an event was deleted).
// Closing it also removes the flag from the URL, so it doesn't come back on refresh.
export function NoticeDialog({ title, message }: { title: string; message?: string }) {
  const { t } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  return (
    <dialog ref={dialog} className="notice-dialog" aria-labelledby="notice-title" onClose={() => router.replace(pathname, { scroll: false })}>
      <CheckCircle2 className="notice-icon" size={40} aria-hidden />
      <h2 id="notice-title">{title}</h2>
      {message && <p className="muted">{message}</p>}
      <form method="dialog">
        <button className="button button-primary" type="submit" autoFocus>{t("Acceptar")}</button>
      </form>
    </dialog>
  );
}
