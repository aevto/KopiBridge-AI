import { notFound } from "next/navigation";
import { z } from "zod";
import { DeleteAnalysisButton } from "@/components/DeleteAnalysisButton";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { requireUser } from "@/lib/auth";
import { getAnalysis } from "@/lib/history";
import { createClient } from "@/lib/supabase/server";
import { InterviewPractice } from "@/components/InterviewPractice";
import type { InterviewPractice as Practice } from "@/lib/multimodal";

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
  const supabase = await createClient();
  const { data: practice, error: practiceError } = await supabase
    .from("interview_practice")
    .select("id, question, transcript, feedback, source, model, created_at")
    .eq("analysis_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);
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
              timeZone: "Asia/Singapore",
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
      <InterviewPractice
        analysisId={id}
        questions={analysis.report.interviewPreparation.questions}
        initialPractices={(practice ?? []) as Practice[]}
        available={!practiceError}
      />
    </div>
  );
}
