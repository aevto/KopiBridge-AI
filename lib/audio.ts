"use client";

import { MEDIA_LIMITS } from "@/lib/multimodal";

export async function normaliseAudio(blob: Blob): Promise<Blob> {
  if (blob.size > 12 * 1024 * 1024)
    throw new Error("Choose an audio file smaller than 12MB.");
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration > MEDIA_LIMITS.audioSeconds || decoded.duration < 0.5)
      throw new Error(
        "Use an answer between half a second and 90 seconds long.",
      );
    const offline = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * 16_000),
      16_000,
    );
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    const samples = rendered.getChannelData(0);
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const string = (offset: number, value: string) =>
      [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
    string(0, "RIFF");
    view.setUint32(4, buffer.byteLength - 8, true);
    string(8, "WAVE");
    string(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16_000, true);
    view.setUint32(28, 32_000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    string(36, "data");
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((sample, i) => {
      const value = Math.max(-1, Math.min(1, sample));
      view.setInt16(
        44 + i * 2,
        Math.round(value * (value < 0 ? 32768 : 32767)),
        true,
      );
    });
    return new Blob([buffer], { type: "audio/wav" });
  } finally {
    await context.close();
  }
}
