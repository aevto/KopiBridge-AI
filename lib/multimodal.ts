import { z } from "zod";
import type { AnalysisResult } from "@/types/analysis";

export const MEDIA_LIMITS = {
  imagePages: 3,
  imageRequestBytes: 3_800_000,
  audioSeconds: 90,
  audioSampleRate: 16_000,
  audioBytes: 90 * 16_000 * 2 + 44,
  dailyAttempts: 6,
} as const;

export const imageRequestSchema = z
  .object({
    images: z
      .array(
        z
          .string()
          .max(1_500_000)
          .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/),
      )
      .min(1)
      .max(MEDIA_LIMITS.imagePages),
    idempotencyKey: z.uuid(),
    consent: z.literal(true),
  })
  .strict();

export const extractionSchema = z.object({
  text: z.string().max(50_000),
  warnings: z.array(z.string().max(300)).max(5),
});

export const feedbackSchema = z.object({
  summary: z.string().min(20).max(800),
  strengths: z
    .array(
      z.object({
        quote: z.string().min(3).max(350),
        explanation: z.string().max(500),
      }),
    )
    .max(3),
  improvements: z
    .array(
      z.object({
        quote: z.string().min(3).max(350),
        advice: z.string().max(500),
      }),
    )
    .max(3),
  nextSteps: z.array(z.string().min(10).max(400)).min(1).max(3),
  cautions: z.array(z.string().max(400)).max(3),
});

export const interviewRequestSchema = z
  .object({
    questionIndex: z.number().int().min(0).max(4),
    transcript: z
      .string()
      .trim()
      .min(30, "Add at least 30 characters to your answer.")
      .max(8_000),
    idempotencyKey: z.uuid(),
    consent: z.literal(true),
  })
  .strict();

export type InterviewFeedback = z.infer<typeof feedbackSchema>;

// Constrain generated citations to source spans, not model-rewritten quotations.
export function groundedFeedbackSchema(transcript: string) {
  const excerpts = (transcript.match(/[^.!?\n]+[.!?]?/g) || [transcript])
    .flatMap((sentence) => sentence.match(/[\s\S]{1,300}/g) || [])
    .map((excerpt) => excerpt.trim())
    .filter((excerpt) => excerpt.length >= 3);
  if (!excerpts.length)
    throw new Error("The answer contains no usable excerpts.");
  const quote = z.enum(excerpts as [string, ...string[]]);
  return feedbackSchema.extend({
    strengths: z
      .array(z.object({ quote, explanation: z.string().max(500) }))
      .max(3),
    improvements: z
      .array(z.object({ quote, advice: z.string().max(500) }))
      .max(3),
  });
}
export interface InterviewPractice {
  id: string;
  question: string;
  transcript: string;
  feedback: InterviewFeedback;
  source: "openai" | "local";
  model: string;
  created_at: string;
}

export function validateFeedbackQuotes(
  feedback: InterviewFeedback,
  transcript: string,
) {
  const normalise = (text: string) =>
    text.toLowerCase().replace(/\s+/g, " ").trim();
  const source = normalise(transcript);
  if (
    [...feedback.strengths, ...feedback.improvements].some(
      (item) => !source.includes(normalise(item.quote)),
    )
  ) {
    throw new Error("Feedback cited words that are not in the answer.");
  }
  return feedback;
}

export function localInterviewFeedback(
  report: AnalysisResult,
): InterviewFeedback {
  return {
    summary:
      "AI feedback is unavailable. Your reviewed answer is saved with this preparation checklist. This checklist is based on your resume report, not an assessment of your answer.",
    strengths: [],
    improvements: [],
    nextSteps: [
      "Check that your answer names your own action, the technology used, and a result you can substantiate.",
      report.interviewPreparation.evidenceToPrepare[0] ||
        "Prepare one working project artifact that supports your answer.",
      "Separate what you implemented from what you would like to learn. Do not add unverified claims to your resume.",
    ],
    cautions: [
      "A spoken claim is not verified experience. This practice never changes the original score or honesty labels.",
    ],
  };
}

// The browser normalises audio to this single format, so the server can verify
// duration from the bytes instead of trusting client-provided metadata.
export function validatePcmWav(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...bytes.slice(offset, offset + length));
  if (
    bytes.length < 44 ||
    bytes.length > MEDIA_LIMITS.audioBytes ||
    ascii(0, 4) !== "RIFF" ||
    ascii(8, 4) !== "WAVE" ||
    ascii(12, 4) !== "fmt " ||
    view.getUint32(16, true) !== 16 ||
    view.getUint16(20, true) !== 1 ||
    view.getUint16(22, true) !== 1 ||
    view.getUint32(24, true) !== 16_000 ||
    view.getUint32(28, true) !== 32_000 ||
    view.getUint16(32, true) !== 2 ||
    view.getUint16(34, true) !== 16 ||
    ascii(36, 4) !== "data" ||
    view.getUint32(4, true) !== bytes.length - 8 ||
    view.getUint32(40, true) !== bytes.length - 44 ||
    (bytes.length - 44) % 2 !== 0
  ) {
    throw new Error(
      "Use a recording or audio file of up to 90 seconds, converted by the upload control.",
    );
  }
  const samples = (bytes.length - 44) / 2;
  if (samples < 8_000)
    throw new Error("Record at least half a second of speech.");
  let energy = 0;
  for (let offset = 44; offset < bytes.length; offset += 2)
    energy += (view.getInt16(offset, true) / 32768) ** 2;
  if (Math.sqrt(energy / samples) < 0.001)
    throw new Error(
      "No audible speech was found. Check your microphone or use a different recording.",
    );
  return samples / MEDIA_LIMITS.audioSampleRate;
}

export function validateImageDataUrl(value: string) {
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+=*)$/.exec(
    value,
  );
  if (!match) throw new Error("Unsupported image format.");
  const bytes = Buffer.from(match[2], "base64");
  const valid =
    match[1] === "png"
      ? bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : match[1] === "jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.subarray(0, 4).toString() === "RIFF" &&
          bytes.subarray(8, 12).toString() === "WEBP";
  if (!valid) throw new Error("The file contents do not match the image type.");
}
