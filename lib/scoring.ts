import type { EvidenceStrength, GapSeverity } from "@/types/analysis";

export function normaliseText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#./-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countTermHits(text: string, terms: string[]) {
  const normalised = normaliseText(text);
  return terms.reduce((count, term) => {
    const cleanTerm = normaliseText(term);
    if (!cleanTerm) {
      return count;
    }

    const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = normalised.match(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "g"));
    return count + (matches?.length ?? 0);
  }, 0);
}

export function evidenceScoreFromHits(primaryHits: number, relatedHits: number): {
  strength: EvidenceStrength;
  score: number;
} {
  if (primaryHits >= 2 || (primaryHits >= 1 && relatedHits >= 2)) {
    return { strength: "strong", score: 1 };
  }

  if (primaryHits >= 1) {
    return { strength: "partial", score: 0.64 };
  }

  if (relatedHits >= 2) {
    return { strength: "weak", score: 0.36 };
  }

  if (relatedHits === 1) {
    return { strength: "weak", score: 0.24 };
  }

  return { strength: "missing", score: 0 };
}

export function severityFromStrength(strength: EvidenceStrength): GapSeverity {
  if (strength === "missing") {
    return "high";
  }

  if (strength === "weak") {
    return "medium";
  }

  return "low";
}

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreLabel(score: number) {
  if (score >= 82) {
    return "Strong Match";
  }

  if (score >= 66) {
    return "Good Match";
  }

  if (score >= 48) {
    return "Developing Match";
  }

  return "Early Match";
}
