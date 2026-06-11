import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  getActiveClassId,
  getLatestMembershipClassId,
  getPendingJoinCode,
  setActiveClassId,
} from "@/lib/class-flow";
import { QUESTIONS } from "@/lib/questions";
import type { Answers, AnswerValue } from "@/lib/synco";

import { RouteErrorFallback } from "@/components/route-error-boundary";

export const Route = createFileRoute("/survey")({
  component: Survey,
  errorComponent: RouteErrorFallback,
});

const DETAIL_STEPS = [
  { id: "availability", label: "Availability" },
  { id: "academic", label: "Topics" },
  { id: "logistics", label: "Study fit" },
  { id: "preferences", label: "Boundaries" },
] as const;

const AVAILABILITY = [
  "Mon morning",
  "Mon afternoon",
  "Mon evening",
  "Tue evening",
  "Wed afternoon",
  "Wed evening",
  "Thu evening",
  "Fri afternoon",
  "Sat morning",
  "Sat afternoon",
  "Sun evening",
];

const TOPICS = [
  "Algebra",
  "Geometry",
  "Calculus",
  "Programming",
  "Writing",
  "Research",
  "Data analysis",
  "Design",
  "Presentation",
  "Exam review",
];

const STUDY_STYLES = [
  "Quiet co-working",
  "Practice problems",
  "Explain and teach",
  "Review notes",
  "Project sprints",
];

const TARGET_GRADES = ["Pass safely", "B or better", "A range", "Top score"];
const COMMUNICATION = [
  "WhatsApp/text",
  "Email",
  "Discord/Slack",
  "Video call",
  "In-person after class",
];
const MEETING_MODES = ["Online", "In person", "Hybrid"];
const LANGUAGES = ["English", "Urdu", "Arabic", "Spanish", "Other"];
const ENERGY_STYLES = ["Introvert", "Ambivert", "Extrovert"];
const ACCOUNTABILITY = ["Gentle reminders", "Regular check-ins", "Strict deadlines"];
const PRIVACY = [
  "Show my name in results",
  "Show name but keep reasons general",
  "Lead introduction only",
];
const GENDER_PRIVACY = [
  "No gender-based preference",
  "Prefer same gender if available",
  "Prefer not to answer",
  "Discuss with lead privately",
];

type DetailStepId = (typeof DETAIL_STEPS)[number]["id"];

function Survey() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [classId, setClassId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const cid = getActiveClassId() ?? (await getLatestMembershipClassId(user.id));
      if (!cid) {
        const pendingCode = getPendingJoinCode();
        if (pendingCode) navigate({ to: "/join/$code", params: { code: pendingCode } });
        else navigate({ to: "/join" });
        return;
      }
      setActiveClassId(cid);
      setClassId(cid);
      const { data: resp } = await supabase
        .from("survey_responses")
        .select("answers")
        .eq("class_id", cid)
        .eq("student_id", user.id)
        .maybeSingle();
      if (resp?.answers) setAnswers(resp.answers as Answers);
    })();
  }, [user, navigate]);

  const totalSteps = QUESTIONS.length + DETAIL_STEPS.length;
  const isQuestionStep = idx < QUESTIONS.length;
  const q = isQuestionStep ? QUESTIONS[idx] : null;
  const detailStep = isQuestionStep ? null : DETAIL_STEPS[idx - QUESTIONS.length];
  const value = q ? answerNumber(answers, q.id, 3) : 3;
  const progress = ((idx + 1) / totalSteps) * 100;

  function updateAnswer(id: string, value: AnswerValue) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function toggleArrayValue(id: string, option: string) {
    setAnswers((current) => {
      const currentList = answerList(current, id);
      const exists = currentList.includes(option);
      return {
        ...current,
        [id]: exists ? currentList.filter((item) => item !== option) : [...currentList, option],
      };
    });
  }

  async function save(next: Answers, completed = false) {
    if (!user || !classId) return;
    await supabase.from("survey_responses").upsert(
      {
        class_id: classId,
        student_id: user.id,
        answers: next as never,
        completed,
        submitted_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "class_id,student_id" },
    );
  }

  async function advance() {
    if (busy) return;
    setBusy(true);
    const next = q ? { ...answers, [q.id]: value } : answers;
    setAnswers(next);
    if (idx === totalSteps - 1) {
      await save(next, true);
      navigate({ to: "/survey/done" });
      return;
    }
    await save(next);
    setDirection(1);
    setIdx(idx + 1);
    setBusy(false);
  }

  function back() {
    if (idx === 0) return;
    setDirection(-1);
    setIdx(idx - 1);
  }

  if (!classId)
    return (
      <div className="min-h-screen grid place-items-center text-muted text-sm">
        Loading your survey...
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 sm:px-6 md:px-12 pt-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              {detailStep?.label ?? `Question ${idx + 1}`} of {totalSteps}
            </span>
            {idx > 0 && (
              <button
                onClick={back}
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
          </div>
          <div className="h-1 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 sm:px-6 md:px-12 py-6 sm:py-8 overflow-hidden">
        <div className="max-w-2xl mx-auto relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={q?.id ?? detailStep?.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {q ? (
                <QuestionStep
                  framing={q.framing}
                  question={q.question}
                  low={q.low}
                  high={q.high}
                  value={value}
                  onChange={(next) => updateAnswer(q.id, next)}
                />
              ) : (
                <DetailStep
                  step={detailStep?.id ?? "availability"}
                  answers={answers}
                  updateAnswer={updateAnswer}
                  toggleArrayValue={toggleArrayValue}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <div className="px-4 sm:px-6 md:px-12 pb-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={advance}
            disabled={busy}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-[color:var(--color-primary-hover)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {idx === totalSteps - 1 ? "Submit answers" : "Next"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <style>{`
        .pg-slider { -webkit-appearance: none; appearance: none; height: 6px; background: var(--color-border); border-radius: 9999px; outline: none; }
        .pg-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 9999px; background: var(--color-accent); border: 3px solid var(--color-background); box-shadow: 0 1px 4px oklch(0 0 0 / 0.15); cursor: pointer; transition: transform 150ms ease; }
        .pg-slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
        .pg-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 9999px; background: var(--color-accent); border: 3px solid var(--color-background); cursor: pointer; }
      `}</style>
    </div>
  );
}

function QuestionStep({
  framing,
  question,
  low,
  high,
  value,
  onChange,
}: {
  framing: string;
  question: string;
  low: string;
  high: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <>
      <p className="text-sm text-muted mb-3">{framing}</p>
      <h2 className="font-display text-xl sm:text-2xl md:text-3xl mb-10 leading-snug">{question}</h2>

      <div className="space-y-6">
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="pg-slider w-full"
          aria-label={question}
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={value}
        />
        <div className="flex justify-between text-xs text-muted">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={"w-6 text-center " + (n === value ? "text-accent font-medium" : "")}
            >
              {n}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6 pt-2 text-sm">
          <div className="text-muted leading-relaxed">
            <span className="font-mono text-xs mr-1 text-foreground">1</span>
            {low}
          </div>
          <div className="text-muted leading-relaxed text-right">
            <span className="font-mono text-xs mr-1 text-foreground">5</span>
            {high}
          </div>
        </div>
      </div>
    </>
  );
}

function DetailStep({
  step,
  answers,
  updateAnswer,
  toggleArrayValue,
}: {
  step: DetailStepId;
  answers: Answers;
  updateAnswer: (id: string, value: AnswerValue) => void;
  toggleArrayValue: (id: string, option: string) => void;
}) {
  if (step === "availability") {
    return (
      <div>
        <p className="text-sm text-muted mb-3">Match quality starts with real meeting times.</p>
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl mb-8 leading-snug">
          When can you usually study with someone?
        </h2>
        <OptionGrid
          options={AVAILABILITY}
          selected={answerList(answers, "availability")}
          onToggle={(option) => toggleArrayValue("availability", option)}
        />
      </div>
    );
  }

  if (step === "academic") {
    return (
      <div className="space-y-9">
        <div>
          <p className="text-sm text-muted mb-3">
            Pick the course areas that matter for this class.
          </p>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl mb-8 leading-snug">
            What should matching pay attention to academically?
          </h2>
          <FieldLabel>Subjects or topics you want to study</FieldLabel>
          <OptionGrid
            options={TOPICS}
            selected={answerList(answers, "topics")}
            onToggle={(option) => toggleArrayValue("topics", option)}
          />
        </div>
        <div>
          <FieldLabel>Strengths you can bring</FieldLabel>
          <OptionGrid
            options={TOPICS}
            selected={answerList(answers, "strengths")}
            onToggle={(option) => toggleArrayValue("strengths", option)}
          />
        </div>
        <div>
          <FieldLabel>Weak areas where help would be useful</FieldLabel>
          <OptionGrid
            options={TOPICS}
            selected={answerList(answers, "weakAreas")}
            onToggle={(option) => toggleArrayValue("weakAreas", option)}
          />
        </div>
      </div>
    );
  }

  if (step === "logistics") {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm text-muted mb-3">
            These answers keep matches practical after class ends.
          </p>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl mb-8 leading-snug">
            How do you want a study partnership to work?
          </h2>
          <FieldLabel>Preferred study style</FieldLabel>
          <SingleChoice
            options={STUDY_STYLES}
            value={answerString(answers, "studyStyle")}
            onChange={(option) => updateAnswer("studyStyle", option)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <FieldLabel>Seriousness level</FieldLabel>
            <span className="font-mono text-xs text-accent">
              {answerNumber(answers, "seriousness", 3)}/5
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={answerNumber(answers, "seriousness", 3)}
            onChange={(e) => updateAnswer("seriousness", Number(e.target.value))}
            className="pg-slider w-full"
          />
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>Casual support</span>
            <span>Very committed</span>
          </div>
        </div>

        <ChoiceStack
          label="Target grade"
          options={TARGET_GRADES}
          value={answerString(answers, "targetGrade")}
          onChange={(option) => updateAnswer("targetGrade", option)}
        />
        <ChoiceStack
          label="Communication preference"
          options={COMMUNICATION}
          value={answerString(answers, "communicationPreference")}
          onChange={(option) => updateAnswer("communicationPreference", option)}
        />
        <ChoiceStack
          label="Online vs in-person"
          options={MEETING_MODES}
          value={answerString(answers, "meetingMode")}
          onChange={(option) => updateAnswer("meetingMode", option)}
        />
        <ChoiceStack
          label="Preferred language"
          options={LANGUAGES}
          value={answerString(answers, "preferredLanguage")}
          onChange={(option) => updateAnswer("preferredLanguage", option)}
        />
        <ChoiceStack
          label="Personality / work energy"
          options={ENERGY_STYLES}
          value={answerString(answers, "energyStyle")}
          onChange={(option) => updateAnswer("energyStyle", option)}
        />
        <ChoiceStack
          label="Accountability preference"
          options={ACCOUNTABILITY}
          value={answerString(answers, "accountabilityPreference")}
          onChange={(option) => updateAnswer("accountabilityPreference", option)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted mb-3">
          Optional boundaries help the lead avoid awkward or unsafe pairings.
        </p>
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl mb-8 leading-snug">
          Anything the matching process should respect?
        </h2>
        <ChoiceStack
          label="Published-result privacy"
          options={PRIVACY}
          value={answerString(answers, "privacyPreference") || PRIVACY[0]}
          onChange={(option) => updateAnswer("privacyPreference", option)}
        />
      </div>

      <ChoiceStack
        label="Gender/privacy preference, if relevant"
        options={GENDER_PRIVACY}
        value={answerString(answers, "genderPreference") || GENDER_PRIVACY[0]}
        onChange={(option) => updateAnswer("genderPreference", option)}
      />

      <div>
        <FieldLabel htmlFor="doNotPairWith">Do not pair me with</FieldLabel>
        <textarea
          id="doNotPairWith"
          value={answerString(answers, "doNotPairWith")}
          onChange={(e) => updateAnswer("doNotPairWith", e.target.value)}
          placeholder="Names or identifiers, separated by commas. Leave blank if none."
          className="min-h-28 w-full resize-none rounded-lg border border-border bg-card px-3 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
        />
        <p className="mt-2 text-xs text-muted">
          This is treated as a hard constraint before scores are calculated.
        </p>
      </div>
    </div>
  );
}

function OptionGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            aria-pressed={active}
            className={
              "min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-all " +
              (active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted")
            }
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function SingleChoice({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (option: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={active}
            className={
              "min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-all " +
              (active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted")
            }
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceStack({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (option: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <SingleChoice options={options} value={value} onChange={onChange} />
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: string; htmlFor?: string }) {
  if (htmlFor) {
    return (
      <label
        htmlFor={htmlFor}
        className="block mb-3 text-xs font-medium uppercase tracking-wider text-muted cursor-pointer"
      >
        {children}
      </label>
    );
  }
  return (
    <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">{children}</div>
  );
}

function answerList(answers: Answers, id: string) {
  const value = answers[id];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function answerString(answers: Answers, id: string) {
  const value = answers[id];
  return typeof value === "string" ? value : "";
}

function answerNumber(answers: Answers, id: string, fallback: number) {
  const value = answers[id];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
