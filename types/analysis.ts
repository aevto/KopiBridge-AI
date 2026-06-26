export type EvidenceStrength = "strong" | "partial" | "weak" | "missing";

export type GapSeverity = "high" | "medium" | "low";

export type RequirementCategory =
  | "skills"
  | "experience"
  | "tools"
  | "education"
  | "communication";

export interface RequirementMatch {
  id: string;
  label: string;
  category: RequirementCategory;
  strength: EvidenceStrength;
  score: number;
  evidence: string;
  matchedTerms: string[];
}

export interface GapItem {
  id: string;
  label: string;
  category: RequirementCategory;
  severity: GapSeverity;
  reason: string;
  action: string;
}

export interface ScoreBreakdownItem {
  id: RequirementCategory;
  label: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface EvidenceMapItem {
  label: string;
  category: RequirementCategory;
  strength: EvidenceStrength;
  evidence: string;
}

export interface PriorityAction {
  title: string;
  detail: string;
  severity: GapSeverity;
  timeframe: string;
}

export type RecommendationStatus = "safe" | "needs-proof";

export interface ResumeRecommendation {
  status: RecommendationStatus;
  text: string;
}

export interface RoadmapWeek {
  week: string;
  title: string;
  tasks: string[];
}

export interface AnalysisResult {
  generatedAt: string;
  overallScore: number;
  scoreLabel: string;
  scoreBreakdown: ScoreBreakdownItem[];
  roleFitSummary: string;
  matchedRequirements: RequirementMatch[];
  weakRequirements: GapItem[];
  evidenceMap: EvidenceMapItem[];
  priorityActions: PriorityAction[];
  resumeImprovements: ResumeRecommendation[];
  roadmap: RoadmapWeek[];
}
