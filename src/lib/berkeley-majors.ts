// Directory of UC Berkeley undergraduate majors → department info.
//
// The goal is to answer queries like "media studies advisor", "cs advising",
// "how do i declare econ", etc. Without this, those queries fall through to
// generic fallback because we don't curate a Resource row for every major.
//
// Scope: we only include entries we are highly confident about. For any major
// not listed, the resolver returns null and the caller surfaces a college-
// level advising link instead (see COLLEGE_ADVISING below).
//
// Extend this list anytime you verify a department's URL.

export type College =
  | "L&S"          // Letters & Science (most majors)
  | "CoE"          // College of Engineering
  | "Haas"         // Haas School of Business
  | "CED"          // College of Environmental Design
  | "Rausser"      // Rausser College of Natural Resources
  | "CoChemistry"; // College of Chemistry

export type MajorDept = {
  /** Canonical department or major name (display-cased). */
  name: string;
  /** Lower-case strings we match against query terms. List most specific first. */
  aliases: string[];
  /** Main department website. */
  website: string;
  /** Preferred advising / undergraduate-students page, if known. */
  advisingUrl?: string;
  college: College;
};

/**
 * Hand-curated list. URL correctness is the priority over coverage — omitted
 * departments are handled by the college-level fallback.
 */
export const BERKELEY_MAJORS: MajorDept[] = [
  // ── Letters & Science — Humanities ─────────────────────────────────────
  { name: "Art History", aliases: ["art history", "history of art"], website: "https://arthistory.berkeley.edu", college: "L&S" },
  { name: "Art Practice", aliases: ["art practice", "studio art"], website: "https://art.berkeley.edu", college: "L&S" },
  { name: "Classics", aliases: ["classics", "latin", "greek", "classical civilizations"], website: "https://classics.berkeley.edu", college: "L&S" },
  { name: "Comparative Literature", aliases: ["comparative literature", "comp lit"], website: "https://complit.berkeley.edu", college: "L&S" },
  { name: "English", aliases: ["english", "english literature"], website: "https://english.berkeley.edu", college: "L&S" },
  { name: "Film and Media", aliases: ["film and media", "film", "filmmaking", "cinema"], website: "https://filmmedia.berkeley.edu", college: "L&S" },
  { name: "French", aliases: ["french"], website: "https://french.berkeley.edu", college: "L&S" },
  { name: "German", aliases: ["german"], website: "https://german.berkeley.edu", college: "L&S" },
  { name: "History", aliases: ["history"], website: "https://history.berkeley.edu", college: "L&S" },
  { name: "Italian Studies", aliases: ["italian studies", "italian"], website: "https://italian.berkeley.edu", college: "L&S" },
  { name: "Linguistics", aliases: ["linguistics"], website: "https://linguistics.berkeley.edu", college: "L&S" },
  { name: "Media Studies", aliases: ["media studies"], website: "https://mediastudies.berkeley.edu", advisingUrl: "https://mediastudies.berkeley.edu/undergraduate/advising/", college: "L&S" },
  { name: "Music", aliases: ["music"], website: "https://music.berkeley.edu", college: "L&S" },
  { name: "Philosophy", aliases: ["philosophy"], website: "https://philosophy.berkeley.edu", college: "L&S" },
  { name: "Rhetoric", aliases: ["rhetoric"], website: "https://rhetoric.berkeley.edu", college: "L&S" },
  { name: "Slavic Languages and Literatures", aliases: ["slavic", "russian"], website: "https://slavic.berkeley.edu", college: "L&S" },
  { name: "Spanish and Portuguese", aliases: ["spanish and portuguese", "spanish", "portuguese"], website: "https://spanish-portuguese.berkeley.edu", college: "L&S" },
  { name: "Theater, Dance, and Performance Studies", aliases: ["theater dance and performance studies", "theater", "dance", "performance studies", "tdps"], website: "https://tdps.berkeley.edu", college: "L&S" },
  { name: "East Asian Languages and Cultures", aliases: ["east asian languages", "chinese", "japanese", "korean", "ealc"], website: "https://ealc.berkeley.edu", college: "L&S" },
  { name: "Near Eastern Studies", aliases: ["near eastern studies", "arabic", "hebrew", "persian"], website: "https://nes.berkeley.edu", college: "L&S" },
  { name: "South and Southeast Asian Studies", aliases: ["south asian studies", "southeast asian studies", "sseas"], website: "https://sseas.berkeley.edu", college: "L&S" },

  // ── Letters & Science — Social Sciences ────────────────────────────────
  { name: "African American Studies", aliases: ["african american studies", "african diaspora"], website: "https://africam.berkeley.edu", college: "L&S" },
  { name: "Anthropology", aliases: ["anthropology", "anthro"], website: "https://anthropology.berkeley.edu", college: "L&S" },
  { name: "Cognitive Science", aliases: ["cognitive science", "cog sci", "cogsci"], website: "https://cogsci.berkeley.edu", college: "L&S" },
  { name: "Economics", aliases: ["economics", "econ"], website: "https://www.econ.berkeley.edu", advisingUrl: "https://www.econ.berkeley.edu/undergrad/advising", college: "L&S" },
  { name: "Ethnic Studies", aliases: ["ethnic studies", "chicano studies", "asian american studies", "native american studies"], website: "https://ethnicstudies.berkeley.edu", college: "L&S" },
  { name: "Gender and Women's Studies", aliases: ["gender and women's studies", "gender studies", "women's studies", "gws"], website: "https://womensstudies.berkeley.edu", college: "L&S" },
  { name: "Geography", aliases: ["geography"], website: "https://geography.berkeley.edu", college: "L&S" },
  { name: "Global Studies", aliases: ["global studies"], website: "https://globalstudies.berkeley.edu", college: "L&S" },
  { name: "Legal Studies", aliases: ["legal studies"], website: "https://legalstudies.berkeley.edu", college: "L&S" },
  { name: "Peace and Conflict Studies", aliases: ["peace and conflict studies", "pacs"], website: "https://pacs.berkeley.edu", college: "L&S" },
  { name: "Political Economy", aliases: ["political economy", "pe"], website: "https://polecon.berkeley.edu", college: "L&S" },
  { name: "Political Science", aliases: ["political science", "polisci", "poli sci"], website: "https://polisci.berkeley.edu", college: "L&S" },
  { name: "Psychology", aliases: ["psychology", "psych"], website: "https://psychology.berkeley.edu", college: "L&S" },
  { name: "Public Health (Undergraduate)", aliases: ["public health"], website: "https://publichealth.berkeley.edu", college: "L&S" },
  { name: "Social Welfare", aliases: ["social welfare"], website: "https://socialwelfare.berkeley.edu", college: "L&S" },
  { name: "Sociology", aliases: ["sociology"], website: "https://sociology.berkeley.edu", college: "L&S" },

  // ── Letters & Science — Math & Physical Sciences ───────────────────────
  { name: "Astrophysics", aliases: ["astrophysics", "astronomy", "astro"], website: "https://astro.berkeley.edu", college: "L&S" },
  { name: "Earth and Planetary Science", aliases: ["earth and planetary science", "eps", "geology", "geophysics"], website: "https://eps.berkeley.edu", college: "L&S" },
  { name: "Mathematics", aliases: ["mathematics", "math", "applied math"], website: "https://math.berkeley.edu", advisingUrl: "https://math.berkeley.edu/programs/undergraduate/advising", college: "L&S" },
  { name: "Physics", aliases: ["physics"], website: "https://physics.berkeley.edu", college: "L&S" },
  { name: "Statistics", aliases: ["statistics", "stats"], website: "https://statistics.berkeley.edu", college: "L&S" },
  { name: "Data Science", aliases: ["data science", "ds"], website: "https://data.berkeley.edu", advisingUrl: "https://data.berkeley.edu/academics/undergraduate-programs/data-science-major", college: "L&S" },

  // ── Letters & Science — Biological Sciences ────────────────────────────
  { name: "Integrative Biology", aliases: ["integrative biology", "ib"], website: "https://ib.berkeley.edu", college: "L&S" },
  { name: "Molecular and Cell Biology", aliases: ["molecular and cell biology", "mcb", "molecular biology", "cell biology"], website: "https://mcb.berkeley.edu", college: "L&S" },
  { name: "Neuroscience", aliases: ["neuroscience", "neuro"], website: "https://mcb.berkeley.edu", college: "L&S" },
  { name: "Public Health", aliases: ["public health"], website: "https://publichealth.berkeley.edu", college: "L&S" },

  // ── College of Chemistry ───────────────────────────────────────────────
  { name: "Chemistry", aliases: ["chemistry", "chem"], website: "https://chemistry.berkeley.edu", advisingUrl: "https://chemistry.berkeley.edu/ugrad", college: "CoChemistry" },
  { name: "Chemical Biology", aliases: ["chemical biology"], website: "https://chemistry.berkeley.edu", college: "CoChemistry" },
  { name: "Chemical Engineering", aliases: ["chemical engineering", "chem e", "cheme"], website: "https://cheme.berkeley.edu", college: "CoChemistry" },

  // ── College of Engineering ─────────────────────────────────────────────
  { name: "Bioengineering", aliases: ["bioengineering", "bioe"], website: "https://bioeng.berkeley.edu", college: "CoE" },
  { name: "Civil and Environmental Engineering", aliases: ["civil and environmental engineering", "civil engineering", "environmental engineering", "cee"], website: "https://ce.berkeley.edu", college: "CoE" },
  { name: "Electrical Engineering and Computer Sciences", aliases: ["electrical engineering and computer sciences", "electrical engineering", "ee", "computer science", "cs", "eecs"], website: "https://eecs.berkeley.edu", advisingUrl: "https://eecs.berkeley.edu/resources/undergrads/csmajor/advising", college: "CoE" },
  { name: "Industrial Engineering and Operations Research", aliases: ["industrial engineering and operations research", "ieor", "operations research"], website: "https://ieor.berkeley.edu", college: "CoE" },
  { name: "Materials Science and Engineering", aliases: ["materials science and engineering", "materials science", "mse"], website: "https://mse.berkeley.edu", college: "CoE" },
  { name: "Mechanical Engineering", aliases: ["mechanical engineering", "me"], website: "https://me.berkeley.edu", college: "CoE" },
  { name: "Nuclear Engineering", aliases: ["nuclear engineering", "nuc e"], website: "https://nuc.berkeley.edu", college: "CoE" },
  { name: "Engineering Science", aliases: ["engineering science", "engineering physics", "engineering math and statistics"], website: "https://engineering.berkeley.edu", college: "CoE" },

  // ── Haas School of Business ────────────────────────────────────────────
  { name: "Business Administration (Haas)", aliases: ["business administration", "business", "haas", "mba"], website: "https://haas.berkeley.edu", advisingUrl: "https://haas.berkeley.edu/undergrad/academics/advising/", college: "Haas" },

  // ── College of Environmental Design ────────────────────────────────────
  { name: "Architecture", aliases: ["architecture"], website: "https://arch.ced.berkeley.edu", college: "CED" },
  { name: "Landscape Architecture", aliases: ["landscape architecture"], website: "https://laep.ced.berkeley.edu", college: "CED" },
  { name: "Urban Studies", aliases: ["urban studies", "city planning"], website: "https://ced.berkeley.edu/academics/city-regional-planning", college: "CED" },
  { name: "Sustainable Environmental Design", aliases: ["sustainable environmental design", "sed"], website: "https://ced.berkeley.edu", college: "CED" },

  // ── Rausser College of Natural Resources ───────────────────────────────
  { name: "Environmental Economics and Policy", aliases: ["environmental economics and policy", "eep"], website: "https://are.berkeley.edu", college: "Rausser" },
  { name: "Environmental Sciences", aliases: ["environmental sciences", "es"], website: "https://ourenvironment.berkeley.edu", college: "Rausser" },
  { name: "Molecular Environmental Biology", aliases: ["molecular environmental biology", "meb"], website: "https://nature.berkeley.edu", college: "Rausser" },
  { name: "Nutritional Sciences", aliases: ["nutritional sciences", "nutrition"], website: "https://nst.berkeley.edu", college: "Rausser" },
  { name: "Conservation and Resource Studies", aliases: ["conservation and resource studies", "crs"], website: "https://nature.berkeley.edu", college: "Rausser" },
  { name: "Forestry and Natural Resources", aliases: ["forestry", "natural resources"], website: "https://nature.berkeley.edu", college: "Rausser" },
];

/**
 * College-level fallback: when advising intent is detected but no specific
 * major matches. We point the user at their college's main advising hub.
 */
export const COLLEGE_ADVISING: Record<College, { name: string; url: string }> = {
  "L&S":          { name: "L&S Office of Undergraduate Advising", url: "https://lsadvising.berkeley.edu/" },
  "CoE":          { name: "Engineering Student Services (ESS)", url: "https://engineering.berkeley.edu/students/advising-counseling/" },
  "Haas":         { name: "Haas Undergraduate Advising", url: "https://haas.berkeley.edu/undergrad/academics/advising/" },
  "CED":          { name: "CED Undergraduate Advising", url: "https://ced.berkeley.edu/academics/undergraduate-advising" },
  "Rausser":      { name: "Rausser College Student Services", url: "https://nature.berkeley.edu/advising" },
  "CoChemistry":  { name: "College of Chemistry Student Services", url: "https://chemistry.berkeley.edu/ugrad/advising" },
};

/**
 * Shared catalog / guide anchors shown when no specific match exists.
 */
export const BERKELEY_GUIDE_URL = "https://guide.berkeley.edu/undergraduate/degree-programs/";

// ── Advising intent detection ───────────────────────────────────────────

const ADVISING_KEYWORDS: ReadonlySet<string> = new Set([
  "advisor", "advisors", "adviser", "advisers", "advising", "advise",
  "counselor", "counselors", "counselling", "counseling",
  "declare", "declaring", "declaration",
  "major", "majors", "minor", "minors",
  "department", "departmental",
  "prerequisite", "prerequisites", "prereq", "prereqs",
  "requirements", "requirement",
  "switch", "switching", "change",
  "drop", "add",
  "degree", "degrees",
  "faculty", "professor", "professors",
  "ugsa", "ugba", "l&s", "ls",
]);

/**
 * True if the query mentions any advising-flavored term. Pair with
 * `resolveMajor` to decide whether to inject a department entry.
 */
export function detectAdvisingIntent(queryTerms: string[], rawQuery: string): boolean {
  const lower = rawQuery.toLowerCase();
  for (const t of queryTerms) {
    if (ADVISING_KEYWORDS.has(t)) return true;
  }
  // Phrase check for multi-word terms that wouldn't survive tokenization.
  if (/\b(office hours|drop in|walk in|how do i declare)\b/i.test(lower)) return true;
  return false;
}

// ── Major resolution ────────────────────────────────────────────────────

/**
 * Longest-alias-wins resolver. Returns the single best department match from
 * the raw query string. Case-insensitive, whitespace-tolerant.
 *
 * We match against the raw query (not tokenized terms) so multi-word aliases
 * like "media studies" and "political science" work correctly.
 */
export function resolveMajor(rawQuery: string): MajorDept | null {
  const lower = ` ${rawQuery.toLowerCase().replace(/[^a-z0-9\s&'-]/g, " ").replace(/\s+/g, " ").trim()} `;

  let best: { dept: MajorDept; aliasLen: number } | null = null;

  for (const dept of BERKELEY_MAJORS) {
    for (const alias of dept.aliases) {
      const needle = ` ${alias.toLowerCase()} `;
      if (lower.includes(needle)) {
        if (!best || alias.length > best.aliasLen) {
          best = { dept, aliasLen: alias.length };
        }
      }
    }
  }

  return best?.dept ?? null;
}
