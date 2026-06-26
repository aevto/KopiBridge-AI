"use client";

import { BriefcaseBusiness, ClipboardPaste } from "lucide-react";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  onLoadDemoJobDescription: () => void;
}

export function JobDescriptionInput({ value, onChange, onLoadDemoJobDescription }: JobDescriptionInputProps) {
  return (
    <section className="relative border-b border-espresso-100 py-6">
      <div className="flex gap-4">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-espresso-800 text-sm font-semibold text-white">
          2
        </span>
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md bg-espresso-50 text-espresso-700">
                <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-espresso-900">Paste Target Role</h3>
                <p className="mt-1 text-sm leading-6 text-espresso-500">Paste an AI-adjacent role, or load the demo job description.</p>
              </div>
            </div>
            <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${value.trim() ? "border-sage-100 bg-sage-50 text-sage-700" : "border-espresso-100 bg-espresso-50 text-espresso-500"}`}>
              {value.trim() ? "Job description ready" : "Awaiting target role"}
            </span>
          </div>

          <button
            type="button"
            onClick={onLoadDemoJobDescription}
            className="inline-flex w-fit max-w-full items-center justify-center gap-2 rounded-md border border-espresso-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-espresso-800 shadow-sm transition hover:border-sage-500 hover:text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-100"
          >
            <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
            Load Demo Job Description
          </button>

          <details className="group rounded-md border border-espresso-100 bg-white" open={!value.trim()}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-espresso-900">
              Target job description text
              <span className="text-xs font-medium text-espresso-500 group-open:hidden">Show</span>
              <span className="hidden text-xs font-medium text-espresso-500 group-open:inline">Hide</span>
            </summary>
            <div className="border-t border-espresso-100 p-3">
              <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Paste an AI-adjacent tech job description here. KopiBridge will compare your resume against the role requirements locally."
                className="min-h-48 w-full rounded-md border border-espresso-100 bg-espresso-50/40 p-4 text-sm leading-7 text-espresso-800 outline-none transition placeholder:text-espresso-400 focus:border-sage-500 focus:bg-white focus:ring-2 focus:ring-sage-100"
              />
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
