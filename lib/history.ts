import { createClient } from "@/lib/supabase/server";
import type { AnalysisHistoryItem, StoredAnalysis } from "@/types/history";

const summaryColumns =
  "id, target_role, company, resume_filename, status, overall_score, score_label, final_recommendation, created_at";

export async function getRecentAnalyses(userId: string, limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select(summaryColumns)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Unable to load analysis history.");
  return (data ?? []) as AnalysisHistoryItem[];
}

export async function getAnalysis(userId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select(`${summaryColumns}, report`)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Unable to load this report.");
  return data as StoredAnalysis | null;
}
