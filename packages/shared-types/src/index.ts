export type SummaryAnswerDTO = {
  key: string;
  prompt: string;
  answer: string;
};

export type ResourceCardDTO = {
  id: string;
  name: string;
  shortDescription: string;
  category: string;
  openStatus: string;
  locationSummary: string;
  requirementsLink?: string | null;
  keyPoints: string[];
};

export type ResourceDetailDTO = {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription?: string | null;
  eligibilityText: string;
  walkInAllowed: boolean;
  isAppointmentRequired: boolean;
  whatToBring: string[];
  requirementsLink?: string | null;
  websiteUrl?: string | null;
  officialUrl?: string | null;
  keyPoints: string[];
  answers: SummaryAnswerDTO[];
};

export type UserProfileDTO = {
  studentType?: string | null;
  year?: string | null;
  identities: string[];
  financialSituation?: string | null;
  topics: string[];
};
