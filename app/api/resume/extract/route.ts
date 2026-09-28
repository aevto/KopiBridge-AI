import {
  imageRequestSchema,
  MEDIA_LIMITS,
  validateImageDataUrl,
} from "@/lib/multimodal";
import { extractResumeImages } from "@/lib/openai-media";
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

export async function POST(request: Request) {
  try {
    const { supabase } = await mediaSession(request);
    let body: unknown;
    try {
      body = JSON.parse(
        (
          await readBoundedBody(request, MEDIA_LIMITS.imageRequestBytes)
        ).toString(),
      );
    } catch (error) {
      if (error instanceof MediaRequestError) throw error;
      throw new MediaRequestError("Invalid request body.");
    }
    const parsed = imageRequestSchema.safeParse(body);
    if (!parsed.success)
      throw new MediaRequestError(
        "Upload up to three resume pages and confirm the processing consent.",
      );
    try {
      parsed.data.images.forEach(validateImageDataUrl);
    } catch {
      throw new MediaRequestError("The image contents are invalid.");
    }
    if (!isOpenAiGuidanceConfigured())
      throw new MediaRequestError(
        "Image reading is unavailable. Paste the resume text instead.",
        503,
      );
    await reserveMediaOperation(supabase, "vision", parsed.data.idempotencyKey);
    const result = await extractResumeImages(parsed.data.images);
    return Response.json(
      { text: result.text, warnings: result.warnings, model: result.model },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mediaError(error);
  }
}
