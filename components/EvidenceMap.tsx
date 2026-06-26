import type { EvidenceMapItem, EvidenceStrength } from "@/types/analysis";

interface EvidenceMapProps {
  items: EvidenceMapItem[];
}

const strengthStyles: Record<EvidenceStrength, string> = {
  strong: "border-sage-100 bg-sage-50 text-sage-700",
  partial: "border-sage-100 bg-white text-sage-700",
  weak: "border-ambergap-100 bg-ambergap-50 text-ambergap-600",
  missing: "border-clay-100 bg-clay-50 text-clay-700"
};

const strengthLabels: Record<EvidenceStrength, string> = {
  strong: "Strong",
  partial: "Partial",
  weak: "Weak",
  missing: "Missing"
};

export function EvidenceMap({ items }: EvidenceMapProps) {
  return (
    <section className="print-card print-avoid rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-espresso-900">Evidence Strength Map</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-espresso-500">
            A requirement-by-requirement view of what the resume already proves.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(["strong", "partial", "weak", "missing"] as EvidenceStrength[]).map((strength) => (
            <span key={strength} className={`rounded-full border px-2.5 py-1 font-bold ${strengthStyles[strength]}`}>
              {strengthLabels[strength]}
            </span>
          ))}
        </div>
      </div>

      <div className="print-stack mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.label} className="rounded-md border border-espresso-100 bg-espresso-50/35 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold leading-6 text-espresso-900">{item.label}</h4>
                <p className="mt-1 text-xs font-bold uppercase text-espresso-400">{item.category}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${strengthStyles[item.strength]}`}>
                {strengthLabels[item.strength]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-espresso-600">{item.evidence}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
