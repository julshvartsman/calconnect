import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Real lat/lng for Berkeley campus buildings & addresses ────────────────

const COORDS: Record<string, [number, number]> = {
  "MLK Jr. Student Union, 1st Floor":         [37.86910, -122.26040],
  "MLK Jr. Student Union, bNorth (Lower Level)": [37.86910, -122.26040],
  "Basic Needs Welcome Center, MLK 1st Floor": [37.86910, -122.26040],
  "Basic Needs Center, MLK Student Union":     [37.86910, -122.26040],
  "MLK Jr. Student Union, Suite #220":         [37.86910, -122.26040],
  "MLK Jr. Student Union, bNorth":             [37.86910, -122.26040],
  "2440 Bancroft Way #102":                    [37.86870, -122.26000],
  "Tang Center, 2222 Bancroft Way":            [37.86760, -122.26340],
  "Tang Center, 1st Floor":                    [37.86760, -122.26340],
  "Tang Center, Room 3200":                    [37.86760, -122.26340],
  "Tang Center, 3rd Floor":                    [37.86760, -122.26340],
  "University Health Services Building":       [37.86760, -122.26340],
  "Sproul Hall":                               [37.86940, -122.25870],
  "120 Sproul Hall":                           [37.86940, -122.25870],
  "102 Sproul Hall":                           [37.86940, -122.25870],
  "1 Sproul Hall":                             [37.86940, -122.25870],
  "102 Sproul Hall (mailing)":                 [37.86940, -122.25870],
  "Cesar E. Chavez Student Center":            [37.86970, -122.26020],
  "100 Cesar E. Chavez Student Center":        [37.86970, -122.26020],
  "180 Cesar E. Chavez Student Center":        [37.86970, -122.26020],
  "241 Cesar Chavez #2440":                    [37.86970, -122.26020],
  "100 Cesar E. Chavez Student Center & Anchor House (1923 Walnut St)": [37.86970, -122.26020],
  "Eshleman Hall":                             [37.86920, -122.25990],
  "Eshleman Hall 312F, 2465 Bancroft Way":     [37.86920, -122.25990],
  "Eshleman Hall 412B":                        [37.86920, -122.25990],
  "2610 Channing Way, #2272":                  [37.86600, -122.25680],
  "2424 Ridge Road":                           [37.87590, -122.26010],
  "2150 Shattuck Ave, Suite 500":              [37.86900, -122.26800],
  "100 Creekside Center #4250":                [37.87290, -122.25340],
  "DSP Proctoring Center":                     [37.87290, -122.25340],
  "2440 Bancroft Way":                         [37.86870, -122.26000],
  "200 California Hall #1500":                 [37.87180, -122.26060],
  "Wheeler Hall":                              [37.87110, -122.25870],
  "Chavez Student Center & Memorial Stadium":  [37.87070, -122.25050],
  "Doe, Moffitt, and Main Stacks":             [37.87240, -122.25930],
  "Hearst Field Annex, Building B":            [37.87010, -122.25620],
  "Hearst Memorial Gym, Room 102":             [37.87020, -122.25620],
  "Recreational Sports Facility":              [37.86850, -122.26260],
  "Dwinelle 117, MLK 2nd Floor, Moffitt 4th Floor": [37.87060, -122.26030],
  "CEJCE":                                     [37.86970, -122.26020],
};

type SeedCategory = {
  slug: string;
  name: string;
};

type SeedResource = {
  id: string;
  name: string;
  categorySlug: string;
  description: string;
  location: string;
  url?: string;
  hours: { days: string; open: string; close: string }[] | "24/7" | null;
  tags: string[];
};

const CATEGORIES: SeedCategory[] = [
  { slug: "food", name: "Food & Basic Needs" },
  { slug: "health", name: "Health & Medical" },
  { slug: "mental-health", name: "Mental Health & Counseling" },
  { slug: "safety", name: "Safety & Emergency" },
  { slug: "housing", name: "Housing" },
  { slug: "financial", name: "Financial Aid & Money" },
  { slug: "academic", name: "Academic Support" },
  { slug: "career", name: "Career & Professional" },
  { slug: "legal", name: "Legal & Advocacy" },
  { slug: "disability", name: "Disability & Accessibility" },
  { slug: "technology", name: "Technology & IT" },
  { slug: "international", name: "International Students" },
  { slug: "community", name: "Community & Identity Centers" },
  { slug: "student-life", name: "Student Life & Wellbeing" },
];

const WEEKDAYS = "Monday, Tuesday, Wednesday, Thursday, Friday";
const MTThF = "Monday, Tuesday, Thursday, Friday";

const RESOURCES: SeedResource[] = [
  // Food & Basic Needs
  { id: "basic-needs-center", name: "Basic Needs Center", categorySlug: "food", description: "Walk-in case support, CalFresh enrollment, emergency grants, and referrals for food, housing, and financial security.", location: "MLK Jr. Student Union, 1st Floor", url: "https://basicneeds.berkeley.edu/home", hours: [{ days: WEEKDAYS, open: "1:00 PM", close: "4:30 PM" }], tags: ["free-food", "emergency"] },
  { id: "food-pantry", name: "Food Pantry", categorySlug: "food", description: "Free groceries for all UC Berkeley students. Virtual line — check website for current schedule. Bring Cal 1 Card.", location: "MLK Jr. Student Union, bNorth (Lower Level)", url: "https://basicneeds.berkeley.edu/pantry", hours: null, tags: ["free-food"] },
  { id: "calfresh", name: "CalFresh Application Assistance", categorySlug: "food", description: "Help applying for CalFresh/SNAP benefits ($234/month in free groceries). Most students with work-study or EFC 0 qualify.", location: "Basic Needs Welcome Center, MLK 1st Floor", url: "https://basicneeds.berkeley.edu/calfresh", hours: [{ days: WEEKDAYS, open: "1:00 PM", close: "4:30 PM" }], tags: ["free-food"] },
  { id: "food-collective", name: "Berkeley Student Food Collective", categorySlug: "food", description: "Student-run grocery store with affordable, healthy food. Open to all — not just students.", location: "2440 Bancroft Way #102", url: "https://www.foodcollective.org/", hours: [{ days: WEEKDAYS, open: "8:30 AM", close: "8:30 PM" }, { days: "Saturday, Sunday", open: "11:30 AM", close: "7:30 PM" }], tags: [] },

  // Health & Medical
  { id: "uhs", name: "University Health Services (UHS)", categorySlug: "health", description: "Primary care, urgent care, lab, and immunizations. Walk-in and appointment options. Bring Cal 1 Card.", location: "Tang Center, 2222 Bancroft Way", url: "https://uhs.berkeley.edu/", hours: [{ days: WEEKDAYS, open: "8:00 AM", close: "5:00 PM" }], tags: [] },
  { id: "uhs-pharmacy", name: "UHS Pharmacy", categorySlug: "health", description: "Prescription pickup and over-the-counter medications. See UHS hours page for pharmacy-specific times.", location: "Tang Center, 1st Floor", url: "https://uhs.berkeley.edu/medical/pharmacy-uhs", hours: null, tags: [] },
  { id: "ship", name: "Student Health Insurance (SHIP)", categorySlug: "health", description: "UC-sponsored health insurance plan. Enroll, waive, or get help using your SHIP benefits.", location: "Tang Center, Room 3200", url: "https://uhs.berkeley.edu/ship", hours: null, tags: [] },
  { id: "local-urgent-care", name: "Local Emergency & Urgent Care", categorySlug: "health", description: "Directory of nearby emergency rooms and urgent care centers for after-hours or serious medical needs.", location: "Tang Center, 2222 Bancroft Way", url: "https://uhs.berkeley.edu/medical/urgent-care/local-emergency-and-urgent-care-centers", hours: "24/7", tags: ["emergency"] },

  // Mental Health
  { id: "caps", name: "Counseling & Psychological Services (CAPS)", categorySlug: "mental-health", description: "Individual counseling, group therapy, crisis support, and psychiatric services for enrolled students.", location: "Tang Center, 3rd Floor", url: "https://uhs.berkeley.edu/caps", hours: null, tags: [] },
  { id: "caps-urgent", name: "CAPS Urgent / After-Hours Crisis", categorySlug: "mental-health", description: "24/7 phone crisis support for students experiencing mental health emergencies. Call anytime.", location: "Tang Center, 3rd Floor", url: "https://uhs.berkeley.edu/counseling/urgent", hours: "24/7", tags: ["emergency"] },
  { id: "lets-talk", name: "Let's Talk (Drop-In Counseling)", categorySlug: "mental-health", description: "Free, informal, confidential drop-in conversations with counselors. No appointment needed.", location: "Cesar E. Chavez Student Center", url: "https://uhs.berkeley.edu/counseling/letstalk/schedule", hours: null, tags: [] },

  // Safety & Emergency
  { id: "path-to-care", name: "PATH to Care Center", categorySlug: "safety", description: "Free, confidential support for sexual violence, sexual harassment, dating violence, and stalking.", location: "University Health Services Building", url: "https://care.berkeley.edu/", hours: [{ days: WEEKDAYS, open: "9:00 AM", close: "4:30 PM" }], tags: ["emergency"] },
  { id: "csi", name: "Center for Support & Intervention", categorySlug: "safety", description: "Case management, threat assessment, and support for students in crisis or distress.", location: "102 Sproul Hall", url: "https://csi.berkeley.edu/", hours: [{ days: WEEKDAYS, open: "9:00 AM", close: "5:00 PM" }], tags: ["emergency"] },
  { id: "ucpd", name: "UC Police Department", categorySlug: "safety", description: "Emergency: 911. Non-emergency: (510) 642-6760. Station open 24/7.", location: "1 Sproul Hall", url: "https://ucpd.berkeley.edu/contact-information", hours: "24/7", tags: ["emergency"] },
  { id: "bearwalk", name: "BearWALK Night Safety Escort", categorySlug: "safety", description: "Free safety escort for students walking on campus after dark. Available dusk to 3am.", location: "1 Sproul Hall", url: "https://nightsafety.berkeley.edu/nightsafety/escort", hours: null, tags: ["emergency"] },
  { id: "ophd", name: "OPHD (Title IX & Discrimination)", categorySlug: "safety", description: "Report and resolve complaints of discrimination, harassment, and Title IX violations.", location: "200 California Hall #1500", url: "https://ophd.berkeley.edu/", hours: null, tags: [] },

  // Housing
  { id: "emergency-housing", name: "Emergency Housing Assistance", categorySlug: "housing", description: "Temporary housing support for students facing homelessness or housing insecurity.", location: "Basic Needs Center, MLK Student Union", url: "https://basicneeds.berkeley.edu/get-support/housing/emergency-housing", hours: null, tags: ["emergency"] },
  { id: "uc-housing", name: "UC Berkeley Housing Office", categorySlug: "housing", description: "On-campus housing applications, contracts, and residence hall assignments.", location: "2610 Channing Way, #2272", url: "https://housing.berkeley.edu/", hours: [{ days: "Monday, Tuesday, Wednesday, Thursday", open: "9:00 AM", close: "4:00 PM" }], tags: [] },
  { id: "bsc-coop", name: "Berkeley Student Cooperative", categorySlug: "housing", description: "Affordable cooperative housing for students. Room and board starting around $8,000/year.", location: "2424 Ridge Road", url: "https://www.bsc.coop/about-us/contact-us", hours: [{ days: WEEKDAYS, open: "10:00 AM", close: "5:00 PM" }], tags: [] },

  // Financial Aid
  { id: "financial-aid", name: "Financial Aid & Scholarships", categorySlug: "financial", description: "Help with FAFSA, scholarships, grants, loans, and work-study.", location: "Sproul Hall", url: "https://financialaid.berkeley.edu/", hours: null, tags: [] },
  { id: "financial-wellness", name: "Center for Financial Wellness", categorySlug: "financial", description: "Free peer coaching on budgeting, student loans, taxes, and financial planning.", location: "Sproul Hall", url: "https://financialaid.berkeley.edu/center-for-financial-wellness/", hours: null, tags: [] },
  { id: "student-billing", name: "Student Billing & Payment Services", categorySlug: "financial", description: "Tuition billing, payment plans, refunds, and fee questions.", location: "Sproul Hall", url: "https://studentbilling.berkeley.edu/home", hours: [{ days: WEEKDAYS, open: "9:00 AM", close: "12:00 PM" }], tags: [] },
  { id: "emergency-fund", name: "Basic Needs Emergency Fund", categorySlug: "financial", description: "One-time emergency grants for unexpected expenses like rent, food, or medical bills.", location: "Basic Needs Center, MLK Student Union", url: "https://basicneeds.berkeley.edu/get-support/finances/emergency-fund", hours: null, tags: ["emergency"] },
  { id: "asuc-tax", name: "ASUC Free Tax Prep (VITA)", categorySlug: "financial", description: "Free tax preparation for students through the VITA program.", location: "Eshleman Hall", url: "https://www.asucslcberkeley.org/tax-services", hours: null, tags: [] },

  // Academic Support
  { id: "slc", name: "Student Learning Center (SLC)", categorySlug: "academic", description: "Free drop-in and appointment tutoring for writing, math, statistics, science, and economics.", location: "Cesar E. Chavez Student Center", url: "https://slc.berkeley.edu/home", hours: [{ days: "Monday, Tuesday, Wednesday, Thursday", open: "9:00 AM", close: "6:00 PM" }], tags: [] },
  { id: "cal-student-central", name: "Cal Student Central", categorySlug: "academic", description: "One-stop hub for registration, billing, financial aid, and enrollment questions.", location: "120 Sproul Hall", url: "https://studentcentral.berkeley.edu/", hours: [{ days: WEEKDAYS, open: "9:00 AM", close: "4:00 PM" }], tags: [] },
  { id: "registrar", name: "Office of the Registrar", categorySlug: "academic", description: "Transcripts, enrollment verification, academic records, and degree conferral.", location: "120 Sproul Hall", url: "https://registrar.berkeley.edu/", hours: null, tags: [] },
  { id: "library-study", name: "Library Study Spaces", categorySlug: "academic", description: "Open study spaces, group study rooms, and printing. Reserve rooms via LibCal.", location: "Doe, Moffitt, and Main Stacks", url: "https://www.lib.berkeley.edu/hours", hours: null, tags: [] },
  { id: "berkeley-connect", name: "Berkeley Connect (Mentorship)", categorySlug: "academic", description: "Faculty-led mentorship program connecting students with peers, grad mentors, and career resources.", location: "Wheeler Hall", url: "https://berkeleyconnect.berkeley.edu/home", hours: null, tags: [] },

  // Career
  { id: "career-center", name: "Berkeley Career Engagement", categorySlug: "career", description: "Resume reviews, mock interviews, job/internship search, and career counseling.", location: "2440 Bancroft Way", url: "https://career.berkeley.edu/", hours: [{ days: WEEKDAYS, open: "8:30 AM", close: "4:30 PM" }], tags: [] },

  // Legal
  { id: "sls", name: "Student Legal Services", categorySlug: "legal", description: "Free, confidential legal advice for students. Landlord disputes, contracts, immigration, and more.", location: "102 Sproul Hall", url: "https://sls.berkeley.edu/", hours: null, tags: [] },
  { id: "asuc-legal", name: "ASUC Student Legal Clinic", categorySlug: "legal", description: "Free legal consultations and VITA tax preparation. Run by law students under attorney supervision.", location: "Eshleman Hall 312F, 2465 Bancroft Way", url: "https://www.asucslcberkeley.org/", hours: [{ days: "Monday, Tuesday", open: "10:00 AM", close: "7:00 PM" }, { days: "Wednesday, Thursday, Friday", open: "10:00 AM", close: "5:00 PM" }], tags: [] },
  { id: "sao", name: "Student Advocate's Office", categorySlug: "legal", description: "Free advocacy for academic grievances, conduct cases, and disputes with the university.", location: "Eshleman Hall 412B", url: "https://advocate.studentorg.berkeley.edu/", hours: [{ days: WEEKDAYS, open: "10:00 AM", close: "5:00 PM" }], tags: [] },
  { id: "dean-of-students", name: "Dean of Students Office", categorySlug: "legal", description: "Central student support — academic concerns, personal crises, policy questions, and student conduct.", location: "Sproul Hall", url: "https://deanofstudents.berkeley.edu/contact-office-hours/", hours: [{ days: WEEKDAYS, open: "9:00 AM", close: "5:00 PM" }], tags: [] },

  // Disability
  { id: "dsp", name: "Disabled Students' Program (DSP)", categorySlug: "disability", description: "Academic accommodations, exam proctoring, note-taking, and assistive technology for students with disabilities.", location: "100 Creekside Center #4250", url: "https://dsp.berkeley.edu/home", hours: null, tags: [] },

  // Technology
  { id: "sts", name: "Student Technology Services", categorySlug: "technology", description: "Tech support, software access, and device troubleshooting for students.", location: "Cesar E. Chavez Student Center", url: "https://studenttech.berkeley.edu/home", hours: null, tags: [] },
  { id: "step", name: "Student Technology Equity Program (STEP)", categorySlug: "technology", description: "Free laptop loans for students with financial need. Apply through the STEP portal.", location: "Cesar E. Chavez Student Center", url: "https://studenttech.berkeley.edu/step", hours: null, tags: [] },
  { id: "it-dropin", name: "Drop-In IT Support", categorySlug: "technology", description: "Walk-in tech support for CalNet, Wi-Fi, software, and device issues.", location: "Dwinelle 117, MLK 2nd Floor, Moffitt 4th Floor", url: "https://berkeley.service-now.com/kb_view.do?sys_kb_id=453cbcad478c92d4702449df016d43eb", hours: [{ days: MTThF, open: "9:00 AM", close: "4:00 PM" }], tags: [] },

  // International
  { id: "bio", name: "Berkeley International Office (BIO)", categorySlug: "international", description: "Immigration advising, visa support, work authorization, and international student services.", location: "2150 Shattuck Ave, Suite 500", url: "https://internationaloffice.berkeley.edu/about/contact-us", hours: [{ days: WEEKDAYS, open: "9:00 AM", close: "4:00 PM" }], tags: [] },
  { id: "bio-dropin", name: "BIO In-Person Drop-In Advising", categorySlug: "international", description: "Walk-in immigration and visa advising. No appointment needed.", location: "2150 Shattuck Ave, Suite 500", url: "https://internationaloffice.berkeley.edu/students/student-services/in-person-advising", hours: [{ days: MTThF, open: "1:00 PM", close: "4:00 PM" }], tags: [] },

  // Community & Identity
  { id: "mcc", name: "Multicultural Community Center (MCC)", categorySlug: "community", description: "Community space, programming, and support for multicultural students.", location: "MLK Jr. Student Union, Suite #220", url: "https://cejce.berkeley.edu/mcc", hours: null, tags: [] },
  { id: "geneq", name: "Gender Equity Resource Center (GenEq)", categorySlug: "community", description: "Resources for women, LGBTQ+, trans students, and survivors of gender-based violence.", location: "Cesar E. Chavez Student Center", url: "https://cejce.berkeley.edu/geneq", hours: null, tags: [] },
  { id: "usp", name: "Undocumented Student Program", categorySlug: "community", description: "Holistic support for undocumented students — legal aid, financial resources, community, and advocacy.", location: "180 Cesar E. Chavez Student Center", url: "https://undocu.berkeley.edu/", hours: null, tags: [] },
  { id: "lsrc", name: "Latinx Student Resource Center", categorySlug: "community", description: "Community space, advising, and resources for Chicanx/Latinx students.", location: "Hearst Field Annex, Building B", url: "https://cejce.berkeley.edu/clsd/latinx-student-resource-center", hours: [{ days: "Monday, Tuesday, Wednesday, Thursday", open: "10:00 AM", close: "6:00 PM" }, { days: "Friday", open: "10:00 AM", close: "5:00 PM" }], tags: [] },

  // Student Life
  { id: "transfer-center", name: "Transfer Student Center", categorySlug: "student-life", description: "Community, advising, and transition support for transfer students.", location: "100 Cesar E. Chavez Student Center & Anchor House (1923 Walnut St)", url: "https://transfers.berkeley.edu/home", hours: [{ days: "Monday, Tuesday, Wednesday, Thursday", open: "9:00 AM", close: "5:00 PM" }, { days: "Friday", open: "9:00 AM", close: "4:00 PM" }], tags: [] },
  { id: "reentry", name: "Re-entry Student Program", categorySlug: "student-life", description: "Community space and support for students 25+ and independent students.", location: "MLK Jr. Student Union, bNorth", url: "https://reentry.berkeley.edu/", hours: [{ days: WEEKDAYS, open: "10:00 AM", close: "5:00 PM" }], tags: [] },
  { id: "student-parents", name: "Student Parent Center", categorySlug: "student-life", description: "Resources, community, and advocacy for student parents.", location: "100 Cesar E. Chavez Student Center", url: "https://studentparents.berkeley.edu/home", hours: [{ days: WEEKDAYS, open: "9:00 AM", close: "5:00 PM" }], tags: [] },
  { id: "veterans", name: "Cal Veteran Services Center", categorySlug: "student-life", description: "Benefits advising, community space, and transition support for veterans.", location: "Hearst Memorial Gym, Room 102", url: "https://veteran.berkeley.edu/", hours: [{ days: WEEKDAYS, open: "10:00 AM", close: "5:00 PM" }], tags: [] },
  { id: "grad-division", name: "Graduate Division", categorySlug: "student-life", description: "Graduate admissions, funding, academic progress, and degree completion.", location: "Sproul Hall", url: "https://grad.berkeley.edu/about/contact/", hours: [{ days: WEEKDAYS, open: "9:00 AM", close: "4:00 PM" }], tags: [] },
  { id: "rsf", name: "Recreational Sports Facility (RSF)", categorySlug: "student-life", description: "Gym, pool, courts, fitness classes, and wellness programs. Free for enrolled students.", location: "Recreational Sports Facility", url: "https://recwell.berkeley.edu/facilities/recreational-sports-facility-rsf/", hours: [{ days: WEEKDAYS, open: "7:00 AM", close: "11:00 PM" }, { days: "Saturday", open: "8:00 AM", close: "6:00 PM" }, { days: "Sunday", open: "8:00 AM", close: "11:00 PM" }], tags: [] },
];

// ── Slight random offset so co-located pins don't perfectly overlap ───────

function jitter(coord: number): number {
  return coord + (Math.random() - 0.5) * 0.0006;
}

async function main() {
  console.log("Seeding CalConnect database...\n");

  // 1. Upsert categories
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name },
    });
    categoryMap.set(cat.slug, row.id);
    console.log(`  ✓ Category: ${cat.name}`);
  }

  // 2. Upsert tags
  const allTagNames = [...new Set(RESOURCES.flatMap((r) => r.tags))].filter(Boolean);
  const tagMap = new Map<string, string>();
  for (const tagName of allTagNames) {
    const row = await prisma.tag.upsert({
      where: { name_type: { name: tagName, type: "feature" } },
      update: {},
      create: { name: tagName, type: "feature" },
    });
    tagMap.set(tagName, row.id);
    console.log(`  ✓ Tag: ${tagName}`);
  }

  // 3. Create resources with locations
  let created = 0;
  let skipped = 0;

  for (const r of RESOURCES) {
    const categoryId = categoryMap.get(r.categorySlug);
    if (!categoryId) {
      console.log(`  ✗ Skipping ${r.name} — unknown category ${r.categorySlug}`);
      skipped++;
      continue;
    }

    const existing = await prisma.resource.findFirst({ where: { name: r.name } });
    if (existing) {
      skipped++;
      continue;
    }

    const baseCoords = COORDS[r.location];
    const lat = baseCoords ? jitter(baseCoords[0]) : null;
    const lng = baseCoords ? jitter(baseCoords[1]) : null;

    const location = await prisma.location.create({
      data: {
        buildingName: r.location,
        address: r.location,
        latitude: lat,
        longitude: lng,
      },
    });

    const hoursJson =
      r.hours === "24/7"
        ? { type: "24/7" as const }
        : r.hours
          ? { type: "scheduled" as const, slots: r.hours }
          : null;

    const resource = await prisma.resource.create({
      data: {
        name: r.name,
        shortDescription: r.description,
        eligibilityText: "UC Berkeley students",
        websiteUrl: r.url,
        officialUrl: r.url,
        hoursJson: hoursJson as any,
        isActive: true,
        categoryId,
        locationId: location.id,
      },
    });

    // Link tags
    for (const tagName of r.tags) {
      const tagId = tagMap.get(tagName);
      if (tagId) {
        await prisma.resourceTag.create({
          data: { resourceId: resource.id, tagId },
        });
      }
    }

    created++;
    console.log(`  ✓ Resource: ${r.name} (${lat ? "📍 mapped" : "📎 no coords"})`);
  }

  console.log(`\nDone! Created ${created} resources, skipped ${skipped}.`);
  console.log(`Total resources in DB: ${await prisma.resource.count()}`);
  console.log(`Total with coordinates: ${await prisma.location.count({ where: { latitude: { not: null } } })}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
