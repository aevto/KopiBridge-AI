import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  FileSearch,
} from "lucide-react";
import type { AnalysisHistoryItem } from "@/types/history";

export function HistoryList({
  items,
  compact = false,
}: {
  items: AnalysisHistoryItem[];
  compact?: boolean;
}) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-espresso-200 bg-white p-8 text-center">
        <FileSearch className="mx-auto h-7 w-7 text-espresso-300" />
        <h3 className="mt-4 text-lg font-semibold text-espresso-900">
          No saved analyses yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-espresso-500">
          Your successful reports will appear here. Uploaded files are not
          stored.
        </p>
        <Link
          href="/analysis/new"
          className="mt-5 inline-flex rounded-md bg-espresso-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Start your first analysis
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-espresso-100 overflow-hidden rounded-lg border border-espresso-100 bg-white shadow-card">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/history/${item.id}`}
          className="group grid gap-4 p-4 transition hover:bg-espresso-50/60 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-espresso-400">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              {item.company || "Company not specified"}
            </div>
            <h3 className="mt-2 truncate text-base font-semibold text-espresso-900">
              {item.target_role}
            </h3>
            {!compact ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-espresso-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Intl.DateTimeFormat("en-SG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Singapore",
                }).format(new Date(item.created_at))}
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-5 sm:justify-end">
            <div className="text-right">
              <p className="text-2xl font-semibold text-espresso-900">
                {item.overall_score}%
              </p>
              <p className="text-xs text-sage-700">{item.score_label}</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-espresso-300 transition group-hover:text-espresso-700" />
          </div>
        </Link>
      ))}
    </div>
  );
}
