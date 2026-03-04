import Link from "next/link";
import { getOpenStatus } from "@/lib/resource-helpers";

type SearchResultPanelProps = {
  resource: {
    id: string;
    name: string;
    shortDescription: string;
    eligibilityText: string;
    whatToBring: string[];
    requirementsLink: string | null;
    category: { name: string };
    location: { buildingName: string | null; room: string | null; address: string } | null;
    summaryJson: unknown;
    faqJson: unknown;
    hoursJson: unknown;
  };
};

type Answer = { key: string; prompt: string; answer: string };

function getKeyPoints(summaryJson: unknown): string[] {
  if (!summaryJson || typeof summaryJson !== "object") return [];
  const points = (summaryJson as { keyPoints?: string[] }).keyPoints;
  return Array.isArray(points) ? points.slice(0, 4) : [];
}

function getAnswers(faqJson: unknown): Answer[] {
  if (!Array.isArray(faqJson)) return [];
  return faqJson.filter(
    (item): item is Answer =>
      typeof item === "object" &&
      item !== null &&
      "key" in item &&
      "prompt" in item &&
      "answer" in item,
  );
}

function locationSummary(location: SearchResultPanelProps["resource"]["location"]) {
  if (!location) return "Online / no physical location";
  return [location.buildingName, location.room, location.address].filter(Boolean).join(" · ");
}

export function SearchResultPanel({ resource }: SearchResultPanelProps) {
  const status = getOpenStatus(resource.hoursJson);
  const keyPoints = getKeyPoints(resource.summaryJson);
  const answers = getAnswers(resource.faqJson).slice(0, 3);

  return (
    <article className="card-surface rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">{resource.name}</h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[var(--berkeley-blue)]">
          {resource.category.name}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-700">{resource.shortDescription}</p>
      <p className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
        {status}
      </p>

      <dl className="mt-4 grid gap-2 text-sm">
        <div>
          <dt className="font-semibold text-slate-800">Eligibility</dt>
          <dd className="text-slate-600">{resource.eligibilityText}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800">Location</dt>
          <dd className="text-slate-600">{locationSummary(resource.location)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800">What to bring</dt>
          <dd className="text-slate-600">
            {resource.whatToBring.length ? resource.whatToBring.join(", ") : "Not specified"}
          </dd>
        </div>
      </dl>

      {keyPoints.length > 0 && (
        <section className="mt-4 rounded-xl bg-slate-50 p-3">
          <h3 className="text-sm font-semibold text-[var(--berkeley-blue)]">Quick summary</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      {answers.length > 0 && (
        <section className="mt-4">
          <h3 className="text-sm font-semibold text-[var(--berkeley-blue)]">Key answers</h3>
          <dl className="mt-2 space-y-2">
            {answers.map((answer) => (
              <div key={answer.key}>
                <dt className="text-sm font-medium text-slate-800">{answer.prompt}</dt>
                <dd className="text-sm text-slate-600">{answer.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/resources/${resource.id}`}
          className="rounded-lg border border-[var(--berkeley-blue)]/25 px-3 py-2 text-sm font-medium text-[var(--berkeley-blue)] hover:bg-blue-50"
        >
          Learn more
        </Link>
        {resource.requirementsLink && (
          <a
            href={resource.requirementsLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-[var(--berkeley-blue)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--berkeley-blue-700)]"
          >
            Open form
          </a>
        )}
      </div>
    </article>
  );
}
