"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Mic,
  Square,
  Upload,
  MessageSquareText,
  ArrowRight,
} from "lucide-react";
import { normaliseAudio } from "@/lib/audio";
import type { InterviewPractice as Practice } from "@/lib/multimodal";

const button =
  "inline-flex items-center justify-center gap-2 rounded-md border border-espresso-200 bg-white px-4 py-3 text-sm font-semibold text-espresso-800 transition hover:border-sage-600 disabled:cursor-not-allowed disabled:opacity-50";

export function InterviewPractice({
  analysisId,
  questions,
  initialPractices,
  available,
}: {
  analysisId: string;
  questions: string[];
  initialPractices: Practice[];
  available: boolean;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const audioUrlRef = useRef("");
  const [practices, setPractices] = useState(initialPractices);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const locked = useRef(false);
  const feedbackKey = useRef(crypto.randomUUID());

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);
  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setSeconds(elapsed);
      if (elapsed >= 90 && recorder.current?.state === "recording")
        recorder.current.stop();
    }, 250);
    return () => window.clearInterval(timer);
  }, [recording]);

  async function prepare(blob: Blob) {
    setBusy("Preparing audio");
    setError("");
    try {
      const normalised = await normaliseAudio(blob);
      if (mounted.current) {
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = URL.createObjectURL(normalised);
        setAudioUrl(audioUrlRef.current);
        setAudio(normalised);
        setNotice(
          "Recording ready. Listen before sending it for transcription.",
        );
      }
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof Error
            ? error.message
            : "This audio could not be read. Try WAV, MP3, M4A, or WebM.",
        );
    } finally {
      if (mounted.current) setBusy("");
    }
  }

  async function startRecording() {
    if (locked.current) return;
    locked.current = true;
    setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const next = new MediaRecorder(media);
      const chunks: Blob[] = [];
      next.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      next.onstop = () => {
        media.getTracks().forEach((t) => t.stop());
        locked.current = false;
        if (mounted.current) {
          setRecording(false);
          void prepare(new Blob(chunks, { type: next.mimeType }));
        }
      };
      recorder.current = next;
      setSeconds(0);
      setRecording(true);
      next.start();
    } catch {
      locked.current = false;
      setError(
        "Microphone access is unavailable. Upload a short recording or type your answer below.",
      );
    }
  }

  async function transcribe() {
    if (!audio || !consent || locked.current) return;
    locked.current = true;
    setBusy("Transcribing your answer");
    setError("");
    try {
      const response = await fetch(`/api/analyses/${analysisId}/transcribe`, {
        method: "POST",
        headers: {
          "Content-Type": "audio/wav",
          "Idempotency-Key": crypto.randomUUID(),
          "X-Processing-Consent": "true",
        },
        body: audio,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Transcription failed.");
      setTranscript(result.text);
      setReviewed(false);
      feedbackKey.current = crypto.randomUUID();
      setNotice(
        "Transcript ready. Correct any mistakes, then confirm it represents your answer.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Transcription failed. You can type your answer instead.",
      );
    } finally {
      locked.current = false;
      setBusy("");
    }
  }

  async function saveFeedback() {
    if (!consent || !reviewed || locked.current) return;
    locked.current = true;
    setBusy("Reviewing your answer");
    setError("");
    try {
      const response = await fetch(`/api/analyses/${analysisId}/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIndex,
          transcript,
          consent: true,
          idempotencyKey: feedbackKey.current,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Feedback could not be saved.");
      setPractices((items) => [result, ...items].slice(0, 6));
      setNotice(
        "Practice saved to this private report. Your original score and evidence labels are unchanged.",
      );
      setReviewed(false);
      feedbackKey.current = crypto.randomUUID();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Feedback could not be saved. Your answer is still here.",
      );
      feedbackKey.current = crypto.randomUUID();
    } finally {
      locked.current = false;
      setBusy("");
    }
  }

  return (
    <section
      className="printable-report mt-10 border-t border-espresso-200 pt-8"
      aria-labelledby="practice-heading"
    >
      <div className="flex items-center gap-3 text-sage-700">
        <MessageSquareText className="h-6 w-6" />
        <h2
          id="practice-heading"
          className="text-2xl font-semibold text-espresso-900"
        >
          Practise your evidence story
        </h2>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-espresso-600">
        Use one question from your report to prepare a specific, honest answer.
        Spoken claims do not establish experience or change your resume
        assessment.
      </p>
      <div className="no-print mt-6 space-y-5 rounded-lg border border-espresso-100 bg-white p-5 shadow-card sm:p-7">
        {!available ? (
          <p
            role="status"
            className="rounded-md bg-ambergap-50 p-4 text-sm leading-6 text-ambergap-600"
          >
            Interview practice is awaiting database setup. Your resume analysis
            and saved report remain available.
          </p>
        ) : null}
        <label className="block text-sm font-semibold text-espresso-800">
          Practice question
          <select
            value={questionIndex}
            disabled={!!busy || recording}
            onChange={(event) => {
              setQuestionIndex(Number(event.target.value));
              feedbackKey.current = crypto.randomUUID();
              setReviewed(false);
            }}
            className="mt-2 w-full rounded-md border border-espresso-200 bg-white p-3 font-normal"
          >
            {questions.slice(0, 5).map((question, i) => (
              <option key={question} value={i}>
                Question {i + 1}
              </option>
            ))}
          </select>
        </label>
        <p className="border-l-2 border-sage-600 pl-4 text-lg font-medium leading-7 text-espresso-900">
          {questions[questionIndex]}
        </p>
        <div className="flex flex-wrap gap-3">
          {recording ? (
            <button
              type="button"
              onClick={() => recorder.current?.stop()}
              className={button}
            >
              <Square className="h-4 w-4 text-clay-700" />
              Stop · {seconds}s / 90s
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={!!busy || !available}
              className={button}
            >
              <Mic className="h-4 w-4" />
              Record answer
            </button>
          )}
          <label className={`${button} cursor-pointer`}>
            <Upload className="h-4 w-4" />
            Upload audio
            <input
              aria-label="Upload interview audio"
              type="file"
              accept="audio/*,.m4a,.webm"
              className="sr-only"
              disabled={!!busy || recording || !available}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void prepare(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-xs leading-5 text-espresso-500">
          Up to 90 seconds or 12MB. Your microphone starts only when you choose
          Record answer.
        </p>
        {audio && audioUrl ? (
          <audio
            aria-label="Answer recording"
            controls
            src={audioUrl}
            className="w-full max-w-lg"
          />
        ) : null}
        <label className="flex items-start gap-3 text-sm leading-6 text-espresso-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 flex-none accent-sage-700"
          />
          I agree to send this audio and reviewed answer to OpenAI for
          transcription and feedback. KopiBridge saves only my reviewed text and
          feedback with this private report, not the audio.
        </label>
        {audio ? (
          <button
            type="button"
            className={button}
            disabled={!consent || !!busy || recording}
            onClick={transcribe}
          >
            <MessageSquareText className="h-4 w-4" />
            Transcribe answer
          </button>
        ) : null}
        <label className="block text-sm font-semibold text-espresso-800">
          Review your answer
          <textarea
            aria-label="Review your answer"
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              setReviewed(false);
              feedbackKey.current = crypto.randomUUID();
            }}
            maxLength={8000}
            placeholder="Your transcript appears here. You can also type your answer."
            className="mt-2 min-h-44 w-full rounded-md border border-espresso-200 p-4 text-sm font-normal leading-6 focus:border-sage-600 focus:outline-none focus:ring-2 focus:ring-sage-100"
          />
        </label>
        <label className="flex items-start gap-3 text-sm leading-6 text-espresso-700">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
            className="mt-1 h-4 w-4 flex-none accent-sage-700"
          />
          I have corrected the text and it represents my answer.
        </label>
        <button
          type="button"
          onClick={saveFeedback}
          disabled={
            !available ||
            !reviewed ||
            !consent ||
            transcript.trim().length < 30 ||
            !!busy ||
            recording
          }
          className="inline-flex items-center gap-2 rounded-md bg-espresso-900 px-5 py-3 text-sm font-semibold text-white hover:bg-espresso-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save interview feedback
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-xs leading-5 text-espresso-500">
          No additional analysis credit. Six transcription attempts and six
          feedback attempts per day, resetting at midnight Singapore time.
          Failed processing attempts count towards these limits.
        </p>
        {busy ? (
          <p role="status" className="text-sm font-medium text-sage-700">
            {busy}...
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm leading-6 text-clay-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="text-sm leading-6 text-sage-700">
            {notice}
          </p>
        ) : null}
      </div>
      {practices.length ? (
        <div className="mt-7 space-y-6">
          {practices.map((practice) => (
            <article
              key={practice.id}
              className="print-card rounded-lg border border-sage-100 bg-white p-5 sm:p-7"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-sage-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {practice.source === "openai"
                    ? "Saved interview feedback"
                    : "Saved preparation checklist"}
                </p>
                <span className="text-xs text-espresso-500">
                  {new Intl.DateTimeFormat("en-SG", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    timeZone: "Asia/Singapore",
                  }).format(new Date(practice.created_at))}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-7 text-espresso-900">
                {practice.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-espresso-700">
                {practice.feedback.summary}
              </p>
              <details className="my-4">
                <summary className="cursor-pointer text-sm font-semibold text-espresso-700">
                  Your reviewed answer
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-espresso-600">
                  {practice.transcript}
                </p>
              </details>
              <div className="grid gap-6 md:grid-cols-2">
                {practice.feedback.strengths.length ? (
                  <div>
                    <h4 className="text-sm font-semibold text-sage-700">
                      What works
                    </h4>
                    {practice.feedback.strengths.map((item, i) => (
                      <div
                        key={i}
                        className="mt-3 border-l-2 border-sage-200 pl-3"
                      >
                        <blockquote className="text-sm italic leading-6 text-espresso-700">
                          “{item.quote}”
                        </blockquote>
                        <p className="mt-1 text-sm leading-6 text-espresso-600">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {practice.feedback.improvements.length ? (
                  <div>
                    <h4 className="text-sm font-semibold text-clay-700">
                      Make it more specific
                    </h4>
                    {practice.feedback.improvements.map((item, i) => (
                      <div
                        key={i}
                        className="mt-3 border-l-2 border-clay-100 pl-3"
                      >
                        <blockquote className="text-sm italic leading-6 text-espresso-700">
                          “{item.quote}”
                        </blockquote>
                        <p className="mt-1 text-sm leading-6 text-espresso-600">
                          {item.advice}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <h4 className="mt-5 text-sm font-semibold text-espresso-900">
                Prepare next
              </h4>
              <ul className="mt-2 space-y-2">
                {practice.feedback.nextSteps.map((task) => (
                  <li
                    key={task}
                    className="flex gap-2 text-sm leading-6 text-espresso-700"
                  >
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-sage-600" />
                    {task}
                  </li>
                ))}
              </ul>
              {practice.feedback.cautions.map((caution) => (
                <p
                  key={caution}
                  className="mt-3 text-sm leading-6 text-clay-700"
                >
                  {caution}
                </p>
              ))}
            </article>
          ))}
        </div>
      ) : (
        <p className="no-print mt-5 text-sm text-espresso-500">
          Your first saved answer will appear here alongside your report.
        </p>
      )}
    </section>
  );
}
