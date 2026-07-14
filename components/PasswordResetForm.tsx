"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsPending(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        },
      );
      if (resetError) {
        setError(
          "The reset email could not be sent. Check the address and try again.",
        );
      } else {
        setMessage(
          "If an account exists for that email, a reset link is on its way.",
        );
      }
    } catch {
      setError("Password reset is not configured yet.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-semibold text-espresso-800">
          Email address
        </span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mt-2 w-full rounded-md border border-espresso-200 bg-white px-4 py-3 outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
        />
      </label>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-clay-100 bg-clay-50 px-4 py-3 text-sm text-clay-700"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="rounded-md border border-sage-100 bg-sage-50 px-4 py-3 text-sm text-sage-700"
        >
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-espresso-900 px-5 py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {isPending ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
        Send reset link
      </button>
    </form>
  );
}
