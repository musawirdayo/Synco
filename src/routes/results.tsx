import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { archetypeBlurb } from "@/lib/synco";
import type { MatchBreakdown } from "@/lib/synco";
import { Activity, Info } from "lucide-react";
import {
  clearActiveClassId,
  getActiveClassId,
  getLatestMembershipClassId,
  getPendingJoinCode,
  setActiveClassId,
} from "@/lib/class-flow";
import {
  studentIsUnmatched,
  teamAssignmentForStudent,
  type StudentTeamAssignment,
  type TeamAssignmentSnapshot,
} from "@/lib/team-assignments";

import { RouteErrorFallback } from "@/components/route-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/results")({
  component: Results,
  errorComponent: RouteErrorFallback,
});

type Match = {
  student_id: string;
  name: string;
  identifier?: string | null;
  archetype: string;
  score: number;
  assigned?: boolean;
  confidence?: "High" | "Moderate" | "Low";
  breakdown?: MatchBreakdown;
  proofs?: string[];
  why: string;
  brings: string;
  agree: string[];
  move: string;
};
type Avoid = {
  student_id: string;
  name: string;
  identifier?: string | null;
  archetype: string;
  score: number;
  friendFlagged?: boolean;
  friendRisk?: string | null;
  confidence?: "High" | "Moderate" | "Low";
  breakdown?: MatchBreakdown;
  riskProofs?: string[];
  riskScore?: number;
  isRisky?: boolean;
  why: string;
  watch: string;
  move: string;
};
type ResultData = {
  results_version?: number;
  generated_at?: string;
  assigned_partner_id?: string | null;
  matching_algorithm?: string;
  matching_weights?: string;
  feedback_after_week?: string;
  archetype: string;
  meters: {
    structure: number;
    commPace: number;
    deadlineBuffer: number;
    initiative: number;
    teachingComfort: number;
  };
  matches: Match[];
  avoid?: Avoid[];
  comparisonPeers?: ComparisonPeer[];
  readiness?: {
    suggestedGroup: Array<{ name: string; archetype: string; score: number }>;
    why: string;
    friction: string;
    agenda: string[];
    roles: string[];
    disclaimer: string;
  };
  submitted_count: number;
  expected_count: number;
};

type ComparisonPeer = Match & {
  identifier?: string | null;
  watch?: string;
  riskWhy?: string;
  riskProofs?: string[];
  riskScore?: number;
  isRisky?: boolean;
  friendFlagged?: boolean;
  friendRisk?: string | null;
};

/* ─── Component: Score ring ─── */
function ScoreRing({
  score,
  isWarning,
  label = "Match",
}: {
  score: number;
  isWarning?: boolean;
  label?: string;
}) {
  const radius = 48;
  const stroke = 5;
  const normRad = radius - stroke * 2;
  const circum = normRad * 2 * Math.PI;
  const offset = circum - (score / 100) * circum;
  const color = isWarning ? "var(--color-destructive)" : "var(--accent)";

  return (
    <div className="relative flex flex-col items-center justify-center h-24 w-24 shrink-0">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="var(--border)"
          fill="transparent"
          strokeWidth={stroke}
          r={normRad}
          cx={radius}
          cy={radius}
          opacity="0.25"
        />
        <motion.circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circum} ${circum}`}
          initial={{ strokeDashoffset: circum }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          r={normRad}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold leading-none text-foreground">
          {score}%
        </span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5 font-bold">
          {label}
        </span>
      </div>
    </div>
  );
}

/* ─── Component: Breakdown bars ─── */
function BreakdownBars({ breakdown }: { breakdown: MatchBreakdown }) {
  const rows = [
    { label: "Availability", value: breakdown.availability },
    { label: "Academic Fit", value: breakdown.academic },
    { label: "Complementary Skills", value: breakdown.complementary },
    { label: "Study Style", value: breakdown.studyStyle },
    { label: "Goals", value: breakdown.goals },
  ];

  return (
    <div className="space-y-3 rounded-xl border border-border/40 bg-background/35 p-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-foreground">{row.label}</span>
            <span className="font-mono font-bold text-foreground">{row.value}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-border/60">
            <div
              className={
                "h-full rounded-full transition-all duration-500 " +
                (row.value < 55 ? "bg-destructive" : "bg-primary")
              }
              style={{ width: `${row.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Component: Work style meters ─── */
function WorkStyleSection({ meters }: { meters: ResultData["meters"] }) {
  const items = [
    {
      label: "Structure Preference",
      left: "Flexible",
      right: "Structured",
      value: meters?.structure ?? 50,
      note:
        meters?.structure < 40
          ? "You thrive in adaptive, organic environments."
          : meters?.structure > 65
            ? "You work best with clear outlines and organized plans."
            : "You balance structured work with flexibility.",
    },
    {
      label: "Communication",
      left: "Quick check-ins",
      right: "Longer async updates",
      value: meters?.commPace ?? 50,
      note:
        meters?.commPace < 40
          ? "You prefer frequent, real-time communication."
          : meters?.commPace > 65
            ? "You prefer fewer, deeper sync sessions."
            : "You switch naturally between sync and async.",
    },
    {
      label: "Deadline Style",
      left: "Sprint near deadline",
      right: "Early delivery",
      value: meters?.deadlineBuffer ?? 50,
      note:
        meters?.deadlineBuffer < 40
          ? "You do your best work under time pressure."
          : meters?.deadlineBuffer > 65
            ? "You prefer finishing early with buffer time."
            : "You pace yourself steadily toward deadlines.",
    },
    {
      label: "Initiative",
      left: "Supportive execution",
      right: "Proactive lead",
      value: meters?.initiative ?? 50,
      note:
        meters?.initiative < 40
          ? "You excel at executing defined tasks reliably."
          : meters?.initiative > 65
            ? "You naturally step forward and take charge."
            : "You balance leading with supporting.",
    },
    {
      label: "Teaching Comfort",
      left: "Learning from peers",
      right: "Explaining to others",
      value: meters?.teachingComfort ?? 50,
      note:
        meters?.teachingComfort < 40
          ? "You prefer absorbing knowledge from others."
          : meters?.teachingComfort > 65
            ? "You enjoy explaining complex concepts to teammates."
            : "You comfortably switch between learning and teaching.",
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-2xl font-display font-semibold tracking-tight text-foreground flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5 text-accent" />
        Your Work Style
      </h2>
      <div className="space-y-5">
        {items.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="p-4 rounded-xl bg-background/40 border border-border/40"
          >
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-foreground/90">{m.label}</span>
              <span className="font-mono text-xs font-bold text-accent">{m.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-border/40 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${m.value}%` }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.04 }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
              <span>{m.left}</span>
              <span>{m.right}</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed mt-2 pl-2.5 border-l-2 border-accent/30">
              {m.note}
            </p>
          </motion.div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground/80 mt-5 text-center">
        Based on your survey responses — tendencies, not fixed traits.
      </p>
    </section>
  );
}

type BreakdownMetricKey = "availability" | "academic" | "complementary" | "studyStyle" | "goals";
type BreakdownRow = { key: BreakdownMetricKey; label: string; value: number };

const BREAKDOWN_LABELS: Array<{ key: BreakdownMetricKey; label: string }> = [
  { key: "availability", label: "meeting time" },
  { key: "academic", label: "course focus" },
  { key: "complementary", label: "skill coverage" },
  { key: "studyStyle", label: "work rhythm" },
  { key: "goals", label: "effort level" },
];

function breakdownRows(breakdown?: MatchBreakdown): BreakdownRow[] {
  if (!breakdown) return [];
  return BREAKDOWN_LABELS.map((item) => ({
    ...item,
    value: breakdown[item.key],
  }));
}

function strongestSignal(peer: Match | Avoid) {
  return [...breakdownRows(peer.breakdown)].sort((left, right) => right.value - left.value)[0];
}

function weakestSignal(peer: Match | Avoid) {
  return [...breakdownRows(peer.breakdown)].sort((left, right) => left.value - right.value)[0];
}

function matchHeadline(peer: Match) {
  if (peer.assigned) return "Assigned teammate";
  if (peer.score >= 85) return "High-trust match";
  if (peer.score >= 75) return "Strong project fit";
  if (peer.score >= 65) return "Useful working fit";
  return "Worth a careful first chat";
}

function matchBenefit(peer: Match) {
  const strongest = strongestSignal(peer);
  if (!strongest) return "This match is based on the overall pattern of your answers.";
  if (strongest.key === "complementary") {
    return "The value here is coverage: they are useful because they may cover gaps, not because they are a copy of you.";
  }
  if (strongest.key === "availability") {
    return "The practical win is simple: this person should be easier to actually meet and make progress with.";
  }
  if (strongest.key === "studyStyle") {
    return "The work rhythm is the upside, so planning, updates, and task handoffs should feel smoother.";
  }
  if (strongest.key === "goals") {
    return "The effort level lines up, which lowers the chance that one person carries the project alone.";
  }
  return "The course focus lines up, so helping each other should take less translation time.";
}

function watchHeadline(peer: Avoid) {
  if (peer.friendFlagged) return "Friend reality check";
  if (peer.isRisky) return "High-risk pairing";
  if (peer.riskScore && peer.riskScore >= 25) return "Needs a strict plan";
  return "Watch before choosing";
}

function likelyFailureMode(peer: Avoid) {
  const weakest = weakestSignal(peer);
  if (!weakest) return peer.watch || "This pairing needs a clear plan before work starts.";
  if (weakest.key === "availability") {
    return "What will probably go wrong: you spend more time trying to meet than actually finishing work.";
  }
  if (weakest.key === "academic") {
    return "What will probably go wrong: you may be preparing for different things, so support turns into extra teaching time.";
  }
  if (weakest.key === "complementary") {
    return "What will probably go wrong: the same skill gaps stay uncovered, so the project slows down when hard parts appear.";
  }
  if (weakest.key === "studyStyle") {
    return "What will probably go wrong: one person expects fast back-and-forth while the other works in a different rhythm.";
  }
  return "What will probably go wrong: the effort level or target outcome may not match once deadlines get real.";
}

function comparisonRiskCopy(peer: ComparisonPeer) {
  if (peer.friendRisk) return peer.friendRisk;
  if (peer.watch) return peer.watch;
  if (peer.riskWhy) return peer.riskWhy;
  const weakest = weakestSignal(peer);
  if (!weakest) return "No major difficulty is visible, but still agree on expectations first.";
  if (weakest.key === "availability") {
    return "Meeting time is the weakest signal, so this pair needs a clear schedule before work starts.";
  }
  if (weakest.key === "academic") {
    return "Course focus is the weakest signal, so you may need extra time to get aligned.";
  }
  if (weakest.key === "complementary") {
    return "Skill coverage is the weakest signal, so this pair may not cover each other's gaps.";
  }
  if (weakest.key === "studyStyle") {
    return "Work rhythm is the weakest signal, so agree on updates and communication early.";
  }
  return "Goal alignment is the weakest signal, so agree on effort level before starting.";
}

function firstAgreement(peer: Match | Avoid) {
  if ("agree" in peer && peer.agree?.length) return peer.agree[0];
  const weakest = weakestSignal(peer);
  return weakest?.label ?? "first check-in cadence";
}

type CompatibilityProof = {
  label: string;
  detail: string;
  score?: number;
};

function proofLabelFromText(proof: string) {
  const normalized = proof.toLowerCase();
  if (normalized.includes("slot") || normalized.includes("schedule")) return "Meeting proof";
  if (
    normalized.includes("skill") ||
    normalized.includes("strength") ||
    normalized.includes("weak")
  ) {
    return "Skill proof";
  }
  if (
    normalized.includes("rhythm") ||
    normalized.includes("communication") ||
    normalized.includes("message") ||
    normalized.includes("updates")
  ) {
    return "Work-style proof";
  }
  if (
    normalized.includes("seriousness") ||
    normalized.includes("target") ||
    normalized.includes("outcome")
  ) {
    return "Effort proof";
  }
  if (normalized.includes("focus") || normalized.includes("academic")) return "Course proof";
  return "Fit proof";
}

function proofScoreFromText(proof: string, breakdown?: MatchBreakdown) {
  if (!breakdown) return undefined;
  const label = proofLabelFromText(proof);
  if (label === "Meeting proof") return breakdown.availability;
  if (label === "Skill proof") return breakdown.complementary;
  if (label === "Work-style proof") return breakdown.studyStyle;
  if (label === "Effort proof") return breakdown.goals;
  if (label === "Course proof") return breakdown.academic;
  return undefined;
}

function proofFromStrongSignal(row: BreakdownRow, breakdown?: MatchBreakdown): CompatibilityProof {
  if (row.key === "availability") {
    return {
      label: "Meeting proof",
      score: row.value,
      detail: breakdown?.commonSlots?.length
        ? `${breakdown.commonSlots.length} shared free slot${breakdown.commonSlots.length === 1 ? "" : "s"} gives this pair real time to work.`
        : "The schedule pattern is strong enough that planning should not eat the whole project.",
    };
  }
  if (row.key === "academic") {
    return {
      label: "Course proof",
      score: row.value,
      detail: breakdown?.commonTopics?.length
        ? `You share focus on ${breakdown.commonTopics.slice(0, 2).join(" and ")}, so helping each other should take less translation.`
        : "Your class focus is close enough that support should feel practical instead of random.",
    };
  }
  if (row.key === "complementary") {
    return {
      label: "Skill proof",
      score: row.value,
      detail: breakdown?.complementaryTopics?.length
        ? `${breakdown.complementaryTopics.slice(0, 2).join(" and ")} help cover weak spots instead of duplicating the same strengths.`
        : "The skill pattern is workable, with no obvious shared gap taking over the pairing.",
    };
  }
  if (row.key === "studyStyle") {
    return {
      label: "Work-style proof",
      score: row.value,
      detail: "Your planning, communication, and work rhythm signals point in a similar direction.",
    };
  }
  return {
    label: "Effort proof",
    score: row.value,
    detail: "Your seriousness and target outcome are close enough to reduce expectation drama.",
  };
}

function compatibilityProofs(peer: Match | ComparisonPeer) {
  const seen = new Set<string>();
  const output: CompatibilityProof[] = [];
  const add = (proof: CompatibilityProof) => {
    const key = proof.detail.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    output.push(proof);
  };

  for (const proof of peer.proofs ?? []) {
    add({
      label: proofLabelFromText(proof),
      detail: proof,
      score: proofScoreFromText(proof, peer.breakdown),
    });
  }

  const strongSignals = breakdownRows(peer.breakdown)
    .filter((row) => row.value >= 70)
    .sort((left, right) => right.value - left.value);

  for (const row of strongSignals) {
    add(proofFromStrongSignal(row, peer.breakdown));
  }

  if (!output.length) {
    const strongest = strongestSignal(peer);
    if (strongest) {
      add(proofFromStrongSignal(strongest, peer.breakdown));
    } else {
      add({
        label: "Fit proof",
        detail: peer.why || "This is based on the overall pattern of your survey answers.",
      });
    }
  }

  return output.slice(0, 4);
}

function CompatibilityProofPanel({
  peer,
  compact = false,
}: {
  peer: Match | ComparisonPeer;
  compact?: boolean;
}) {
  const proofs = compatibilityProofs(peer);
  if (!proofs.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-accent/20 bg-accent/[0.035] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
            Compatibility proof
          </div>
          {!compact && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              The useful signals Synco found in your answers.
            </p>
          )}
        </div>
        {peer.confidence && (
          <span className="w-fit rounded-full border border-accent/20 bg-card/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
            {peer.confidence} confidence
          </span>
        )}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {proofs.map((proof) => (
          <div
            key={`${proof.label}-${proof.detail}`}
            className="rounded-lg border border-border/55 bg-background/55 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-foreground">{proof.label}</span>
              {typeof proof.score === "number" && (
                <span className="font-mono text-xs font-bold text-accent">{proof.score}%</span>
              )}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{proof.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function teamSummary(team: StudentTeamAssignment) {
  const quality = team.quality;
  if (!quality) {
    return {
      best: "Team assignment",
      weak: "First plan",
      proof: team.rationale,
      move: "Start with roles, meeting time, and the first task owner.",
      cards: [],
    };
  }

  const metrics = [
    { label: "Meeting time", value: quality.logistics },
    { label: "Skill coverage", value: quality.skillCoverage },
    { label: "Role mix", value: quality.roleCoverage },
    { label: "Pair safety", value: quality.minPairSafety },
    { label: "Effort alignment", value: quality.goalAlignment },
  ].sort((left, right) => right.value - left.value);
  const best = metrics[0];
  const weak = [...metrics].sort((left, right) => left.value - right.value)[0];
  const proofParts = [
    quality.rolesCovered.length ? `roles: ${quality.rolesCovered.slice(0, 4).join(", ")}` : "",
    quality.strengthsCovered.length
      ? `coverage: ${quality.strengthsCovered.slice(0, 4).join(", ")}`
      : "",
  ].filter(Boolean);

  return {
    best: `${best?.label ?? "Team quality"} is the strongest signal (${best?.value ?? quality.score}%).`,
    weak: `${weak?.label ?? "First plan"} is the weak spot (${weak?.value ?? quality.score}%).`,
    proof: proofParts.length ? proofParts.join(" · ") : quality.rationale,
    move: quality.watch,
    cards: metrics.slice(0, 4),
  };
}

function formatReportDate(value?: string) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function profileInitial(name?: string) {
  return (name?.trim()?.[0] ?? "S").toUpperCase();
}

function SectionHeader({
  eyebrow,
  title,
  description,
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div>
      {eyebrow && (
        <div
          className={
            "mb-2 text-[10px] font-bold uppercase tracking-[0.18em] " +
            (tone === "warning" ? "text-destructive" : "text-accent")
          }
        >
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function ProfileOverview({
  name,
  className,
  data,
  partial,
}: {
  name?: string;
  className?: string;
  data: ResultData;
  partial: boolean;
}) {
  const stats = [
    { label: "Best matches", value: data.matches?.length ?? 0 },
    { label: "Watch-outs", value: data.avoid?.length ?? 0 },
    { label: "Responses", value: `${data.submitted_count}/${data.expected_count}` },
    { label: "Report", value: data.results_version ? `v${data.results_version}` : "Live" },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <span className="font-display text-2xl font-bold">{profileInitial(name)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Result profile
          </div>
          <h1 className="mt-1 truncate font-display text-3xl font-bold tracking-tight text-foreground">
            {name || "Your results"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{className || "Current class"}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-accent/20 bg-accent/[0.035] p-4">
        <div className="inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          {data.archetype}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {archetypeBlurb[data.archetype]}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/60 bg-background/45 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </div>
            <div className="mt-1 font-display text-xl font-semibold text-foreground">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-background/60 px-3 py-1">
          Generated {formatReportDate(data.generated_at)}
        </span>
        <span className="rounded-full border border-border bg-background/60 px-3 py-1">
          {data.matching_algorithm || "Synco matcher"}
        </span>
      </div>

      {partial && (
        <div className="mt-5 rounded-xl border border-accent/15 bg-accent/[0.025] p-3 text-xs leading-relaxed text-muted-foreground">
          <div className="flex gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>
              Includes {data.submitted_count} of {data.expected_count} responses.{" "}
              {data.expected_count - data.submitted_count} classmates are still pending.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function MetricBar({ label, value, helper }: { label: string; value: number; helper?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/35 p-4">
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="font-mono font-bold text-accent">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-border/60">
        <div
          className={"h-full rounded-full " + (value < 55 ? "bg-destructive" : "bg-primary")}
          style={{ width: `${value}%` }}
        />
      </div>
      {helper && <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p>}
    </div>
  );
}

function TeamProfilePanel({
  assignedTeam,
  assignedTeamSummary,
  isUnmatchedFromTeams,
  userId,
  readiness,
  teamSize,
}: {
  assignedTeam: StudentTeamAssignment | null;
  assignedTeamSummary: ReturnType<typeof teamSummary> | null;
  isUnmatchedFromTeams: boolean;
  userId?: string;
  readiness: NonNullable<ResultData["readiness"]>;
  teamSize?: number;
}) {
  const teamNumber = assignedTeam?.id.match(/\d+/)?.[0];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-5 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Headline result"
          title="Your assigned team"
          description="The team assignment is the main result. The match lists below are extra context for who you may work well with or should plan carefully around."
        />
        {assignedTeam?.quality?.score !== undefined && (
          <div className="shrink-0 rounded-xl border border-accent/20 bg-accent/[0.04] px-4 py-3 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-accent">
              Team quality
            </div>
            <div className="font-display text-3xl font-bold text-foreground">
              {assignedTeam.quality.score}%
            </div>
          </div>
        )}
      </div>

      {assignedTeam ? (
        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-accent/20 bg-accent/[0.035] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
              {teamNumber ? `Team ${teamNumber}` : "Assigned team"}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {assignedTeam.members.length} member
              {assignedTeam.members.length === 1 ? "" : "s"}
              {teamSize ? ` · target size ${teamSize}` : ""} · {assignedTeam.average_score}% average
              pair fit
            </p>
            {assignedTeam.teammates.length > 0 && (
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                Your teammate{assignedTeam.teammates.length === 1 ? "" : "s"}:{" "}
                <span className="font-semibold">
                  {assignedTeam.teammates.map((member) => member.name).join(", ")}
                </span>
              </p>
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {assignedTeam.members.map((member) => {
                  const isSelf = member.student_id === userId;
                  return (
                    <div
                      key={member.student_id}
                      className={
                        "rounded-xl border p-4 " +
                        (isSelf
                          ? "border-accent/35 bg-accent/[0.04]"
                          : "border-border/60 bg-background/45")
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-foreground">
                            {isSelf ? "You" : member.name}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {member.archetype}
                          </div>
                        </div>
                        {isSelf && (
                          <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {assignedTeam.rationale}
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-border/60 bg-background/35 p-5">
              {assignedTeamSummary && (
                <>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-accent">
                      Best signal
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">
                      {assignedTeamSummary.best}
                    </p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Weak spot to handle
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {assignedTeamSummary.weak}
                    </p>
                  </div>
                </>
              )}
              <div className="border-t border-border/50 pt-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  First meeting
                </div>
                <div className="mt-3 space-y-2">
                  {readiness.agenda.slice(0, 3).map((item, index) => (
                    <div key={item} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-accent/20 bg-accent/10 font-mono text-[10px] font-bold text-accent">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {assignedTeam.quality && assignedTeamSummary && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Pair safety",
                  value: assignedTeam.quality.minPairSafety,
                  helper: "lowest inside-team pair",
                },
                ...assignedTeamSummary.cards.slice(0, 3).map((card) => ({
                  label: card.label,
                  value: card.value,
                  helper:
                    card.label === "Meeting time"
                      ? "schedule reality"
                      : card.label === "Skill coverage"
                        ? "different strengths"
                        : card.label === "Role mix"
                          ? "work roles covered"
                          : "team signal",
                })),
              ]
                .filter(
                  (card, index, cards) =>
                    cards.findIndex((candidate) => candidate.label === card.label) === index,
                )
                .slice(0, 4)
                .map((metric) => (
                  <MetricBar key={metric.label} {...metric} />
                ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          {isUnmatchedFromTeams
            ? "You were included in published results, but Synco could not place you into a team without breaking hard constraints or team size limits."
            : "Your class lead has not published a team assignment for you yet."}
        </p>
      )}
    </section>
  );
}

function SuggestedTeamPanel({ readiness }: { readiness: NonNullable<ResultData["readiness"]> }) {
  if (!readiness.suggestedGroup.length) return null;
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <SectionHeader
        eyebrow="Working group"
        title="Suggested team direction"
        description="Use this when your class lead has not published an assigned team yet."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {readiness.suggestedGroup.map((member) => (
          <div
            key={member.name}
            className="rounded-xl border border-border/60 bg-background/45 p-4"
          >
            <div className="font-semibold text-foreground">{member.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{member.archetype}</div>
            <div className="mt-3 text-xs font-bold text-accent">{member.score}/100 fit</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{readiness.why}</p>
    </section>
  );
}

function comparisonSearchText(peer: ComparisonPeer) {
  return [peer.name, peer.identifier, peer.archetype].filter(Boolean).join(" ").toLowerCase();
}

function comparisonPeersForData(data: ResultData): ComparisonPeer[] {
  const peers = new Map<string, ComparisonPeer>();
  const add = (peer: ComparisonPeer) => {
    const current = peers.get(peer.student_id);
    peers.set(peer.student_id, current ? { ...current, ...peer } : peer);
  };

  if (data.comparisonPeers?.length) {
    data.comparisonPeers.forEach(add);
  }
  data.matches?.forEach((peer) => add(peer));
  data.avoid?.forEach((peer) =>
    add({
      ...peer,
      brings: "",
      agree: [],
      riskWhy: peer.why,
    }),
  );

  return [...peers.values()].sort((left, right) => right.score - left.score);
}

function ComparePanel({ peers }: { peers: ComparisonPeer[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!peers.length) return null;

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? peers.filter((peer) => comparisonSearchText(peer).includes(normalizedQuery)).slice(0, 8)
    : peers.slice(0, 6);
  const selected =
    peers.find((peer) => peer.student_id === selectedId) ?? filtered[0] ?? peers[0] ?? null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <SectionHeader
        eyebrow="Compare"
        title="Check a classmate before teaming up"
        description="Search a visible name or roll number. Synco compares your result with that classmate and shows the practical upside, risks, and first thing to agree on."
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Search classmate
          </label>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedId(null);
            }}
            placeholder="Name or roll number"
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
          />
          <div className="mt-3 space-y-2">
            {filtered.length ? (
              filtered.map((peer) => (
                <button
                  key={peer.student_id}
                  type="button"
                  onClick={() => setSelectedId(peer.student_id)}
                  className={
                    "w-full rounded-xl border p-3 text-left transition-colors " +
                    (selected?.student_id === peer.student_id
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-background/45 hover:border-primary/40")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {peer.name}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {peer.identifier ? `${peer.identifier} · ` : ""}
                        {peer.archetype}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-border bg-card px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                      {peer.score}%
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background/35 p-4 text-sm text-muted-foreground">
                No visible classmate matched that search. Some students may hide their identity
                until the lead introduces them.
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div className="rounded-xl border border-border/60 bg-background/35 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                  Detailed comparison
                </div>
                <h3 className="mt-1 text-2xl font-display font-semibold text-foreground">
                  {selected.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.identifier ? `${selected.identifier} · ` : ""}
                  {selected.archetype}
                </p>
              </div>
              <ScoreRing
                score={selected.score}
                isWarning={Boolean(selected.isRisky || selected.friendRisk)}
                label={selected.isRisky || selected.friendRisk ? "Risk" : "Match"}
              />
            </div>

            {selected.breakdown && (
              <div className="mt-5">
                <BreakdownBars breakdown={selected.breakdown} />
              </div>
            )}

            <CompatibilityProofPanel peer={selected} compact />

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-accent/20 bg-accent/[0.035] p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  Why it may work
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.why}</p>
                {selected.brings && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">They bring:</span>{" "}
                    {selected.brings}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-destructive/20 bg-destructive/[0.025] p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                  What could get difficult
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {comparisonRiskCopy(selected)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                First thing to agree on
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {firstAgreement(selected)} before assigning work.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MatchProfileCard({ peer }: { peer: Match }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-accent/35">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-foreground">{peer.name}</h3>
            {peer.assigned && (
              <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                Teammate
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{peer.archetype}</div>
          <div className="mt-3 inline-flex rounded-full border border-accent/20 bg-accent/[0.05] px-3 py-1 text-xs font-semibold text-accent">
            {matchHeadline(peer)}
          </div>
        </div>
        <ScoreRing score={peer.score} />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground">{matchBenefit(peer)}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{peer.why}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">They bring:</span> {peer.brings}
      </p>

      <CompatibilityProofPanel peer={peer} />

      {peer.breakdown && (
        <div className="mt-4">
          <BreakdownBars breakdown={peer.breakdown} />
        </div>
      )}

      {peer.agree.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {peer.agree.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground"
            >
              Agree on {item}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function WatchProfileCard({ peer }: { peer: Avoid }) {
  const friend = Boolean(peer.friendFlagged);
  return (
    <article
      className={
        "rounded-2xl border p-5 shadow-sm transition-colors " +
        (friend
          ? "border-amber-500/40 bg-amber-500/[0.035] hover:border-amber-500/60"
          : "border-destructive/20 bg-card hover:border-destructive/35")
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {friend && (
            <span className="mb-2 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Friend flagged
            </span>
          )}
          <h3 className="truncate text-lg font-semibold text-foreground">{peer.name}</h3>
          <div className="mt-1 text-xs text-muted-foreground">{peer.archetype}</div>
          <div
            className={
              "mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold " +
              (friend
                ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-destructive/20 bg-destructive/10 text-destructive")
            }
          >
            {watchHeadline(peer)}
          </div>
        </div>
        <ScoreRing score={peer.score} isWarning label="Risk" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground">{likelyFailureMode(peer)}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{peer.why}</p>

      {peer.friendRisk ? (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-sm leading-relaxed text-amber-900 dark:text-amber-100">
          {peer.friendRisk}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-destructive/15 bg-destructive/[0.025] p-4 text-sm leading-relaxed text-destructive/90">
          {peer.watch}
        </div>
      )}

      {peer.breakdown && (
        <div className="mt-4">
          <BreakdownBars breakdown={peer.breakdown} />
        </div>
      )}

      {peer.riskProofs && peer.riskProofs.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-border/50 pt-4 text-sm leading-relaxed text-muted-foreground">
          {peer.riskProofs.slice(0, 3).map((proof) => (
            <li key={proof} className="flex gap-2">
              <span
                className={
                  "mt-2 h-1.5 w-1.5 shrink-0 rounded-full " +
                  (friend ? "bg-amber-500" : "bg-destructive")
                }
              />
              <span>{proof}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        If you still choose this pair, agree on {firstAgreement(peer).toLowerCase()} before
        assigning work.
      </p>
    </article>
  );
}

function FeedbackPanel({
  data,
  feedbackBusy,
  feedbackError,
  onFeedback,
}: {
  data: ResultData;
  feedbackBusy: boolean;
  feedbackError: string | null;
  onFeedback: (choice: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <SectionHeader
        eyebrow="After the first week"
        title="Tell your lead if this worked"
        description="This feedback updates your result record and helps the lead decide whether the class needs a rematch."
      />
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {["Useful", "Unsure", "Not useful"].map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => onFeedback(choice)}
            disabled={feedbackBusy}
            className={
              "h-11 rounded-xl border px-3 text-sm font-semibold transition-colors disabled:opacity-60 " +
              (data.feedback_after_week === choice
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted")
            }
          >
            {choice}
          </button>
        ))}
      </div>
      {data.feedback_after_week && (
        <p className="mt-3 text-xs text-muted-foreground">Saved: {data.feedback_after_week}.</p>
      )}
      {feedbackError && <p className="mt-3 text-xs text-destructive">{feedbackError}</p>}
    </section>
  );
}

/* ─── Main component ─── */
function Results() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [state, setState] = useState<{
    status: "loading" | "waiting" | "ready";
    classId?: string;
    data?: ResultData;
    className?: string;
    published?: boolean;
    submittedAt?: string | null;
    submitted?: number;
    expected?: number;
    name?: string;
    assignedTeam?: StudentTeamAssignment | null;
    assignmentSnapshot?: TeamAssignmentSnapshot | null;
  }>({ status: "loading" });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      let cid = getActiveClassId() ?? (await getLatestMembershipClassId(user.id));
      if (!cid) {
        const pendingCode = getPendingJoinCode();
        if (pendingCode) navigate({ to: "/join/$code", params: { code: pendingCode } });
        else navigate({ to: "/join" });
        return;
      }
      setActiveClassId(cid);
      let { data: cls } = await supabase
        .from("classes")
        .select("name,is_published,expected_count,team_assignments")
        .eq("id", cid)
        .single();
      if (!cls) {
        clearActiveClassId();
        const fallbackClassId = await getLatestMembershipClassId(user.id);
        if (!fallbackClassId || fallbackClassId === cid) {
          navigate({ to: "/join" });
          return;
        }
        cid = fallbackClassId;
        setActiveClassId(cid);
        const { data } = await supabase
          .from("classes")
          .select("name,is_published,expected_count,team_assignments")
          .eq("id", cid)
          .single();
        cls = data;
        if (!cls) {
          navigate({ to: "/join" });
          return;
        }
      }
      const { count } = await supabase
        .from("survey_responses")
        .select("id", { count: "exact", head: true })
        .eq("class_id", cid)
        .eq("completed", true);
      const { data: own } = await supabase
        .from("survey_responses")
        .select("submitted_at")
        .eq("class_id", cid)
        .eq("student_id", user.id)
        .maybeSingle();
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!cls?.is_published) {
        setState({
          status: "waiting",
          classId: cid,
          className: cls?.name,
          published: false,
          submittedAt: own?.submitted_at,
          submitted: count ?? 0,
          expected: cls?.expected_count,
          name: prof?.full_name ?? "",
        });
        return;
      }
      const assignmentSnapshot = cls.team_assignments as TeamAssignmentSnapshot | null;
      const assignedTeam = teamAssignmentForStudent(assignmentSnapshot, user.id);
      const { data: res } = await supabase
        .from("match_results")
        .select("result_data")
        .eq("class_id", cid)
        .eq("student_id", user.id)
        .maybeSingle();
      if (!res) {
        setState({
          status: "waiting",
          classId: cid,
          className: cls.name,
          published: true,
          submittedAt: own?.submitted_at,
          submitted: count ?? 0,
          expected: cls.expected_count,
          name: prof?.full_name ?? "",
          assignedTeam,
          assignmentSnapshot,
        });
        return;
      }
      setState({
        status: "ready",
        classId: cid,
        data: res.result_data as ResultData,
        className: cls.name,
        published: true,
        name: prof?.full_name ?? "",
        assignedTeam,
        assignmentSnapshot,
      });
    })();
  }, [user, navigate, refreshKey]);

  if (state.status === "loading") return <ResultsSkeleton />;

  if (state.status === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-md text-center"
        >
          <h1 className="font-display text-4xl mb-3">
            {state.published ? "Results are published." : "You're in. Results aren't ready yet."}
          </h1>
          <p className="text-muted mb-8">
            {state.published
              ? state.submittedAt
                ? "Your response was submitted after results were generated. Ask your class lead to publish again so your profile can be included."
                : "Take the survey to unlock your own profile. You can still browse the class list if results are live."
              : `${state.submitted} students have submitted. Your class lead will publish results when ready.`}
          </p>
          {state.submittedAt && (
            <p className="text-sm text-muted">
              You submitted on{" "}
              {new Date(state.submittedAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
              })}
            </p>
          )}
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            {state.published && !state.submittedAt && (
              <Link
                to="/survey/guide"
                className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-[color:var(--color-primary-hover)] transition-all text-sm font-medium"
              >
                Take the survey
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setState({
                  status: "loading",
                  classId: state.classId,
                  className: state.className,
                });
                setRefreshKey((key) => key + 1);
              }}
              className="inline-flex items-center justify-center h-11 px-5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
            >
              Check again
            </button>
            {state.classId && (
              <Link
                to="/c/$id"
                params={{ id: state.classId }}
                className="inline-flex items-center justify-center h-11 px-5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
              >
                Class page
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const d = state.data;
  if (!d) {
    return (
      <div className="min-h-screen grid place-items-center text-muted text-sm">
        No result data available.
      </div>
    );
  }

  const partial = (d.submitted_count || 0) < (d.expected_count || 0);
  const rawReadiness = d.readiness ?? fallbackReadiness(d);
  const readiness = {
    suggestedGroup: rawReadiness.suggestedGroup || [],
    why: rawReadiness.why || "Not enough completed surveys to explain a strong working group yet.",
    friction:
      rawReadiness.friction ||
      "Even strong matches should agree on expectations before starting real work.",
    agenda: rawReadiness.agenda || [
      "Share availability and preferred communication channel.",
      "Agree on check-in cadence before assigning tasks.",
      "Name one backup owner for deadlines so work doesn't silently stall.",
      "Schedule a 15-minute reset after the first milestone.",
    ],
    roles: rawReadiness.roles || [],
    disclaimer:
      rawReadiness.disclaimer ||
      "Use this as a practical starting point. A good team still needs a first conversation, clear roles, and instructor judgment.",
  };

  const orderedAvoid = (d.avoid || [])
    .map((peer, index) => ({ peer, index }))
    .sort((left, right) => {
      if (left.peer.friendFlagged !== right.peer.friendFlagged) {
        return left.peer.friendFlagged ? -1 : 1;
      }
      return left.index - right.index;
    })
    .map(({ peer }) => peer);
  const meaningfulAvoid = orderedAvoid.filter(
    (peer) =>
      peer.friendFlagged ||
      peer.isRisky ||
      (peer.riskScore ?? 0) >= 25 ||
      peer.score < 65 ||
      !(d.matches || []).some((match) => match.student_id === peer.student_id),
  );
  const meaningfulAvoidIds = new Set(meaningfulAvoid.map((peer) => peer.student_id));
  const displayMatches = (d.matches || []).filter(
    (peer) => !meaningfulAvoidIds.has(peer.student_id),
  );
  const comparisonPeers = comparisonPeersForData(d);
  const assignedTeam = state.assignedTeam ?? null;
  const assignmentSnapshot = state.assignmentSnapshot ?? null;
  const isUnmatchedFromTeams =
    Boolean(user) && studentIsUnmatched(assignmentSnapshot, user?.id ?? "");
  const assignedTeamSummary = assignedTeam ? teamSummary(assignedTeam) : null;

  async function sendFeedback(choice: string) {
    if (!state.classId || !user || feedbackBusy || !state.data) return;
    setFeedbackBusy(true);
    setFeedbackError(null);
    try {
      const { data, error } = await supabase.rpc("submit_match_feedback", {
        class_id: state.classId,
        choice,
      });
      if (error) throw error;
      const nextData = (data ?? { ...state.data, feedback_after_week: choice }) as ResultData;
      setState((current) =>
        current.status === "ready" ? { ...current, data: nextData } : current,
      );
    } catch (err) {
      console.error("Failed to save match feedback:", err);
      setFeedbackError("Feedback could not be saved. Please try again.");
    } finally {
      setFeedbackBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 sm:px-6 md:px-12 py-5 border-b border-border/60 bg-background sticky top-0 z-50">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary grid place-items-center text-primary-foreground font-display text-sm">
            S
          </div>
          <span className="font-display text-lg">Synco</span>
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]"
        >
          <aside className="space-y-6 lg:self-start">
            <ProfileOverview
              name={state.name}
              className={state.className}
              data={d}
              partial={partial}
            />
            <WorkStyleSection meters={d.meters} />
          </aside>

          <div className="space-y-6">
            <TeamProfilePanel
              assignedTeam={assignedTeam}
              assignedTeamSummary={assignedTeamSummary}
              isUnmatchedFromTeams={isUnmatchedFromTeams}
              userId={user?.id}
              readiness={readiness}
              teamSize={assignmentSnapshot?.team_size}
            />

            {!assignedTeam && <SuggestedTeamPanel readiness={readiness} />}

            <ComparePanel peers={comparisonPeers} />

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <SectionHeader
                eyebrow="Best collaborators"
                title="People you should consider working with"
                description="These are not just high scores. Synco looks for practical fit: meeting time, effort level, thinking style, and skills that fill your gaps."
              />
              {displayMatches.length > 0 ? (
                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  {displayMatches.map((peer) => (
                    <MatchProfileCard key={peer.student_id} peer={peer} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-border bg-background/35 p-8 text-center text-sm text-muted-foreground">
                  No strong collaborator matches are available yet.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <SectionHeader
                eyebrow="Watch-outs"
                title="Pairs to think twice about"
                description="This list exists so group work does not become awkward later. It points out where the data says you would need a strict plan before choosing that person."
                tone="warning"
              />
              {meaningfulAvoid.length > 0 ? (
                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  {meaningfulAvoid.map((peer) => (
                    <WatchProfileCard key={peer.student_id} peer={peer} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-border bg-background/35 p-8 text-center text-sm text-muted-foreground">
                  No major watch-outs showed up in your current result.
                </div>
              )}
            </section>

            <FeedbackPanel
              data={d}
              feedbackBusy={feedbackBusy}
              feedbackError={feedbackError}
              onFeedback={sendFeedback}
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function fallbackReadiness(d: ResultData) {
  const matches = d.matches || [];
  const suggestedGroup = matches.slice(0, 3).map((match) => ({
    name: match.name,
    archetype: match.archetype,
    score: match.score,
  }));
  const agreements = Array.from(new Set(matches.flatMap((match) => match.agree || []))).slice(0, 3);

  return {
    suggestedGroup,
    why: matches[0]?.why ?? "Not enough completed surveys to explain a strong working group yet.",
    friction:
      d.avoid?.[0]?.watch ??
      "Even strong matches should agree on expectations before starting real work.",
    agenda: [
      "Share availability and preferred communication channel.",
      `Agree on ${agreements[0] ?? "check-in cadence"} before assigning tasks.`,
      "Name one backup owner for deadlines so work doesn't silently stall.",
      "Schedule a 15-minute reset after the first milestone.",
    ],
    roles: [
      roleSuggestion(d.archetype),
      ...suggestedGroup.slice(0, 2).map((member) => roleSuggestion(member.archetype, member.name)),
    ],
    disclaimer:
      "Use this as a practical starting point. A good team still needs a first conversation, clear roles, and instructor judgment.",
  };
}

function roleSuggestion(archetype: string, name = "You") {
  const role =
    archetype === "Reliable Finisher"
      ? "deadline owner"
      : archetype === "Fast Starter"
        ? "first-draft driver"
        : archetype === "Concept Explainer"
          ? "concept checker"
          : archetype === "Steady Organizer"
            ? "task planner"
            : archetype === "Deep Thinker"
              ? "quality reviewer"
              : archetype === "Flexible Collaborator"
                ? "handoff coordinator"
                : "flex support";
  return `${name}: ${role}`;
}

function ResultsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-8 space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Sidebar list skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-xl border border-border p-5 space-y-4 bg-card/45">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-5/6 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expanded detail placeholder */}
        <div className="rounded-2xl border border-border p-6 space-y-6 bg-card/25">
          <div className="flex justify-between items-start border-b border-border pb-6">
            <div className="space-y-3">
              <Skeleton className="h-7 w-48 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-40 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
