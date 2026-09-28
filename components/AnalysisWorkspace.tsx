"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { ResumeUpload } from "@/components/ResumeUpload";
import { detectRoleAndCompany } from "@/lib/role";
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME } from "@/lib/sampleData";
import type { CreditStatus } from "@/lib/credits";

const progressMessages = [
  "Reading role requirements",
  "Checking resume evidence",
  "Prioritising proof gaps",
  "Refining evidence-led guidance",
  "Building your action plan",
  "Saving the private report",
];

export function AnalysisWorkspace({
  initialCredits,
}: {
  initialCredits: CreditStatus;
}) {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [resumeFilename, setResumeFilename] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [company, setCompany] = useState("");
  const [metadataTouched, setMetadataTouched] = useState(false);
  const [remaining, setRemaining] = useState(initialCredits.remaining);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!isSubmitting) return;
    const timer = window.setInterval(
      () =>
        setProgressIndex((index) =>
          Math.min(index + 1, progressMessages.length - 1),
        ),
      750,
    );
    return () => window.clearInterval(timer);
  }, [isSubmitting]);

  const canSubmit = useMemo(
    () =>
      resumeText.trim().length >= 80 &&
      jobDescription.trim().length >= 80 &&
      targetRole.trim().length >= 2 &&
      remaining > 0 &&
      !isSubmitting,
    [resumeText, jobDescription, targetRole, remaining, isSubmitting],
  );

  function useSampleResume() {
    setResumeText(SAMPLE_RESUME);
    setResumeFilename("sample-resume.txt");
    setError("");
  }

  function loadDemoJob() {
    setMetadataTouched(false);
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    const detected = detectRoleAndCompany(SAMPLE_JOB_DESCRIPTION);
    setTargetRole(detected.targetRole);
    setCompany(detected.company);
    setError("");
  }

  async function submitAnalysis() {
    if (!canSubmit) {
      setError(
        remaining === 0
          ? "You have used all three analyses today."
          : "Complete the resume, job description, and target role before analysing.",
      );
      return;
    }

    setError("");
    setProgressIndex(0);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          targetRole,
          company,
          resumeFilename,
          idempotencyKey: idempotencyKey.current,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (typeof payload.remaining === "number")
          setRemaining(payload.remaining);
        setError(payload.error ?? "The analysis could not be completed.");
        return;
      }

      setRemaining(payload.remaining);
      router.push(`/history/${payload.analysisId}`);
      router.refresh();
    } catch {
      setError(
        "The network request failed. Your text is still here, so you can try again safely.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitting) {
    return (
      <section className="rounded-lg border border-espresso-100 bg-white px-6 py-16 text-center shadow-soft">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-espresso-900 text-white">
          <FileSearch className="h-6 w-6 animate-pulse" />
        </span>
        <h2 className="mt-6 text-2xl font-semibold text-espresso-900">
          Building your evidence-led report
        </h2>
        <p className="mt-2 text-sm text-espresso-500">
          {progressMessages[progressIndex]}
        </p>
        <div className="mx-auto mt-7 h-1.5 max-w-sm overflow-hidden rounded-full bg-espresso-100">
          <div
            className="h-full bg-sage-600 transition-all duration-700"
            style={{
              width: `${((progressIndex + 1) / progressMessages.length) * 100}%`,
            }}
          />
        </div>
        <p className="mt-5 text-xs text-espresso-400">
          Keep this tab open. A successful report is saved automatically.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-espresso-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-sage-700">
            New analysis
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-espresso-900">
            Compare evidence, not just keywords
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-espresso-500">
            Text-based PDFs are read on your device. Scanned pages can be sent
            to AI with your consent. Review the extracted text, then compare it
            with the role. Your completed report is saved privately.
          </p>
        </div>
        <div className="text-sm font-semibold text-espresso-700">
          {remaining} of {initialCredits.limit} remaining today
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <WorkflowMarker
          number="1"
          title="Resume evidence"
          ready={resumeText.trim().length >= 80}
        />
        <WorkflowMarker
          number="2"
          title="Target role"
          ready={jobDescription.trim().length >= 80}
        />
        <WorkflowMarker
          number="3"
          title="Confirm and analyse"
          ready={targetRole.trim().length >= 2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
          <ResumeUpload
            resumeText={resumeText}
            onResumeTextChange={(value) => {
              setResumeText(value);
              setError("");
            }}
            onUseSampleResume={useSampleResume}
            onFileNameChange={setResumeFilename}
          />
        </section>
        <section className="rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
          <JobDescriptionInput
            value={jobDescription}
            onChange={(value) => {
              setJobDescription(value);
              setError("");
              if (!metadataTouched) {
                const detected = detectRoleAndCompany(value);
                setTargetRole(
                  detected.targetRole === "Target role"
                    ? ""
                    : detected.targetRole,
                );
                setCompany(detected.company);
              }
            }}
            onLoadDemoJobDescription={loadDemoJob}
          />
        </section>
      </div>

      <section className="rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-sage-50 text-sage-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-espresso-900">
              Confirm the target
            </h2>
            <p className="mt-1 text-sm leading-6 text-espresso-500">
              Detection is a convenience. Correct it before spending a credit.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-espresso-800">
              Target role
            </span>
            <input
              value={targetRole}
              onChange={(event) => {
                setTargetRole(event.target.value);
                setMetadataTouched(true);
              }}
              maxLength={120}
              placeholder="e.g. Junior AI Engineer"
              className="mt-2 w-full rounded-md border border-espresso-200 px-4 py-3 outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-espresso-800">
              Company{" "}
              <span className="font-normal text-espresso-400">(optional)</span>
            </span>
            <input
              value={company}
              onChange={(event) => {
                setCompany(event.target.value);
                setMetadataTouched(true);
              }}
              maxLength={120}
              placeholder="Company name"
              className="mt-2 w-full rounded-md border border-espresso-200 px-4 py-3 outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
            />
          </label>
        </div>
        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-md border border-clay-100 bg-clay-50 px-4 py-3 text-sm text-clay-700"
          >
            {error}
          </p>
        ) : null}
        {remaining === 0 ? (
          <div className="mt-5 rounded-md border border-ambergap-100 bg-ambergap-50 p-4 text-sm leading-6 text-ambergap-600">
            <LockKeyhole className="mr-2 inline h-4 w-4" />
            Daily limit reached. Your next three credits arrive at midnight
            Singapore time.
          </div>
        ) : null}
        <div className="mt-6 flex flex-col gap-4 border-t border-espresso-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-espresso-400">
            One accepted analysis uses one credit. Validation failures are free,
            and internal failures automatically restore the credit.
          </p>
          <button
            type="button"
            onClick={submitAnalysis}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-espresso-900 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-espresso-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5" />
            Analyse gap
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

function WorkflowMarker({
  number,
  title,
  ready,
}: {
  number: string;
  title: string;
  ready: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 border-b-2 bg-white px-4 py-3 ${ready ? "border-sage-600" : "border-espresso-100"}`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold ${ready ? "bg-sage-700 text-white" : "bg-espresso-50 text-espresso-500"}`}
      >
        {ready ? <CheckCircle2 className="h-4 w-4" /> : number}
      </span>
      <span className="text-sm font-semibold text-espresso-800">{title}</span>
    </div>
  );
}
