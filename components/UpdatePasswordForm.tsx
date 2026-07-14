"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(
        "The password could not be updated. Request a fresh reset link and try again.",
      );
      setIsPending(false);
      return;
    }
    window.location.assign("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-semibold text-espresso-800">
          New password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-espresso-900 px-5 py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Updating password" : "Update password"}
      </button>
    </form>
  );
}
