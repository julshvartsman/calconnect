import Link from "next/link";
import { getOpenStatus } from "@/lib/resource-helpers";

type ResourceCardProps = {
  resource: {
    id: string;
    name: string;
    shortDescription: string;
    eligibilityText: string;
    isAppointmentRequired: boolean;
    walkInAllowed: boolean;
    whatToBring: string[];
    requirementsLink: string | null;
    lastVerifiedAt: Date | null;
    hoursJson: unknown;
    summaryJson: unknown;
    category: { name: string };
    location: {
      buildingName: string | null;
      room: string | null;
      address: string;
    } | null;
  };
};

function formatLocation(
  location: ResourceCardProps["resource"]["location"],
): string {
  if (!location) return "Online / no physical location";

  const pieces = [location.buildingName, location.room, location.address].filter(
    Boolean,
  );
  return pieces.join(" · ");
}

function keyPointsFromSummary(summaryJson: unknown): string[] {
  if (!summaryJson || typeof summaryJson !== "object") {
    return [];
  }

  const possible = (summaryJson as { keyPoints?: string[] }).keyPoints;
  return Array.isArray(possible) ? possible.slice(0, 3) : [];
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const status = getOpenStatus(resource.hoursJson);
  const keyPoints = keyPointsFromSummary(resource.summaryJson);
  const isOpen = status.toLowerCase().includes("open now");

  return (
    <article className="card-surface rounded-2xl p-5 transition-transform duration-150 hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">{resource.name}</h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[var(--berkeley-blue)]">
          {resource.category.name}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{resource.shortDescription}</p>
      <p
        className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          isOpen ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
        }`}
      >
        {status}
      </p>

      <dl className="mt-4 grid gap-2 text-sm">
        <div>
          <dt className="font-semibold text-slate-800">Eligibility</dt>
          <dd className="text-slate-600">{resource.eligibilityText}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800">Access</dt>
          <dd className="text-slate-600">
            {resource.walkInAllowed ? "Walk-ins allowed" : "Walk-ins not allowed"}
            {" · "}
            {resource.isAppointmentRequired
              ? "Appointment required"
              : "Appointment not required"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800">Location</dt>
          <dd className="text-slate-600">{formatLocation(resource.location)}</dd>
        </div>
      </dl>

      {keyPoints.length > 0 && (
        <section className="mt-4 rounded-xl bg-slate-50 p-3">
          <h3 className="text-sm font-semibold text-[var(--berkeley-blue)]">
            Things you should know
          </h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/resources/${resource.id}`}
          className="rounded-lg border border-[var(--berkeley-blue)]/25 px-3 py-2 text-sm font-medium text-[var(--berkeley-blue)] hover:bg-blue-50"
        >
          View details
        </Link>
        {resource.requirementsLink && (
          <a
            href={resource.requirementsLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-[var(--berkeley-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--berkeley-blue-700)]"
          >
            Open form
          </a>
        )}
      </div>
    </article>
  );
}
