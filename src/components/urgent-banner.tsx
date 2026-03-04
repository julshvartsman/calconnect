/**
 * Scrolling real-time alert banner shown at the top of the browse page.
 *
 * Receives resource data from the server component and computes
 * open / closing-soon status on the client clock every 60 seconds.
 */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  getResourceStatus,
  getDisplayHours,
  type DirectoryResource,
} from "@/lib/resource-directory";

type Alert = { text: string; icon: string };

type UrgentBannerProps = {
  resources: DirectoryResource[];
};

function buildAlerts(resources: DirectoryResource[]): Alert[] {
  const alerts: Alert[] = [];

  const closingSoon = resources.filter((r) => getResourceStatus(r).status === "closing-soon");
  for (const r of closingSoon.slice(0, 3)) {
    alerts.push({ text: `${r.name} closes soon`, icon: "⏰" });
  }

  const openFood = resources.filter(
    (r) => r.tags.includes("free-food") && getResourceStatus(r).status === "open",
  );
  for (const r of openFood.slice(0, 3)) {
    alerts.push({ text: `${r.name} open now`, icon: "🍽" });
  }

  const emergencyOpen = resources.filter(
    (r) => r.tags.includes("emergency") && getResourceStatus(r).status === "open",
  );
  for (const r of emergencyOpen.slice(0, 3)) {
    alerts.push({ text: `${r.name} available now`, icon: "🆘" });
  }

  const openNow = resources.filter(
    (r) =>
      getResourceStatus(r).status === "open" &&
      !r.tags.includes("free-food") &&
      !r.tags.includes("emergency"),
  );
  for (const r of openNow.slice(0, 6)) {
    alerts.push({ text: `${r.name} — ${getDisplayHours(r)}`, icon: "✅" });
  }

  if (alerts.length === 0) {
    alerts.push({ text: "CalConnect — your Berkeley resource hub", icon: "🐻" });
  }

  return alerts;
}

export function UrgentBanner({ resources }: UrgentBannerProps) {
  const computeAlerts = useCallback(() => buildAlerts(resources), [resources]);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setAlerts(computeAlerts());
    const interval = setInterval(() => setAlerts(computeAlerts()), 60_000);
    return () => clearInterval(interval);
  }, [computeAlerts]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || alerts.length === 0) return;

    let raf: number;
    let pos = 0;
    const speed = 0.5;

    function step() {
      if (!paused && el) {
        pos += speed;
        const halfWidth = el.scrollWidth / 2;
        if (pos >= halfWidth) pos -= halfWidth;
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [alerts, paused]);

  if (alerts.length === 0) return null;

  const separator = (
    <span className="mx-4 text-[var(--berkeley-blue)] opacity-30">•</span>
  );

  const itemList = alerts.map((a, i) => (
    <span key={i} className="flex shrink-0 items-center gap-1.5">
      {i > 0 && separator}
      <span>{a.icon}</span>
      <span>{a.text}</span>
    </span>
  ));

  return (
    <div className="bg-[var(--california-gold)] text-[var(--berkeley-blue)]">
      <div
        ref={scrollRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="flex items-center overflow-hidden whitespace-nowrap px-4 py-2 text-sm font-semibold"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex shrink-0 items-center">
          {itemList}
          {separator}
        </div>
        <div className="flex shrink-0 items-center">
          {itemList}
          {separator}
        </div>
      </div>
    </div>
  );
}
