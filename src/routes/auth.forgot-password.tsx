import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, PrimaryButton, inputClass } from "@/components/auth-shell";

export const Route = createFileRoute("/auth/forgot-password")({ component: Forgot });

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/reset-password",
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <AuthShell
      title="Reset your password."
      subtitle="We'll send you a link by email."
      footer={
        <Link to="/auth/login" className="text-foreground hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" error={err}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@school.edu"
          />
        </Field>
        {sent && (
          <p className="text-sm text-[color:var(--color-success)]">
            Check your inbox — a reset link is on its way.
          </p>
        )}
        <PrimaryButton loading={loading} type="submit">
          Send reset link
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
