// Topical hub fallback map.
//
// When retrieval returns zero curated/scraped matches AND the LLM knowledge
// fallback isn't available (missing keys, rate-limited, network failure),
// we still want to point the user at the right office. This is a small
// manually-curated map of common topics → official Berkeley hub pages.
//
// The goal isn't breadth; it's to never hand back a "no results" dead end
// for topics we can trivially classify by keyword.

export type TopicHub = {
  /** Human label shown in the summary. */
  label: string;
  /** Canonical URL — keep to well-known umbrella pages. */
  url: string;
  /** One-line description for the source card. */
  description: string;
  /** Hint we include as an insight on the result. */
  hint: string;
  /** Lower-case keywords that trigger this hub. */
  keywords: string[];
};

const TOPICS: TopicHub[] = [
  {
    label: "Office of the Registrar",
    url: "https://registrar.berkeley.edu",
    description: "Enrollment phases, appointment times, registration holds, transcripts, and degree audits.",
    hint: "Enrollment windows, phase I / phase II / adjustment period, and registration holds are handled by the Office of the Registrar. Your appointment time appears on CalCentral under 'My Academics → Enrollment'.",
    keywords: [
      "enrollment", "enroll", "phase", "adjustment", "registration", "register", "registrar",
      "appointment time", "class schedule", "schedule planner", "add class", "drop class",
      "transcript", "degree audit", "calcentral", "hold", "bcourses", "waitlist",
    ],
  },
  {
    label: "Cal Student Central",
    url: "https://studentcentral.berkeley.edu",
    description: "One-stop shop for registration, financial aid, billing, and records questions.",
    hint: "Cal Student Central (CSC) is the front door for cross-office questions — registration, billing, financial aid, and records. They can route you if you aren't sure where to go.",
    keywords: [
      "cal student central", "student central", "csc", "cars", "billing", "bill", "tuition",
      "fees", "payment plan", "student account",
    ],
  },
  {
    label: "Financial Aid & Scholarships",
    url: "https://financialaid.berkeley.edu",
    description: "FAFSA, Dream Act, Cal Grant, work-study, scholarships, and award appeals.",
    hint: "Award packages, FAFSA/Dream Act, appeals, and scholarship timing are handled by the Financial Aid Office. Current-year deadlines are posted on their site.",
    keywords: [
      "financial aid", "fafsa", "dream act", "cal grant", "scholarship", "award", "loan",
      "work study", "work-study", "sap", "satisfactory academic progress",
    ],
  },
  {
    label: "UC Berkeley Housing",
    url: "https://housing.berkeley.edu",
    description: "On-campus housing contracts, room assignments, rates, and move-in info.",
    hint: "Residence halls, apartments, dining plans, and contract questions are handled by Cal Housing.",
    keywords: [
      "housing", "dorm", "residence hall", "apartment", "move in", "move-in", "roommate",
      "lease", "rent", "foothill", "unit 1", "unit 2", "unit 3", "clark kerr", "blackwell",
    ],
  },
  {
    label: "Basic Needs Center",
    url: "https://basicneeds.berkeley.edu",
    description: "Food pantry, CalFresh enrollment, emergency funds, and housing help.",
    hint: "The Basic Needs Center covers food insecurity, CalFresh enrollment, emergency grants, and short-term housing.",
    keywords: [
      "food", "pantry", "hungry", "hunger", "calfresh", "snap", "meal", "groceries",
      "basic needs", "emergency fund", "homeless",
    ],
  },
  {
    label: "University Health Services (Tang Center)",
    url: "https://uhs.berkeley.edu",
    description: "Primary care, SHIP/insurance, immunizations, pharmacy, and urgent care.",
    hint: "Tang Center is on-campus primary care — appointments, urgent care, immunizations, pharmacy, and the SHIP student insurance office.",
    keywords: [
      "tang", "health", "doctor", "clinic", "sick", "prescription", "pharmacy", "insurance",
      "ship", "immunization", "vaccine", "urgent care",
    ],
  },
  {
    label: "Counseling and Psychological Services (CAPS)",
    url: "https://uhs.berkeley.edu/counseling",
    description: "Short-term counseling, crisis support, and mental-health referrals.",
    hint: "CAPS is Berkeley's main mental-health resource — brief individual counseling, group therapy, and a 24/7 crisis line. Call (510) 642-9494 for urgent support.",
    keywords: [
      "mental health", "counseling", "therapy", "therapist", "caps", "crisis",
      "anxiety", "depression", "stressed", "stress", "suicidal", "wellness",
    ],
  },
  {
    label: "Disabled Students' Program (DSP)",
    url: "https://dsp.berkeley.edu",
    description: "Academic accommodations, note-taking, testing accommodations, and access services.",
    hint: "DSP handles academic accommodations, testing arrangements, and disability-related access services.",
    keywords: [
      "dsp", "disability", "disabled", "accommodation", "accommodations", "accessible",
      "note taker", "note-taker", "testing accommodations",
    ],
  },
  {
    label: "Career Center",
    url: "https://career.berkeley.edu",
    description: "Handshake, advising, resume review, employer events, and internships.",
    hint: "Career advising, resume/cover-letter reviews, Handshake postings, and employer events run through the Career Center.",
    keywords: [
      "career", "job", "internship", "resume", "cover letter", "handshake", "interview",
      "employer", "offer", "opt", "cpt",
    ],
  },
  {
    label: "Berkeley International Office",
    url: "https://internationaloffice.berkeley.edu",
    description: "F-1/J-1 visas, I-20 updates, CPT/OPT, and international student advising.",
    hint: "BIO handles F-1/J-1 visas, I-20 updates, CPT/OPT authorization, and international student questions.",
    keywords: [
      "international", "visa", "i-20", "i20", "f-1", "f1", "j-1", "j1", "opt", "cpt",
      "bio", "berkeley international",
    ],
  },
  {
    label: "Berkeley Library",
    url: "https://lib.berkeley.edu",
    description: "Study rooms, research help, databases, course reserves, and LibCal reservations.",
    hint: "Study spaces, course reserves, research librarians, and LibCal room reservations are on the library site.",
    keywords: [
      "library", "librarian", "study room", "libcal", "course reserve", "research guide",
      "database", "moffitt", "doe library", "main stacks",
    ],
  },
  {
    label: "Parking & Transportation",
    url: "https://pt.berkeley.edu",
    description: "Permits, shuttles, Class Pass, bike registration, and AC Transit info.",
    hint: "Permits, shuttles, EasyPass/Class Pass, and bike programs are managed by Parking & Transportation.",
    keywords: [
      "parking", "permit", "shuttle", "easypass", "class pass", "classpass", "bart",
      "ac transit", "bike", "bicycle",
    ],
  },
  {
    label: "Cal Rec & Wellbeing (RSF)",
    url: "https://recwell.berkeley.edu",
    description: "Gym access, group fitness, intramurals, and club sports.",
    hint: "Gym hours, group fitness, intramurals, and club sports are on the Rec & Wellbeing site.",
    keywords: [
      "gym", "rsf", "recreation", "recsports", "rec well", "workout", "fitness",
      "intramural", "club sports",
    ],
  },
];

/**
 * Classify a query against the topic hub map. Returns best matches by keyword
 * score, or an empty array when nothing topical lands.
 */
export function matchTopicHubs(rawQuery: string, limit = 2): TopicHub[] {
  const lower = ` ${rawQuery.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").replace(/\s+/g, " ").trim()} `;

  const scored: { hub: TopicHub; score: number }[] = [];
  for (const hub of TOPICS) {
    let score = 0;
    for (const kw of hub.keywords) {
      const needle = ` ${kw} `;
      if (lower.includes(needle)) score += Math.max(kw.length, 4);
    }
    if (score > 0) scored.push({ hub, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.hub);
}
