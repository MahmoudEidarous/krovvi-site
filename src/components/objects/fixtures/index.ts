/**
 * The page payloads of every kind's fixtures, written by catch8
 * server/src/lib/objects/page-fixtures.ts (never by hand). Dev mode only.
 */

import food from "./food.json";
import workout from "./workout.json";
import habits from "./habits.json";
import todo from "./todo.json";
import shopping from "./shopping.json";
import spending from "./spending.json";
import split from "./split.json";
import trip from "./trip.json";
import plan from "./plan.json";
import meds from "./meds.json";
import mood from "./mood.json";
import learn from "./learn.json";
import gift from "./gift.json";
import decide from "./decide.json";
import cycle from "./cycle.json";
import meals from "./meals.json";
import watchlist from "./watchlist.json";
import countdown from "./countdown.json";
import kitchen from "./kitchen.json";
import health from "./health.json";

export const FIXTURES: Record<string, Record<string, unknown>> = { food, workout, habits, todo, shopping, spending, split, trip, plan, meds, mood, learn, gift, decide, cycle, meals, watchlist, countdown, kitchen, health };
