import { NextResponse } from "next/server";
import { analyseResumeAgainstJob } from "@/lib/analyse";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { analysisRequestSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_BYTES = 120_000;

export async function POST(request: Request) {
  if (!getSupabaseConfig()) {
    return NextResponse.json(
      {
        error: "Analysis service is not configured.",
        code: "SERVICE_UNAVAILABLE",
      },
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { error: "The submitted text is too large.", code: "PAYLOAD_TOO_LARGE" },
      { status: 413 },
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: "Sign in to run an analysis.", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body must be valid JSON.", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = analysisRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Check the submitted fields.",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const { data: reservationRows, error: reservationError } = await supabase.rpc(
    "reserve_analysis_credit",
    {
      p_idempotency_key: input.idempotencyKey,
    },
  );
  const reservation = reservationRows?.[0];

  if (reservationError || !reservation) {
    return NextResponse.json(
      {
        error: "Credits could not be reserved. Try again.",
        code: "CREDIT_ERROR",
      },
      { status: 503 },
    );
  }

  if (!reservation.accepted) {
    if (
      reservation.reason === "duplicate" &&
      reservation.existing_analysis_id
    ) {
      return NextResponse.json({
        analysisId: reservation.existing_analysis_id,
        remaining: reservation.remaining,
        duplicate: true,
      });
    }

    if (reservation.reason === "duplicate") {
      return NextResponse.json(
        {
          error: "This analysis is already processing. Please wait a moment.",
          code: "DUPLICATE_REQUEST",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error:
          "You have used all three analyses for today. Credits reset at midnight Singapore time.",
        code: "NO_CREDITS",
        remaining: 0,
      },
      { status: 429 },
    );
  }

  const reservationId = reservation.reservation_id as string;

  try {
    const report = analyseResumeAgainstJob(
      input.resumeText,
      input.jobDescription,
    );
    const { data: analysisId, error: storeError } = await supabase.rpc(
      "store_completed_analysis",
      {
        p_reservation_id: reservationId,
        p_target_role: input.targetRole,
        p_company: input.company,
        p_resume_filename: input.resumeFilename,
        p_overall_score: report.overallScore,
        p_score_label: report.scoreLabel,
        p_final_recommendation: report.finalRecommendation.decision,
        p_report: report,
        p_idempotency_key: input.idempotencyKey,
      },
    );

    if (storeError || !analysisId) {
      console.error("Failed to store completed analysis", {
        code: storeError?.code,
        message: storeError?.message,
        details: storeError?.details,
        hint: storeError?.hint,
      });
      throw new Error("The completed report could not be stored.");
    }

    return NextResponse.json(
      { analysisId, remaining: reservation.remaining, report },
      { status: 201 },
    );
  } catch (error) {
    const { data: refunded, error: refundError } = await supabase.rpc(
      "refund_analysis_credit",
      {
        p_reservation_id: reservationId,
      },
    );
    console.error("Analysis processing failed", {
      message: error instanceof Error ? error.message : "Unknown error",
      refunded: refunded === true,
      refundError: refundError?.message,
    });
    return NextResponse.json(
      {
        error:
          "The analysis could not be completed. Your credit has been restored.",
        code: "ANALYSIS_FAILED",
        remaining:
          refunded === true
            ? Math.min(Number(reservation.remaining) + 1, 3)
            : reservation.remaining,
      },
      { status: 500 },
    );
  }
}
