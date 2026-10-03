/**
 * A shared chat's page (krovvi.com/s/<token>): what the share edge function
 * sends (catch8 supabase/functions/share), read in the browser only, so a
 * link preview never stands for a person opening it.
 */

import type { ChatSnapshot } from "@/components/share/chat-view";

export const SHARE_API = process.env.NEXT_PUBLIC_SHARE_API ?? "https://eybepawprfhrvcnpggwk.supabase.co/functions/v1/share";

export interface ShareRead {
  ok: true;
  id: string;
  kind: "chat" | "note";
  title: string;
  lang: "en" | "ar" | null;
  dir: "ltr" | "rtl";
  name: string | null;
  made_at: number;
  version: number;
  snapshot: ChatSnapshot;
  media: Array<{ id: number; url: string; mime: string }>;
}

export type ShareState = { ok: true; share: ShareRead } | { ok: false; off: boolean };

export async function readShare(token: string): Promise<ShareState> {
  try {
    const res = await fetch(`${SHARE_API}?t=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (res.status === 410) return { ok: false, off: true };
    const body = (await res.json()) as ShareRead | { ok: false; off?: boolean };
    return body.ok ? { ok: true, share: body as ShareRead } : { ok: false, off: !!(body as { off?: boolean }).off };
  } catch {
    return { ok: false, off: false };
  }
}

const VISITOR = "krovvi.visitor";

/** This browser's own name for itself, so one person opening twice is one open. */
function visitor(): string {
  try {
    const known = window.localStorage.getItem(VISITOR);
    if (known) return known;
    const made = `v${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(VISITOR, made);
    return made;
  } catch {
    return "anon";
  }
}

export function sayOpened(token: string): void {
  void fetch(SHARE_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token, action: "opened", visitor: visitor() }) }).catch(() => {});
}

export async function report(token: string, why: string): Promise<boolean> {
  try {
    const res = await fetch(SHARE_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token, action: "report", why }) });
    return res.ok;
  } catch {
    return false;
  }
}
