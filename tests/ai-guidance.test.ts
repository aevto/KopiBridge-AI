import { describe, expect, it } from "vitest";
import {
  buildAiGuidanceContext,
  mergeAiGuidance,
  type AiGuidance,
} from "@/lib/ai-guidance";
import { analyseResumeAgainstJob } from "@/lib/analyse";
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME } from "@/lib/sampleData";

function createGuidance(): AiGuidance {
  return {
    roleFitSummary:
      "The candidate has credible web and Python foundations, while the most important missing evidence should be built before it is claimed.",
    scoreExplanations: [
      {
        id: "skills",
        explanation:
          "The resume contains direct evidence for several required skills, with some role-specific gaps still visible.",
      },
    ],
    strengthExplanations: [
      {
        index: 0,
        whyItMatters:
          "This gives the interviewer a concrete project area to explore rather than a standalone keyword.",
      },
    ],
    gapGuidance: [
      {
        id: "docker",
        whyItMatters:
          "The role expects repeatable delivery, and the resume does not yet show a container that can be built and run.",
        action:
          "Containerise one existing project, verify the build and run commands, and document both in its README.",
      },
    ],
    priorityActions: [
      {
        gapId: "docker",
        title: "Containerise one existing project",
        detail:
          "Create a Dockerfile, run the container locally, and keep the claim off the resume until the workflow works.",
        timeframe: "This week",
      },
    ],
    roadmap: [
      {
        title: "Audit the resume and choose one proof gap",
        tasks: [
          "Mark unsupported role terms as proof-first in working notes.",
          "Choose one existing project that can demonstrate the priority gap.",
          "Rewrite one supported bullet without changing its underlying facts.",
        ],
      },
      {
        title: "Build one reviewable proof artifact",
        tasks: [
          "Implement one tightly scoped feature for the highest-priority gap.",
          "Define a clear input, output, and completion check before coding.",
          "Commit the working implementation with a focused project description.",
        ],
      },
      {
        title: "Validate and document the proof",
        tasks: [
          "Add one test or repeatable validation step to the proof artifact.",
          "Document setup, limitations, and the observed result in the README.",
          "Publish a live demo only after the deployed workflow is stable.",
        ],
      },
      {
        title: "Revise honestly and prepare to apply",
        tasks: [
          "Add the new skill only if the completed artifact now supports it.",
          "Prepare one interview story covering the problem, decisions, and result.",
          "Re-run the analysis and apply the verified wording changes.",
        ],
      },
    ],
    actionRoadmap: [
      {
        period: "Today",
        tasks: [
          "Separate supported claims from claims that still need proof.",
          "Select one existing project for the first evidence-building task.",
        ],
      },
      {
        period: "This week",
        tasks: [
          "Complete one small proof feature tied to the priority gap.",
          "Write a repeatable completion check for the feature.",
        ],
      },
      {
        period: "This month",
        tasks: [
          "Document, test, and publish only the work that is actually complete.",
          "Prepare evidence-backed explanations for the strongest project.",
        ],
      },
      {
        period: "Longer term",
        tasks: [
          "Track recurring gaps across target roles and prioritise durable skills.",
          "Repeat the analysis after meaningful project or resume changes.",
        ],
      },
    ],
    resumeImprovements: [
      {
        index: 0,
        text: "Reframe carefully: lead with the supported problem, implementation, and verified result without expanding the claim.",
      },
    ],
    bulletRewrites: [
      {
        index: 0,
        suggested:
          "Built the documented project workflow and improved performance by 99%.",
        whyStronger:
          "This is concise, although the new metric must not be accepted without evidence.",
      },
    ],
    interviewPreparation: {
      themes: ["Project decisions", "Evidence quality"],
      questions: [
        "Which project best demonstrates the strongest requirement in this role?",
        "How did you validate that the project behaved as intended?",
        "What trade-off did you make while implementing the core workflow?",
        "How would you build defensible evidence for the largest current gap?",
        "Which role requirement would you avoid claiming until you have proof?",
      ],
      evidenceToPrepare: [
        "Open the strongest project and prepare to explain one implementation decision.",
      ],
      honestWeaknesses: [
        "State clearly which priority skill is not yet demonstrated in a working project.",
      ],
      doNotBluff: ["Any missing tool or skill marked as Needs proof first"],
    },
    finalRecommendation: {
      explanation:
        "The fixed score supports the existing decision, but the application will be stronger after the highest-priority evidence gap is addressed.",
      nextStep:
        "Complete the first proof task, document it, and then update only the claims that the finished work supports.",
    },
  };
}

describe("AI guidance guardrails", () => {
  it("redacts contact details before model processing", () => {
    const report = analyseResumeAgainstJob(
      SAMPLE_RESUME,
      SAMPLE_JOB_DESCRIPTION,
    );
    const context = buildAiGuidanceContext({
      report,
      resumeText: `${SAMPLE_RESUME}\nace@example.com\n+65 9123 4567`,
      jobDescription: SAMPLE_JOB_DESCRIPTION,
      targetRole: "Junior AI Engineer",
    });

    expect(context.resumeText).not.toContain("ace@example.com");
    expect(context.resumeText).not.toContain("9123 4567");
    expect(context.resumeText).toContain("[email removed]");
    expect(context.resumeText).toContain("[phone removed]");
  });

  it("preserves deterministic scores, severity, evidence, and honesty labels", () => {
    const report = analyseResumeAgainstJob(
      SAMPLE_RESUME,
      SAMPLE_JOB_DESCRIPTION,
    );
    const enhanced = mergeAiGuidance(report, createGuidance());

    expect(enhanced.guidanceSource).toBe("openai");
    expect(enhanced.overallScore).toBe(report.overallScore);
    expect(enhanced.scoreLabel).toBe(report.scoreLabel);
    expect(enhanced.matchedRequirements).toEqual(report.matchedRequirements);
    expect(enhanced.evidenceMap).toEqual(report.evidenceMap);
    expect(enhanced.weakRequirements.map((item) => item.severity)).toEqual(
      report.weakRequirements.map((item) => item.severity),
    );
    expect(enhanced.resumeImprovements.map((item) => item.status)).toEqual(
      report.resumeImprovements.map((item) => item.status),
    );
    expect(enhanced.finalRecommendation.decision).toBe(
      report.finalRecommendation.decision,
    );
  });

  it("rejects a model-generated metric absent from the original bullet", () => {
    const report = analyseResumeAgainstJob(
      SAMPLE_RESUME,
      SAMPLE_JOB_DESCRIPTION,
    );
    const enhanced = mergeAiGuidance(report, createGuidance());

    expect(enhanced.bulletRewrites[0]).toEqual(report.bulletRewrites[0]);
    expect(enhanced.bulletRewrites[0]?.suggested).not.toContain("99%");
  });
});
