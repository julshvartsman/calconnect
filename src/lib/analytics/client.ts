"use client";

import { SEARCH_ANALYTICS_PATH, SearchEventPayload, normalizeQuery } from "@/lib/analytics/search-events";

const ANON_ID_KEY = "calconnect.analytics.anonymousId";
const SESSION_ID_KEY = "calconnect.analytics.sessionId";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateStorageValue(key: string): string {
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = createId();
  localStorage.setItem(key, created);
  return created;
}

export function getAnalyticsIds() {
  return {
    anonymousId: getOrCreateStorageValue(ANON_ID_KEY),
    sessionId: getOrCreateStorageValue(SESSION_ID_KEY),
  };
}

export function trackSearchEvent(payload: Omit<SearchEventPayload, "anonymousId" | "sessionId" | "query"> & { query: string }) {
  if (typeof window === "undefined") return;

  const query = normalizeQuery(payload.query);
  if (!query) return;

  const ids = getAnalyticsIds();
  const body: SearchEventPayload = {
    ...payload,
    ...ids,
    query,
  };

  fetch(SEARCH_ANALYTICS_PATH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Analytics should never block user actions.
  });
}
