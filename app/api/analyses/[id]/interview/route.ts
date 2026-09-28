import { z } from "zod";
import {
  interviewRequestSchema,
  localInterviewFeedback,
} from "@/lib/multimodal";
import { reviewInterviewAnswer } from "@/lib/openai-media";
import { isOpenAiGuidanceConfigured } from "@/lib/openai-guidance";
import {
  mediaError,
  MediaRequestError,
  mediaSession,
  readBoundedBody,
  reserveMediaOperation,
} from "@/lib/media-http";
import type { AnalysisResult } from "@/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await mediaSession(request);
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success)
      throw new MediaRequestError("Report not found.", 404);
    const { data: analysis } = await supabase
      .from("analyses")
      .select("id, report, target_role")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!analysis) throw new MediaRequestError("Report not found.", 404);
    let body: unknown;
    try {
      body = JSON.parse((await readBoundedBody(request, 40_000)).toString());
    } catch (error) {
      if (error instanceof MediaRequestError) throw error;
      throw new MediaRequestError("Invalid request body.");
    }
    const parsed = interviewRequestSchema.safeParse(body);
    if (!parsed.success)
      throw new MediaRequestError(parsed.error.issues[0].message);
    const report = analysis.report as AnalysisResult;
    const question =
      report.interviewPreparation.questions[parsed.data.questionIndex];
    if (!question)
      throw new MediaRequestError("Choose a question from this report.");
    const operationId = await reserveMediaOperation(
      supabase,
      "interview",
      parsed.data.idempotencyKey,
      id,
    );
    let feedback = localInterviewFeedback(report);
    let source = "local";
    let model = "deterministic-checklist";
    if (isOpenAiGuidanceConfigured()) {
      try {
        const reviewed = await reviewInterviewAnswer({
          report,
          targetRole: analysis.target_role,
          question,
          transcript: parsed.data.transcript,
        });
        feedback = reviewed.feedback;
        model = reviewed.model;
        source = "openai";
      } catch {
        /* Save the labelled checklist when the provider cannot give validated feedback. */
      }
    }
    const { data: practiceId, error } = await supabase.rpc(
      "save_interview_practice",
      {
        p_operation_id: operationId,
        p_question: question,
        p_transcript: parsed.data.transcript,
        p_feedback: feedback,
        p_source: source,
        p_model: model,
      },
    );
    if (error || !practiceId)
      throw new MediaRequestError(
        "Your answer could not be saved. It is still in the editor.",
        503,
      );
    return Response.json(
      {
        id: practiceId,
        question,
        transcript: parsed.data.transcript,
        feedback,
        source,
        model,
        created_at: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mediaError(error);
  }
}
