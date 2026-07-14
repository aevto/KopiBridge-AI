"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2, X } from "lucide-react";

export function DeleteAnalysisButton({
  analysisId,
  role,
}: {
  analysisId: string;
  role: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setIsPending(true);
    setError("");
    const response = await fetch(`/api/analyses/${analysisId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? "The report could not be deleted.");
      setIsPending(false);
      return;
    }
    router.push("/history");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print inline-flex items-center gap-2 rounded-md border border-clay-100 bg-white px-4 py-2.5 text-sm font-semibold text-clay-700 hover:bg-clay-50"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-900/45 p-5"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="delete-title"
                  className="text-xl font-semibold text-espresso-900"
                >
                  Delete this report?
                </h2>
                <p className="mt-2 text-sm leading-6 text-espresso-500">
                  The saved analysis for {role} will be permanently removed.
                  Your used credit will not be restored.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                className="text-espresso-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-clay-700">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-2.5 text-sm font-semibold text-espresso-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-md bg-clay-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete report
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
