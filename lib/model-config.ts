export function modelConfig() {
  const text = process.env.OPENAI_MODEL?.trim() || "gpt-5.6-terra";
  const vision = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4.1-mini";
  const audio =
    process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "gpt-4o-mini-transcribe";
  if (new Set([text, vision, audio]).size !== 3) {
    throw new Error(
      "Configure three distinct text, vision, and transcription models.",
    );
  }
  return { text, vision, audio };
}
