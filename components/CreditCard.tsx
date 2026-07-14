import { Clock3, Zap } from "lucide-react";
import type { CreditStatus } from "@/lib/credits";

export function CreditCard({ credits }: { credits: CreditStatus }) {
  const percentage = credits.limit
    ? (credits.remaining / credits.limit) * 100
    : 0;
  const reset = new Intl.DateTimeFormat("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Singapore",
  }).format(new Date(credits.resetsAt));

  return (
    <section className="rounded-lg border border-espresso-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-espresso-400">
            Daily allowance
          </p>
          <p className="mt-2 text-2xl font-semibold text-espresso-900">
            {credits.remaining} of {credits.limit}
          </p>
          <p className="mt-1 text-sm text-espresso-500">
            analyses remaining today
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-ambergap-50 text-ambergap-600">
          <Zap className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-espresso-100">
        <div
          className="h-full rounded-full bg-sage-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-espresso-400">
        <Clock3 className="h-3.5 w-3.5" />
        Resets at {reset}, Asia/Singapore
      </p>
    </section>
  );
}
