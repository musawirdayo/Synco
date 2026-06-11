import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Field, PrimaryButton, inputClass } from "@/components/auth-shell";
import {
  clearPendingJoinCode,
  normalizeInviteCode,
  normalizeStudentIdentifier,
  rememberPendingJoinCode,
  setActiveClassId,
} from "@/lib/class-flow";

export const Route = createFileRoute("/join_/$code")({ component: JoinWithCode });

function JoinWithCode() {
  const { code } = useParams({ from: "/join_/$code" });
  return <JoinForm initialCode={normalizeInviteCode(code)} />;
}

export function JoinForm({ initialCode = "" }: { initialCode?: string }) {
  const lockedCode = normalizeInviteCode(initialCode);
  const hasCodeFromLink = lockedCode.length > 0;
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState(lockedCode);
  const [identType, setIdentType] = useState<string>("roll");
  const [rosterLock, setRosterLock] = useState(false);
  const [knownClass, setKnownClass] = useState(false);
  const [checkedClass, setCheckedClass] = useState(false);
  const [isCheckingClass, setIsCheckingClass] = useState(true);
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      if (hasCodeFromLink) {
        rememberPendingJoinCode(code);
        navigate({ to: "/auth/login" });
      }
      return;
    }
    if (user?.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
  }, [user, loading, navigate, hasCodeFromLink, code]);

  useEffect(() => {
    if (!user || !code || code.length < 4) return;
    (async () => {
      const { data: cls } = await supabase
        .from("classes")
        .select("id, is_published")
        .eq("invite_code", code.toUpperCase())
        .maybeSingle();
      if (!cls) return;

      const { data: membership } = await supabase
        .from("class_members")
        .select("student_id")
        .eq("class_id", cls.id)
        .eq("student_id", user.id)
        .maybeSingle();

      if (membership) {
        const { data: own } = await supabase
          .from("survey_responses")
          .select("completed")
          .eq("class_id", cls.id)
          .eq("student_id", user.id)
          .maybeSingle();

        setActiveClassId(cls.id);
        clearPendingJoinCode();

        if (own?.completed && cls.is_published) {
          navigate({ to: "/results" });
        } else {
          navigate({ to: "/c/$id", params: { id: cls.id } });
        }
      }
    })();
  }, [user, code, navigate]);

  useEffect(() => {
    if (!code || code.length < 4) {
      setKnownClass(false);
      setCheckedClass(false);
      setIsCheckingClass(false);
      return;
    }
    (async () => {
      setIsCheckingClass(true);
      try {
        const { data } = await supabase.rpc("lookup_class_by_code", { _code: code });
        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          setIdentType(row.identifier_type ?? "roll");
          setRosterLock(!!row.roster_lock_enabled);
          setKnownClass(true);
        } else {
          setKnownClass(false);
        }
      } catch (e) {
        console.error(e);
        setKnownClass(false);
      } finally {
        setIsCheckingClass(false);
        setCheckedClass(true);
      }
    })();
  }, [code]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      const inviteCode = normalizeInviteCode(code);
      if (inviteCode) rememberPendingJoinCode(inviteCode);
      navigate({ to: "/auth/login" });
      return;
    }
    setErr(undefined);
    setBusy(true);
    const inviteCode = normalizeInviteCode(code);
    const normalizedIdentifier = normalizeStudentIdentifier(identifier);
    if (!inviteCode) {
      setErr("Enter your class invite code.");
      setBusy(false);
      return;
    }
    if (!normalizedIdentifier) {
      setErr(`Enter your ${identLabel.toLowerCase()}. This prevents duplicate submissions.`);
      setBusy(false);
      return;
    }
    const { data, error } = await supabase.rpc("join_class_by_code", {
      _code: inviteCode,
      _display_name: fullName,
      _identifier: normalizedIdentifier,
    });
    if (error) {
      const msg = error.message || "";
      const friendly = msg.includes("invalid_code")
        ? "This class code doesn't exist or has expired."
        : msg.includes("not_on_roster")
          ? "Your roll number isn't on the class roster. Check with your class lead."
          : msg.includes("roster_taken")
            ? "This roster spot is already taken."
            : msg.includes("identifier_taken")
              ? "This identifier has already joined this class. Use the original account or ask your class lead to help."
              : msg.includes("identifier_required")
                ? `Please enter your ${identLabel.toLowerCase()}.`
                : "We couldn't join you to this class. Please try again.";
      setErr(friendly);
      setBusy(false);
      return;
    }
    const result = data as { class_id: string; already_member: boolean; survey_completed: boolean };
    setActiveClassId(result.class_id);
    clearPendingJoinCode();
    const { data: cls } = await supabase
      .from("classes")
      .select("is_published")
      .eq("id", result.class_id)
      .maybeSingle();
    if (result.survey_completed && cls?.is_published) {
      navigate({ to: "/results" });
      return;
    }
    navigate({ to: "/c/$id", params: { id: result.class_id } });
  }

  const identLabel = knownClass
    ? identType === "email"
      ? "Email on roster"
      : identType === "id"
        ? "Student ID"
        : "Roll number"
    : "Student ID / Roll number";

  const showDeletedScreen = hasCodeFromLink && checkedClass && !knownClass && !isCheckingClass;

  if (showDeletedScreen) {
    return (
      <div className="min-h-screen grid md:grid-cols-2 bg-background">
        <div className="hidden md:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary-foreground grid place-items-center text-primary font-display text-sm">
              P
            </div>
            <span className="font-display text-lg">PeerGraph</span>
          </Link>
          <div>
            <h2 className="font-display text-4xl leading-tight mb-4">
              Honest answers,
              <br />
              better teammates.
            </h2>
            <p className="text-primary-foreground/70 max-w-sm">
              You'll spend a few focused minutes answering questions about how you actually work.
              That's it.
            </p>
          </div>
          <span className="font-mono text-xs text-primary-foreground/50">
            private · honest · useful
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-center p-6 md:p-12"
        >
          <div className="w-full max-w-sm text-center space-y-5">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              Class no longer exists
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              The administrator or class lead has deleted this class. You can no longer join or
              submit a survey for it.
            </p>
            <div className="pt-4">
              <Link
                to="/dashboard"
                className="inline-flex w-full h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary-foreground grid place-items-center text-primary font-display text-sm">
            P
          </div>
          <span className="font-display text-lg">PeerGraph</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl leading-tight mb-4">
            Honest answers,
            <br />
            better teammates.
          </h2>
          <p className="text-primary-foreground/70 max-w-sm">
            You'll spend a few focused minutes answering questions about how you actually work.
            That's it.
          </p>
        </div>
        <span className="font-mono text-xs text-primary-foreground/50">
          private · honest · useful
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-center p-6 md:p-12"
      >
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <h1 className="font-display text-3xl mb-2">
            {hasCodeFromLink ? "Continue to your class." : "Join your class."}
          </h1>
          <p className="text-muted text-sm mb-6">
            {hasCodeFromLink
              ? "We found your invite code. Confirm your details to continue."
              : "Enter your details to get started."}
          </p>
          <Field label="Full name">
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label={identLabel}
            hint={
              rosterLock
                ? "Must match the class roster."
                : "Required to prevent duplicate submissions."
            }
          >
            <input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={inputClass}
              placeholder={identType === "email" ? "you@school.edu" : "e.g. 22K-1234"}
            />
          </Field>
          {hasCodeFromLink ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted mb-1">
                Invite code
              </div>
              <div className="font-mono text-lg tracking-widest">{code}</div>
            </div>
          ) : (
            <Field label="Invite code">
              <input
                required
                value={code}
                onChange={(e) => setCode(normalizeInviteCode(e.target.value))}
                className={inputClass + " font-mono tracking-widest uppercase"}
                maxLength={6}
                placeholder="ABCD12"
              />
            </Field>
          )}
          {err && <p className="text-sm text-destructive">{err}</p>}
          <PrimaryButton loading={busy} type="submit">
            {hasCodeFromLink ? "Continue" : "Join class"}
          </PrimaryButton>
        </form>
      </motion.div>
    </div>
  );
}
