"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-xl rounded-lg border border-clay-100 bg-white p-7 text-center shadow-card">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-clay-50 text-clay-700">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-espresso-900">
        This page could not be loaded
      </h1>
      <p className="mt-3 text-sm leading-6 text-espresso-500">
        Your saved data has not been changed. Try the request again or return to
        the dashboard.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-espresso-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-espresso-200 px-4 py-2.5 text-sm font-semibold text-espresso-700"
        >
          Dashboard
        </Link>
      </div>
    </section>
  );
}
