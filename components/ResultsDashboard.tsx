"use client";

import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Download,
  FileCheck2,
  ListChecks,
  Target,
  TrendingUp
} from "lucide-react";
import { EvidenceMap } from "@/components/EvidenceMap";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import type { AnalysisResult, GapItem, GapSeverity, PriorityAction, ResumeRecommendation } from "@/types/analysis";

interface ResultsDashboardProps {
  result: AnalysisResult;
}

const severityStyles: Record<GapSeverity, string> = {
  high: "border-clay-100 bg-clay-50 text-clay-700",
  medium: "border-ambergap-100 bg-ambergap-50 text-ambergap-600",
  low: "border-sage-100 bg-sage-50 text-sage-700"
};

const severityAccent: Record<GapSeverity, string> = {
  high: "bg-clay-600",
  medium: "bg-ambergap-500",
  low: "bg-sage-600"
};

const recommendationStyles: Record<ResumeRecommendation["status"], string> = {
  safe: "border-sage-100 bg-sage-50 text-sage-700",
  "needs-proof": "border-ambergap-100 bg-ambergap-50 text-ambergap-600"
};

const recommendationLabels: Record<ResumeRecommendation["status"], string> = {
  safe: "Safe to add",
  "needs-proof": "Needs proof first"
};

export function ResultsDashboard({ result }: ResultsDashboardProps) {
  const circumference = 2 * Math.PI * 44;
  const stroke = circumference - (result.overallScore / 100) * circumference;
  const reportDate = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(result.generatedAt));
  const topGaps = result.weakRequirements.slice(0, 3);
  const topActions = result.priorityActions.slice(0, 3);

  function handlePrint() {
    window.print();
  }

  return (
    <section className="printable-report space-y-5 rounded-lg border border-espresso-100 bg-white p-5 shadow-soft sm:p-6">
      <div className="print-only mb-5 border-b border-neutral-300 pb-4">
        <h1 className="text-2xl font-bold text-neutral-950">KopiBridge AI</h1>
        <p className="mt-1 text-sm text-neutral-700">Resume-to-AI-tech-role gap analysis report</p>
        <p className="mt-1 text-sm text-neutral-700">Report date: {reportDate}</p>
      </div>

      <div className="no-print flex flex-col gap-4 border-b border-espresso-100 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-espresso-500">KopiBridge AI Report</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-espresso-900 sm:text-3xl">Your AI role readiness snapshot</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-espresso-500">Generated {reportDate}. Review the summary, then use the roadmap to build proof.</p>
        </div>
        <button
          type="button"
          data-testid="save-report"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-sage-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sage-600 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-sage-200"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Save Report
        </button>
      </div>

      <ExecutiveSummary result={result} circumference={circumference} stroke={stroke} />

      <div className="print-stack grid gap-5 lg:grid-cols-2">
        <TopGapsCard gaps={topGaps} />
        <TopActionsCard actions={topActions} />
      </div>

      <RoadmapPanel result={result} />

      <div className="space-y-6">
        <EvidenceMap items={result.evidenceMap} />
        <ScoreBreakdown items={result.scoreBreakdown} />
      </div>

      <div className="space-y-5">
        <div className="print-stack grid gap-5 2xl:grid-cols-2">
          <DetailPanel
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            title={`Matched requirements (${result.matchedRequirements.length})`}
          >
            <ul className="space-y-3">
              {result.matchedRequirements.slice(0, 8).map((item) => (
                <li key={item.id} className="rounded-md border border-espresso-100 bg-espresso-50/45 p-3 text-sm leading-6 text-espresso-700">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-sage-600" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-espresso-900">{item.label}</strong>
                      <span className="mt-1 block text-xs leading-5 text-espresso-500">{item.evidence}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </DetailPanel>

          <DetailPanel
            icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
            title={`Missing or weak requirements (${result.weakRequirements.length})`}
          >
            <ul className="space-y-3">
              {result.weakRequirements.slice(0, 8).map((item) => (
                <li key={item.id} className="rounded-md border border-espresso-100 bg-espresso-50/45 p-3 text-sm leading-6 text-espresso-700">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-ambergap-600" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-espresso-900">{item.label}</strong>
                      <span className="mt-1 block text-xs leading-5 text-espresso-500">{item.reason}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </DetailPanel>
        </div>

        <RecommendationsPanel recommendations={result.resumeImprovements} />
      </div>
    </section>
  );
}

function ExecutiveSummary({
  result,
  circumference,
  stroke
}: {
  result: AnalysisResult;
  circumference: number;
  stroke: number;
}) {
  return (
    <section className="print-card print-avoid overflow-hidden rounded-lg border border-espresso-100 bg-gradient-to-br from-white via-white to-espresso-50 shadow-card">
      <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-espresso-100 p-5 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-start">
            <div className="relative h-32 w-32 flex-none">
              <svg viewBox="0 0 104 104" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="52" cy="52" r="44" fill="none" stroke="#eadac8" strokeWidth="10" />
                <circle
                  cx="52"
                  cy="52"
                  r="44"
                  fill="none"
                  stroke="#237551"
                  strokeLinecap="round"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={stroke}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-semibold text-espresso-900">{result.overallScore}%</span>
                <span className="mt-1 text-[11px] font-bold uppercase text-espresso-500">Match</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-espresso-500">Overall Match Score</p>
              <h3 className="mt-2 text-2xl font-semibold leading-tight text-espresso-900">{result.scoreLabel}</h3>
              <p className="mt-2 text-sm leading-6 text-espresso-600">
                Based on matched requirements, evidence strength, and weighted role categories.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <SectionHeader icon={<Target className="h-5 w-5" aria-hidden="true" />} tone="espresso" title="Role Fit Summary" />
          <p className="mt-4 text-sm leading-7 text-espresso-600">{result.roleFitSummary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {result.scoreBreakdown.slice(0, 5).map((item) => (
              <span key={item.id} className="inline-flex items-center gap-2 rounded-full border border-espresso-100 bg-white px-3 py-1.5 text-xs font-semibold text-espresso-700 shadow-sm">
                <BadgeCheck className="h-3.5 w-3.5 text-sage-600" aria-hidden="true" />
                {item.label}: {item.score}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TopGapsCard({ gaps }: { gaps: GapItem[] }) {
  return (
    <section className="print-card print-avoid rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
      <SectionHeader
        icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
        tone="amber"
        title="Top 3 Priority Gaps"
        description="The highest-impact missing or weak signals to fix first."
      />
      <ol className="mt-5 space-y-3">
        {gaps.map((gap, index) => (
          <li key={gap.id} className="relative overflow-hidden rounded-md border border-espresso-100 bg-espresso-50/35 p-4">
            <span className={`absolute inset-y-0 left-0 w-1 ${severityAccent[gap.severity]}`} aria-hidden="true" />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div>
                <p className="text-xs font-bold uppercase text-espresso-400">Priority {index + 1}</p>
                <h4 className="mt-1 text-base font-semibold leading-6 text-espresso-900">{gap.label}</h4>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${severityStyles[gap.severity]}`}>
                {gap.severity}
              </span>
            </div>
            <p className="mt-3 pl-2 text-sm leading-6 text-espresso-600">{gap.reason}</p>
            <div className="mt-3 rounded-md border border-espresso-100 bg-white px-3 py-2.5 text-sm leading-6 text-espresso-700">
              <span className="font-semibold text-espresso-900">Proof step: </span>
              {gap.action}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TopActionsCard({ actions }: { actions: PriorityAction[] }) {
  return (
    <section className="print-card print-avoid rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
      <SectionHeader
        icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
        tone="sage"
        title="Top 3 Recommended Actions"
        description="Short proof-building moves that can improve the next version of the resume."
      />
      <ol className="mt-5 space-y-3">
        {actions.map((action, index) => {
          const needsProof = /needs proof first/i.test(`${action.title} ${action.detail}`);
          const detail = action.detail.replace(/^Needs proof first:\s*/i, "");

          return (
            <li key={`${action.title}-${index}`} className="rounded-md border border-espresso-100 bg-espresso-50/35 p-4">
              <div className="flex gap-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-espresso-800 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-semibold leading-6 text-espresso-900">{action.title}</h4>
                    {needsProof ? (
                      <span className="rounded-full border border-ambergap-100 bg-ambergap-50 px-2 py-0.5 text-[11px] font-bold text-ambergap-600">
                        Needs proof first
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-espresso-600">{detail}</p>
                  <p className="mt-2 text-xs font-semibold uppercase text-espresso-400">{action.timeframe}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function RoadmapPanel({ result }: { result: AnalysisResult }) {
  return (
    <section className="print-card print-avoid rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
      <SectionHeader
        icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
        tone="espresso"
        title="30-Day Roadmap"
        description="Four focused weeks, generated from the strongest gaps in this comparison."
      />
      <div className="print-stack mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {result.roadmap.map((week) => (
          <article key={week.week} className="rounded-md border border-espresso-100 bg-espresso-50/35 p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-sage-700 shadow-sm">{week.week}</span>
              <ListChecks className="h-4 w-4 flex-none text-espresso-400" aria-hidden="true" />
            </div>
            <h4 className="mt-4 min-h-10 text-base font-semibold leading-6 text-espresso-900">{week.title}</h4>
            <ul className="mt-4 space-y-3">
              {week.tasks.slice(0, 3).map((task) => (
                <li key={task} className="flex gap-2.5 text-sm leading-6 text-espresso-600">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-sage-600" aria-hidden="true" />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecommendationsPanel({ recommendations }: { recommendations: ResumeRecommendation[] }) {
  return (
    <DetailPanel icon={<FileCheck2 className="h-5 w-5" aria-hidden="true" />} title="Recommended resume improvements">
      <ul className="grid gap-3 md:grid-cols-2">
        {recommendations.map((item) => (
          <li key={item.text} className="rounded-md border border-espresso-100 bg-espresso-50/40 p-4 text-sm leading-6 text-espresso-700">
            <span className={`mb-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${recommendationStyles[item.status]}`}>
              {recommendationLabels[item.status]}
            </span>
            <span className="block">{item.text}</span>
          </li>
        ))}
      </ul>
    </DetailPanel>
  );
}

function DetailPanel({
  icon,
  title,
  children
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="print-card print-avoid rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
      <SectionHeader icon={icon} tone="espresso" title={title} />
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  tone
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone: "espresso" | "sage" | "amber";
}) {
  const toneClass = {
    espresso: "bg-espresso-50 text-espresso-700",
    sage: "bg-sage-50 text-sage-700",
    amber: "bg-ambergap-50 text-ambergap-600"
  }[tone];

  return (
    <div className="flex items-start gap-3">
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-md ${toneClass}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-lg font-semibold text-espresso-900">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-espresso-500">{description}</p> : null}
      </div>
    </div>
  );
}
