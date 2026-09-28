import { describe, expect, it } from "vitest";
import {
  feedbackSchema,
  groundedFeedbackSchema,
  imageRequestSchema,
  interviewRequestSchema,
  validateFeedbackQuotes,
  validateImageDataUrl,
  validatePcmWav,
  localInterviewFeedback,
} from "@/lib/multimodal";
import { analyseResumeAgainstJob } from "@/lib/analyse";
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME } from "@/lib/sampleData";

function wav(seconds = 1, amplitude = 0.1) {
  const bytes = Buffer.alloc(44 + 32_000 * seconds);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(16_000, 24);
  bytes.writeUInt32LE(32_000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(bytes.length - 44, 40);
  for (let i = 44; i < bytes.length; i += 2)
    bytes.writeInt16LE(Math.round(amplitude * 32767 * Math.sin(i)), i);
  return bytes;
}

describe("bounded, consented media inputs", () => {
  it("requires consent, a request key, supported formats, and at most three images", () => {
    const input = {
      images: ["data:image/png;base64,aGVsbG8="],
      consent: true,
      idempotencyKey: crypto.randomUUID(),
    };
    expect(imageRequestSchema.safeParse(input).success).toBe(true);
    expect(
      imageRequestSchema.safeParse({ ...input, consent: false }).success,
    ).toBe(false);
    expect(
      imageRequestSchema.safeParse({
        ...input,
        images: Array(4).fill(input.images[0]),
      }).success,
    ).toBe(false);
    expect(() => validateImageDataUrl(input.images[0])).toThrow();
  });
  it("computes duration from verified PCM bytes, not submitted metadata", () => {
    expect(validatePcmWav(wav(90))).toBe(90);
    expect(() => validatePcmWav(wav(91))).toThrow();
    expect(() => validatePcmWav(wav(1, 0))).toThrow(/audible/);
    const spoof = wav();
    spoof.writeUInt32LE(1, 40);
    expect(() => validatePcmWav(spoof)).toThrow();
    expect(() => validatePcmWav(Buffer.from("RIFF"))).toThrow();
  });
  it("rejects user identity injection and unbounded interview answers", () => {
    const input = {
      questionIndex: 0,
      transcript: "I built a small Python API for a class project.",
      idempotencyKey: crypto.randomUUID(),
      consent: true,
    };
    expect(interviewRequestSchema.safeParse(input).success).toBe(true);
    expect(
      interviewRequestSchema.safeParse({
        ...input,
        userId: crypto.randomUUID(),
      }).success,
    ).toBe(false);
    expect(
      interviewRequestSchema.safeParse({
        ...input,
        transcript: "x".repeat(8001),
      }).success,
    ).toBe(false);
    expect(
      interviewRequestSchema.safeParse({ ...input, questionIndex: 5 }).success,
    ).toBe(false);
  });
});

describe("interview grounding", () => {
  const report = analyseResumeAgainstJob(SAMPLE_RESUME, SAMPLE_JOB_DESCRIPTION);
  it("restricts output citations to actual transcript spans", () => {
    const feedback = localInterviewFeedback(report);
    const schema = groundedFeedbackSchema(
      "I built a Python API. I tested validation.",
    );
    feedback.strengths = [
      { quote: "I built a Python API.", explanation: "A concrete action." },
    ];
    expect(schema.safeParse(feedback).success).toBe(true);
    feedback.strengths[0].quote = "I deployed the API on AWS.";
    expect(schema.safeParse(feedback).success).toBe(false);
  });
  it("rejects invented quotations", () => {
    const feedback = localInterviewFeedback(report);
    feedback.strengths = [
      {
        quote: "I deployed on AWS",
        explanation: "Specific deployment evidence.",
      },
    ];
    expect(() =>
      validateFeedbackQuotes(feedback, "I built a Python API."),
    ).toThrow(/not in the answer/);
    feedback.strengths[0].quote = "built a Python API";
    expect(validateFeedbackQuotes(feedback, "I built a Python API.")).toEqual(
      feedback,
    );
  });
  it("provides an explicitly labelled local checklist without changing the assessment", () => {
    const original = structuredClone(report);
    const feedback = localInterviewFeedback(report);
    expect(feedbackSchema.safeParse(feedback).success).toBe(true);
    expect(feedback.summary).toContain("not an assessment of your answer");
    expect(report).toEqual(original);
  });
});
