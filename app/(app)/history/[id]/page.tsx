import { notFound } from "next/navigation";
import { z } from "zod";
import { DeleteAnalysisButton } from "@/components/DeleteAnalysisButton";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { requireUser } from "@/lib/auth";
import { getAnalysis } from "@/lib/history";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requireUser(`/history/${id}`);
  const analysis = await getAnalysis(user.id, id);
  if (!analysis) notFound();
  return (
    <div>
      <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-sage-700">
            Saved report
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-espresso-900">
            {analysis.target_role}
          </h1>
          <p className="mt-2 text-sm text-espresso-500">
            {analysis.company || "Company not specified"} |{" "}
            {new Intl.DateTimeFormat("en-SG", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(analysis.created_at))}
          </p>
        </div>
        <DeleteAnalysisButton
          analysisId={analysis.id}
          role={analysis.target_role}
        />
      </div>
      <ResultsDashboard
        result={analysis.report}
        targetRole={analysis.target_role}
        company={analysis.company}
      />
    </div>
  );
}
