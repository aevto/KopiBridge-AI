"use client";

import { ChangeEvent, useRef, useState, useSyncExternalStore } from "react";
import {
  CheckCircle2,
  FileText,
  UploadCloud,
  UserRoundCheck,
  X,
} from "lucide-react";
import { extractTextFromPdf, resumePageImages } from "@/lib/pdf";
import { ErrorMessage } from "@/components/ErrorMessage";
import { LoadingState } from "@/components/LoadingState";

interface ResumeUploadProps {
  resumeText: string;
  onResumeTextChange: (value: string) => void;
  onUseSampleResume: () => void;
  onFileNameChange?: (value: string) => void;
}

const subscribeToHydration = () => () => {};

export function ResumeUpload({
  resumeText,
  onResumeTextChange,
  onUseSampleResume,
  onFileNameChange,
}: ResumeUploadProps) {
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const extractionAttempt = useRef(0);
  const [fileName, setFileName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");
  const [pendingScan, setPendingScan] = useState<File | null>(null);
  const [imageConsent, setImageConsent] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const attempt = ++extractionAttempt.current;
    setError("");
    setNotice("");
    setPendingScan(null);
    setImageConsent(false);

    if (!file) {
      return;
    }

    if (
      !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
        file.type,
      )
    ) {
      setError("Choose a PDF, PNG, JPEG, or WebP resume.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Please use a resume file smaller than 8MB.");
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    onFileNameChange?.(file.name);
    onResumeTextChange("");
    if (file.type !== "application/pdf") {
      setPendingScan(file);
      return;
    }
    setIsExtracting(true);

    try {
      const extracted = await extractTextFromPdf(file);
      if (attempt !== extractionAttempt.current) return;
      if (extracted.trim().length < 80) {
        setPendingScan(file);
        setNotice(
          "This PDF has little selectable text. You can read its pages with AI or paste the text below.",
        );
        return;
      }

      onResumeTextChange(extracted);
      setNotice(
        "Text extracted on your device. Check the reading order and correct any mistakes before analysis.",
      );
    } catch {
      if (attempt !== extractionAttempt.current) return;
      setError(
        "I could not extract readable text from this PDF. You can paste or edit the resume text manually below.",
      );
    } finally {
      if (attempt === extractionAttempt.current) setIsExtracting(false);
    }
  }

  async function readScan() {
    if (!pendingScan || !imageConsent || isExtracting) return;
    const attempt = ++extractionAttempt.current;
    setIsExtracting(true);
    setError("");
    try {
      const images = await resumePageImages(pendingScan);
      if (attempt !== extractionAttempt.current) return;
      const response = await fetch("/api/resume/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          consent: true,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const result = await response.json();
      if (attempt !== extractionAttempt.current) return;
      if (!response.ok)
        throw new Error(
          result.error || "Image reading failed. Paste your text instead.",
        );
      onResumeTextChange(result.text);
      setNotice(
        [
          "AI-read text. Check every detail before continuing.",
          ...result.warnings,
        ].join(" "),
      );
      setPendingScan(null);
    } catch (error) {
      if (attempt === extractionAttempt.current)
        setError(
          error instanceof Error ? error.message : "Image reading failed.",
        );
    } finally {
      if (attempt === extractionAttempt.current) setIsExtracting(false);
    }
  }

  function useSample() {
    extractionAttempt.current += 1;
    setFileName("");
    setIsExtracting(false);
    setError("");
    setPendingScan(null);
    setNotice("");
    setImageConsent(false);
    if (inputRef.current) inputRef.current.value = "";
    onUseSampleResume();
  }

  function clearFile() {
    extractionAttempt.current += 1;
    setFileName("");
    onFileNameChange?.("");
    onResumeTextChange("");
    setError("");
    setIsExtracting(false);
    setPendingScan(null);
    setNotice("");
    setImageConsent(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const hasResumeText = resumeText.trim().length > 0;

  return (
    <section className="space-y-5">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md bg-espresso-50 text-espresso-700">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-espresso-900">
                Resume source
              </h3>
              <p className="mt-1 text-sm leading-6 text-espresso-500">
                Upload a PDF or resume image, paste text, or load a sample.
              </p>
            </div>
          </div>
          <span
            className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${hasResumeText ? "border-sage-100 bg-sage-50 text-sage-700" : "border-espresso-100 bg-espresso-50 text-espresso-500"}`}
          >
            {hasResumeText ? "Resume text ready" : "Awaiting resume"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {fileName ? (
            <CheckCircle2
              className="h-5 w-5 text-sage-600"
              aria-label="PDF uploaded"
            />
          ) : null}
          <button
            type="button"
            onClick={useSample}
            className="inline-flex w-fit max-w-full items-center justify-center gap-2 rounded-md border border-espresso-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-espresso-800 shadow-sm transition hover:border-sage-500 hover:text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-100"
          >
            <UserRoundCheck className="h-4 w-4" aria-hidden="true" />
            Use Sample Resume Text
          </button>
        </div>

        <label className="group flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-espresso-200 bg-espresso-50/60 px-4 py-8 text-center transition hover:border-sage-500 hover:bg-sage-50">
          <UploadCloud
            className="mb-3 h-8 w-8 text-espresso-500 transition group-hover:text-sage-700"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-espresso-900">
            {fileName || "Choose a resume file"}
          </span>
          <span className="mt-1 text-xs text-espresso-500">
            PDF, PNG, JPEG, WebP · up to 8MB
          </span>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            aria-label="Upload resume"
            disabled={!interactive}
            onChange={handleFileChange}
          />
        </label>

        {pendingScan ? (
          <div className="space-y-4 border-l-2 border-sage-600 bg-sage-50/60 p-4">
            <h4 className="font-semibold text-espresso-900">
              Read scanned resume pages
            </h4>
            <p className="text-sm leading-6 text-espresso-600">
              Up to three pages will be sent to OpenAI for text extraction.
              KopiBridge does not save the images. Remove contact details before
              uploading if you prefer. Six attempts per day; no analysis credit
              is used.
            </p>
            <label className="flex items-start gap-3 text-sm leading-6 text-espresso-800">
              <input
                type="checkbox"
                checked={imageConsent}
                onChange={(e) => setImageConsent(e.target.checked)}
                className="mt-1 h-4 w-4 accent-sage-700"
              />
              I agree to send these pages for AI extraction.
            </label>
            <button
              type="button"
              disabled={!imageConsent || isExtracting}
              onClick={readScan}
              className="rounded-md bg-sage-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isExtracting ? "Reading pages..." : "Read resume pages"}
            </button>
          </div>
        ) : null}

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

        {isExtracting ? (
          <LoadingState label="Extracting resume text from PDF..." />
        ) : null}
        <ErrorMessage message={error} />
        {notice ? (
          <p role="status" className="text-sm leading-6 text-sage-700">
            {notice}
          </p>
        ) : null}

        <details
          className="group rounded-md border border-espresso-100 bg-white"
          open
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-espresso-900">
            Extracted resume text
            <span className="text-xs font-medium text-espresso-500 group-open:hidden">
              Show
            </span>
            <span className="hidden text-xs font-medium text-espresso-500 group-open:inline">
              Hide
            </span>
          </summary>
          <div className="border-t border-espresso-100 p-3">
            <textarea
              aria-label="Resume text"
              value={resumeText}
              onChange={(event) => onResumeTextChange(event.target.value)}
              placeholder="Upload a PDF or paste your resume text here."
              maxLength={50000}
              className="min-h-52 w-full rounded-md border border-espresso-100 bg-espresso-50/40 p-4 text-sm leading-6 text-espresso-800 outline-none transition placeholder:text-espresso-300 focus:border-sage-500 focus:bg-white focus:ring-2 focus:ring-sage-100"
            />
            <p className="mt-2 text-right text-[11px] text-espresso-400">
              {resumeText.length.toLocaleString()} / 50,000 characters
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
