import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, PrimaryButton, inputClass } from "@/components/auth-shell";
import { getLatestMembershipClassId, getPendingJoinCode, setActiveClassId } from "@/lib/class-flow";

export const Route = createFileRoute("/auth/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErrors({ form: "That email or password didn't match. Try again." });
      return;
    }
    const pendingCode = getPendingJoinCode();
    if (pendingCode) {
      navigate({ to: "/join/$code", params: { code: pendingCode } });
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      navigate({ to: "/onboarding/role" });
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.role === "lead") {
      navigate({ to: "/dashboard" });
      return;
    }
    const classId = await getLatestMembershipClassId(userId);
    if (classId) {
      setActiveClassId(classId);
      navigate({ to: "/c/$id", params: { id: classId } });
      return;
    }
    navigate({ to: profile?.role === "student" ? "/join" : "/onboarding/role" });
  }

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Sign in to your class workspace."
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
