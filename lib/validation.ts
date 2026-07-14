import { z } from "zod";

const trimmedText = (minimum: number, maximum: number, label: string) =>
  z
    .string()
    .trim()
    .min(minimum, `${label} is too short for a useful analysis.`)
    .max(maximum, `${label} is too long.`);

export const analysisRequestSchema = z
  .object({
    resumeText: trimmedText(80, 50_000, "Resume text"),
    jobDescription: trimmedText(80, 30_000, "Job description"),
    targetRole: trimmedText(2, 120, "Target role"),
    company: z
      .string()
      .trim()
      .max(120, "Company name is too long.")
      .optional()
      .default(""),
    resumeFilename: z
      .string()
      .trim()
      .max(180, "Resume filename is too long.")
      .optional()
      .default(""),
    idempotencyKey: z.uuid("Invalid analysis request identifier."),
  })
  .strict();

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

export const authSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
});
