import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, PrimaryButton, inputClass } from "@/components/auth-shell";
import { getPendingJoinCode } from "@/lib/class-flow";
import { withTimeout } from "@/lib/async";

export const Route = createFileRoute("/auth/signup")({ component: Signup });

const AUTH_TIMEOUT_MS = 15000;
const AUTH_TIMEOUT_MESSAGE =
  "Synco could not reach Supabase Auth. Check the Vercel Supabase environment variables and try again.";

function Signup() {
  const navigate = useNavigate();
  const pendingJoinCode = getPendingJoinCode();
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
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        }),
        AUTH_TIMEOUT_MS,
        AUTH_TIMEOUT_MESSAGE,
      );
      if (error) {
        setErrors({ form: signupErrorMessage(error) });
        return;
      }
      if (pendingJoinCode) {
        if (data.user) {
          await withTimeout(
            supabase.from("profiles").upsert({
              id: data.user.id,
              role: "student",
              full_name: fullName,
            }),
            AUTH_TIMEOUT_MS,
            AUTH_TIMEOUT_MESSAGE,
          );
        }
        navigate({ to: "/join/$code", params: { code: pendingJoinCode } });
        return;
      }
      navigate({ to: "/onboarding/role" });
    } catch (err) {
      console.error("Signup failed:", err);
      setErrors({
        form: signupErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={pendingJoinCode ? "Create your student account." : "Create your account."}
      subtitle={
        pendingJoinCode
          ? "Use an email and password you can remember. Your results will open from any device with this account."
          : "One account works for both leads and students."
      }
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

function signupErrorMessage(err: unknown) {
  const raw =
    err && typeof err === "object" && "message" in err && typeof err.message === "string"
      ? err.message
      : String(err ?? "");
  const message = raw.toLowerCase();

  if (raw === AUTH_TIMEOUT_MESSAGE) return raw;
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "An account already exists for this email. Sign in instead.";
  }
  if (message.includes("invalid email")) {
    return "Use a valid email address.";
  }
  if (message.includes("password")) {
    return "Use a stronger password with at least 8 characters.";
  }
  if (message.includes("signup") && message.includes("disabled")) {
    return "New signups are currently disabled. Try again later.";
  }

  return "We couldn't create your account. Check your details and try again.";
}
