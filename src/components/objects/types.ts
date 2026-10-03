import type { ComponentType } from "react";

import type { Lang, PagePayload } from "@/lib/objects";

/**
 * What a kind's view on the page is handed: the payload the objects edge
 * function sent (its `view` is the kind's view for this reader, the same
 * shape the app draws), the page's language, and the one way to change it.
 */
export interface PageProps<V = unknown> {
  page: PagePayload<V>;
  view: V;
  /** The page's own words: the reader's browser language. */
  lang: Lang;
  /** Run an op as this reader. Asks who they are first when they have not said. True when it went through. */
  act: (op: string, args?: Record<string, unknown>) => Promise<boolean>;
  /** Whether this reader may run an op here (the page's ops). */
  can: (op: string) => boolean;
  /** A change of theirs is on its way. */
  busy: boolean;
  /** The moment the page was drawn at, ticking once a minute. */
  now: number;
}

export type KindPage = ComponentType<PageProps<any>>;
