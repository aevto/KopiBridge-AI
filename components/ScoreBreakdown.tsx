import type { ScoreBreakdownItem } from "@/types/analysis";

interface ScoreBreakdownProps {
  items: ScoreBreakdownItem[];
}

export function ScoreBreakdown({ items }: ScoreBreakdownProps) {
  return (
    <section className="print-card print-avoid rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-espresso-900">
          Score Breakdown
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-espresso-500">
          Category scores are calculated locally from direct matches and
          adjacent evidence.
        </p>
      </div>
      <div className="mt-6 space-y-5">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-md border border-espresso-100 bg-espresso-50/35 p-4"
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h4 className="text-base font-semibold text-espresso-900">
                  {item.label}
                </h4>
                <p className="mt-1 text-xs font-bold uppercase text-espresso-400">
                  Weight {Math.round(item.weight * 100)}%
                </p>
              </div>
              <span className="text-2xl font-semibold text-espresso-900">
                {item.score}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-espresso-100">
              <div
                className="print-progress-fill h-full rounded-full bg-sage-600"
                style={{ width: `${item.score}%` }}
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-espresso-600">
              {item.explanation}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
