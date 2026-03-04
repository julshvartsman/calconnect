import { format } from "date-fns";

// ── Hours-related types covering all three storage conventions ───────────

type DayHours = { open?: string; close?: string; closed?: boolean };
type DayKeyedHours = Record<string, DayHours>;
type SlotHours = { days: string; open: string; close: string };
type StructuredHours = { type: "24/7" } | { type: "scheduled"; slots: SlotHours[] };

// ── Time helpers ────────────────────────────────────────────────────────

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function getTodayKey(date = new Date()): string {
  return format(date, "EEEE").toLowerCase();
}

/**
 * Converts a time string to minutes since midnight.
 * Handles both 24-hour ("09:00") and 12-hour ("1:00 PM") formats.
 */
function toMinutes(time: string): number {
  const ampmMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1]);
    const m = parseInt(ampmMatch[2]);
    const period = ampmMatch[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }

  const parts = time.split(":").map(Number);
  if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }

  return -1;
}

/**
 * Checks whether a slot's `days` string covers a given day name.
 */
function slotMatchesToday(slotDays: string, today: string, dayIndex: number): boolean {
  const lower = slotDays.toLowerCase();
  if (lower.includes(today)) return true;
  if (lower.includes("daily") || lower.includes("everyday")) return true;
  if (lower.includes("weekday") && dayIndex >= 1 && dayIndex <= 5) return true;
  return false;
}

/**
 * Returns a human-readable open/closed status string.
 *
 * Handles three hoursJson conventions:
 *   1. Structured:  { type: "24/7" } | { type: "scheduled", slots: [...] }
 *   2. Day-keyed:   { monday: { open, close, closed? }, ... }
 *   3. Null / missing → "Hours unavailable"
 */
export function getOpenStatus(hoursJson?: unknown): string {
  if (!hoursJson || typeof hoursJson !== "object") {
    return "Hours unavailable";
  }

  const obj = hoursJson as Record<string, unknown>;

  // ── Convention 1: Structured wrapper ──────────────────────────────────
  if (obj.type === "24/7") return "Open 24/7";

  if (obj.type === "scheduled" && Array.isArray(obj.slots)) {
    return statusFromSlots(obj.slots as SlotHours[]);
  }

  // ── Convention 2: Day-keyed object ────────────────────────────────────
  const todayKey = getTodayKey();
  const todayEntry = obj[todayKey];

  if (todayEntry && typeof todayEntry === "object") {
    const day = todayEntry as DayHours;
    if (day.closed) return "Closed today";
    if (!day.open || !day.close) return "Closed today";

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMin = toMinutes(day.open);
    const closeMin = toMinutes(day.close);

    if (openMin < 0 || closeMin < 0) return "Hours unavailable";

    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      return `Open now · Closes ${day.close}`;
    }
    return `Closed now · Opens ${day.open}`;
  }

  // If the object has day-name keys but today isn't present, check if it
  // has *any* day keys (indicating a day-keyed format where today is missing).
  const hasDayKeys = DAY_NAMES.some((d) => d in obj);
  if (hasDayKeys) return "Closed today";

  return "Hours unavailable";
}

// ── Slot-based status check (shared by structured format) ────────────────

function statusFromSlots(slots: SlotHours[]): string {
  const now = new Date();
  const today = DAY_NAMES[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const slot of slots) {
    if (!slotMatchesToday(slot.days, today, now.getDay())) continue;

    const openMin = toMinutes(slot.open);
    const closeMin = toMinutes(slot.close);
    if (openMin < 0 || closeMin < 0) continue;

    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      if (closeMin - currentMinutes <= 60) {
        return `Closing soon · ${slot.close}`;
      }
      return `Open now · Closes ${slot.close}`;
    }
  }

  return "Closed now";
}

export function tokenizeProfile(profileJson: unknown): string[] {
  if (!profileJson || typeof profileJson !== "object") {
    return [];
  }

  const profile = profileJson as {
    studentType?: string;
    year?: string;
    identities?: string[];
    financialSituation?: string;
    topics?: string[];
  };

  return [
    profile.studentType,
    profile.year,
    profile.financialSituation,
    ...(profile.identities ?? []),
    ...(profile.topics ?? []),
  ]
    .filter(Boolean)
    .map((token) => token!.toLowerCase());
}
