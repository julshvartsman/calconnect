import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getOpenStatus } from "@/lib/resource-helpers";

export const dynamic = "force-dynamic";

type ResourceDetailProps = {
  params: Promise<{ id: string }>;
};

type SummaryAnswer = {
  key: string;
  prompt: string;
  answer: string;
};

function parseAnswers(faqJson: unknown): SummaryAnswer[] {
  if (!Array.isArray(faqJson)) return [];
  return faqJson.filter(
    (item): item is SummaryAnswer =>
      typeof item === "object" &&
      item !== null &&
      "key" in item &&
      "prompt" in item &&
      "answer" in item,
  );
}

function parseKeyPoints(summaryJson: unknown): string[] {
  if (!summaryJson || typeof summaryJson !== "object") return [];
  const points = (summaryJson as { keyPoints?: string[] }).keyPoints;
  return Array.isArray(points) ? points : [];
}

export default async function ResourceDetailPage({ params }: ResourceDetailProps) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      provider: true,
      resourceTags: { include: { tag: true } },
    },
  });

  if (!resource || !resource.isActive) {
    notFound();
  }

  const status = getOpenStatus(resource.hoursJson);
  const answers = parseAnswers(resource.faqJson);
  const keyPoints = parseKeyPoints(resource.summaryJson);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <section className="bg-berkeley rounded-3xl p-6 text-white md:p-7">
        <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          {resource.category.name}
        </p>
        <h1 className="mt-3 text-3xl font-bold">{resource.name}</h1>
        <p className="mt-2 text-blue-50">{resource.shortDescription}</p>
        <p className="mt-3 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
          {status}
        </p>
      </section>

      <div className="card-surface mt-5 grid gap-4 rounded-2xl p-4 md:grid-cols-2">
        <p className="text-sm">
          <span className="font-semibold">Category:</span> {resource.category.name}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Status:</span> {status}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Eligibility:</span>{" "}
          {resource.eligibilityText}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Access:</span>{" "}
          {resource.walkInAllowed ? "Walk-in allowed" : "Walk-in not allowed"}
          {" · "}
          {resource.isAppointmentRequired
            ? "Appointment required"
            : "Appointment optional"}
        </p>
      </div>

      <section className="card-surface mt-6 rounded-2xl p-5">
        <h2 className="text-berkeley text-lg font-semibold">What to bring</h2>
        <ul className="mt-2 list-disc pl-6 text-sm text-slate-700">
          {resource.whatToBring.length > 0 ? (
            resource.whatToBring.map((item) => <li key={item}>{item}</li>)
          ) : (
            <li>No required items listed.</li>
          )}
        </ul>
      </section>

      {resource.location && (
        <section className="card-surface mt-6 rounded-2xl p-5">
          <h2 className="text-berkeley text-lg font-semibold">Location & directions</h2>
          <p className="mt-2 text-sm text-slate-700">
            {[resource.location.buildingName, resource.location.room, resource.location.address]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-3 flex gap-2">
            {resource.location.latitude && resource.location.longitude && (
              <a
                className="rounded-lg border border-[var(--berkeley-blue)]/25 px-3 py-2 text-sm font-medium text-[var(--berkeley-blue)] hover:bg-blue-50"
                href={`https://www.google.com/maps/search/?api=1&query=${resource.location.latitude},${resource.location.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                Get directions
              </a>
            )}
            {resource.requirementsLink && (
              <a
                className="rounded-lg bg-[var(--berkeley-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--berkeley-blue-700)]"
                href={resource.requirementsLink}
                target="_blank"
                rel="noreferrer"
              >
                Open required form
              </a>
            )}
          </div>
        </section>
      )}

      {keyPoints.length > 0 && (
        <section className="card-surface mt-6 rounded-2xl p-5">
          <h2 className="text-berkeley text-lg font-semibold">Things you should know</h2>
          <ul className="mt-2 list-disc pl-6 text-sm text-slate-700">
            {keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      {answers.length > 0 && (
        <section className="card-surface mt-6 rounded-2xl p-5">
          <h2 className="text-berkeley text-lg font-semibold">Key questions answered</h2>
          <dl className="mt-3 space-y-3">
            {answers.map((answer) => (
              <div key={answer.key}>
                <dt className="text-sm font-medium">{answer.prompt}</dt>
                <dd className="text-sm text-slate-700">{answer.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <p className="mt-6 text-xs text-slate-500">
        Last verified{" "}
        {resource.lastVerifiedAt
          ? format(resource.lastVerifiedAt, "MMM d, yyyy")
          : "not yet verified"}
        {resource.officialUrl && (
          <>
            {" · "}
            <a href={resource.officialUrl} target="_blank" rel="noreferrer" className="underline">
              View official source
            </a>
          </>
        )}
      </p>
    </main>
  );
}
