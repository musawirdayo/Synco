import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, PrimaryButton, inputClass } from "@/components/auth-shell";
import { getPendingJoinCode } from "@/lib/class-flow";

export const Route = createFileRoute("/auth/signup")({ component: Signup });

function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (password.length < 8) {
      setErrors({ password: "Use at least 8 characters." });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });
      if (error) {
        setErrors({ form: error.message });
        return;
      }
      const pendingCode = getPendingJoinCode();
      if (pendingCode) {
        if (data.user) {
          await supabase
            .from("profiles")
            .upsert({ id: data.user.id, role: "student", full_name: fullName });
        }
        navigate({ to: "/join/$code", params: { code: pendingCode } });
        return;
      }
      navigate({ to: "/onboarding/role" });
    } catch (err) {
      console.error("Signup failed:", err);
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
      title="Create your account."
      subtitle="One account works for both leads and students."
      footer={
        <>
          Already have one?{" "}
          <Link to="/auth/login" className="text-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="Ayesha Khan"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@school.edu"
          />
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters.">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass + " pr-10"}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
        <PrimaryButton loading={loading} type="submit">
          Create account
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
