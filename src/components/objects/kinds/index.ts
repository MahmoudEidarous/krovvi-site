/**
 * Every kind's view on the page, by name. Each lane edits only its own
 * kinds/<kind>.tsx; this list never changes when a kind is built.
 */

import { Page as food } from "./food";
import { Page as workout } from "./workout";
import { Page as habits } from "./habits";
import { Page as todo } from "./todo";
import { Page as shopping } from "./shopping";
import { Page as spending } from "./spending";
import { Page as split } from "./split";
import { Page as trip } from "./trip";
import { Page as plan } from "./plan";
import { Page as meds } from "./meds";
import { Page as mood } from "./mood";
import { Page as learn } from "./learn";
import { Page as gift } from "./gift";
import { Page as decide } from "./decide";
import { Page as cycle } from "./cycle";
import { Page as meals } from "./meals";
import { Page as watchlist } from "./watchlist";
import { Page as countdown } from "./countdown";
import { Page as kitchen } from "./kitchen";
import type { KindPage } from "../types";

export const KIND_PAGES: Record<string, KindPage | null> = { food, workout, habits, todo, shopping, spending, split, trip, plan, meds, mood, learn, gift, decide, cycle, meals, watchlist, countdown, kitchen };
