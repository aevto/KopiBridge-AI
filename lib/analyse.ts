import { CATEGORY_WEIGHTS, SKILL_SIGNALS, type SkillSignal } from "@/lib/skills";
import {
  clampScore,
  countTermHits,
  evidenceScoreFromHits,
  normaliseText,
  scoreLabel,
  severityFromStrength
} from "@/lib/scoring";
import type {
  AnalysisResult,
  EvidenceMapItem,
  GapItem,
  PriorityAction,
  RequirementCategory,
  RequirementMatch,
  ResumeRecommendation,
  RoadmapWeek,
  ScoreBreakdownItem
} from "@/types/analysis";

const DEFAULT_SIGNAL_IDS = [
  "python",
  "machine-learning",
  "llm",
  "sql",
  "api-backend",
  "react",
  "deployment",
  "communication",
  "degree"
];

const GAP_PROOF_GUIDES: Record<
  string,
  {
    proofAction: string;
    week2: string;
    week3: string;
    resumeLine: string;
  }
> = {
  python: {
    proofAction: "Build one focused Python feature and show the library, input data, output, and result.",
    week2: "Extend one existing project with a Python analysis or automation feature and commit the code publicly.",
    week3: "Add a README section that explains the Python libraries used, sample input, expected output, and one limitation.",
    resumeLine: "Only add stronger Python claims after the project shows real code, libraries, and an outcome."
  },
  "javascript-typescript": {
    proofAction: "Ship one TypeScript or JavaScript feature with clear user flow and project impact.",
    week2: "Add a small TypeScript feature to your strongest web project, such as validation, filtering, or a saved result state.",
    week3: "Document the component, state, and error-handling decisions in the project README.",
    resumeLine: "Only strengthen JavaScript/TypeScript wording after the feature is working and linked."
  },
  react: {
    proofAction: "Add one polished React feature that demonstrates state, component structure, and user feedback.",
    week2: "Improve an existing React project with a real workflow, loading state, empty state, and responsive layout.",
    week3: "Record a short demo GIF or screenshot sequence showing the React workflow before adding it to the resume.",
    resumeLine: "Only claim React product experience if the demo is usable and publicly reviewable."
  },
  sql: {
    proofAction: "Create one SQL-backed analysis with joins, filters, and a short insight summary.",
    week2: "Build a small notebook or script that uses SQL joins and aggregations on a public dataset.",
    week3: "Add the schema, three important queries, and a before/after data-cleaning note to the repository.",
    resumeLine: "Only list SQL examples that include real queries or database work you can explain."
  },
  "machine-learning": {
    proofAction: "Document one ML project with dataset, model choice, evaluation metric, and error cases.",
    week2: "Take one ML project and add a simple evaluation table with baseline, metric, and failure examples.",
    week3: "Add a README section explaining why the metric was chosen and what the model still gets wrong.",
    resumeLine: "Safe to strengthen ML wording only when the resume names a model, dataset, and metric."
  },
  "deep-learning": {
    proofAction: "Build or document a small PyTorch/TensorFlow experiment with a measurable metric.",
    week2: "Create a compact notebook that trains or fine-tunes a small model and records one evaluation result.",
    week3: "Add reproducible setup steps and a short note about overfitting, compute limits, or model errors.",
    resumeLine: "Only add framework names when the repo shows actual PyTorch/TensorFlow code."
  },
  llm: {
    proofAction: "Build a small LLM workflow with prompts, guardrails, evaluation notes, and a user-facing demo.",
    week2: "Create a tiny LLM app around one task, such as resume bullet feedback or FAQ answering, with clear input and output.",
    week3: "Add prompt examples, failure cases, and a simple quality checklist before claiming LLM application experience.",
    resumeLine: "Needs proof first: do not add LLM experience until the demo and evaluation notes exist."
  },
  rag: {
    proofAction: "Build a small RAG demo with a local knowledge base before adding RAG or vector search to the resume.",
    week2: "Create a minimal RAG proof using a few local markdown/PDF notes, chunking, retrieval, and cited answers.",
    week3: "Document chunk size, retrieval examples, one bad answer, and how you checked answer quality.",
    resumeLine: "Needs proof first: mention RAG only after the retrieval workflow can be shown."
  },
  "api-backend": {
    proofAction: "Expose one backend API endpoint with validation, sample requests, and predictable error responses.",
    week2: "Add a small API endpoint to a project, such as analyse, search, or save-report metadata.",
    week3: "Document request/response examples and add one error case so backend evidence is not just a keyword.",
    resumeLine: "Only claim API experience where the endpoint and validation can be inspected."
  },
  testing: {
    proofAction: "Add one implemented test or error-handling flow before mentioning testing in the resume.",
    week2: "Choose the most relevant project and add one unit test, validation check, or failure-state screen.",
    week3: "Show how to run the test or trigger the error-handling flow in the README.",
    resumeLine: "Needs proof first: mention testing only if the test or error-handling path is actually implemented."
  },
  cloud: {
    proofAction: "Complete one small cloud deployment or documented cloud walkthrough before claiming cloud experience.",
    week2: "Prepare one deployable project with environment notes, build command, and a clear service boundary.",
    week3: "Deploy to AWS/GCP/Azure free tier or document a Cloud Run/Lambda-style walkthrough with screenshots.",
    resumeLine: "Needs proof first: add cloud platform names only after you have used that platform directly."
  },
  docker: {
    proofAction: "Containerise one existing AI/web project with a Dockerfile and local setup instructions.",
    week2: "Pick one existing project and make sure it can run locally with documented install and start commands.",
    week3: "Add a Dockerfile, test `docker build`, and include the exact run command in the README.",
    resumeLine: "Needs proof first: add Docker only after the container builds and runs on your machine."
  },
  "data-pipelines": {
    proofAction: "Build a simple ingest-clean-transform pipeline and show before/after data quality checks.",
    week2: "Create a small ETL script that loads a messy dataset, cleans fields, and exports a usable result.",
    week3: "Add before/after row counts, validation checks, and a short explanation of cleaning decisions.",
    resumeLine: "Only claim data pipeline work if the repo shows ingestion, transformation, and validation."
  },
  deployment: {
    proofAction: "Deploy one working project and add the live demo link only after the deployment is stable.",
    week2: "Choose the strongest AI/web project and make it deployable with a clean README and environment notes.",
    week3: "Deploy it to Vercel or another suitable host, verify the URL, and add screenshots after it works.",
    resumeLine: "Safe to add a live demo link only when the deployed project loads reliably."
  },
  monitoring: {
    proofAction: "Add a basic evaluation or monitoring note with metric, baseline, and failure cases.",
    week2: "Add logging, an evaluation table, or a simple metric check to your most relevant AI project.",
    week3: "Document baseline result, one failure case, and one improvement idea in the README.",
    resumeLine: "Only mention monitoring/evaluation if you can point to a metric or observed failure case."
  },
  mlops: {
    proofAction: "Add a lightweight CI or model-evaluation workflow before claiming MLOps.",
    week2: "Add a small script that re-runs one model or app quality check from the command line.",
    week3: "Wire the check into GitHub Actions or document the manual command and expected output.",
    resumeLine: "Needs proof first: add MLOps only after there is automation, versioning, or an evaluation workflow."
  },
  git: {
    proofAction: "Make the project repository clean, public if appropriate, and easy to review.",
    week2: "Clean up one repository with meaningful commits, setup instructions, and screenshots.",
    week3: "Add issue/PR notes or a changelog entry to show collaborative workflow habits.",
    resumeLine: "Safe to add GitHub links only when the repository is public, clean, and runnable."
  },
  degree: {
    proofAction: "Map relevant coursework to the target role without overstating skills.",
    week2: "Add one coursework-backed mini project or assignment summary related to the target AI role.",
    week3: "Link coursework to project evidence rather than listing modules as standalone proof.",
    resumeLine: "Safe to keep relevant coursework concise if it genuinely supports the target role."
  },
  communication: {
    proofAction: "Write one short project explanation for a non-technical stakeholder.",
    week2: "Add a product-facing project summary that explains problem, user, and outcome without jargon.",
    week3: "Prepare one interview story about explaining a technical trade-off to teammates or users.",
    resumeLine: "Safe to mention communication only when tied to a project, presentation, or collaboration example."
  }
};

export function analyseResumeAgainstJob(
  resumeText: string,
  jobDescription: string
): AnalysisResult {
  const selectedSignals = selectSignalsForJob(jobDescription);
  const requirementMatches = selectedSignals.map((signal) => scoreSignal(signal, resumeText));

  const scoreBreakdown = buildScoreBreakdown(requirementMatches);
  const scoredWeight = scoreBreakdown.reduce((total, item) => total + item.weight, 0);
  const overallScore = clampScore(
    scoreBreakdown.reduce((total, item) => total + item.score * item.weight, 0) / Math.max(scoredWeight, 0.01)
  );

  const matchedRequirements = requirementMatches
    .filter((item) => item.strength === "strong" || item.strength === "partial")
    .sort((a, b) => b.score - a.score);

  const weakRequirements = requirementMatches
    .filter((item) => item.strength === "weak" || item.strength === "missing")
    .map<GapItem>((item) => ({
      id: item.id,
      label: item.label,
      category: item.category,
      severity: severityFromStrength(item.strength),
      reason:
        item.strength === "missing"
          ? `No direct resume evidence found for ${item.label.toLowerCase()}.`
          : `Only indirect evidence found: ${item.evidence.toLowerCase()}.`,
      action: proofActionForGap(item.id)
    }))
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  const evidenceMap = requirementMatches.map<EvidenceMapItem>((item) => ({
    label: item.label,
    category: item.category,
    strength: item.strength,
    evidence: item.evidence
  }));

  const priorityActions = buildPriorityActions(weakRequirements, matchedRequirements);
  const resumeImprovements = buildResumeImprovements(weakRequirements, matchedRequirements);
  const roadmap = buildRoadmap(priorityActions, weakRequirements, overallScore);

  return {
    generatedAt: new Date().toISOString(),
    overallScore,
    scoreLabel: scoreLabel(overallScore),
    scoreBreakdown,
    roleFitSummary: buildRoleFitSummary(overallScore, matchedRequirements, weakRequirements),
    matchedRequirements,
    weakRequirements,
    evidenceMap,
    priorityActions,
    resumeImprovements,
    roadmap
  };
}

function selectSignalsForJob(jobDescription: string) {
  const normalisedJob = normaliseText(jobDescription);
  const explicitSignals = SKILL_SIGNALS.filter((signal) => {
    const directHits = countTermHits(normalisedJob, signal.aliases);
    const relatedHits = countTermHits(normalisedJob, signal.related);
    return directHits > 0 || relatedHits > 0;
  });

  const selected = explicitSignals.length >= 5
    ? explicitSignals
    : SKILL_SIGNALS.filter(
        (signal) => explicitSignals.some((item) => item.id === signal.id) || DEFAULT_SIGNAL_IDS.includes(signal.id)
      );

  return selected.sort((a, b) => b.weight - a.weight).slice(0, 14);
}

function scoreSignal(signal: SkillSignal, resumeText: string): RequirementMatch {
  const primaryHits = countTermHits(resumeText, signal.aliases);
  const relatedHits = countTermHits(resumeText, signal.related);
  const evidence = evidenceText(signal, primaryHits, relatedHits);
  const { strength, score } = evidenceScoreFromHits(primaryHits, relatedHits);

  return {
    id: signal.id,
    label: signal.label,
    category: signal.category,
    strength,
    score: score * signal.weight,
    evidence,
    matchedTerms: [...signal.aliases, ...signal.related].filter((term) => countTermHits(resumeText, [term]) > 0)
  };
}

function buildScoreBreakdown(matches: RequirementMatch[]): ScoreBreakdownItem[] {
  const categories = Object.keys(CATEGORY_WEIGHTS) as RequirementCategory[];

  return categories
    .map((category) => {
      const categoryMatches = matches.filter((match) => match.category === category);
      if (!categoryMatches.length) {
        return null;
      }

      // Each category score is the weighted average of requirement-level evidence scores.
      // The overall score then applies the fixed category weight from lib/skills.ts.
      const max = categoryMatches.reduce((total, match) => {
        const signal = SKILL_SIGNALS.find((item) => item.id === match.id);
        return total + (signal?.weight ?? 1);
      }, 0);
      const earned = categoryMatches.reduce((total, match) => total + match.score, 0);
      const score = clampScore((earned / Math.max(max, 1)) * 100);

      return {
        id: category,
        label: categoryLabel(category),
        score,
        weight: CATEGORY_WEIGHTS[category],
        explanation: categoryExplanation(category, score)
      };
    })
    .filter(Boolean) as ScoreBreakdownItem[];
}

function evidenceText(signal: SkillSignal, primaryHits: number, relatedHits: number) {
  if (primaryHits >= 2) {
    return `Strong direct evidence across ${primaryHits} mentions.`;
  }

  if (primaryHits === 1 && relatedHits > 0) {
    return `Direct mention plus ${relatedHits} related supporting signal${relatedHits > 1 ? "s" : ""}.`;
  }

  if (primaryHits === 1) {
    return "Direct mention found, but impact or project context could be clearer.";
  }

  if (relatedHits > 1) {
    return `Related evidence found through ${relatedHits} adjacent terms.`;
  }

  if (relatedHits === 1) {
    return "Only one adjacent signal found; evidence is thin.";
  }

  return "No direct evidence found in the resume text.";
}

function buildRoleFitSummary(score: number, matched: RequirementMatch[], gaps: GapItem[]) {
  const topMatches = matched.slice(0, 3).map((item) => item.label.toLowerCase());
  const topGaps = gaps.slice(0, 3).map((item) => item.label.toLowerCase());

  if (score >= 82) {
    return `This resume is already a credible fit for the target role, especially around ${joinList(topMatches)}. The fastest improvement is to make the remaining gaps explicit: ${joinList(topGaps)}.`;
  }

  if (score >= 66) {
    return `This is a promising fit with clear strengths in ${joinList(topMatches)}. To become interview-ready, focus the next pass on ${joinList(topGaps)} and add evidence with outcomes.`;
  }

  if (score >= 48) {
    return `The profile has useful foundations, but the role fit is not yet obvious. The resume should add stronger project evidence and close the highest-priority gaps around ${joinList(topGaps)}.`;
  }

  return `The resume is early for this target role. Start by building proof for ${joinList(topGaps)} and rewriting the resume so each project maps to a clear role requirement.`;
}

function buildPriorityActions(gaps: GapItem[], matched: RequirementMatch[]): PriorityAction[] {
  const highImpact = gaps.slice(0, 5).map<PriorityAction>((gap, index) => ({
    title: `Needs proof first: ${gap.action.replace(/\.$/, "")}`,
    detail: `Targets ${gap.label.toLowerCase()} because the job description expects it and current resume evidence is ${gap.severity === "high" ? "missing" : "thin"}. Do the proof before adding the skill to the resume.`,
    severity: gap.severity,
    timeframe: index < 2 ? "This week" : "Next 30 days"
  }));

  if (highImpact.length >= 3) {
    return highImpact;
  }

  return [
    ...highImpact,
    {
      title: "Safe to add: quantify your strongest projects",
      detail: `Use the strongest signals already present, such as ${joinList(matched.slice(0, 2).map((item) => item.label.toLowerCase()))}, and add metrics, users, or technical outcomes.`,
      severity: "medium",
      timeframe: "This week"
    }
  ];
}

function buildResumeImprovements(gaps: GapItem[], matched: RequirementMatch[]): ResumeRecommendation[] {
  const strongMatches = matched
    .filter((item) => item.strength === "strong")
    .slice(0, 3)
    .map((item) => item.label.toLowerCase());
  const topGaps = gaps.slice(0, 3);

  const improvements: ResumeRecommendation[] = [
    {
      status: "safe",
      text: "Safe to add: rewrite one existing project bullet using problem -> action -> technology -> result, but only with facts already in your resume."
    },
    {
      status: "safe",
      text: strongMatches.length
        ? `Safe to add: move supported strengths (${joinList(strongMatches)}) into the top third of the resume and quantify outcomes where possible.`
        : "Safe to add: keep the summary focused on proven coursework, projects, and tools already visible in the resume."
    }
  ];

  for (const gap of topGaps) {
    improvements.push({
      status: "needs-proof",
      text: `${proofResumeLine(gap.id)}`
    });
  }

  if (gaps.some((gap) => gap.category === "tools")) {
    improvements.push({
      status: "needs-proof",
      text: "Needs proof first: separate AI frameworks, deployment tools, and developer tools only after each one has visible project evidence."
    });
  }

  return improvements.slice(0, 6);
}

function buildRoadmap(actions: PriorityAction[], gaps: GapItem[], score: number): RoadmapWeek[] {
  const firstGap = gaps[0];
  const secondGap = gaps[1];
  const thirdGap = gaps[2];
  const proofFocus = firstGap?.label ?? "the highest-priority role gap";
  const buildTask = roadmapTask(firstGap, "week2");
  const evidenceTask = roadmapTask(secondGap ?? firstGap, "week3");
  const supportTask = roadmapTask(thirdGap ?? secondGap ?? firstGap, "week3");

  return [
    {
      week: "Week 1",
      title: "Resume fixes and skill review",
      tasks: [
        `Mark ${proofFocus.toLowerCase()} as "Needs proof first" until a working project or documented evidence exists.`,
        "Update the resume skills section with exact terms from the job description.",
        "Rewrite one existing project bullet using problem -> action -> technology -> result."
      ]
    },
    {
      week: "Week 2",
      title: `Build proof for ${proofFocus}`,
      tasks: [
        buildTask,
        "Keep the scope small enough to finish: one working feature, one README, and one screenshot is better than a half-built platform.",
        firstGap?.id === "rag"
          ? "Include one retrieval example, one cited answer, and one failure case so RAG evidence is explainable."
          : "Connect the project to a user problem and write down the expected input, output, and success check."
      ]
    },
    {
      week: "Week 3",
      title: "Deployment, documentation, testing, or measurable evidence",
      tasks: [
        evidenceTask,
        supportTask,
        "Add GitHub or live demo links only if the repository is public, clean, and the demo actually works."
      ]
    },
    {
      week: "Week 4",
      title: score >= 66 ? "Resume rewrite and application preparation" : "Re-score, rewrite, and fill remaining gaps",
      tasks: [
        "Run KopiBridge again with the revised resume and compare the score breakdown.",
        "Move completed proof into the resume only after it is implemented, documented, and easy to explain.",
        actions[0]
          ? `Prepare one interview story for the top gap: ${actions[0].title.replace("Needs proof first: ", "").toLowerCase()}.`
          : "Prepare two interview stories for proven strengths and one honest story for a known gap."
      ]
    }
  ];
}

function proofActionForGap(id: string) {
  return GAP_PROOF_GUIDES[id]?.proofAction ?? "Create visible project evidence with code, output, README notes, and a measurable result.";
}

function proofResumeLine(id: string) {
  return GAP_PROOF_GUIDES[id]?.resumeLine ?? "Needs proof first: build visible evidence before adding this requirement to the resume.";
}

function roadmapTask(gap: GapItem | undefined, phase: "week2" | "week3") {
  if (!gap) {
    return phase === "week2"
      ? "Choose one missing requirement and build a small working proof with code, README notes, and a screenshot."
      : "Add documentation, setup steps, and one measurable result so the proof is credible.";
  }

  return GAP_PROOF_GUIDES[gap.id]?.[phase] ?? proofActionForGap(gap.id);
}

function categoryLabel(category: RequirementCategory) {
  const labels: Record<RequirementCategory, string> = {
    skills: "Skills",
    experience: "Experience",
    tools: "Tools & Tech",
    education: "Education",
    communication: "Communication"
  };

  return labels[category];
}

function categoryExplanation(category: RequirementCategory, score: number) {
  const quality = score >= 70 ? "well supported" : score >= 45 ? "partially supported" : "needs clearer evidence";
  return `${categoryLabel(category)} evidence is ${quality} by direct and adjacent keyword matches.`;
}

function joinList(items: string[]) {
  if (!items.length) {
    return "the target role requirements";
  }

  if (items.length === 1) {
    return items[0];
  }

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function severityRank(severity: GapItem["severity"]) {
  return severity === "high" ? 0 : severity === "medium" ? 1 : 2;
}
