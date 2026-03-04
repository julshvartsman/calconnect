/**
 * Shared types and client-side utility functions for the resource directory.
 *
 * The actual resource data lives in the database and is queried via
 * resource-queries.ts.  This file provides the canonical shapes and
 * real-time status helpers that run on the client (browser clock).
 */

// ── Types ───────────────────────────────────────────────────────────────

export type ResourceHours = {
  days: string;
  open: string;
  close: string;
};

export type DirectoryResource = {
  id: string;
  name: string;
  category: string;
  hours: ResourceHours[] | "24/7" | null;
  location: string;
  description: string;
  url?: string;
  tags: string[];
};

export type ResourceCategory = {
  id: string;
  name: string;
  icon: string;
  resources: DirectoryResource[];
};

export type ResourceStatus = "open" | "closing-soon" | "closed";

// ── Time helpers ────────────────────────────────────────────────────────

/**
 * Parses a time string ("1:00 PM" or "09:00") to minutes since midnight.
 * Returns -1 if the string cannot be parsed.
 */
function timeToMinutes(t: string): number {
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }

  // Fallback: 24-hour format ("09:00")
  const parts = t.split(":").map(Number);
  if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }

  return -1;
}

/**
 * Returns whether the given slot's `days` string covers a given weekday.
 */
function slotMatchesToday(slotDays: string, today: string, dayIndex: number): boolean {
  const lower = slotDays.toLowerCase();
  if (lower.includes(today)) return true;
  if (lower.includes("daily") || lower.includes("everyday")) return true;
  if (lower.includes("weekday") && dayIndex >= 1 && dayIndex <= 5) return true;
  return false;
}

// ── Public status helpers ───────────────────────────────────────────────

/**
 * Computes real-time open / closing-soon / closed status for a resource.
 * Designed to run on the client so the status updates with the user's clock.
 */
export function getResourceStatus(
  resource: DirectoryResource,
): { status: ResourceStatus; label: string } {
  if (resource.hours === "24/7") return { status: "open", label: "Open" };
  if (!resource.hours || resource.hours.length === 0) {
    return { status: "closed", label: "See website" };
  }

  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = dayNames[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const slot of resource.hours) {
    if (!slotMatchesToday(slot.days, today, now.getDay())) continue;

    const openMin = timeToMinutes(slot.open);
    const closeMin = timeToMinutes(slot.close);
    if (openMin < 0 || closeMin < 0) continue;

    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      if (closeMin - currentMinutes <= 60) {
        return { status: "closing-soon", label: "Closing Soon" };
      }
      return { status: "open", label: "Open" };
    }
  }

  return { status: "closed", label: "Closed" };
}

/**
 * Returns a human-readable hours string for today, or the first available
 * slot if today has none.
 */
export function getDisplayHours(resource: DirectoryResource): string {
  if (resource.hours === "24/7") return "24/7";
  if (!resource.hours || resource.hours.length === 0) return "See website";

  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = dayNames[now.getDay()];

  for (const slot of resource.hours) {
    if (slotMatchesToday(slot.days, today, now.getDay())) {
      return `${slot.open} - ${slot.close}`;
    }
  }

  if (resource.hours.length > 0) {
    return `${resource.hours[0].open} - ${resource.hours[0].close}`;
  }
  return "See website";
}
