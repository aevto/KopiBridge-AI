import { describe, expect, it } from "vitest";
import { analysisRequestSchema } from "@/lib/validation";

const validRequest = {
  resumeText:
    "Python and TypeScript project evidence with a working API, tests, documentation, deployment notes, and clear outcomes.",
  jobDescription:
    "We need a junior AI engineer with Python, SQL, APIs, testing, communication, and deployment experience.",
  targetRole: "Junior AI Engineer",
  company: "Example Co",
  resumeFilename: "resume.pdf",
  idempotencyKey: "9b6577b0-c9d4-4a12-b668-a4ba8d262d87",
};

describe("analysis request validation", () => {
  it("accepts a bounded, complete request", () => {
    expect(analysisRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects client-supplied identity fields", () => {
    expect(
      analysisRequestSchema.safeParse({
        ...validRequest,
        userId: "someone-else",
      }).success,
    ).toBe(false);
  });

  it("rejects short content before a credit can be reserved", () => {
    expect(
      analysisRequestSchema.safeParse({
        ...validRequest,
        resumeText: "too short",
      }).success,
    ).toBe(false);
  });
});
