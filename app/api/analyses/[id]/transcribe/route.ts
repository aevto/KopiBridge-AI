import { z } from "zod";
import { MEDIA_LIMITS, validatePcmWav } from "@/lib/multimodal";
import { transcribeAnswer } from "@/lib/openai-media";
import { isOpenAiGuidanceConfigured } from "@/lib/openai-guidance";
import {
  mediaError,
  MediaRequestError,
  mediaSession,
  readBoundedBody,
  reserveMediaOperation,
} from "@/lib/media-http";

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
    const { data: report } = await supabase
      .from("analyses")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!report) throw new MediaRequestError("Report not found.", 404);
    const key = request.headers.get("idempotency-key");
    if (
      !z.uuid().safeParse(key).success ||
      request.headers.get("x-processing-consent") !== "true"
    )
      throw new MediaRequestError("Confirm audio processing consent.");
    const bytes = await readBoundedBody(request, MEDIA_LIMITS.audioBytes);
    try {
      validatePcmWav(bytes);
    } catch (error) {
      throw new MediaRequestError((error as Error).message);
    }
    if (!isOpenAiGuidanceConfigured())
      throw new MediaRequestError(
        "Transcription is unavailable. Type your answer instead.",
        503,
      );
    await reserveMediaOperation(supabase, "transcription", key!, id);
    const result = await transcribeAnswer(bytes);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return mediaError(error);
  }
}
