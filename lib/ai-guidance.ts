import { z } from "zod";
import type { AnalysisResult, GapItem, PriorityAction } from "@/types/analysis";

const shortText = z.string().trim().min(8).max(320);
const taskText = z.string().trim().min(8).max(260);

export const aiGuidanceSchema = z.object({
  roleFitSummary: z.string().trim().min(30).max(700),
  scoreExplanations: z
    .array(
      z.object({
        id: z.enum([
          "skills",
          "experience",
          "tools",
          "education",
          "communication",
        ]),
        explanation: shortText,
      }),
    )
    .max(5),
  strengthExplanations: z
    .array(
      z.object({
        index: z.number().int().min(0).max(3),
        whyItMatters: shortText,
      }),
    )
    .max(4),
  gapGuidance: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        whyItMatters: shortText,
        action: z.string().trim().min(12).max(360),
      }),
    )
    .max(10),
  priorityActions: z
    .array(
      z.object({
        gapId: z.string().trim().min(1).max(80),
        title: z.string().trim().min(8).max(180),
        detail: z.string().trim().min(12).max(420),
        timeframe: z.string().trim().min(3).max(80),
      }),
    )
    .min(1)
    .max(3),
  roadmap: z
    .array(
      z.object({
        title: z.string().trim().min(5).max(120),
        tasks: z.array(taskText).length(3),
      }),
    )
    .length(4),
  actionRoadmap: z
    .array(
      z.object({
        period: z.enum(["Today", "This week", "This month", "Longer term"]),
        tasks: z.array(taskText).min(2).max(3),
      }),
    )
    .length(4),
  resumeImprovements: z
    .array(
      z.object({
        index: z.number().int().min(0).max(5),
        text: z.string().trim().min(12).max(420),
      }),
    )
    .max(6),
  bulletRewrites: z
    .array(
      z.object({
        index: z.number().int().min(0).max(1),
        suggested: z.string().trim().min(12).max(500),
        whyStronger: z.string().trim().min(12).max(360),
      }),
    )
    .max(2),
  interviewPreparation: z.object({
    themes: z.array(z.string().trim().min(2).max(100)).min(2).max(5),
    questions: z.array(z.string().trim().min(10).max(260)).length(5),
    evidenceToPrepare: z.array(taskText).min(1).max(5),
    honestWeaknesses: z.array(taskText).max(5),
    doNotBluff: z.array(z.string().trim().min(2).max(120)).max(5),
  }),
  finalRecommendation: z.object({
    explanation: z.string().trim().min(20).max(600),
    nextStep: z.string().trim().min(12).max(360),
  }),
});

export type AiGuidance = z.infer<typeof aiGuidanceSchema>;

export interface AiGuidanceInput {
  report: AnalysisResult;
  resumeText: string;
  jobDescription: string;
  targetRole: string;
  company?: string;
}

export function buildAiGuidanceContext(input: AiGuidanceInput) {
  const { report } = input;

  return {
    targetRole: cleanUntrustedText(input.targetRole, 120),
    company: cleanUntrustedText(input.company || "Not specified", 120),
    resumeText: redactContactDetails(input.resumeText, 24_000),
    jobDescription: redactContactDetails(input.jobDescription, 20_000),
    fixedAssessment: redactNestedText({
      overallScore: report.overallScore,
      scoreLabel: report.scoreLabel,
      finalDecision: report.finalRecommendation.decision,
      scoreBreakdown: report.scoreBreakdown,
      matchedRequirements: report.matchedRequirements,
      weakRequirements: report.weakRequirements,
      evidenceMap: report.evidenceMap,
      existingStrengths: report.existingStrengths,
      priorityActions: report.priorityActions,
      roadmap: report.roadmap,
      actionRoadmap: report.actionRoadmap,
      resumeImprovements: report.resumeImprovements,
      bulletRewrites: report.bulletRewrites,
    }),
  };
}

export function mergeAiGuidance(
  report: AnalysisResult,
  guidance: AiGuidance,
): AnalysisResult {
  const scoreExplanations = new Map(
    guidance.scoreExplanations.map((item) => [item.id, item.explanation]),
  );
  const strengthExplanations = new Map(
    guidance.strengthExplanations.map((item) => [
      item.index,
      item.whyItMatters,
    ]),
  );
  const gapGuidance = new Map(
    guidance.gapGuidance.map((item) => [item.id, item]),
  );
  const gapById = new Map(report.weakRequirements.map((gap) => [gap.id, gap]));
  const priorityActions = mergePriorityActions(
    report.priorityActions,
    guidance.priorityActions,
    gapById,
  );
  const resumeImprovements = new Map(
    guidance.resumeImprovements.map((item) => [item.index, item.text]),
  );
  const bulletRewrites = new Map(
    guidance.bulletRewrites.map((item) => [item.index, item]),
  );

  return {
    ...report,
    guidanceSource: "openai",
    roleFitSummary: guidance.roleFitSummary,
    scoreBreakdown: report.scoreBreakdown.map((item) => ({
      ...item,
      explanation: scoreExplanations.get(item.id) ?? item.explanation,
    })),
    existingStrengths: report.existingStrengths.map((item, index) => ({
      ...item,
      whyItMatters: strengthExplanations.get(index) ?? item.whyItMatters,
    })),
    weakRequirements: report.weakRequirements.map((gap) => {
      const enhanced = gapGuidance.get(gap.id);
      return enhanced
        ? {
            ...gap,
            whyItMatters: enhanced.whyItMatters,
            action: enhanced.action,
          }
        : gap;
    }),
    priorityActions,
    roadmap: report.roadmap.map((week, index) => ({
      week: week.week,
      title: guidance.roadmap[index]?.title ?? week.title,
      tasks: guidance.roadmap[index]?.tasks ?? week.tasks,
    })),
    actionRoadmap: report.actionRoadmap.map((group, index) => ({
      period: group.period,
      tasks:
        guidance.actionRoadmap[index]?.period === group.period
          ? guidance.actionRoadmap[index].tasks
          : group.tasks,
    })),
    resumeImprovements: report.resumeImprovements.map((item, index) => ({
      status: item.status,
      text: resumeImprovements.get(index) ?? item.text,
    })),
    bulletRewrites: report.bulletRewrites.map((item, index) => {
      const enhanced = bulletRewrites.get(index);
      if (
        !enhanced ||
        containsUnsupportedNumber(enhanced.suggested, item.original)
      ) {
        return item;
      }
      return {
        original: item.original,
        status: item.status,
        suggested: enhanced.suggested,
        whyStronger: enhanced.whyStronger,
      };
    }),
    interviewPreparation: guidance.interviewPreparation,
    finalRecommendation: {
      decision: report.finalRecommendation.decision,
      explanation: guidance.finalRecommendation.explanation,
      nextStep: guidance.finalRecommendation.nextStep,
    },
  };
}

function mergePriorityActions(
  fallback: PriorityAction[],
  suggestions: AiGuidance["priorityActions"],
  gapById: Map<string, GapItem>,
) {
  const merged = suggestions.flatMap<PriorityAction>((suggestion) => {
    const gap = gapById.get(suggestion.gapId);
    if (!gap) return [];
    const unprefixedTitle = suggestion.title.replace(
      /^needs proof first:\s*/i,
      "",
    );
    return [
      {
        title: `Needs proof first: ${unprefixedTitle}`,
        detail: suggestion.detail,
        severity: gap.severity,
        timeframe: suggestion.timeframe,
      },
    ];
  });

  return merged.length ? merged : fallback;
}

function cleanUntrustedText(value: string, maximum: number) {
  return Array.from(value)
    .map((character) => {
      const code = character.charCodeAt(0);
      return (code < 32 && code !== 9 && code !== 10 && code !== 13) ||
        code === 127
        ? " "
        : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function redactContactDetails(value: string, maximum: number) {
  return cleanUntrustedText(value, maximum)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/(?:\+?\d[\s().-]?){8,15}/g, "[phone removed]");
}

function redactNestedText<T>(value: T): T {
  if (typeof value === "string") {
    return redactContactDetails(value, 700) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactNestedText(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactNestedText(item)]),
    ) as T;
  }

  return value;
}

function containsUnsupportedNumber(suggestion: string, original: string) {
  const numberPattern = /\b\d+(?:[.,]\d+)?%?\b/g;
  const originalNumbers = new Set(original.match(numberPattern) ?? []);
  return (suggestion.match(numberPattern) ?? []).some(
    (number) => !originalNumbers.has(number),
  );
}
