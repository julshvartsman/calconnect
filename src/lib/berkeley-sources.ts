export type BerkeleySource = {
  url: string;
  category: string;
  label: string;
};

export const BERKELEY_SOURCES: BerkeleySource[] = [
  // ── Directory / Triage Pages ──────────────────────────────────────────
  { url: "https://supportal.berkeley.edu/cant-find-what-you-need/resource-directory", category: "directory", label: "Support Portal Resource Directory" },
  { url: "https://studentunion.berkeley.edu/services-and-centers/", category: "directory", label: "Student Union Services & Centers" },
  { url: "https://studentunion.berkeley.edu/safety-and-wellness/", category: "directory", label: "Student Union Safety & Wellness" },
  { url: "https://www.berkeley.edu/map/", category: "directory", label: "UC Berkeley Campus Map" },
  { url: "https://callink.berkeley.edu/organizations", category: "directory", label: "CalLink Organizations Directory" },
  { url: "https://www.lib.berkeley.edu/hours", category: "directory", label: "Library Hours & Locations" },

  // ── Academic Support ──────────────────────────────────────────────────
  { url: "https://berkeley.libcal.com/", category: "academic", label: "Library Study Space Reservations" },
  { url: "https://studentcentral.berkeley.edu/", category: "academic", label: "Cal Student Central" },
  { url: "https://studentcentral.berkeley.edu/services-areas-support/", category: "academic", label: "Cal Student Central Advising" },
  { url: "https://registrar.berkeley.edu/about/", category: "academic", label: "Office of the Registrar Info" },
  { url: "https://registrar.berkeley.edu/", category: "academic", label: "Office of the Registrar" },
  { url: "https://slc.berkeley.edu/home", category: "academic", label: "Student Learning Center" },
  { url: "https://slc.berkeley.edu/writing", category: "academic", label: "SLC Writing Program" },
  { url: "https://slc.berkeley.edu/programs/writing/drop-tutoring", category: "academic", label: "SLC Writing Drop-In Tutoring" },
  { url: "https://slc.berkeley.edu/programs/writing/appointment-tutoring", category: "academic", label: "SLC Writing Appointment Tutoring" },
  { url: "https://slc.berkeley.edu/programs/science/drop-tutoring", category: "academic", label: "SLC Science Drop-In Tutoring" },
  { url: "https://slc.berkeley.edu/programs/mathematics-and-statistics/drop-tutoring", category: "academic", label: "SLC Math/Stat Drop-In Tutoring" },
  { url: "https://slc.berkeley.edu/programs/economics/drop-tutoring", category: "academic", label: "SLC Economics Drop-In Tutoring" },
  { url: "https://www.lib.berkeley.edu/visit/doe", category: "academic", label: "Doe Library" },
  { url: "https://www.lib.berkeley.edu/visit/moffitt", category: "academic", label: "Moffitt Library" },
  { url: "https://www.lib.berkeley.edu/visit/main-stacks", category: "academic", label: "Main (Gardner) Stacks" },
  { url: "https://berkeleyconnect.berkeley.edu/home", category: "academic", label: "Berkeley Connect" },
  { url: "https://berkeleyconnect.berkeley.edu/get-involved/contact-us", category: "academic", label: "Berkeley Connect Contact" },
  { url: "https://asc.berkeley.edu/home", category: "academic", label: "Athletic Study Center" },
  { url: "https://asc.berkeley.edu/about/locations", category: "academic", label: "Athletic Study Center Locations" },

  // ── Career ────────────────────────────────────────────────────────────
  { url: "https://career.berkeley.edu/", category: "career", label: "Berkeley Career Engagement" },
  { url: "https://career.berkeley.edu/about-us/contact-us/", category: "career", label: "Career Center Contact" },

  // ── Financial ─────────────────────────────────────────────────────────
  { url: "https://financialaid.berkeley.edu/", category: "financial", label: "Financial Aid & Scholarships" },
  { url: "https://financialaid.berkeley.edu/contact-us/", category: "financial", label: "Financial Aid Contact" },
  { url: "https://financialaid.berkeley.edu/center-for-financial-wellness/", category: "financial", label: "Center for Financial Wellness" },
  { url: "https://financialaid.berkeley.edu/center-for-financial-wellness/basic-needs/", category: "financial", label: "Basic Needs (Financial Aid)" },
  { url: "https://studentbilling.berkeley.edu/home", category: "financial", label: "Student Billing & Payment" },
  { url: "https://studentbilling.berkeley.edu/payments-and-refunds", category: "financial", label: "Payments & Refunds" },
  { url: "https://basicneeds.berkeley.edu/finances/other-financial-resources", category: "financial", label: "Emergency Loans & Financial Resources" },
  { url: "https://basicneeds.berkeley.edu/get-support/finances/emergency-fund", category: "financial", label: "Basic Needs Emergency Fund" },
  { url: "https://www.asucslcberkeley.org/tax-services", category: "financial", label: "ASUC Tax Services (VITA)" },
  { url: "https://undocu.berkeley.edu/financial-support/uc-berkeley-support/emergency-grants", category: "financial", label: "Undocumented Student Emergency Grants" },

  // ── Food ──────────────────────────────────────────────────────────────
  { url: "https://basicneeds.berkeley.edu/home", category: "food", label: "Basic Needs Center" },
  { url: "https://basicneeds.berkeley.edu/contact-us", category: "food", label: "Basic Needs Welcome Center" },
  { url: "https://basicneeds.berkeley.edu/pantry", category: "food", label: "Basic Needs Food Pantry" },
  { url: "https://basicneeds.berkeley.edu/calfresh", category: "food", label: "CalFresh Application Assistance" },
  { url: "https://basicneeds.berkeley.edu/faq/calfresh", category: "food", label: "CalFresh FAQ" },
  { url: "https://www.foodcollective.org/", category: "food", label: "Berkeley Student Food Collective" },

  // ── Housing ───────────────────────────────────────────────────────────
  { url: "https://basicneeds.berkeley.edu/get-support/housing/emergency-housing", category: "housing", label: "Emergency Housing Assistance" },
  { url: "https://basicneeds.berkeley.edu/housing-resources", category: "housing", label: "Basic Needs Housing Resources" },
  { url: "https://basicneeds.berkeley.edu/get-support/housing", category: "housing", label: "Basic Needs Housing Support" },
  { url: "https://housing.berkeley.edu/", category: "housing", label: "UC Berkeley Housing" },
  { url: "https://housing.berkeley.edu/contact-us/", category: "housing", label: "UC Berkeley Housing Contact" },
  { url: "https://housing.berkeley.edu/living-on-campus/front-desks-housing-facilities/", category: "housing", label: "Housing Front Desks & Facilities" },
  { url: "https://www.bsc.coop/about-us/contact-us", category: "housing", label: "Berkeley Student Cooperative" },

  // ── Health ────────────────────────────────────────────────────────────
  { url: "https://uhs.berkeley.edu/", category: "health", label: "University Health Services" },
  { url: "https://uhs.berkeley.edu/about-uhs/hours", category: "health", label: "UHS Hours of Operation" },
  { url: "https://uhs.berkeley.edu/about-uhs/directions-uhs", category: "health", label: "UHS Directions (Tang Center)" },
  { url: "https://uhs.berkeley.edu/medical/pharmacy-uhs", category: "health", label: "UHS Pharmacy" },
  { url: "https://uhs.berkeley.edu/ship", category: "health", label: "Student Health Insurance (SHIP)" },
  { url: "https://uhs.berkeley.edu/insurance-ship/how-use-ship/ship-updates", category: "health", label: "SHIP Office Hours" },
  { url: "https://uhs.berkeley.edu/about-uhs/contact-us", category: "health", label: "UHS Contact Directory" },
  { url: "https://uhs.berkeley.edu/get-care-uhs", category: "health", label: "UHS Get Care" },
  { url: "https://uhs.berkeley.edu/medical/urgent-care/local-emergency-and-urgent-care-centers", category: "health", label: "Local Emergency & Urgent Care" },

  // ── Mental Health ─────────────────────────────────────────────────────
  { url: "https://uhs.berkeley.edu/caps", category: "mental-health", label: "Counseling & Psychological Services" },
  { url: "https://uhs.berkeley.edu/counseling/urgent", category: "mental-health", label: "CAPS Urgent Mental Health" },
  { url: "https://uhs.berkeley.edu/counseling/letstalk/schedule", category: "mental-health", label: "Let's Talk Schedule" },
  { url: "https://uhs.berkeley.edu/mental-health/talk", category: "mental-health", label: "Let's Talk Overview" },

  // ── Safety ────────────────────────────────────────────────────────────
  { url: "https://care.berkeley.edu/", category: "safety", label: "PATH to Care Center" },
  { url: "https://care.berkeley.edu/how-we-support-survivors/meet-an-advocate/", category: "safety", label: "PATH to Care Advocate Hours" },
  { url: "https://ophd.berkeley.edu/", category: "safety", label: "OPHD (Title IX)" },
  { url: "https://ophd.berkeley.edu/about/contact-information", category: "safety", label: "OPHD Contact" },
  { url: "https://csi.berkeley.edu/", category: "safety", label: "Center for Support and Intervention" },
  { url: "https://csi.berkeley.edu/case-management-support/im-seeking-support/", category: "safety", label: "CSI Seeking Support" },
  { url: "https://ucpd.berkeley.edu/safety/threat-assessment-and-management", category: "safety", label: "Care Report / SOCC" },
  { url: "https://ucpd.berkeley.edu/contact-information", category: "safety", label: "UCPD Contact" },
  { url: "https://nightsafety.berkeley.edu/nightsafety/escort", category: "safety", label: "BearWALK Night Escort" },
  { url: "https://reslife.berkeley.edu/health-and-safety/personal-safety/", category: "safety", label: "Residential Life Personal Safety" },

  // ── Legal ─────────────────────────────────────────────────────────────
  { url: "https://studentaffairs.berkeley.edu/ombuds-office-for-students-postdoctoral-appointees/", category: "legal", label: "Ombuds Office" },
  { url: "https://studentaffairs.berkeley.edu/ombuds-office-for-students-postdoctoral-appointees/contact-ombuds/", category: "legal", label: "Ombuds Office Contact" },
  { url: "https://sls.berkeley.edu/", category: "legal", label: "Student Legal Services" },
  { url: "https://www.asucslcberkeley.org/", category: "legal", label: "ASUC Student Legal Clinic" },
  { url: "https://advocate.studentorg.berkeley.edu/", category: "legal", label: "Student Advocate's Office" },
  { url: "https://advocate.studentorg.berkeley.edu/contact-us/", category: "legal", label: "Student Advocate's Office Contact" },
  { url: "https://studentconduct.berkeley.edu/resources/", category: "legal", label: "Center for Student Conduct" },
  { url: "https://deanofstudents.berkeley.edu/contact-office-hours/", category: "legal", label: "Dean of Students Contact" },

  // ── Disability ────────────────────────────────────────────────────────
  { url: "https://dsp.berkeley.edu/home", category: "disability", label: "Disabled Students' Program" },
  { url: "https://dsp.berkeley.edu/contact-us", category: "disability", label: "DSP Contact" },
  { url: "https://dsp.berkeley.edu/auxiliary-service-units/proctoring", category: "disability", label: "DSP Proctoring" },
  { url: "https://dsp.berkeley.edu/faq/students/what-are-drop-hours-semester", category: "disability", label: "DSP Drop-In Hours FAQ" },
  { url: "https://dsp.berkeley.edu/spring-2026-drop-hours-and-specialist-site-days", category: "disability", label: "DSP Spring 2026 Drop-In" },

  // ── Technology ────────────────────────────────────────────────────────
  { url: "https://guides.lib.berkeley.edu/libraryequipment", category: "technology", label: "Library Equipment Lending" },
  { url: "https://guides.lib.berkeley.edu/libraryequipment/list", category: "technology", label: "Library Equipment List" },
  { url: "https://studenttech.berkeley.edu/home", category: "technology", label: "Student Technology Services" },
  { url: "https://studenttech.berkeley.edu/techsupport", category: "technology", label: "STS Tech Support" },
  { url: "https://studenttech.berkeley.edu/contact-us", category: "technology", label: "STS Contact" },
  { url: "https://studenttech.berkeley.edu/step", category: "technology", label: "Student Technology Equity Program" },
  { url: "https://studenttech.berkeley.edu/devicelending", category: "technology", label: "STS Device Lending" },
  { url: "https://calnet.berkeley.edu/it-help-desk-and-calnet-support", category: "technology", label: "CalNet / IT Help Desk" },
  { url: "https://berkeley.service-now.com/kb_view.do?sys_kb_id=453cbcad478c92d4702449df016d43eb", category: "technology", label: "Drop-In IT Support Locations" },

  // ── International Students ────────────────────────────────────────────
  { url: "https://internationaloffice.berkeley.edu/about/contact-us", category: "international", label: "Berkeley International Office Contact" },
  { url: "https://internationaloffice.berkeley.edu/students/student-services", category: "international", label: "BIO Student Services" },
  { url: "https://internationaloffice.berkeley.edu/students/student-services/in-person-advising", category: "international", label: "BIO In-Person Drop-In" },
  { url: "https://internationaloffice.berkeley.edu/virtual-student-advising", category: "international", label: "BIO Virtual Drop-In" },

  // ── Community & Identity ──────────────────────────────────────────────
  { url: "https://cejce.berkeley.edu/", category: "community", label: "CEJCE (Community Engagement)" },
  { url: "https://cejce.berkeley.edu/mcc", category: "community", label: "Multicultural Community Center" },
  { url: "https://cejce.berkeley.edu/mcc/contact", category: "community", label: "MCC Contact" },
  { url: "https://cejce.berkeley.edu/geneq", category: "community", label: "Gender Equity Resource Center" },
  { url: "https://cejce.berkeley.edu/geneq/about-geneq/hours-location-community-space", category: "community", label: "GenEq Hours & Location" },
  { url: "https://cejce.berkeley.edu/aasd", category: "community", label: "African American Student Development" },
  { url: "https://cejce.berkeley.edu/aasd/contact-aasd", category: "community", label: "AASD Contact" },
  { url: "https://cejce.berkeley.edu/apasd", category: "community", label: "Asian Pacific American Student Development" },
  { url: "https://cejce.berkeley.edu/apasd/about-apasd/contact-apasd", category: "community", label: "APASD Contact" },
  { url: "https://cejce.berkeley.edu/nasd", category: "community", label: "Native American Student Development" },
  { url: "https://cejce.berkeley.edu/nasd/nasd-programs", category: "community", label: "NASD Programs" },
  { url: "https://cejce.berkeley.edu/clsd", category: "community", label: "Chicanx Latinx Student Development" },
  { url: "https://cejce.berkeley.edu/clsd/latinx-student-resource-center", category: "community", label: "Latinx Student Resource Center" },
  { url: "https://undocu.berkeley.edu/", category: "community", label: "Undocumented Student Program" },

  // ── Student Life ──────────────────────────────────────────────────────
  { url: "https://transfers.berkeley.edu/home", category: "student-life", label: "Transfer Student Center" },
  { url: "https://transfers.berkeley.edu/about-us/contact-us", category: "student-life", label: "Transfer Student Center Contact" },
  { url: "https://reentry.berkeley.edu/", category: "student-life", label: "Re-entry Student Program" },
  { url: "https://reentry.berkeley.edu/connect/contact-us", category: "student-life", label: "Re-entry Student Program Contact" },
  { url: "https://studentparents.berkeley.edu/contact", category: "student-life", label: "Student Parent Center Contact" },
  { url: "https://studentparents.berkeley.edu/home", category: "student-life", label: "Student Parent Center" },
  { url: "https://veteran.berkeley.edu/", category: "student-life", label: "Cal Veteran Services Center" },
  { url: "https://veteran.berkeley.edu/contact-us", category: "student-life", label: "Cal Veteran Services Contact" },
  { url: "https://veteran.berkeley.edu/who-we-are/connect-us", category: "student-life", label: "Cal Veteran Services Hours" },
  { url: "https://grad.berkeley.edu/about/contact/", category: "student-life", label: "Graduate Division Contact" },
  { url: "https://grad.berkeley.edu/students/graduate-writing-center/", category: "student-life", label: "Graduate Writing Center" },
  { url: "https://grad.berkeley.edu/students/finding-community/undocugrads/", category: "student-life", label: "UndocuGrads" },
  { url: "https://recwell.berkeley.edu/", category: "wellness", label: "Recreation & Wellbeing" },
  { url: "https://recwell.berkeley.edu/facilities/recreational-sports-facility-rsf/rsf-hours/", category: "wellness", label: "RSF Hours" },
  { url: "https://recwell.berkeley.edu/facilities/recreational-sports-facility-rsf/", category: "wellness", label: "RSF Facility Info" },
  { url: "https://pt.berkeley.edu/contact-us", category: "transportation", label: "Parking & Transportation Contact" },

  // ── Supportal Pages (triage + deep-link resource pages) ───────────────
  { url: "https://supportal.berkeley.edu/", category: "directory", label: "Supportal Home" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/personal-support-services", category: "directory", label: "Supportal: Personal Support Services" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/personal-support-services/food-security", category: "food", label: "Supportal: Food Security" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/personal-support-services/housing-security", category: "housing", label: "Supportal: Housing Security" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/personal-support-services/financial-security", category: "financial", label: "Supportal: Financial Security" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/personal-support-services/mental-health", category: "mental-health", label: "Supportal: Mental Health" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/personal-support-services/alcohol-other-drugs-recovery", category: "health", label: "Supportal: Alcohol & Drug Recovery" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/personal-support-services/eating-disorders-body-image-nutrition", category: "health", label: "Supportal: Eating Disorders & Nutrition" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/personal-support-services/grief-including-student-or-employee-death", category: "mental-health", label: "Supportal: Grief & Bereavement" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/personal-support-services/physical-illness-injury", category: "health", label: "Supportal: Physical Illness & Injury" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/personal-support-services/menopause", category: "health", label: "Supportal: Menopause Resources" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/communities-and-belonging-spaces", category: "community", label: "Supportal: Communities & Belonging" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/communities-and-belonging-spaces/lgbtq-communities", category: "community", label: "Supportal: LGBTQ+ Communities" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/communities-and-belonging-spaces/people-disabilities", category: "disability", label: "Supportal: People with Disabilities" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/communities-and-belonging-spaces/religious-spiritual-communities", category: "community", label: "Supportal: Religious & Spiritual Communities" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/communities-and-belonging-spaces/spaces-belonging", category: "community", label: "Supportal: Spaces of Belonging" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/communities-and-belonging-spaces/undocumented-communities", category: "community", label: "Supportal: Undocumented Communities" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/communities-and-belonging-spaces/international-students-and-employees", category: "international", label: "Supportal: International Students" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/communities-and-belonging-spaces/campus-inclusion-programs", category: "community", label: "Supportal: Campus Inclusion Programs" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/community-centers-and-resources/first-generation-students", category: "community", label: "Supportal: First-Gen Students" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/community-centers-and-resources/formerly-incarcerated-students", category: "community", label: "Supportal: Formerly Incarcerated Students" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/community-centers-and-resources/foster-youth-current-and-former", category: "community", label: "Supportal: Foster Youth" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/community-centers-and-resources/people-who-are-pregnant-parents-caregivers", category: "student-life", label: "Supportal: Pregnant, Parents, Caregivers" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/harm-and-misconduct", category: "safety", label: "Supportal: Harm & Misconduct" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/harm-and-misconduct/sexual-violence-harassment", category: "safety", label: "Supportal: Sexual Violence & Harassment" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/harm-and-misconduct/harassment-discrimination", category: "safety", label: "Supportal: Harassment & Discrimination" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/harm-and-misconduct/hate-or-bias-incident", category: "safety", label: "Supportal: Hate or Bias Incident" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/harm-and-misconduct/concern-about-self-harm", category: "mental-health", label: "Supportal: Self-Harm Concern" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/harm-and-misconduct/conflict-resolution", category: "legal", label: "Supportal: Conflict Resolution" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/harm-and-misconduct/doxxing-and-other-online-harassment", category: "safety", label: "Supportal: Doxxing & Online Harassment" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/harm-and-misconduct/violence-or-threat-violence", category: "safety", label: "Supportal: Violence or Threat" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/campus-concerns", category: "safety", label: "Supportal: On-Campus Concerns" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/campus-concerns/campus-emergency-preparedness-and-notifications", category: "safety", label: "Supportal: Emergency Preparedness" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/campus-concerns/navigating-safely-around-campus", category: "safety", label: "Supportal: Navigating Safely" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/campus-concerns/unhoused-outreach-support", category: "community", label: "Supportal: Unhoused Outreach" },
  { url: "https://supportal.berkeley.edu/i-am-seeking-help/campus-concerns/federal-immigration-enforcement-activity-campus", category: "safety", label: "Supportal: Immigration Enforcement on Campus" },

  // ── New resources discovered from Supportal ───────────────────────────
  { url: "https://eop.berkeley.edu/", category: "community", label: "Educational Opportunity Program (EOP)" },
  { url: "https://ce3.berkeley.edu/", category: "community", label: "Centers for Educational Equity & Excellence (CE3)" },
  { url: "https://studentsupportservices.berkeley.edu/", category: "community", label: "TRIO Student Support Services" },
  { url: "https://undergroundscholars.berkeley.edu/", category: "community", label: "Berkeley Underground Scholars" },
  { url: "https://hope.berkeley.edu/", category: "community", label: "Berkeley Hope Scholars (Foster Youth)" },
  { url: "https://millerscholars.berkeley.edu/", category: "community", label: "Miller Scholars Program" },
  { url: "https://diversity.berkeley.edu/", category: "community", label: "Division of Equity & Inclusion" },
  { url: "https://uhs.berkeley.edu/bewellatwork/employee-assistance", category: "health", label: "Be Well at Work - Employee Assistance" },
  { url: "https://uhs.berkeley.edu/mental-health/getting-started-your-mental-health", category: "mental-health", label: "UHS Getting Started: Mental Health" },
  { url: "https://uhs.berkeley.edu/socialservices", category: "mental-health", label: "UHS Social Services" },
  { url: "https://uhs.berkeley.edu/mental-health/crisis-resources/supporting-campus-community-after-crisis", category: "mental-health", label: "UHS Crisis Resources" },
  { url: "https://basicneeds.berkeley.edu/graduate-students", category: "food", label: "Basic Needs: Graduate Student Resources" },
  { url: "https://financialaid.berkeley.edu/types-of-aid-at-berkeley/loans/short-term-emergency-loan/", category: "financial", label: "Short-Term Emergency Loan Details" },

  // ═══════════════════════════════════════════════════════════════════════
  // OFF-CAMPUS & COMMUNITY RESOURCES (non-.edu)
  // ═══════════════════════════════════════════════════════════════════════

  // ── Community Food Resources ───────────────────────────────────────────
  { url: "https://www.accfb.org/", category: "food", label: "Alameda County Community Food Bank" },
  { url: "https://www.accfb.org/get-food/", category: "food", label: "ACCFB Find Food Near You" },
  { url: "https://www.berkeleyfoodnetwork.org/", category: "food", label: "Berkeley Food Network" },
  { url: "https://www.berkeleyfoodnetwork.org/find-food", category: "food", label: "Berkeley Food Network Pantry Locator" },
  { url: "https://dorothyday.org/", category: "food", label: "Dorothy Day House (Free Meals)" },
  { url: "https://www.projectopenhand.org/", category: "food", label: "Project Open Hand (Free Meals & Groceries)" },
  { url: "https://www.foodpantries.org/ci/ca-berkeley", category: "food", label: "Berkeley Food Pantry Directory" },
  { url: "https://www.211alamedacounty.org/", category: "food", label: "211 Alameda County (All Social Services)" },

  // ── Community Housing & Shelter ────────────────────────────────────────
  { url: "https://www.yeahberkeley.org/", category: "housing", label: "YEAH! Youth Emergency Assistance Hostel" },
  { url: "https://www.cityofberkeley.info/rent/", category: "housing", label: "Berkeley Rent Stabilization Board" },
  { url: "https://www.bfrb.org/", category: "housing", label: "Berkeley Food & Housing Project" },
  { url: "https://www.evictiondefensecenter.org/", category: "housing", label: "Eviction Defense Center" },
  { url: "https://www.housingandcommunity.org/", category: "housing", label: "Housing & Community Development (Alameda)" },

  // ── Community Health & Medical ─────────────────────────────────────────
  { url: "https://www.lifelongmedical.org/", category: "health", label: "LifeLong Medical Care" },
  { url: "https://www.lifelongmedical.org/locations/", category: "health", label: "LifeLong Medical Locations" },
  { url: "https://suitcaseclinic.org/", category: "health", label: "Suitcase Clinic (Free Health Clinic)" },
  { url: "https://www.plannedparenthood.org/health-center/california/berkeley", category: "health", label: "Planned Parenthood Berkeley" },
  { url: "https://www.berkeleycitycollege.edu/wp/health/community-resources/", category: "health", label: "Berkeley Community Health Resources" },

  // ── Government Programs ────────────────────────────────────────────────
  { url: "https://www.getcalfresh.org/", category: "financial", label: "GetCalFresh (CalFresh Application)" },
  { url: "https://www.cdss.ca.gov/calfresh", category: "financial", label: "CalFresh (CA SNAP Benefits)" },
  { url: "https://www.coveredca.com/", category: "health", label: "Covered California (Health Insurance)" },
  { url: "https://www.dhcs.ca.gov/services/medi-cal", category: "health", label: "Medi-Cal (Free Health Insurance)" },
  { url: "https://studentaid.gov/", category: "financial", label: "Federal Student Aid (FAFSA)" },
  { url: "https://studentaid.gov/h/apply-for-aid/fafsa", category: "financial", label: "FAFSA Application" },
  { url: "https://www.benefits.gov/", category: "financial", label: "Benefits.gov (Federal Benefits Finder)" },
  { url: "https://edd.ca.gov/", category: "financial", label: "CA Employment Development Dept (EDD)" },
  { url: "https://www.csac.ca.gov/cal-grant", category: "financial", label: "Cal Grant (State Financial Aid)" },
  { url: "https://www.ssa.gov/benefits/ssi/", category: "financial", label: "SSI Benefits (Social Security)" },

  // ── Mental Health Hotlines & Crisis Resources ──────────────────────────
  { url: "https://988lifeline.org/", category: "mental-health", label: "988 Suicide & Crisis Lifeline" },
  { url: "https://www.crisistextline.org/", category: "mental-health", label: "Crisis Text Line (Text HOME to 741741)" },
  { url: "https://translifeline.org/", category: "mental-health", label: "Trans Lifeline" },
  { url: "https://www.thetrevorproject.org/", category: "mental-health", label: "The Trevor Project (LGBTQ+ Crisis)" },
  { url: "https://www.namieastbay.org/", category: "mental-health", label: "NAMI East Bay (Mental Health Support)" },
  { url: "https://www.samhsa.gov/find-help/national-helpline", category: "mental-health", label: "SAMHSA National Helpline" },
  { url: "https://www.nami.org/help", category: "mental-health", label: "NAMI HelpLine & Resources" },

  // ── Community Legal Resources ──────────────────────────────────────────
  { url: "https://bfrb.org/", category: "legal", label: "Bay Area Legal Aid" },
  { url: "https://www.centrolegal.org/", category: "legal", label: "Centro Legal de la Raza" },
  { url: "https://ebclc.org/", category: "legal", label: "East Bay Community Law Center" },
  { url: "https://lsc.gov/about-lsc/what-legal-aid/get-legal-help", category: "legal", label: "Legal Services Corporation (Find Legal Aid)" },
  { url: "https://www.lawhelpca.org/", category: "legal", label: "LawHelp California (Free Legal Help)" },

  // ── Transportation ─────────────────────────────────────────────────────
  { url: "https://www.actransit.org/", category: "transportation", label: "AC Transit (East Bay Bus)" },
  { url: "https://www.actransit.org/maps-schedules", category: "transportation", label: "AC Transit Maps & Schedules" },
  { url: "https://www.bart.gov/", category: "transportation", label: "BART (Bay Area Rapid Transit)" },
  { url: "https://www.bart.gov/stations/dbrk", category: "transportation", label: "Downtown Berkeley BART Station" },
  { url: "https://www.cityofberkeley.info/parking/", category: "transportation", label: "City of Berkeley Parking Info" },

  // ── General Community & Student Life ───────────────────────────────────
  { url: "https://www.berkeleypubliclibrary.org/", category: "community", label: "Berkeley Public Library" },
  { url: "https://www.cityofberkeley.info/Community_Services/", category: "community", label: "City of Berkeley Community Services" },
  { url: "https://www.volunteermatch.org/search?l=Berkeley%2C+CA", category: "community", label: "VolunteerMatch Berkeley" },
  { url: "https://www.unitedwayba.org/", category: "community", label: "United Way Bay Area" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  directory: "Resource Directories",
  academic: "Academic Support",
  career: "Career & Jobs",
  financial: "Financial Aid & Money",
  food: "Food & Basic Needs",
  housing: "Housing",
  health: "Health & Medical",
  "mental-health": "Mental Health & Counseling",
  safety: "Safety & Emergency",
  legal: "Legal Services",
  disability: "Disability & Accessibility",
  technology: "Technology & IT",
  international: "International Students",
  community: "Community & Identity",
  "student-life": "Student Life",
  wellness: "Recreation & Wellbeing",
  transportation: "Transportation",
};
