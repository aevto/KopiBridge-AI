import { describe, expect, it } from "vitest";
import { analyseResumeAgainstJob } from "@/lib/analyse";
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME } from "@/lib/sampleData";

describe("deterministic report guidance", () => {
  it("produces grounded claim labels and an actionable recommendation", () => {
    const report = analyseResumeAgainstJob(
      SAMPLE_RESUME,
      SAMPLE_JOB_DESCRIPTION,
    );
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.existingStrengths.length).toBeGreaterThan(0);
    expect(report.evidenceMap.some((item) => item.claimStatus === "safe")).toBe(
      true,
    );
    expect(
      report.evidenceMap.some((item) => item.claimStatus === "needs-proof"),
    ).toBe(true);
    expect(report.actionRoadmap.map((group) => group.period)).toEqual([
      "Today",
      "This week",
      "This month",
      "Longer term",
    ]);
    expect(report.interviewPreparation.questions).toHaveLength(5);
    expect(report.finalRecommendation.nextStep.length).toBeGreaterThan(20);
  });

  it("does not invent numeric outcomes in bullet rewrites", () => {
    const report = analyseResumeAgainstJob(
      SAMPLE_RESUME,
      SAMPLE_JOB_DESCRIPTION,
    );
    expect(
      report.bulletRewrites.every((item) =>
        /verified result|preserves|original/i.test(
          `${item.suggested} ${item.whyStronger}`,
        ),
      ),
    ).toBe(true);
  });
});
