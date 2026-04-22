import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOnboardingComplete } from "@/lib/onboarding";
import { OnboardingBannerClient } from "@/components/onboarding-banner-client";

/**
 * Server wrapper that decides whether to show the onboarding banner.
 *
 * We render the banner when the user is authenticated but hasn't filled out
 * their onboarding survey yet. The client subcomponent handles dismissal
 * and path-based hiding (e.g. on /signin and /onboarding itself).
 */
export async function OnboardingBanner() {
  const session = await auth().catch(() => null);
  if (!session?.user?.email) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { profile: { select: { profileJson: true } } },
    });
    if (isOnboardingComplete(user?.profile?.profileJson)) return null;
  } catch (error) {
    // If we can't read the profile (missing table, migration drift, etc.),
    // don't block the app. Better to silently skip the banner than to crash.
    console.error("[OnboardingBanner] profile lookup failed", error);
    return null;
  }

  return <OnboardingBannerClient />;
}
