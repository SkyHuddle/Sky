"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Notice } from "../ui/primitives";

function Field({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = props.id ?? props.name;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-footnote font-medium text-ink-2">
        {label}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-12 w-full rounded-xl border border-border bg-surface px-3.5 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:border-accent/60 focus:outline-none aria-[invalid=true]:border-negative/60"
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-footnote text-negative">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthForm({ mode, next }: { mode: "signin" | "signup"; next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const form = new FormData(e.currentTarget);
    const body =
      mode === "signup"
        ? { username: form.get("username"), email: form.get("email"), password: form.get("password") }
        : { login: form.get("login"), password: form.get("password") };
    try {
      const res = await fetch(`/api/auth/${mode === "signup" ? "signup" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const details = data?.error?.details as { path: string; message: string }[] | null;
        if (Array.isArray(details)) setFieldErrors(Object.fromEntries(details.map((d) => [d.path, d.message])));
        setError(data?.error?.message ?? "Something went wrong.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("You appear to be offline. Try again when you're connected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {mode === "signup" ? (
        <>
          <Field label="Username" name="username" autoComplete="username" placeholder="your_handle" required minLength={3} maxLength={20} error={fieldErrors.username} />
          <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required error={fieldErrors.email} />
          <Field label="Password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} error={fieldErrors.password} />
        </>
      ) : (
        <>
          <Field label="Username or email" name="login" autoComplete="username" required error={fieldErrors.login} />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required error={fieldErrors.password} />
        </>
      )}
      <Button type="submit" size="lg" block loading={busy}>
        {mode === "signup" ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-callout text-ink-2">
        {mode === "signup" ? "Already have an account? " : "New here? "}
        <Link href={`/${mode === "signup" ? "signin" : "signup"}?next=${encodeURIComponent(next)}`} className="font-semibold text-accent">
          {mode === "signup" ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
