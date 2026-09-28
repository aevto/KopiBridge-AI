import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export class MediaRequestError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "INVALID_INPUT",
  ) {
    super(message);
  }
}

export async function mediaSession(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    let sameHost = false;
    try {
      const source = new URL(origin);
      const target = new URL(request.url);
      sameHost =
        ["https:", "http:"].includes(source.protocol) &&
        source.host === (request.headers.get("host") || target.host);
    } catch {
      /* Malformed origins are never trusted. */
    }
    if (!sameHost)
      throw new MediaRequestError("Request origin is not allowed.", 403);
  }
  if (!getSupabaseConfig())
    throw new MediaRequestError("Account services are unavailable.", 503);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    throw new MediaRequestError("Sign in to continue.", 401, "UNAUTHENTICATED");
  return { supabase, user: data.user };
}

export async function readBoundedBody(request: Request, limit: number) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new MediaRequestError("The upload is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new MediaRequestError("The request is empty.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new MediaRequestError("The upload is too large.", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function reserveMediaOperation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kind: "vision" | "transcription" | "interview",
  key: string,
  analysisId?: string,
) {
  const { data, error } = await supabase.rpc("reserve_model_operation", {
    p_kind: kind,
    p_request_key: key,
    p_analysis_id: analysisId || null,
  });
  if (error)
    throw new MediaRequestError(
      "This feature is not ready. Your existing analysis is still available.",
      503,
      "MEDIA_UNAVAILABLE",
    );
  const reservation = data?.[0];
  if (!reservation?.accepted) {
    if (reservation?.reason === "duplicate")
      throw new MediaRequestError(
        "This request has already been accepted. Wait for the current result before retrying.",
        409,
        "DUPLICATE_REQUEST",
      );
    if (reservation?.reason === "not_found")
      throw new MediaRequestError("Report not found.", 404);
    throw new MediaRequestError(
      "You have used the six processing attempts for this feature today. They reset at midnight Singapore time. Your analysis credits are unchanged.",
      429,
      "MEDIA_LIMIT",
    );
  }
  return reservation.operation_id as string;
}

export function mediaError(error: unknown) {
  if (error instanceof MediaRequestError)
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  return Response.json(
    {
      error:
        "AI processing could not be completed. Your analysis credits are unchanged. You can use reviewed text instead.",
      code: "PROVIDER_ERROR",
    },
    { status: 502 },
  );
}
