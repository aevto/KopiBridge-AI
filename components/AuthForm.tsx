"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authSchema, signupSchema } from "@/lib/validation";

function getSignupErrorMessage(error: { code?: string; message?: string }) {
  const code = error.code ?? "";
  const message = error.message?.toLowerCase() ?? "";

  if (code === "weak_password" || message.includes("password")) {
    return "Use at least 8 characters, including a letter and a number.";
  }

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already registered")
  ) {
    return "An account may already exist for this email. Try logging in or resetting your password.";
  }

  if (code === "over_email_send_rate_limit" || message.includes("rate limit")) {
    return "Too many confirmation emails were requested. Wait a few minutes, then try again.";
  }

  if (code === "signup_disabled") {
    return "New account creation is temporarily unavailable.";
  }

  return "We could not create the account right now. Please try again.";
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const schema = mode === "signup" ? signupSchema : authSchema;
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details.");
      return;
    }

    setIsPending(true);

    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword(
          parsed.data,
        );
        if (signInError) {
          setError("We could not sign you in. Check your email and password.");
          return;
        }
        router.replace(next);
        router.refresh();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          ...parsed.data,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (signUpError) {
          setError(getSignupErrorMessage(signUpError));
          return;
        }
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else {
          setMessage(
            "Check your inbox to confirm your email, then return to sign in.",
          );
        }
      }
    } catch {
      setError(
        "Authentication is not configured yet. Add the Supabase environment variables and try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <label className="block" htmlFor="auth-email">
        <span className="text-sm font-semibold text-espresso-800">
          Email address
        </span>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-md border border-espresso-200 bg-white px-4 py-3 text-espresso-900 outline-none transition placeholder:text-espresso-300 focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
          placeholder="you@example.com"
          required
        />
      </label>
      <div className="block">
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-espresso-800">
          <label htmlFor="auth-password">Password</label>
          {mode === "login" ? (
            <Link
              href="/forgot-password"
              className="font-medium text-sage-700 hover:text-sage-600"
            >
              Forgot password?
            </Link>
          ) : null}
        </div>
        <input
          id="auth-password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-md border border-espresso-200 bg-white px-4 py-3 text-espresso-900 outline-none transition placeholder:text-espresso-300 focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
          placeholder="At least 8 characters"
          minLength={8}
          aria-describedby={mode === "signup" ? "password-hint" : undefined}
          required
        />
        {mode === "signup" ? (
          <p id="password-hint" className="mt-2 text-sm text-espresso-500">
            Use 8 or more characters with at least one letter and one number.
          </p>
        ) : null}
      </div>

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
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-espresso-900 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-espresso-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        )}
        {isPending
          ? "Please wait"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </button>

      <p className="text-center text-sm text-espresso-500">
        {mode === "login" ? "New to KopiBridge?" : "Already have an account?"}{" "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="font-semibold text-sage-700 hover:text-sage-600"
        >
          {mode === "login" ? "Create an account" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
