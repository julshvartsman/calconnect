import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding-form";
import type { OnboardingProfile } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

type OnboardingPageProps = {
  searchParams: Promise<{ next?: string; edit?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/signin?callbackUrl=/onboarding");
  }

  const params = await searchParams;
  // Guard against open-redirect: only accept same-origin relative paths,
  // and reject protocol-relative URLs like "//evil.com/x" which also start
  // with "/" but aren't same-origin.
  const rawNext = typeof params.next === "string" ? params.next : "";
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/search";

  // Pull existing profile so the form can hydrate when they come back to edit.
  let existing: OnboardingProfile | null = null;
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { profile: { select: { profileJson: true } } },
    });
    if (user?.profile?.profileJson && typeof user.profile.profileJson === "object") {
      existing = user.profile.profileJson as OnboardingProfile;
    }
  } catch (error) {
    console.error("[Onboarding] Failed to load existing profile", error);
  }

  return (
    <>
      <section className="hero-gradient -mt-[1px] pb-8 pt-10 sm:pt-14">
        <div className="relative z-10 mx-auto max-w-3xl px-4 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--california-gold)]">
            A minute of setup
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Help us personalize CalConnect
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Tell us a bit about yourself and we&apos;ll tailor recommended resources to your year,
            interests, and situation — even before you search for anything.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 md:px-6">
        <OnboardingForm initial={existing} nextPath={nextPath} />
      </main>
    </>
  );
}
