import { loadEnvConfig } from "@next/env";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import {
  extractResumeImages,
  transcribeAnswer,
  reviewInterviewAnswer,
} from "@/lib/openai-media";
import { enhanceAnalysisWithOpenAI } from "@/lib/openai-guidance";
import { analyseResumeAgainstJob } from "@/lib/analyse";
import { SAMPLE_JOB_DESCRIPTION } from "@/lib/sampleData";
import { validatePcmWav } from "@/lib/multimodal";

loadEnvConfig(process.cwd());
const fixtures = path.resolve("tests/fixtures/multimodal");
const output = path.resolve("reports/evaluation");
mkdirSync(output, { recursive: true });
const manifest = JSON.parse(
  readFileSync(path.join(fixtures, "manifest.json"), "utf8"),
);
const savedPath = path.join(output, "model-results.json");
const runs: Record<string, unknown>[] = existsSync(savedPath)
  ? JSON.parse(readFileSync(savedPath, "utf8")).runs
  : [];
for (const run of runs) {
  if (!run.requestedModel)
    run.requestedModel = String(run.model).replace(/-\d{4}-\d{2}-\d{2}$/, "");
}
const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
function wer(reference: string, hypothesis: string) {
  const a = words(reference),
    b = words(hypothesis);
  let row = b.map((_: string, i: number) => i + 1);
  row.unshift(0);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++)
      next.push(
        Math.min(next[j] + 1, row[j + 1] + 1, row[j] + (a[i] === b[j] ? 0 : 1)),
      );
    row = next;
  }
  return Number((row[b.length] / Math.max(a.length, 1)).toFixed(4));
}
function save() {
  writeFileSync(
    path.join(output, "model-results.json"),
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        dataset: manifest.origin,
        note: "Exploratory synthetic fixtures, not a representative human benchmark. Single run per case/model. No hiring accuracy is measured.",
        runs,
      },
      null,
      2,
    ),
  );
}
async function measure(
  kind: string,
  model: string,
  id: string,
  action: () => Promise<Record<string, unknown>>,
) {
  if (
    runs.some(
      (run) =>
        run.kind === kind &&
        run.requestedModel === model &&
        run.id === id &&
        run.success,
    )
  )
    return;
  const start = performance.now();
  try {
    const result = await action();
    runs.push({
      kind,
      model,
      id,
      success: true,
      latencyMs: Math.round(performance.now() - start),
      ...result,
      requestedModel: model,
    });
  } catch (error) {
    const e = error as {
      status?: number;
      code?: string;
      name?: string;
      message?: string;
    };
    runs.push({
      kind,
      model,
      requestedModel: model,
      id,
      success: false,
      latencyMs: Math.round(performance.now() - start),
      error: {
        status: e.status,
        code: e.code,
        name: e.name,
        message: e.message?.slice(0, 250),
      },
    });
  }
  save();
  console.log(
    JSON.stringify({
      kind,
      model,
      id,
      success: runs.at(-1)?.success,
      latencyMs: runs.at(-1)?.latencyMs,
    }),
  );
}

async function main() {
  for (const model of ["gpt-4.1-mini", "gpt-4o-mini"])
    for (const fixture of manifest.images)
      await measure("vision", model, fixture.id, async () => {
        const result = await extractResumeImages(
          [
            `data:image/png;base64,${readFileSync(path.join(fixtures, fixture.image)).toString("base64")}`,
          ],
          model,
        );
        return {
          ...result,
          reference: fixture.reference,
          wordErrorRate: wer(fixture.reference, result.text),
        };
      });
  for (const model of ["gpt-4o-mini-transcribe", "whisper-1"])
    for (const fixture of manifest.answers)
      await measure("audio", model, fixture.id, async () => {
        const bytes = readFileSync(path.join(fixtures, fixture.audio));
        const durationSeconds = validatePcmWav(bytes);
        const result = await transcribeAnswer(bytes, model);
        return {
          ...result,
          reference: fixture.text,
          wordErrorRate: wer(fixture.text, result.text),
          durationSeconds,
        };
      });
  const vision = runs.find(
    (x) =>
      x.kind === "vision" &&
      x.requestedModel === "gpt-4.1-mini" &&
      x.id === "clean" &&
      x.success,
  );
  if (!vision) {
    console.log("Integrated evaluation blocked: selected vision run failed.");
    return;
  }
  const resumeText = String(vision.text);
  const localReport = analyseResumeAgainstJob(
    resumeText,
    SAMPLE_JOB_DESCRIPTION,
  );
  for (const model of ["gpt-5.6-terra", "gpt-4.1-mini"])
    await measure("guidance", model, "integrated-resume", async () => {
      const report = await enhanceAnalysisWithOpenAI(
        {
          report: localReport,
          resumeText,
          jobDescription: SAMPLE_JOB_DESCRIPTION,
          targetRole: "Junior AI Engineer",
        },
        model,
      );
      const fixedPreserved =
        report.overallScore === localReport.overallScore &&
        JSON.stringify(report.evidenceMap) ===
          JSON.stringify(localReport.evidenceMap) &&
        JSON.stringify(
          report.weakRequirements.map((g) => [g.id, g.severity]),
        ) ===
          JSON.stringify(
            localReport.weakRequirements.map((g) => [g.id, g.severity]),
          );
      return { report, fixedPreserved };
    });
  const chosen = runs.find(
    (x) =>
      x.kind === "guidance" &&
      x.requestedModel === "gpt-5.6-terra" &&
      x.success,
  );
  const report = (chosen?.report || localReport) as typeof localReport;
  for (const model of ["gpt-5.6-terra", "gpt-4.1-mini"])
    for (const fixture of manifest.answers)
      await measure("interview-grounded-v2", model, fixture.id, async () => {
        const audio = runs.find(
          (x) =>
            x.kind === "audio" &&
            x.requestedModel === "gpt-4o-mini-transcribe" &&
            x.id === fixture.id &&
            x.success,
        );
        if (!audio)
          throw new Error(
            "Selected transcription failed; integrated input unavailable.",
          );
        const transcript = String(audio.text);
        const question = report.interviewPreparation.questions[0];
        const result = await reviewInterviewAnswer(
          { report, targetRole: "Junior AI Engineer", question, transcript },
          model,
        );
        return { ...result, question, transcript, quotesVerified: true };
      });
  writeFileSync(
    path.join(output, "integrated-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(`Saved ${runs.length} live provider runs.`);
}
void main();
