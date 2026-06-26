"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, Beaker, ClipboardList, Coffee, ShieldCheck, Sparkles } from "lucide-react";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { ResumeUpload } from "@/components/ResumeUpload";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { analyseResumeAgainstJob } from "@/lib/analyse";
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME } from "@/lib/sampleData";
import type { AnalysisResult } from "@/types/analysis";

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [formError, setFormError] = useState("");
  const reportRef = useRef<HTMLDivElement | null>(null);

  const canAnalyse = useMemo(
    () => resumeText.trim().length >= 80 && jobDescription.trim().length >= 80,
    [resumeText, jobDescription]
  );

  function handleResumeTextChange(value: string) {
    setResumeText(value);
    setAnalysis(null);
    setFormError("");
  }

  function handleJobDescriptionChange(value: string) {
    setJobDescription(value);
    setAnalysis(null);
    setFormError("");
  }

  function loadSampleResume() {
    setResumeText(SAMPLE_RESUME);
    setAnalysis(null);
    setFormError("");
  }

  function loadDemoJobDescription() {
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setAnalysis(null);
    setFormError("");
  }

  function handleAnalyse() {
    setFormError("");

    if (!resumeText.trim()) {
      setFormError("Add resume text first by uploading a PDF or using the demo data.");
      return;
    }

    if (!jobDescription.trim()) {
      setFormError("Paste the target AI-tech job description before analysing.");
      return;
    }

    if (!canAnalyse) {
      setFormError("For a useful local analysis, use at least a few resume bullets and a real job description.");
      return;
    }

    setAnalysis(analyseResumeAgainstJob(resumeText, jobDescription));
    window.requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      <section
        className="no-print relative overflow-hidden border-b border-espresso-100 bg-cover bg-right-top"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 48%, rgba(255,255,255,0.58) 100%), url('/hero-desk.png')"
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-espresso-200 to-transparent" />
        <div className="mx-auto flex max-w-7xl flex-col gap-9 px-5 py-8 md:px-8 lg:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-espresso-800 text-white shadow-sm">
                <Coffee className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="text-3xl font-semibold leading-none text-espresso-900">KopiBridge AI</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-espresso-500">
              <ShieldCheck className="h-4 w-4 text-sage-600" aria-hidden="true" />
              <span>Local-first analysis. No API key required.</span>
            </div>
          </div>

          <div className="mx-auto max-w-4xl text-left lg:text-center">
            <h1 className="text-4xl font-semibold leading-tight text-espresso-900 sm:text-5xl">
              Turn your resume into a roadmap for your next AI tech role.
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-espresso-600">
              A local-first career report that compares your resume with a target role, then turns the gaps into practical proof-building steps.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-4xl gap-3 rounded-lg border border-white/70 bg-white/80 p-3 shadow-soft backdrop-blur sm:grid-cols-3">
            <FlowStep icon={<ClipboardList className="h-5 w-5" />} label="Upload Resume" showArrow />
            <FlowStep icon={<Beaker className="h-5 w-5" />} label="Analyse Gap" showArrow />
            <FlowStep icon={<Sparkles className="h-5 w-5" />} label="Get Roadmap" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:px-8 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
        <aside className="no-print rounded-lg border border-espresso-100 bg-white p-5 shadow-soft">
          <div className="border-b border-espresso-100 pb-5">
            <h2 className="text-2xl font-semibold text-espresso-900">Guided Workflow</h2>
            <p className="mt-2 text-sm leading-6 text-espresso-600">Build your report in three simple steps.</p>
          </div>
          <ResumeUpload
            resumeText={resumeText}
            onResumeTextChange={handleResumeTextChange}
            onUseSampleResume={loadSampleResume}
          />
          <JobDescriptionInput
            value={jobDescription}
            onChange={handleJobDescriptionChange}
            onLoadDemoJobDescription={loadDemoJobDescription}
          />

          <section className="relative pt-6">
            <div className="flex gap-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sage-700 text-sm font-semibold text-white">
                3
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-espresso-900">Get Roadmap</h3>
                    <p className="mt-1 text-sm leading-6 text-espresso-500">Generate the report and review your 30-day plan.</p>
                  </div>
                  <span className="inline-flex w-fit rounded-full border border-sage-100 bg-sage-50 px-3 py-1 text-xs font-bold text-sage-700">
                    Local engine only
                  </span>
                </div>

                {formError ? (
                  <p className="mt-4 rounded-md border border-clay-100 bg-clay-50 px-4 py-3 text-sm leading-6 text-clay-700">
                    {formError}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={handleAnalyse}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-espresso-800 px-5 py-4 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-espresso-700 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-espresso-200"
                >
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  Analyse Gap
                </button>
                <p className="mt-4 text-xs leading-5 text-espresso-500">
                  The score is calculated locally from requirement matches, evidence strength, and gap severity.
                </p>
              </div>
            </div>
          </section>
        </aside>

        <div ref={reportRef} className="space-y-5 scroll-mt-6">
          {analysis ? (
            <ResultsDashboard result={analysis} />
          ) : (
            <section className="rounded-lg border border-dashed border-espresso-200 bg-white/80 p-8 shadow-soft">
              <div className="mx-auto max-w-2xl text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-md bg-espresso-50 text-espresso-700">
                  <ClipboardList className="h-7 w-7" aria-hidden="true" />
                </span>
                <h2 className="mt-6 text-3xl font-semibold text-espresso-900">Your career report will appear here</h2>
                <p className="mt-3 text-base leading-7 text-espresso-600">
                  Use the sample resume and demo job description for a reliable recording, or upload a text-based PDF resume and paste a real role.
                </p>
                <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
                  <EmptyMetric label="Score" value="0%" />
                  <EmptyMetric label="Matched" value="-" />
                  <EmptyMetric label="Actions" value="-" />
                </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function FlowStep({ icon, label, showArrow = false }: { icon: React.ReactNode; label: string; showArrow?: boolean }) {
  return (
    <div className="group flex items-center gap-3 rounded-md border border-espresso-100 bg-espresso-50/70 p-3 text-sm font-semibold text-espresso-800">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-white text-sage-700 shadow-sm">
        {icon}
      </span>
      <span className="min-w-0">{label}</span>
      {showArrow ? <ArrowRight className="ml-auto hidden h-4 w-4 text-espresso-300 sm:block" aria-hidden="true" /> : null}
    </div>
  );
}

function EmptyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-espresso-100 bg-espresso-50/60 p-4">
      <p className="text-xs font-semibold uppercase text-espresso-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-espresso-900">{value}</p>
    </div>
  );
}
