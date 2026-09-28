"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Download,
  FileCheck2,
  ListChecks,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";
import { EvidenceMap } from "@/components/EvidenceMap";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import type {
  AnalysisResult,
  GapItem,
  GapSeverity,
  RecommendationStatus,
} from "@/types/analysis";

const severityStyles: Record<GapSeverity, string> = {
  high: "border-clay-100 bg-clay-50 text-clay-700",
  medium: "border-ambergap-100 bg-ambergap-50 text-ambergap-600",
  low: "border-sage-100 bg-sage-50 text-sage-700",
};

const claimStyles: Record<RecommendationStatus, string> = {
  safe: "border-sage-100 bg-sage-50 text-sage-700",
  reframe: "border-ambergap-100 bg-ambergap-50 text-ambergap-600",
  "needs-proof": "border-clay-100 bg-clay-50 text-clay-700",
};

const claimLabels: Record<RecommendationStatus, string> = {
  safe: "Safe to add now",
  reframe: "Reframe carefully",
  "needs-proof": "Needs proof first",
};

export function ResultsDashboard({
  result,
  targetRole,
  company,
}: {
  result: AnalysisResult;
  targetRole?: string;
  company?: string | null;
}) {
  const reportDate = new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  }).format(new Date(result.generatedAt));

  return (
    <section className="printable-report space-y-6">
      <header className="print-only border-b border-neutral-300 pb-4">
        <h1 className="text-2xl font-bold">KopiBridge AI</h1>
        <p className="mt-1 text-sm">Private resume-to-role alignment report</p>
        <p className="mt-1 text-sm">
          {targetRole || "Target role"}
          {company ? ` | ${company}` : ""} | {reportDate}
        </p>
        <p className="mt-1 text-sm">
          Guidance:{" "}
          {result.guidanceSource === "openai" ? "AI-refined" : "Local analysis"}
        </p>
      </header>

      <div className="no-print flex flex-col gap-4 border-b border-espresso-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-sage-700">
            Evidence-led career report
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-espresso-900">
            Your role-alignment decision brief
          </h2>
          <p className="mt-2 text-sm text-espresso-500">
            Generated {reportDate}. Verify every recommendation before changing
            your resume.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-sage-100 bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-700">
            <Sparkles className="h-3.5 w-3.5" />
            {result.guidanceSource === "openai"
              ? "AI-refined, evidence-led guidance"
              : "Local evidence-led guidance"}
          </span>
        </div>
        <button
          type="button"
          data-testid="save-report"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-espresso-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-espresso-700"
        >
          <Download className="h-4 w-4" />
          Save report
        </button>
      </div>

      <section className="print-card overflow-hidden rounded-lg border border-espresso-100 bg-white shadow-soft">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
          <div className="bg-espresso-900 p-7 text-white sm:p-8">
            <p className="text-xs font-bold uppercase text-espresso-200">
              Overall match estimate
            </p>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-7xl font-semibold leading-none">
                {result.overallScore}
              </span>
              <span className="pb-1 text-2xl text-espresso-200">%</span>
            </div>
            <p className="mt-4 text-xl font-semibold">{result.scoreLabel}</p>
            <p className="mt-3 text-xs leading-5 text-espresso-200">
              {result.scoreDisclaimer}
            </p>
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 text-sage-700">
              <Target className="h-5 w-5" />
              <p className="text-xs font-bold uppercase">Role fit summary</p>
            </div>
            <p className="mt-4 text-base leading-7 text-espresso-700">
              {result.roleFitSummary}
            </p>
            <div className="mt-6 border-l-2 border-sage-600 pl-4">
              <p className="text-xs font-bold uppercase text-espresso-400">
                Recommendation
              </p>
              <p className="mt-1 text-xl font-semibold text-espresso-900">
                {result.finalRecommendation.decision}
              </p>
              <p className="mt-2 text-sm leading-6 text-espresso-500">
                {result.finalRecommendation.explanation}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="print-card rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
        <SectionTitle
          icon={<ShieldAlert />}
          title="Claim safety at a glance"
          description="Use these labels as a guardrail against exaggeration."
        />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ClaimGuide
            status="safe"
            text="Directly supported by the resume text. Keep the wording factual."
          />
          <ClaimGuide
            status="reframe"
            text="The experience appears present, but the wording or context needs care."
          />
          <ClaimGuide
            status="needs-proof"
            text="Do not add this claim until you can show working, defensible evidence."
          />
        </div>
      </section>

      <div className="print-stack grid gap-6 lg:grid-cols-2">
        <section className="print-card rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
          <SectionTitle
            icon={<BadgeCheck />}
            title="Existing strengths"
            description="The strongest signals already found in your resume."
          />
          <div className="mt-5 space-y-4">
            {result.existingStrengths.slice(0, 4).map((strength) => (
              <article
                key={strength.title}
                className="border-l-2 border-sage-500 pl-4"
              >
                <h4 className="font-semibold text-espresso-900">
                  {strength.title}
                </h4>
                <p className="mt-1 text-sm leading-6 text-espresso-600">
                  &ldquo;{strength.evidence}&rdquo;
                </p>
                <p className="mt-1 text-xs leading-5 text-espresso-400">
                  {strength.whyItMatters}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="print-card rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
          <SectionTitle
            icon={<AlertTriangle />}
            title="Critical gaps"
            description="The three issues most likely to weaken this application."
          />
          <div className="mt-5 space-y-4">
            {result.weakRequirements.slice(0, 3).map((gap, index) => (
              <GapRow key={gap.id} gap={gap} number={index + 1} />
            ))}
          </div>
        </section>
      </div>

      <section className="print-card rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
        <SectionTitle
          icon={<TimerReset />}
          title="Action roadmap"
          description="Start with tasks that create proof, then earn stronger resume wording."
        />
        <div className="print-roadmap-grid mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {result.actionRoadmap.map((group) => (
            <article
              key={group.period}
              className="border-t-2 border-espresso-800 bg-espresso-50/45 p-4"
            >
              <p className="text-xs font-bold uppercase text-sage-700">
                {group.period}
              </p>
              <ul className="mt-4 space-y-3">
                {group.tasks.map((task, index) => (
                  <li
                    key={`${group.period}-${index}`}
                    className="flex gap-2 text-sm leading-6 text-espresso-600"
                  >
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-sage-600" />
                    {task}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="print-card rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
        <SectionTitle
          icon={<CalendarDays />}
          title="30-day proof plan"
          description="A practical four-week sequence tied to the highest-priority gaps."
        />
        <div className="print-roadmap-grid mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {result.roadmap.map((week) => (
            <article
              key={week.week}
              className="rounded-md border border-espresso-100 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-sage-700">
                  {week.week}
                </span>
                <ListChecks className="h-4 w-4 text-espresso-300" />
              </div>
              <h4 className="mt-3 font-semibold leading-6 text-espresso-900">
                {week.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {week.tasks.slice(0, 3).map((task, index) => (
                  <li
                    key={`${week.week}-${index}`}
                    className="text-sm leading-6 text-espresso-600"
                  >
                    {task}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <EvidenceMap items={result.evidenceMap} />

      <section className="print-card rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
        <SectionTitle
          icon={<FileCheck2 />}
          title="Resume wording workshop"
          description="Conservative rewrites that expose missing evidence instead of inventing it."
        />
        <div className="mt-5 space-y-5">
          {result.bulletRewrites.map((rewrite, index) => (
            <article
              key={`${rewrite.original}-${index}`}
              className="grid gap-4 border-t border-espresso-100 pt-5 md:grid-cols-2"
            >
              <div>
                <p className="text-xs font-bold uppercase text-espresso-400">
                  Current wording
                </p>
                <p className="mt-2 text-sm leading-6 text-espresso-600">
                  {rewrite.original}
                </p>
              </div>
              <div>
                <span
                  className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-bold ${claimStyles[rewrite.status]}`}
                >
                  {claimLabels[rewrite.status]}
                </span>
                <p className="mt-2 text-sm font-medium leading-6 text-espresso-800">
                  {rewrite.suggested}
                </p>
                <p className="mt-2 text-xs leading-5 text-espresso-400">
                  {rewrite.whyStronger}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="print-card rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
        <SectionTitle
          icon={<MessageSquareText />}
          title="Interview preparation"
          description="Prepare evidence for strengths and honest language for gaps."
        />
        <div className="print-stack mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-espresso-900">
              Five likely questions
            </h4>
            <ol className="mt-3 space-y-3">
              {result.interviewPreparation.questions.map((question, index) => (
                <li
                  key={question}
                  className="flex gap-3 text-sm leading-6 text-espresso-600"
                >
                  <span className="font-semibold text-sage-700">
                    {index + 1}.
                  </span>
                  {question}
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-5">
            <InterviewList
              title="Evidence to prepare"
              items={result.interviewPreparation.evidenceToPrepare}
              tone="sage"
            />
            <InterviewList
              title="Weaknesses to address honestly"
              items={result.interviewPreparation.honestWeaknesses}
              tone="amber"
            />
            <InterviewList
              title="Do not bluff about"
              items={result.interviewPreparation.doNotBluff}
              tone="clay"
            />
          </div>
        </div>
      </section>

      <ScoreBreakdown items={result.scoreBreakdown} />

      <section className="print-card rounded-lg border border-espresso-100 bg-espresso-900 p-6 text-white shadow-card sm:p-8">
        <p className="text-xs font-bold uppercase text-espresso-200">
          Final recommendation
        </p>
        <h3 className="mt-3 text-3xl font-semibold">
          {result.finalRecommendation.decision}
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-espresso-100">
          {result.finalRecommendation.explanation}
        </p>
        <p className="mt-5 flex items-start gap-2 text-sm font-semibold">
          <ArrowUpRight className="mt-0.5 h-4 w-4 flex-none text-sage-500" />
          {result.finalRecommendation.nextStep}
        </p>
      </section>
    </section>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-espresso-50 text-espresso-700 [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <div>
        <h3 className="text-lg font-semibold text-espresso-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-espresso-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function ClaimGuide({
  status,
  text,
}: {
  status: RecommendationStatus;
  text: string;
}) {
  return (
    <div
      className={`border-l-2 px-4 py-3 ${status === "safe" ? "border-sage-600 bg-sage-50" : status === "reframe" ? "border-ambergap-500 bg-ambergap-50" : "border-clay-600 bg-clay-50"}`}
    >
      <p className="text-sm font-semibold text-espresso-900">
        {claimLabels[status]}
      </p>
      <p className="mt-1 text-xs leading-5 text-espresso-500">{text}</p>
    </div>
  );
}

function GapRow({ gap, number }: { gap: GapItem; number: number }) {
  return (
    <article className="border-t border-espresso-100 pt-4 first:border-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-espresso-900 text-xs font-semibold text-white">
            {number}
          </span>
          <div>
            <h4 className="font-semibold text-espresso-900">{gap.label}</h4>
            <p className="mt-1 text-xs capitalize text-espresso-400">
              {gap.gapType} | {gap.estimatedEffort}
            </p>
          </div>
        </div>
        <span
          className={`rounded-md border px-2 py-1 text-[11px] font-bold capitalize ${severityStyles[gap.severity]}`}
        >
          {gap.severity}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-espresso-600">
        {gap.whyItMatters}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-espresso-800">
        Proof step: {gap.action}
      </p>
    </article>
  );
}

function InterviewList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "sage" | "amber" | "clay";
}) {
  const toneClass =
    tone === "sage"
      ? "border-sage-500"
      : tone === "amber"
        ? "border-ambergap-500"
        : "border-clay-600";
  return (
    <div className={`border-l-2 pl-4 ${toneClass}`}>
      <h4 className="text-sm font-semibold text-espresso-900">{title}</h4>
      {items.length ? (
        <ul className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="text-sm leading-6 text-espresso-500"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-espresso-400">
          No high-risk items detected.
        </p>
      )}
    </div>
  );
}
