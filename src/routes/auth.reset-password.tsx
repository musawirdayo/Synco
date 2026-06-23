import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, PrimaryButton, inputClass } from "@/components/auth-shell";

export const Route = createFileRoute("/auth/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (password.length < 8) {
      setErrors({ password: "Use at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setErrors({ confirm: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("Password reset failed:", err);
      setErrors({
        form: "We could not update your password. Open the reset link again and retry.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Choose a new password."
      subtitle="Enter a new password for your Synco account."
      footer={
        <Link to="/auth/login" className="text-foreground hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="New password" error={errors.password} hint="At least 8 characters.">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="New password"
          />
        </Field>
        <Field label="Confirm new password" error={errors.confirm}>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
            placeholder="Confirm password"
          />
        </Field>
        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
        <PrimaryButton loading={loading} type="submit">
          Update password
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
