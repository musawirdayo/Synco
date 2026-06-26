import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, PrimaryButton, inputClass } from "@/components/auth-shell";
import { getLatestMembershipClassId, getPendingJoinCode, setActiveClassId } from "@/lib/class-flow";
import { withTimeout } from "@/lib/async";

export const Route = createFileRoute("/auth/login")({ component: Login });

const AUTH_TIMEOUT_MS = 15000;
const AUTH_TIMEOUT_MESSAGE =
  "Synco could not reach Supabase Auth. Check the Vercel Supabase environment variables and try again.";

function Login() {
  const navigate = useNavigate();
  const pendingJoinCode = getPendingJoinCode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        AUTH_TIMEOUT_MS,
        AUTH_TIMEOUT_MESSAGE,
      );
      if (error) {
        setErrors({ form: "That email or password didn't match. Try again." });
        return;
      }
      if (pendingJoinCode) {
        navigate({ to: "/join/$code", params: { code: pendingJoinCode } });
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        navigate({ to: "/onboarding/role" });
        return;
      }
      const { data: profile } = await withTimeout(
        supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
        AUTH_TIMEOUT_MS,
        AUTH_TIMEOUT_MESSAGE,
      );
      if (profile?.role === "lead") {
        navigate({ to: "/dashboard" });
        return;
      }
      const classId = await withTimeout(
        getLatestMembershipClassId(userId),
        AUTH_TIMEOUT_MS,
        AUTH_TIMEOUT_MESSAGE,
      );
      if (classId) {
        setActiveClassId(classId);
        navigate({ to: "/c/$id", params: { id: classId } });
        return;
      }
      navigate({ to: profile?.role === "student" ? "/join" : "/onboarding/role" });
    } catch (err) {
      console.error("Login failed:", err);
      setErrors({
        form:
          err instanceof Error
            ? err.message
            : "We couldn't reach Synco's auth service. Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={pendingJoinCode ? "Sign in to continue." : "Welcome back."}
      subtitle={
        pendingJoinCode
          ? "Use the same email and password you used when you first joined this class."
          : "Sign in to your class workspace."
      }
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/auth/signup" className="text-foreground hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@school.edu"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </Field>
        <div className="flex justify-end -mt-2">
          <Link to="/auth/forgot-password" className="text-sm text-muted hover:text-foreground">
            Forgot password?
          </Link>
        </div>
        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
        <PrimaryButton loading={loading} type="submit">
          Sign in
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
