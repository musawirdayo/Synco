import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Field, PrimaryButton, inputClass } from "@/components/auth-shell";
import { copyText } from "@/lib/clipboard";
import {
  exampleClassIdentifier,
  normalizeClassIdentifier,
  normalizeIdentifierPrefix,
} from "@/lib/class-flow";

export const Route = createFileRoute("/class/new")({ component: NewClass });

const TEAM_SIZE_OPTIONS = [2, 3, 4, 5, 6] as const;
const ROLL_SUFFIX_DIGIT_OPTIONS = [2, 3, 4, 5, 6] as const;
const MAX_INVITE_CODE_ATTEMPTS = 6;
const classBasicsSchema = z.object({
  name: z.string().trim().min(2, "Class name needs at least 2 characters."),
  institution: z.string().trim().max(120, "Institution or course is too long."),
  expected: z
    .number({ invalid_type_error: "Expected students must be a number." })
    .int("Expected students must be a whole number.")
    .min(2, "Add at least 2 expected students.")
    .max(500, "Keep expected students at 500 or fewer."),
  teamSize: z
    .number()
    .int()
    .refine((value) => TEAM_SIZE_OPTIONS.some((size) => size === value), {
      message: "Pick a team size from 2 to 6.",
    }),
});

type ClassBasics = {
  name: string;
  institution: string;
  expected: number;
  teamSize: number;
};

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
  const [classBasics, setClassBasics] = useState<ClassBasics>({
    name: "",
    institution: "",
    expected: 20,
    teamSize: 4,
  });
  const [rosterLock, setRosterLock] = useState(false);
  const [rosterText, setRosterText] = useState("");
  const [identType, setIdentType] = useState<"roll" | "email" | "id">("roll");
  const [rollPrefix, setRollPrefix] = useState("");
  const [rollSuffixDigits, setRollSuffixDigits] = useState(3);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const identifierFormat = {
    identifierType: identType,
    identifierPrefix: identType === "roll" ? rollPrefix : null,
    identifierSuffixDigits: identType === "roll" ? rollSuffixDigits : null,
  };
  const normalizedRollPrefix = normalizeIdentifierPrefix(rollPrefix);
  const rollExample = exampleClassIdentifier(identifierFormat).toUpperCase();
  const rosterEntries = Array.from(
    new Set(
      rosterText
        .split("\n")
        .map((entry) => normalizeClassIdentifier(entry, identifierFormat))
        .filter(Boolean),
    ),
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
      let createdClass: { id: string; invite_code: string } | null = null;
      for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt += 1) {
        const code = genCode();
        const { data, error: createError } = await supabase
          .from("classes")
          .insert({
            lead_id: user.id,
            name: classBasics.name,
            institution: classBasics.institution || null,
            expected_count: classBasics.expected,
            team_size: classBasics.teamSize,
            invite_code: code,
            roster_lock_enabled: rosterLock,
            identifier_type: identType,
            identifier_prefix:
              identType === "roll" && normalizedRollPrefix ? normalizedRollPrefix : null,
            identifier_suffix_digits: identType === "roll" ? rollSuffixDigits : null,
          })
          .select("id,invite_code")
          .single();

        if (!createError && data) {
          createdClass = data;
          break;
        }
        if (!isInviteCodeCollision(createError)) {
          throw createError ?? new Error("Class could not be created.");
        }
      }
      if (!createdClass) {
        throw new Error("invite_code_generation_failed");
      }

      if (rosterLock && rosterEntries.length) {
        const { error: rosterError } = await supabase.from("roster_entries").insert(
          rosterEntries.map((id) => ({
            class_id: createdClass.id,
            identifier: id,
            identifier_type: identType,
          })),
        );

        if (rosterError) {
          await supabase.from("classes").delete().eq("id", createdClass.id);
          throw rosterError;
        }
      }
      setCreated({ id: createdClass.id, code: createdClass.invite_code });
      setStep(3);
    } catch (err) {
      setError(createClassErrorMessage(err));
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
                  const parsed = classBasicsSchema.safeParse(classBasics);
                  if (!parsed.success) {
                    setError(parsed.error.issues[0]?.message ?? "Check the class details.");
                    return;
                  }
                  setError(null);
                  setClassBasics(parsed.data);
                  setStep(2);
                }}
                className="space-y-5"
              >
                <Field label="Class name">
                  <input
                    required
                    value={classBasics.name}
                    onChange={(e) =>
                      setClassBasics((current) => ({ ...current, name: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="CS 2025 — Software Engineering"
                  />
                </Field>
                <Field label="Institution or course (optional)">
                  <input
                    value={classBasics.institution}
                    onChange={(e) =>
                      setClassBasics((current) => ({ ...current, institution: e.target.value }))
                    }
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
                    value={classBasics.expected}
                    onChange={(e) =>
                      setClassBasics((current) => ({
                        ...current,
                        expected: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Team size" hint="Pick the target size for automatic team assignment.">
                  <div className="grid grid-cols-5 gap-2" role="group" aria-label="Team size">
                    {TEAM_SIZE_OPTIONS.map((size) => {
                      const selected = classBasics.teamSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setClassBasics((current) => ({ ...current, teamSize: size }))
                          }
                          className={
                            "h-11 rounded-lg border text-sm font-medium transition-all " +
                            (selected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-card hover:bg-muted hover:border-primary")
                          }
                          aria-pressed={selected}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
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
              <h1 className="font-display text-3xl mb-2">Set student identity rules.</h1>
              <p className="text-muted text-sm mb-8">
                Pick how Synco should read roll numbers, then optionally lock joining to a roster.
              </p>
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
                <Field label="Identifier type">
                  <select
                    value={identType}
                    onChange={(e) => {
                      setIdentType(e.target.value as "roll" | "email" | "id");
                      setRosterText("");
                    }}
                    className={inputClass}
                  >
                    <option value="roll">Roll number</option>
                    <option value="email">Email</option>
                    <option value="id">Student ID</option>
                  </select>
                </Field>
                {identType === "roll" && (
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
                      <Field
                        label="Roll prefix (optional)"
                        hint="For formats like SP25-BCS-006, enter SP25-BCS."
                      >
                        <input
                          value={rollPrefix}
                          onChange={(e) => setRollPrefix(e.target.value)}
                          className={inputClass + " font-mono uppercase"}
                          placeholder="SP25-BCS"
                        />
                      </Field>
                      <Field label="Ending digits">
                        <select
                          value={rollSuffixDigits}
                          onChange={(e) => setRollSuffixDigits(Number(e.target.value))}
                          className={inputClass}
                        >
                          {ROLL_SUFFIX_DIGIT_OPTIONS.map((digits) => (
                            <option key={digits} value={digits}>
                              {digits}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      Students can type only{" "}
                      <span className="font-mono text-foreground">
                        {"6".padStart(rollSuffixDigits, "0")}
                      </span>
                      . Synco will save it as{" "}
                      <span className="font-mono text-foreground">{rollExample}</span>.
                    </p>
                  </div>
                )}
                {rosterLock && (
                  <>
                    <Field
                      label="Roster"
                      hint={`${rosterEntries.length} entries detected · one per line${
                        identType === "roll" ? " · endings or full roll numbers both work" : ""
                      }`}
                    >
                      <textarea
                        value={rosterText}
                        onChange={(e) => setRosterText(e.target.value)}
                        rows={6}
                        className={inputClass + " h-auto py-3 font-mono text-sm"}
                        placeholder={
                          identType === "email"
                            ? "student1@school.edu\nstudent2@school.edu"
                            : identType === "id"
                              ? "STU-001\nSTU-002"
                              : normalizedRollPrefix
                                ? "001\n002\n003"
                                : "006\n007\n008"
                        }
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

function isInviteCodeCollision(err: unknown) {
  const message =
    err && typeof err === "object" && "message" in err && typeof err.message === "string"
      ? err.message.toLowerCase()
      : "";
  const code =
    err && typeof err === "object" && "code" in err && typeof err.code === "string" ? err.code : "";

  return code === "23505" && message.includes("invite_code");
}

function createClassErrorMessage(err: unknown) {
  const message =
    err && typeof err === "object" && "message" in err && typeof err.message === "string"
      ? err.message
      : String(err ?? "");

  if (message.includes("invite_code_generation_failed")) {
    return "Synco could not reserve an invite code. Try again.";
  }
  if (message.toLowerCase().includes("roster")) {
    return "The class was created, but the roster could not be saved. Check the roster and try again.";
  }
  if (message.toLowerCase().includes("team_size")) {
    return "Pick a team size between 2 and 6.";
  }

  return "We couldn't create this class. Please check the details and try again.";
}
