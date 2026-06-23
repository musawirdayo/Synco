import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Field, PrimaryButton, inputClass } from "@/components/auth-shell";
import { copyText } from "@/lib/clipboard";
import { normalizeStudentIdentifier } from "@/lib/class-flow";

export const Route = createFileRoute("/class/new")({ component: NewClass });

function genCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function NewClass() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [expected, setExpected] = useState(20);
  const [teamSize, setTeamSize] = useState(4);
  const [rosterLock, setRosterLock] = useState(false);
  const [rosterText, setRosterText] = useState("");
  const [identType, setIdentType] = useState<"roll" | "email" | "id">("roll");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rosterEntries = Array.from(
    new Set(rosterText.split("\n").map(normalizeStudentIdentifier).filter(Boolean)),
  );

  async function createClass() {
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    if (rosterLock && rosterEntries.length === 0) {
      setError("Add at least one roster identifier, or turn roster lock off.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const code = genCode();
      const { data, error: createError } = await supabase
        .from("classes")
        .insert({
          lead_id: user.id,
          name,
          institution: institution || null,
          expected_count: expected,
          team_size: teamSize,
          invite_code: code,
          roster_lock_enabled: rosterLock,
          identifier_type: identType,
        })
        .select("id,invite_code")
        .single();
      if (createError || !data) throw createError ?? new Error("Class could not be created.");

      if (rosterLock && rosterEntries.length) {
        const { error: rosterError } = await supabase.from("roster_entries").insert(
          rosterEntries.map((id) => ({
            class_id: data.id,
            identifier: id,
            identifier_type: identType,
          })),
        );

        if (rosterError) {
          await supabase.from("classes").delete().eq("id", data.id);
          throw rosterError;
        }
      }
      setCreated({ id: data.id, code: data.invite_code });
      setStep(3);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "We couldn't create this class. Please check the details and try again.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(kind: "code" | "link") {
    if (!created) return;
    const text = kind === "code" ? created.code : `${window.location.origin}/join/${created.code}`;
    const ok = await copyText(text);
    if (!ok) {
      setError("Copy failed. Select the invite text and copy it manually.");
      return;
    }
    setError(null);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen">
      <header className="px-4 sm:px-6 md:px-12 py-5 border-b border-border/60">
        <Link to="/dashboard" className="text-sm text-muted hover:text-foreground">
          ← Dashboard
        </Link>
      </header>
      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-8 text-xs font-medium uppercase tracking-wider text-muted">
          <span className={step >= 1 ? "text-foreground" : ""}>01 Basics</span>
          <span>·</span>
          <span className={step >= 2 ? "text-foreground" : ""}>02 Security</span>
          <span>·</span>
          <span className={step >= 3 ? "text-foreground" : ""}>03 Invite</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="font-display text-3xl mb-2">Tell us about your class.</h1>
              <p className="text-muted text-sm mb-8">This helps your students recognize it.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
                className="space-y-5"
              >
                <Field label="Class name">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="CS 2025 — Software Engineering"
                  />
                </Field>
                <Field label="Institution or course (optional)">
                  <input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className={inputClass}
                    placeholder="FAST NUCES"
                  />
                </Field>
                <Field label="Expected number of students" hint="Used to compute coverage.">
                  <input
                    type="number"
                    min={2}
                    max={500}
                    required
                    value={expected}
                    onChange={(e) => setExpected(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Team size">
                  <input
                    type="number"
                    min={2}
                    max={6}
                    required
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
                <PrimaryButton type="submit">Continue</PrimaryButton>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="font-display text-3xl mb-2">Lock down who can join.</h1>
              <p className="text-muted text-sm mb-8">Optional, but recommended for real classes.</p>
              <div className="space-y-5">
                <label className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={rosterLock}
                    onChange={(e) => setRosterLock(e.target.checked)}
                    className="mt-1 accent-[color:var(--color-primary)]"
                  />
                  <div>
                    <div className="font-medium">Enable roster lock</div>
                    <p className="text-sm text-muted">Only listed identifiers can join.</p>
                  </div>
                </label>
                {rosterLock && (
                  <>
                    <Field label="Identifier type">
                      <select
                        value={identType}
                        onChange={(e) => setIdentType(e.target.value as "roll" | "email" | "id")}
                        className={inputClass}
                      >
                        <option value="roll">Roll number</option>
                        <option value="email">Email</option>
                        <option value="id">Student ID</option>
                      </select>
                    </Field>
                    <Field
                      label="Roster"
                      hint={`${rosterEntries.length} entries detected · one per line`}
                    >
                      <textarea
                        value={rosterText}
                        onChange={(e) => setRosterText(e.target.value)}
                        rows={6}
                        className={inputClass + " h-auto py-3 font-mono text-sm"}
                        placeholder={"22K-1234\n22K-1235"}
                      />
                    </Field>
                  </>
                )}
                <div className="flex gap-3 p-4 rounded-lg bg-[color:var(--color-accent-light)] text-sm">
                  <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p>
                    For best results, wait until all students submit before publishing. Publishing
                    early means some classmates won't appear in results.
                  </p>
                </div>
                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 px-5 rounded-lg border border-border bg-card hover:bg-muted transition-colors font-medium"
                  >
                    Back
                  </button>
                  <PrimaryButton type="button" onClick={createClass} loading={busy}>
                    Create class
                  </PrimaryButton>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && created && (
            <motion.div
              key="3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="h-12 w-12 rounded-full bg-[color:var(--color-accent-light)] grid place-items-center mb-6">
                <Check className="h-6 w-6 text-accent" />
              </div>
              <h1 className="font-display text-3xl mb-2">Your class is live.</h1>
              <p className="text-muted text-sm mb-8">
                Share this with your students. They'll use it to join and complete the survey.
              </p>
              {error && (
                <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="rounded-xl border border-border bg-card p-8 text-center mb-4">
                <div className="text-xs font-medium uppercase tracking-wider text-muted mb-3">
                  Invite code
                </div>
                <div className="font-mono text-4xl tracking-[0.3em] mb-4">{created.code}</div>
                <button
                  onClick={() => copy("code")}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
                >
                  {copied === "code" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[color:var(--color-success)]" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy code
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3 mb-8">
                <span className="font-mono text-xs text-muted truncate">
                  {window.location.origin}/join/{created.code}
                </span>
                <button
                  onClick={() => copy("link")}
                  className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors shrink-0"
                >
                  {copied === "link" ? (
                    <Check className="h-3.5 w-3.5 text-[color:var(--color-success)]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied === "link" ? "Copied" : "Copy link"}
                </button>
              </div>
              <button
                onClick={() => navigate({ to: "/class/$id", params: { id: created.id } })}
                className="text-sm font-medium text-primary hover:underline"
              >
                Go to class dashboard →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
