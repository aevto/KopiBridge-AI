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
  evidenceSnippet: string;
  matchedTerms: string[];
}

export type GapType =
  | "missing skill"
  | "weak evidence"
  | "experience gap"
  | "positioning gap"
  | "optional advantage";

export interface GapItem {
  id: string;
  label: string;
  category: RequirementCategory;
  severity: GapSeverity;
  reason: string;
  whyItMatters: string;
  gapType: GapType;
  estimatedEffort: string;
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
  claimStatus: RecommendationStatus;
}

export interface PriorityAction {
  title: string;
  detail: string;
  severity: GapSeverity;
  timeframe: string;
}

export type RecommendationStatus = "safe" | "reframe" | "needs-proof";

export interface ResumeRecommendation {
  status: RecommendationStatus;
  text: string;
}

export interface RoadmapWeek {
  week: string;
  title: string;
  tasks: string[];
}

export interface ExistingStrength {
  title: string;
  evidence: string;
  whyItMatters: string;
}

export interface ActionRoadmapGroup {
  period: "Today" | "This week" | "This month" | "Longer term";
  tasks: string[];
}

export interface BulletRewrite {
  original: string;
  suggested: string;
  whyStronger: string;
  status: RecommendationStatus;
}

export interface InterviewPreparation {
  themes: string[];
  questions: string[];
  evidenceToPrepare: string[];
  honestWeaknesses: string[];
  doNotBluff: string[];
}

export type ApplicationDecision =
  | "Apply now"
  | "Apply after light resume edits"
  | "Build one proof project first"
  | "Significant preparation needed";

export interface FinalRecommendation {
  decision: ApplicationDecision;
  explanation: string;
  nextStep: string;
}

export interface AnalysisResult {
  generatedAt: string;
  guidanceSource: "local" | "openai";
  overallScore: number;
  scoreLabel: string;
  scoreBreakdown: ScoreBreakdownItem[];
  scoreDisclaimer: string;
  roleFitSummary: string;
  existingStrengths: ExistingStrength[];
  matchedRequirements: RequirementMatch[];
  weakRequirements: GapItem[];
  evidenceMap: EvidenceMapItem[];
  priorityActions: PriorityAction[];
  resumeImprovements: ResumeRecommendation[];
  roadmap: RoadmapWeek[];
  actionRoadmap: ActionRoadmapGroup[];
  bulletRewrites: BulletRewrite[];
  interviewPreparation: InterviewPreparation;
  finalRecommendation: FinalRecommendation;
}
