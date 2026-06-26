"use client";

import { ChangeEvent, useRef, useState } from "react";
import { CheckCircle2, FileText, UploadCloud, UserRoundCheck, X } from "lucide-react";
import { extractTextFromPdf } from "@/lib/pdf";
import { ErrorMessage } from "@/components/ErrorMessage";
import { LoadingState } from "@/components/LoadingState";

interface ResumeUploadProps {
  resumeText: string;
  onResumeTextChange: (value: string) => void;
  onUseSampleResume: () => void;
}

export function ResumeUpload({ resumeText, onResumeTextChange, onUseSampleResume }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF resume. DOCX support is intentionally outside this prototype.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Please use a PDF smaller than 8MB for this local prototype.");
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    setIsExtracting(true);

    try {
      const extracted = await extractTextFromPdf(file);
      if (!extracted) {
        throw new Error("No text found");
      }

      onResumeTextChange(extracted);
    } catch {
      setError("I could not extract readable text from this PDF. You can paste or edit the resume text manually below.");
    } finally {
      setIsExtracting(false);
    }
  }

  function clearFile() {
    setFileName("");
    onResumeTextChange("");
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const hasResumeText = resumeText.trim().length > 0;

  return (
    <section className="relative border-b border-espresso-100 py-6">
      <div className="flex gap-4">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-espresso-800 text-sm font-semibold text-white">
          1
        </span>
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md bg-espresso-50 text-espresso-700">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-espresso-900">Upload Resume</h3>
                <p className="mt-1 text-sm leading-6 text-espresso-500">Upload a PDF or use the sample resume for a reliable demo.</p>
              </div>
            </div>
            <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${hasResumeText ? "border-sage-100 bg-sage-50 text-sage-700" : "border-espresso-100 bg-espresso-50 text-espresso-500"}`}>
              {hasResumeText ? "Resume text ready" : "Awaiting resume"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {fileName ? (
              <CheckCircle2 className="h-5 w-5 text-sage-600" aria-label="PDF uploaded" />
            ) : null}
            <button
              type="button"
              onClick={onUseSampleResume}
              className="inline-flex w-fit max-w-full items-center justify-center gap-2 rounded-md border border-espresso-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-espresso-800 shadow-sm transition hover:border-sage-500 hover:text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-100"
            >
              <UserRoundCheck className="h-4 w-4" aria-hidden="true" />
              Use Sample Resume Text
            </button>
          </div>

          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-espresso-200 bg-espresso-50/60 px-4 py-7 text-center transition hover:border-sage-500 hover:bg-sage-50">
            <UploadCloud className="mb-3 h-8 w-8 text-espresso-500 transition group-hover:text-sage-700" aria-hidden="true" />
            <span className="text-sm font-semibold text-espresso-900">
              {fileName || "Choose a PDF resume"}
            </span>
            <span className="mt-1 text-xs text-espresso-500">Client-side extraction, max 8MB</span>
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </label>

          {fileName ? (
            <button
              type="button"
              onClick={clearFile}
              className="inline-flex items-center gap-2 text-sm font-medium text-espresso-600 transition hover:text-espresso-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear resume
            </button>
          ) : null}

          {isExtracting ? <LoadingState label="Extracting resume text from PDF..." /> : null}
          <ErrorMessage message={error} />

          <details className="group rounded-md border border-espresso-100 bg-white" open={!hasResumeText}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-espresso-900">
              Extracted resume text
              <span className="text-xs font-medium text-espresso-500 group-open:hidden">Show</span>
              <span className="hidden text-xs font-medium text-espresso-500 group-open:inline">Hide</span>
            </summary>
            <div className="border-t border-espresso-100 p-3">
              <textarea
                value={resumeText}
                onChange={(event) => onResumeTextChange(event.target.value)}
                placeholder="Upload a PDF or paste your resume text here."
                className="min-h-48 w-full rounded-md border border-espresso-100 bg-espresso-50/40 p-4 font-mono text-xs leading-6 text-espresso-800 outline-none transition placeholder:text-espresso-300 focus:border-sage-500 focus:bg-white focus:ring-2 focus:ring-sage-100"
              />
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
