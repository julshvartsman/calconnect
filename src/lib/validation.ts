import { z } from "zod";

export const locationInputSchema = z
  .object({
    address: z.string().min(1),
    buildingName: z.string().optional().nullable(),
    room: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .nullable()
  .optional();

export const resourceInputSchema = z.object({
  name: z.string().min(2),
  shortDescription: z.string().min(5),
  fullDescription: z.string().optional().nullable(),
  eligibilityText: z.string().min(2),
  isAppointmentRequired: z.boolean().default(false),
  walkInAllowed: z.boolean().default(true),
  whatToBring: z.array(z.string()).default([]),
  requirementsLink: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  officialUrl: z.string().url().optional().nullable(),
  hoursJson: z.record(z.string(), z.unknown()).optional().nullable(),
  isActive: z.boolean().default(true),
  categoryId: z.string().min(1),
  location: locationInputSchema,
  tagIds: z.array(z.string()).default([]),
  providerId: z.string().optional().nullable(),
});

export const profileInputSchema = z.object({
  studentType: z.string().optional().nullable(),
  year: z.string().optional().nullable(),
  identities: z.array(z.string()).default([]),
  financialSituation: z.string().optional().nullable(),
  topics: z.array(z.string()).default([]),
});

export type ResourceInput = z.infer<typeof resourceInputSchema>;
