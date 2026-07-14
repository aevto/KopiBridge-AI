import type { AnalysisResult } from "@/types/analysis";

export interface AnalysisHistoryItem {
  id: string;
  target_role: string;
  company: string | null;
  resume_filename: string | null;
  status: "completed";
  overall_score: number;
  score_label: string;
  final_recommendation: string;
  created_at: string;
}

export interface StoredAnalysis extends AnalysisHistoryItem {
  report: AnalysisResult;
}
