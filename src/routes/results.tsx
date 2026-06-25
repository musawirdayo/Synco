import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { archetypeBlurb } from "@/lib/synco";
import type { MatchBreakdown } from "@/lib/synco";
import { Users, Activity, Info, AlertCircle } from "lucide-react";
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

/* ─── Component: Score ring ─── */
function ScoreRing({ score, isWarning }: { score: number; isWarning?: boolean }) {
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
          Match
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
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-5 bg-background/30 p-2.5 rounded-xl border border-border/20">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-lg bg-card/45 p-2 border border-border/10 flex flex-col justify-between"
        >
          <div className="mb-1 flex items-center justify-between gap-1 text-[10px] text-muted-foreground font-semibold">
            <span className="truncate">{row.label}</span>
            <span className="font-mono text-foreground font-bold shrink-0">{row.value}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
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

/* ─── Component: Peer detail panel ─── */
function PeerDetail({
  peer,
  ownArchetype,
}: {
  peer: (Match | Avoid) & { isAvoid: boolean };
  ownArchetype: string;
}) {
  const isAvoid = peer.isAvoid;
  const breakdown = peer.breakdown;

  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-5 border-b border-border/40">
        <div className="text-center sm:text-left">
          <span
            className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
              isAvoid
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-accent/10 text-accent border border-accent/20"
            }`}
          >
            {isAvoid ? "Needs careful alignment" : "Strong match"}
          </span>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{peer.name}</h3>
          <div className="mt-1 flex flex-wrap gap-2 justify-center sm:justify-start items-center">
            <span className="text-xs text-muted-foreground">
              Work style: <span className="font-semibold text-foreground">{peer.archetype}</span>
            </span>
            {ownArchetype === peer.archetype && (
              <>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-xs text-accent font-medium">Same style as you</span>
              </>
            )}
          </div>
        </div>
        <ScoreRing score={peer.score} isWarning={isAvoid} />
      </div>

      {/* Why this fit / Why this is hard */}
      <div className="space-y-3">
        <div className="bg-card/50 rounded-xl p-4 border border-border/40">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
            {isAvoid ? "Why this might be hard" : "Why you'd work well together"}
          </h4>
          <p className="text-sm leading-relaxed text-foreground">{peer.why}</p>
        </div>

        {((isAvoid && "riskProofs" in peer && peer.riskProofs?.length) ||
          (!isAvoid && "proofs" in peer && peer.proofs?.length)) && (
          <div
            className={`rounded-xl p-4 border ${
              isAvoid
                ? "bg-destructive/[0.025] border-destructive/15"
                : "bg-accent/[0.035] border-accent/15"
            }`}
          >
            <h4
              className={`text-xs uppercase tracking-wider font-bold mb-2 ${
                isAvoid ? "text-destructive" : "text-accent"
              }`}
            >
              {isAvoid ? "Proof signals" : "Proof signals"}
            </h4>
            <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              {(isAvoid && "riskProofs" in peer
                ? peer.riskProofs
                : "proofs" in peer
                  ? peer.proofs
                  : []
              )
                ?.slice(0, 4)
                .map((proof) => (
                  <li key={proof} className="flex gap-2">
                    <span
                      className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 ${
                        isAvoid ? "bg-destructive" : "bg-accent"
                      }`}
                    />
                    <span>{proof}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {"watch" in peer && peer.watch && (
          <div className="text-sm leading-relaxed text-destructive/90 bg-destructive/[0.02] rounded-xl p-3.5 border border-destructive/15 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <strong className="text-destructive font-semibold">Watch out:</strong> {peer.watch}
            </div>
          </div>
        )}

        {"brings" in peer && peer.brings && (
          <div className="bg-card/50 rounded-xl p-4 border border-border/40">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
              What they bring
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">{peer.brings}</p>
          </div>
        )}
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="pt-4 border-t border-border/40">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-accent shrink-0" />
            Compatibility Breakdown
          </h4>
          <BreakdownBars breakdown={breakdown} />
        </div>
      )}

      {/* Next steps */}
      <div className="pt-4 border-t border-border/40 space-y-3 text-sm">
        {"agree" in peer && peer.agree && peer.agree.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <strong className="text-foreground text-xs mr-1">Discuss first:</strong>
            {peer.agree.map((item) => (
              <span
                key={item}
                className="px-2 py-0.5 rounded-full bg-[color:var(--color-accent-light)] text-[11px] font-semibold border border-accent/15"
              >
                {item}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-2 border-t border-border/20">
          <strong className="font-semibold text-foreground/80">Getting started:</strong> {peer.move}
        </p>
      </div>
    </div>
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

  const [activeTab, setActiveTab] = useState<"details" | "list">("details");
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    const matches = state.data?.matches || [];
    if (matches.length > 0 && !selectedPeerId) {
      setSelectedPeerId(matches[0].student_id);
    }
  }, [state.data, selectedPeerId]);

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

  const allPeers = [
    ...(d.matches || []).map((m) => ({ ...m, isAvoid: false })),
    ...(d.avoid || []).map((a) => ({ ...a, isAvoid: true })),
  ];
  const orderedAvoid = (d.avoid || [])
    .map((peer, index) => ({ peer, index }))
    .sort((left, right) => {
      if (left.peer.friendFlagged !== right.peer.friendFlagged) {
        return left.peer.friendFlagged ? -1 : 1;
      }
      return left.index - right.index;
    })
    .map(({ peer }) => peer);
  const assignedTeam = state.assignedTeam ?? null;
  const assignmentSnapshot = state.assignmentSnapshot ?? null;
  const isUnmatchedFromTeams =
    Boolean(user) && studentIsUnmatched(assignmentSnapshot, user?.id ?? "");

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

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {/* Profile header */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center sm:text-left"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start mb-3">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {state.name || "Your results"}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-xs font-semibold text-accent">
              {d.archetype}
            </span>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
            {archetypeBlurb[d.archetype]}
          </p>

          {partial && (
            <div className="mt-4 p-3 rounded-xl border border-accent/10 bg-accent/[0.02] text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-2 max-w-xl">
              <Info className="h-4 w-4 text-accent shrink-0" />
              <span>
                Includes {d.submitted_count} of {d.expected_count} responses.{" "}
                {d.expected_count - d.submitted_count} classmates are still pending.
              </span>
            </div>
          )}
        </motion.section>

        {assignmentSnapshot && (
          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Headline result
                </span>
                <h2 className="mt-1 text-2xl font-display font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Your Team
                </h2>
              </div>
            </div>
            {assignedTeam ? (
              <>
                <p className="text-sm text-muted-foreground mb-5">
                  Team {Number(assignedTeam.id.replace("team-", "")) || ""} ·{" "}
                  {assignedTeam.members.length} member
                  {assignedTeam.members.length === 1 ? "" : "s"} · {assignedTeam.average_score}%
                  average compatibility
                </p>
                {assignedTeam.teammates.length > 0 && (
                  <p className="mb-5 rounded-xl border border-accent/20 bg-accent/[0.04] p-4 text-sm text-muted-foreground">
                    Your teammate{assignedTeam.teammates.length === 1 ? "" : "s"}:{" "}
                    <span className="font-semibold text-foreground">
                      {assignedTeam.teammates.map((member) => member.name).join(", ")}
                    </span>
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 mb-5">
                  {assignedTeam.members.map((member) => {
                    const isSelf = member.student_id === user?.id;
                    return (
                      <div
                        key={member.student_id}
                        className="rounded-xl border border-border/60 bg-background/50 p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-base text-foreground">
                              {isSelf ? "You" : member.name}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {member.archetype}
                            </div>
                          </div>
                          {isSelf && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-xl border border-border/40 bg-background/40 p-5">
                  <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-2">
                    Why this team
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {assignedTeam.rationale}
                  </p>
                </div>
                {assignedTeam.quality && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Team quality", assignedTeam.quality.score, "overall balance"],
                      ["Pair safety", assignedTeam.quality.minPairSafety, "no weak hidden pair"],
                      ["Skill coverage", assignedTeam.quality.skillCoverage, "gaps covered"],
                      ["Role balance", assignedTeam.quality.roleCoverage, "different work roles"],
                    ].map(([label, value, helper]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-border/40 bg-background/45 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {label}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
                          </div>
                          <span className="font-display text-2xl font-bold text-accent">
                            {value}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {(assignedTeam.quality.rolesCovered.length > 0 ||
                      assignedTeam.quality.weakAreasCovered.length > 0) && (
                      <div className="sm:col-span-2 rounded-xl border border-accent/15 bg-accent/[0.035] p-4 text-sm text-muted-foreground">
                        {assignedTeam.quality.rolesCovered.length > 0 && (
                          <p>
                            <strong className="text-foreground">Role mix:</strong>{" "}
                            {assignedTeam.quality.rolesCovered.join(", ")}.
                          </p>
                        )}
                        {assignedTeam.quality.weakAreasCovered.length > 0 && (
                          <p className="mt-2">
                            <strong className="text-foreground">Coverage proof:</strong>{" "}
                            {assignedTeam.quality.weakAreasCovered.slice(0, 3).join(", ")}.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isUnmatchedFromTeams
                  ? "You were included in published results, but Synco could not place you into a team without breaking hard constraints or team size limits."
                  : "Your class lead has not published a team assignment for you yet."}
              </p>
            )}
          </section>
        )}

        {/* Suggested team */}
        {readiness.suggestedGroup.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-display font-semibold tracking-tight text-foreground flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-accent" />
              Suggested Team
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Based on your survey, these peers have the strongest compatibility for forming a
              working group.
            </p>

            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              {readiness.suggestedGroup.map((member) => (
                <div
                  key={member.name}
                  className="rounded-xl border border-border/60 bg-background/50 p-5 hover:border-accent/40 transition-colors"
                >
                  <div className="font-semibold text-base text-foreground">{member.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{member.archetype}</div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-3">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Score
                    </span>
                    <span className="font-mono text-xs font-bold text-accent">
                      {member.score}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-5 md:grid-cols-2 bg-background/40 border border-border/40 rounded-xl p-5">
              <div>
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-2">
                  Why this works
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{readiness.why}</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-2">
                  What to watch
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {readiness.friction}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-3">
                  First meeting agenda
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {readiness.agenda.map((item, idx) => (
                    <div key={item} className="flex gap-2.5 items-start">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-mono text-[10px] font-bold text-accent">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              {readiness.roles.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-3">
                    Suggested roles
                  </h3>
                  <div className="space-y-2">
                    {readiness.roles.map((role) => {
                      const parts = role.split(":");
                      const name = parts[0] || "You";
                      const suggestion = parts[1] || "Flex Support";
                      return (
                        <div
                          key={role}
                          className="flex items-center justify-between rounded-xl bg-background/60 border border-border/40 px-4 py-3 text-sm"
                        >
                          <span className="font-semibold text-foreground">{name}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary capitalize">
                            {suggestion.trim()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-5 text-xs text-muted-foreground/80 italic text-center md:text-left border-t border-border/30 pt-4">
              {readiness.disclaimer}
            </p>
          </section>
        )}

        {/* Work style */}
        <WorkStyleSection meters={d.meters} />

        {/* Match details */}
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5 mb-6">
            <div>
              <h2 className="text-2xl font-display font-semibold tracking-tight text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Your Matches
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Explore each match to understand why you were paired and what to do first.
              </p>
            </div>

            <div className="flex p-1 bg-muted/80 rounded-xl border border-border/60 max-w-xs self-start md:self-auto">
              {(
                [
                  { id: "details", label: "Detail View" },
                  { id: "list", label: "Overview" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-4 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-card text-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid md:grid-cols-[240px_1fr] gap-5"
              >
                {/* Peer selector */}
                <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2.5 mb-1">
                    Select a classmate
                  </span>
                  {allPeers.map((peer) => (
                    <button
                      key={peer.student_id}
                      type="button"
                      onClick={() => setSelectedPeerId(peer.student_id)}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all duration-200 flex items-start justify-between gap-3 ${
                        selectedPeerId === peer.student_id
                          ? "bg-background border-accent shadow-sm"
                          : peer.isAvoid
                            ? "bg-card/40 hover:bg-card/70 border-destructive/15 hover:border-destructive/30"
                            : "bg-card/40 hover:bg-card/70 border-border/50 hover:border-border"
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold truncate flex items-center gap-1.5 text-foreground/90">
                          {peer.name}
                          {peer.isAvoid && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0"
                              title="Low compatibility"
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {peer.archetype}
                        </div>
                      </div>
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                          peer.isAvoid
                            ? "text-destructive bg-destructive/10 border border-destructive/15"
                            : "text-accent bg-accent/10 border border-accent/15"
                        }`}
                      >
                        {peer.score}%
                      </span>
                    </button>
                  ))}
                </div>

                {/* Detail panel */}
                {(() => {
                  const activePeer = allPeers.find((p) => p.student_id === selectedPeerId);
                  if (!activePeer) {
                    return (
                      <div className="rounded-xl border border-dashed border-border/60 bg-background/25 flex items-center justify-center p-12 text-center text-muted-foreground">
                        <p className="text-sm">Select a classmate to view match details.</p>
                      </div>
                    );
                  }
                  return <PeerDetail peer={activePeer} ownArchetype={d.archetype} />;
                })()}
              </motion.div>
            )}

            {activeTab === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Top matches */}
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-semibold tracking-tight text-foreground">
                    Top {(d.matches || []).length} matches
                  </h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    {(d.matches || []).map((peer) => (
                      <div
                        key={peer.student_id}
                        className="rounded-xl border border-border/50 bg-card/45 p-5 hover:border-accent/40 transition-colors flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/20">
                            <div>
                              <h4 className="font-semibold text-lg text-foreground">{peer.name}</h4>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent uppercase tracking-wider">
                                {peer.archetype}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-display text-2xl font-extrabold text-accent">
                                {peer.score}%
                              </span>
                              <div className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                                match
                              </div>
                            </div>
                          </div>

                          {peer.breakdown && <BreakdownBars breakdown={peer.breakdown} />}

                          <div className="text-xs leading-relaxed space-y-2">
                            <p className="text-muted-foreground">
                              <strong className="text-foreground/80 text-[10px] block mb-0.5">
                                Why:
                              </strong>{" "}
                              {peer.why}
                            </p>
                            <p className="text-muted-foreground">
                              <strong className="text-foreground/80 text-[10px] block mb-0.5">
                                What they bring:
                              </strong>{" "}
                              {peer.brings}
                            </p>
                            {peer.proofs && peer.proofs.length > 0 && (
                              <div className="rounded-lg border border-accent/15 bg-accent/[0.035] p-3">
                                <strong className="text-accent text-[10px] uppercase tracking-wider block mb-1.5">
                                  Proof
                                </strong>
                                <ul className="space-y-1 text-muted-foreground">
                                  {peer.proofs.slice(0, 3).map((proof) => (
                                    <li key={proof} className="flex gap-2">
                                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                                      <span>{proof}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPeerId(peer.student_id);
                            setActiveTab("details");
                          }}
                          className="mt-4 w-full h-9 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent text-accent hover:text-accent-foreground text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          View details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pairs to watch */}
                {orderedAvoid.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-border/40">
                    <div>
                      <h3 className="text-lg font-display font-semibold tracking-tight text-destructive/90 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        Pairs to watch
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        Not bad fits — just areas where you'd need to align on expectations early.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {orderedAvoid.map((peer) => (
                        <div
                          key={peer.student_id}
                          className={
                            "rounded-xl border p-5 transition-colors flex flex-col justify-between " +
                            (peer.friendFlagged
                              ? "border-amber-500/40 bg-amber-500/[0.04] hover:border-amber-500/60"
                              : "border-destructive/20 bg-destructive/[0.01] hover:border-destructive/40")
                          }
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/20">
                              <div>
                                {peer.friendFlagged && (
                                  <span className="mb-2 inline-block px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                    Friend flagged
                                  </span>
                                )}
                                <h4 className="font-semibold text-lg text-foreground">
                                  {peer.name}
                                </h4>
                                <span
                                  className={
                                    "inline-block mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider " +
                                    (peer.friendFlagged
                                      ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                                      : "bg-destructive/10 border-destructive/20 text-destructive")
                                  }
                                >
                                  {peer.archetype}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-display text-2xl font-extrabold text-destructive">
                                  {peer.score}%
                                </span>
                              </div>
                            </div>

                            {peer.breakdown && <BreakdownBars breakdown={peer.breakdown} />}

                            <div className="text-xs leading-relaxed space-y-2">
                              <p className="text-muted-foreground">
                                <strong className="text-foreground/80 text-[10px] block mb-0.5">
                                  Why this is hard:
                                </strong>{" "}
                                {peer.why}
                              </p>
                              {peer.friendRisk ? (
                                <div className="text-amber-900 dark:text-amber-100 bg-amber-500/[0.08] border border-amber-500/20 rounded-lg p-3">
                                  <strong className="text-amber-700 dark:text-amber-300 text-[10px] block mb-0.5">
                                    Friend risk:
                                  </strong>{" "}
                                  {peer.friendRisk}
                                </div>
                              ) : (
                                <div className="text-destructive/90 bg-destructive/[0.02] border border-destructive/10 rounded-lg p-3">
                                  <strong className="text-destructive text-[10px] block mb-0.5">
                                    Watch out:
                                  </strong>{" "}
                                  {peer.watch}
                                </div>
                              )}
                              {peer.riskProofs && peer.riskProofs.length > 0 && (
                                <div className="rounded-lg border border-destructive/10 bg-background/35 p-3">
                                  <strong className="text-destructive text-[10px] uppercase tracking-wider block mb-1.5">
                                    Proof
                                  </strong>
                                  <ul className="space-y-1 text-muted-foreground">
                                    {peer.riskProofs.slice(0, 3).map((proof) => (
                                      <li key={proof} className="flex gap-2">
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                                        <span>{proof}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPeerId(peer.student_id);
                              setActiveTab("details");
                            }}
                            className="mt-4 w-full h-9 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive text-destructive hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                          >
                            View details
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Feedback */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-medium mb-2">After the first week</h2>
          <p className="text-sm text-muted mb-5">
            Once you've met your match, mark whether the pairing was useful. If it's not working,
            ask your class lead to republish or override.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {["Useful", "Unsure", "Not useful"].map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => sendFeedback(choice)}
                disabled={feedbackBusy}
                className={
                  "h-10 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-60 " +
                  (d.feedback_after_week === choice
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted")
                }
              >
                {choice}
              </button>
            ))}
          </div>
          {d.feedback_after_week && (
            <p className="mt-3 text-xs text-muted">
              Saved: {d.feedback_after_week}. This helps the lead decide on rematch adjustments.
            </p>
          )}
          {feedbackError && <p className="mt-3 text-xs text-destructive">{feedbackError}</p>}
        </section>
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
