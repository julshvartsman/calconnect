// Shared constants and helpers for the onboarding survey.
//
// The survey writes to UserProfile.profileJson via /api/profile, using the
// existing profileInputSchema (studentType, year, identities, topics,
// financialSituation). Keeping the option catalog here means the UI, the
// recommendations engine, and the profile page all use the same labels.

export const YEAR_OPTIONS: { value: string; label: string }[] = [
  { value: "freshman", label: "Freshman" },
  { value: "sophomore", label: "Sophomore" },
  { value: "junior", label: "Junior" },
  { value: "senior", label: "Senior" },
  { value: "transfer", label: "Transfer" },
  { value: "grad", label: "Graduate student" },
  { value: "other", label: "Other" },
];

/**
 * Category slugs here MUST match the slugs in the Category table (the seed
 * file and CATEGORY_LABELS map). This way `topics` can be scored directly
 * against resource categories without any translation step.
 */
/**
 * `value` strings match Category.slug in the DB seed so they score a direct
 * hit via the category-slug check in recommendations scoring. Any value not
 * in the seed will still work (it'll match via labels/descriptions/tags) but
 * score less precisely — keep these aligned with prisma/seed.ts.
 */
export const TOPIC_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "food",          label: "Food & basic needs",   hint: "Pantry, CalFresh, meals" },
  { value: "housing",       label: "Housing",              hint: "Dorms, apartments, emergency housing" },
  { value: "financial",     label: "Financial aid & money",hint: "FAFSA, scholarships, billing" },
  { value: "academic",      label: "Academic support",     hint: "Tutoring, writing, advising" },
  { value: "career",        label: "Career & jobs",        hint: "Handshake, resumes, internships" },
  { value: "mental-health", label: "Mental health",        hint: "CAPS, therapy, crisis support" },
  { value: "health",        label: "Health & medical",     hint: "Tang Center, insurance, pharmacy" },
  { value: "student-life",  label: "Student life & wellbeing", hint: "RSF, clubs, campus life" },
  { value: "safety",        label: "Safety & emergency",   hint: "Survivor support, emergency help" },
  { value: "legal",         label: "Legal help",           hint: "Rights, leases, immigration" },
  { value: "disability",    label: "Disability & access",  hint: "DSP, accommodations" },
  { value: "international", label: "International students", hint: "Visas, I-20, CPT/OPT" },
  { value: "community",     label: "Community & identity", hint: "Cultural, LGBTQ+, first-gen" },
  { value: "technology",    label: "Tech & IT",            hint: "Laptops, wifi, software" },
];

export const IDENTITY_OPTIONS: { value: string; label: string }[] = [
  { value: "transfer",          label: "Transfer student" },
  { value: "international",     label: "International student" },
  { value: "first-generation",  label: "First-generation college student" },
  { value: "re-entry",          label: "Re-entry student" },
  { value: "veteran",           label: "Veteran / active military" },
  { value: "parent",            label: "Student parent" },
  { value: "out-of-state",      label: "Out-of-state (non-Californian)" },
  { value: "dreamer",           label: "Undocumented / Dreamer" },
];

export const FINANCIAL_OPTIONS: { value: string; label: string }[] = [
  { value: "full-aid",       label: "Financial aid covers most costs" },
  { value: "partial-aid",    label: "Some aid, but I worry about costs" },
  { value: "no-aid",         label: "No financial aid right now" },
  { value: "prefer-not-say", label: "Prefer not to say" },
];

export type OnboardingProfile = {
  studentType?: string | null;
  year?: string | null;
  identities?: string[];
  financialSituation?: string | null;
  topics?: string[];
};

/**
 * Truthy when the user has filled out enough for us to personalize
 * recommendations. Year + at least one topic is our bar.
 */
export function isOnboardingComplete(profileJson: unknown): boolean {
  if (!profileJson || typeof profileJson !== "object") return false;
  const p = profileJson as OnboardingProfile;
  return Boolean(p.year && (p.topics?.length ?? 0) > 0);
}

/**
 * Turn a profile into a list of "virtual queries" that the recommendation
 * scorer can use the same way it uses real search history. Each topic slug
 * becomes its own query so we get resource diversity instead of stacking
 * every profile signal into one monolithic score.
 */
export function profileToVirtualQueries(profileJson: unknown): string[] {
  if (!profileJson || typeof profileJson !== "object") return [];
  const p = profileJson as OnboardingProfile;

  const queries: string[] = [];
  const topicLabels = new Map(TOPIC_OPTIONS.map((t) => [t.value, t.label]));

  for (const topic of p.topics ?? []) {
    const label = topicLabels.get(topic) ?? topic;
    queries.push(label);
  }

  // Identities often correlate strongly with specific resource pools
  // (international → BIO, transfer → transfer center, etc.).
  for (const identity of p.identities ?? []) {
    queries.push(identity);
  }

  return queries;
}
