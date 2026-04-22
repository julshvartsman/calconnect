import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FINANCIAL_OPTIONS,
  IDENTITY_OPTIONS,
  TOPIC_OPTIONS,
  YEAR_OPTIONS,
  isOnboardingComplete,
  type OnboardingProfile,
} from "@/lib/onboarding";

export const dynamic = "force-dynamic";

type RecentSearch = {
  query: string;
  queryKey: string;
  lastSearchedAt: Date;
  count: number;
};

async function getRecentSearches(email: string, limit = 20): Promise<RecentSearch[]> {
  try {
    const rows = await prisma.searchEvent.findMany({
      where: {
        userEmail: email,
        eventType: "search_submitted",
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        query: true,
        queryKey: true,
        createdAt: true,
      },
    });

    const byKey = new Map<string, RecentSearch>();
    for (const row of rows) {
      const existing = byKey.get(row.queryKey);
      if (existing) {
        existing.count += 1;
      } else {
        byKey.set(row.queryKey, {
          query: row.query,
          queryKey: row.queryKey,
          lastSearchedAt: row.createdAt,
          count: 1,
        });
      }
    }

    return Array.from(byKey.values())
      .sort((a, b) => b.lastSearchedAt.getTime() - a.lastSearchedAt.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("[Profile] Failed to load recent searches", error);
    return [];
  }
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

function formatRole(role: string): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "provider":
      return "Provider";
    default:
      return "Student";
  }
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/signin?callbackUrl=/profile");
  }

  const email = session.user.email;

  let user: {
    name: string | null;
    role: string;
    createdAt: Date;
    profile: { profileJson: unknown } | null;
  } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: {
        name: true,
        role: true,
        createdAt: true,
        profile: { select: { profileJson: true } },
      },
    });
  } catch (error) {
    console.error("[Profile] Failed to load user", error);
  }

  const onboarding: OnboardingProfile | null =
    user?.profile?.profileJson && typeof user.profile.profileJson === "object"
      ? (user.profile.profileJson as OnboardingProfile)
      : null;
  const hasOnboarding = isOnboardingComplete(onboarding);

  const yearLabel = YEAR_OPTIONS.find((o) => o.value === onboarding?.year)?.label ?? null;
  const topicLabels =
    onboarding?.topics?.map((v) => TOPIC_OPTIONS.find((o) => o.value === v)?.label ?? v) ?? [];
  const identityLabels =
    onboarding?.identities?.map((v) => IDENTITY_OPTIONS.find((o) => o.value === v)?.label ?? v) ?? [];
  const financialLabel =
    FINANCIAL_OPTIONS.find((o) => o.value === onboarding?.financialSituation)?.label ?? null;

  const displayName = user?.name ?? session.user.name ?? email.split("@")[0];
  const role = user?.role ?? session.user.role ?? "student";
  const memberSince = user?.createdAt ? user.createdAt.toLocaleDateString() : null;

  const recentSearches = await getRecentSearches(email);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <header className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--berkeley-blue-700)]">
            Your account
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[var(--berkeley-blue)]">Profile</h1>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Account</h2>
        <dl className="mt-3 grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-[140px_1fr]">
          <dt className="font-medium text-slate-500">Name</dt>
          <dd className="text-slate-900">{displayName}</dd>

          <dt className="font-medium text-slate-500">Email</dt>
          <dd className="text-slate-900">{email}</dd>

          <dt className="font-medium text-slate-500">Role</dt>
          <dd>
            <span className="inline-flex items-center rounded-full bg-[var(--berkeley-blue)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--berkeley-blue)]">
              {formatRole(role)}
            </span>
          </dd>

          {memberSince && (
            <>
              <dt className="font-medium text-slate-500">Member since</dt>
              <dd className="text-slate-900">{memberSince}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your preferences
          </h2>
          <Link
            href="/onboarding?next=/profile"
            className="text-xs font-medium text-[var(--berkeley-blue)] hover:underline"
          >
            {hasOnboarding ? "Edit →" : "Set up →"}
          </Link>
        </div>

        {!hasOnboarding ? (
          <div className="mt-4 rounded-lg border border-dashed border-[var(--california-gold)]/50 bg-[var(--california-gold)]/5 p-5 text-center">
            <p className="text-sm font-medium text-slate-800">
              Finish your profile to get personalized recommendations.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              A 60-second survey about your year and interests powers the &quot;For You&quot; feed.
            </p>
            <Link
              href="/onboarding?next=/profile"
              className="mt-3 inline-block rounded-lg bg-[var(--berkeley-blue)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--berkeley-blue-700)]"
            >
              Start the 1-minute survey
            </Link>
          </div>
        ) : (
          <dl className="mt-3 grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-[140px_1fr]">
            {yearLabel && (
              <>
                <dt className="font-medium text-slate-500">Year</dt>
                <dd className="text-slate-900">{yearLabel}</dd>
              </>
            )}

            {topicLabels.length > 0 && (
              <>
                <dt className="font-medium text-slate-500">Interests</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {topicLabels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full bg-[var(--berkeley-blue)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--berkeley-blue)]"
                    >
                      {label}
                    </span>
                  ))}
                </dd>
              </>
            )}

            {identityLabels.length > 0 && (
              <>
                <dt className="font-medium text-slate-500">About you</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {identityLabels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                    >
                      {label}
                    </span>
                  ))}
                </dd>
              </>
            )}

            {financialLabel && (
              <>
                <dt className="font-medium text-slate-500">Financial</dt>
                <dd className="text-slate-900">{financialLabel}</dd>
              </>
            )}
          </dl>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recent searches
          </h2>
          <Link
            href="/search"
            className="text-xs font-medium text-[var(--berkeley-blue)] hover:underline"
          >
            New search →
          </Link>
        </div>

        {recentSearches.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <p className="text-sm text-slate-600">You haven&apos;t searched anything yet.</p>
            <Link
              href="/search"
              className="mt-3 inline-block rounded-lg bg-[var(--berkeley-blue)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--berkeley-blue-700)]"
            >
              Try your first search
            </Link>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {recentSearches.map((item) => (
              <li key={item.queryKey} className="flex items-center justify-between gap-3 py-2.5">
                <Link
                  href={`/search?q=${encodeURIComponent(item.query)}`}
                  className="flex-1 truncate text-sm font-medium text-slate-900 hover:text-[var(--berkeley-blue)] hover:underline"
                  title={item.query}
                >
                  {item.query}
                </Link>
                <span className="shrink-0 text-xs text-slate-500">
                  {item.count > 1 && <span className="mr-2">×{item.count}</span>}
                  {formatRelativeTime(item.lastSearchedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
