import { createFileRoute, useParams, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileText,
  Mail,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  archetype,
  workStyleMeters,
  pairInsight,
  pairFrictionInsight,
  confidence,
  matchBreakdown,
  pairBlocked,
  formTeams,
  friendRiskInsight,
  isFlaggedFriend,
  matchProofs,
  pairIsRisky,
  pairRiskScore,
  riskProofs,
  type Answers,
  type MatchBreakdown,
  type MatchStudent,
} from "@/lib/synco";
import { copyText } from "@/lib/clipboard";
import { normalizeStudentIdentifier } from "@/lib/class-flow";
import {
  buildRiskPairs,
  publicPeerName,
  publicPeerIdentifier,
  publicInsightForPeer,
  publicFrictionForPeer,
  buildReadinessCard,
  downloadCsv,
  slug,
  escapeHtml,
} from "@/lib/class-helpers";
import {
  buildTeamAssignmentSnapshot,
  teamAssignmentForStudent,
  type TeamAssignmentSnapshot,
} from "@/lib/team-assignments";

import { RouteErrorFallback } from "@/components/route-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

export const Route = createFileRoute("/class/$id")({
  component: ClassPage,
  errorComponent: RouteErrorFallback,
});

type Member = { student_id: string; display_name: string; identifier: string | null };
type Resp = {
  student_id: string;
  answers: Answers;
  completed: boolean;
  submitted_at: string | null;
};
type RosterEntry = { identifier: string; claimed_by: string | null };
type ResultMeta = { version: number; generatedAt: string | null; included: number };
type RankedPeer = {
  student_id: string;
  name: string;
  publicName: string;
  archetype: string;
  score: number;
  breakdown: MatchBreakdown;
  insight: ReturnType<typeof pairInsight>;
  friction: ReturnType<typeof pairFrictionInsight>;
  friendFlagged: boolean;
  friendRisk: string | null;
  proofs: string[];
  riskProofs: string[];
  riskScore: number;
  isRisky: boolean;
  answers: Answers;
  identifier: string | null;
};

function splitPeerLists(ranked: RankedPeer[], assignedTeammateIds: Set<string>) {
  const maxPerList = 5;
  const watchTarget = ranked.length <= 1 ? 0 : Math.min(maxPerList, Math.floor(ranked.length / 2));
  const selectedWatch = new Map<string, RankedPeer>();
  const watchEligible = ranked.filter((peer) => !assignedTeammateIds.has(peer.student_id));

  const hardRisks = watchEligible
    .filter((peer) => peer.isRisky || Boolean(peer.friendRisk))
    .sort((left, right) => {
      if (left.friendFlagged !== right.friendFlagged) return left.friendFlagged ? -1 : 1;
      if (left.riskScore !== right.riskScore) return right.riskScore - left.riskScore;
      return left.score - right.score;
    });

  for (const peer of hardRisks) {
    if (selectedWatch.size >= watchTarget) break;
    selectedWatch.set(peer.student_id, peer);
  }

  const softWatch = [...watchEligible]
    .filter((peer) => !selectedWatch.has(peer.student_id))
    .sort((left, right) => {
      if (left.score !== right.score) return left.score - right.score;
      return right.riskScore - left.riskScore;
    });

  for (const peer of softWatch) {
    if (selectedWatch.size >= watchTarget) break;
    selectedWatch.set(peer.student_id, peer);
  }

  const watchIds = new Set(selectedWatch.keys());
  return {
    matches: ranked.filter((peer) => !watchIds.has(peer.student_id)).slice(0, maxPerList),
    avoid: [...selectedWatch.values()]
      .sort((left, right) => {
        if (left.friendFlagged !== right.friendFlagged) return left.friendFlagged ? -1 : 1;
        if (left.riskScore !== right.riskScore) return right.riskScore - left.riskScore;
        return left.score - right.score;
      })
      .slice(0, maxPerList),
  };
}
type PublishedResultData = {
  results_version?: number;
  generated_at?: string;
  submitted_count?: number;
};
type ClassRow = {
  name: string;
  expected_count: number;
  invite_code: string;
  is_published: boolean;
  roster_lock_enabled: boolean;
  team_size: number;
  team_assignments: TeamAssignmentSnapshot | null;
};

function ClassPage() {
  const { id } = useParams({ from: "/class/$id" });
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [responses, setResponses] = useState<Resp[]>([]);
  const [rosterEntries, setRosterEntries] = useState<RosterEntry[]>([]);
  const [resultMeta, setResultMeta] = useState<ResultMeta>({
    version: 0,
    generatedAt: null,
    included: 0,
  });
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"invite" | "reminder" | null>(null);
  const [deletingSurveyId, setDeletingSurveyId] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<{ tone: "info" | "error"; text: string } | null>(
    null,
  );
  const [loadError, setLoadError] = useState("");
  const [feedbackByStudent, setFeedbackByStudent] = useState<Record<string, string>>({});
  const { confirm, confirmationDialog } = useConfirmDialog();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    try {
      setLoadError("");
      const { data: c, error: classError } = await supabase
        .from("classes")
        .select(
          "name,expected_count,invite_code,is_published,roster_lock_enabled,team_size,team_assignments",
        )
        .eq("id", id)
        .single();
      if (classError) throw classError;
      if (c) setCls(c as ClassRow);

      const { data: m, error: membersError } = await supabase
        .from("class_members")
        .select("student_id,display_name,identifier")
        .eq("class_id", id);
      if (membersError) throw membersError;
      const memberRows = m ?? [];
      setMembers(memberRows);

      const { data: r, error: responsesError } = await supabase
        .from("survey_responses")
        .select("student_id,answers,completed,submitted_at")
        .eq("class_id", id);
      if (responsesError) throw responsesError;
      const memberIds = new Set(memberRows.map((member) => member.student_id));
      setResponses(((r ?? []) as Resp[]).filter((resp) => memberIds.has(resp.student_id)));

      const { data: roster, error: rosterError } = await supabase
        .from("roster_entries")
        .select("identifier,claimed_by")
        .eq("class_id", id);
      if (rosterError) throw rosterError;
      setRosterEntries(roster ?? []);

      const { data: resultRows, error: resultsError } = await supabase
        .from("match_results")
        .select("student_id,result_data,generated_at")
        .eq("class_id", id);
      if (resultsError) throw resultsError;

      const first = resultRows?.[0];
      const resultData = first?.result_data as PublishedResultData | undefined;
      const feedbackRows = (resultRows ?? []).reduce<Record<string, string>>((acc, row) => {
        const rowData = row.result_data as { feedback_after_week?: unknown } | null;
        if (typeof rowData?.feedback_after_week === "string") {
          acc[row.student_id] = rowData.feedback_after_week;
        }
        return acc;
      }, {});
      setFeedbackByStudent(feedbackRows);
      setResultMeta({
        version: resultData?.results_version ?? 0,
        generatedAt: resultData?.generated_at ?? first?.generated_at ?? null,
        included: resultData?.submitted_count ?? resultRows?.length ?? 0,
      });
    } catch (err) {
      console.error("Failed to load class:", err);
      setLoadError("Class data could not be loaded. Check your connection and try again.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!cls && loadError) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {loadError}
        </div>
      </div>
    );
  }

  if (!cls) return <ClassSkeleton />;

  const submitted = responses.filter((r) => r.completed).length;
  const completed = responses.filter((r) => r.completed);
  const missingTotal = Math.max(cls.expected_count - submitted, 0);
  const coverage = cls.expected_count ? submitted / cls.expected_count : 0;
  const pct = Math.round(coverage * 100);
  const confidenceLabel = confidence(coverage);
  const statusColor =
    coverage >= 0.8
      ? "text-[color:var(--color-success)]"
      : coverage >= 0.5
        ? "text-accent"
        : "text-destructive";

  const filtered = members.filter(
    (m) =>
      m.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.identifier ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  const respByStudent = new Map(responses.map((r) => [r.student_id, r]));
  const identifierCounts = members.reduce((counts, member) => {
    if (!respByStudent.get(member.student_id)?.completed) return counts;
    const normalized = normalizeStudentIdentifier(member.identifier ?? "");
    if (!normalized) return counts;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const duplicateIdentifiers = Array.from(identifierCounts)
    .filter(([, count]) => count > 1)
    .map(([identifier]) => identifier);
  const hasIdentityConflicts = duplicateIdentifiers.length > 0;
  const memberByStudent = new Map(members.map((member) => [member.student_id, member]));
  const nameOf = (sid: string) =>
    members.find((m) => m.student_id === sid)?.display_name ?? "Classmate";
  const missingJoined = members.filter((m) => !respByStudent.get(m.student_id)?.completed);
  const unclaimedRoster = cls.roster_lock_enabled
    ? rosterEntries.filter((entry) => !entry.claimed_by)
    : [];
  const expectedGap = Math.max(cls.expected_count - members.length, 0);
  const resultGeneratedAt = resultMeta.generatedAt ? new Date(resultMeta.generatedAt) : null;
  const lateSubmissions = resultGeneratedAt
    ? completed.filter((r) => r.submitted_at && new Date(r.submitted_at) > resultGeneratedAt).length
    : 0;
  const resultIncluded = resultMeta.included || submitted;
  const feedbackValues = Object.values(feedbackByStudent);
  const feedbackSummary = feedbackValues.length
    ? ["Useful", "Unsure", "Not useful"]
        .map((choice) => {
          const count = feedbackValues.filter((value) => value === choice).length;
          return count ? `${choice}: ${count}` : "";
        })
        .filter(Boolean)
        .join(" · ")
    : "No student feedback yet";
  const nextVersion = Math.max(1, resultMeta.version + 1);
  const canGenerate = submitted >= 2 && !hasIdentityConflicts;
  const publishVerb = cls.is_published ? "Republish" : "Publish";
  const riskPairs = buildRiskPairs(completed, members).slice(0, 3);
  const publishOutcome = cls.is_published
    ? `Republishing will create version ${nextVersion}, refresh every completed student's matches, and include ${submitted} submitted students.`
    : `Publishing will create version ${nextVersion}, include ${submitted} submitted students, and make student result pages visible.`;
  const missingSummary =
    missingJoined.length || unclaimedRoster.length || expectedGap
      ? [
          missingJoined.length ? `${missingJoined.length} joined but not submitted` : "",
          unclaimedRoster.length ? `${unclaimedRoster.length} roster slots not claimed` : "",
          expectedGap && !cls.roster_lock_enabled ? `${expectedGap} expected seats not joined` : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "No obvious missing students.";

  function rankedPeersFor(self: Resp): RankedPeer[] {
    const selfMember = memberByStudent.get(self.student_id);
    const selfCandidate = {
      id: self.student_id,
      answers: self.answers,
      name: selfMember?.display_name ?? nameOf(self.student_id),
      identifier: selfMember?.identifier ?? null,
    };
    return completed
      .filter((o) => o.student_id !== self.student_id)
      .filter((o) => {
        const otherMember = memberByStudent.get(o.student_id);
        return !pairBlocked(selfCandidate, {
          id: o.student_id,
          answers: o.answers,
          name: otherMember?.display_name ?? nameOf(o.student_id),
          identifier: otherMember?.identifier ?? null,
        });
      })
      .map((o) => {
        const otherMember = memberByStudent.get(o.student_id);
        const actualName = otherMember?.display_name ?? nameOf(o.student_id);
        const otherCandidate = {
          id: o.student_id,
          answers: o.answers,
          name: actualName,
          identifier: otherMember?.identifier ?? null,
        };
        const breakdown = matchBreakdown(self.answers, o.answers);
        const riskScore = pairRiskScore(self.answers, o.answers);
        return {
          student_id: o.student_id,
          name: actualName,
          publicName: actualName,
          archetype: archetype(o.answers),
          score: breakdown.final,
          breakdown,
          insight: pairInsight(self.answers, o.answers),
          friction: pairFrictionInsight(self.answers, o.answers),
          friendFlagged: isFlaggedFriend(selfCandidate, otherCandidate),
          friendRisk: friendRiskInsight(selfCandidate, otherCandidate),
          proofs: matchProofs(self.answers, o.answers),
          riskProofs: riskProofs(self.answers, o.answers),
          riskScore,
          isRisky: pairIsRisky(self.answers, o.answers),
          answers: o.answers,
          identifier: otherMember?.identifier ?? null,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((peer, index) => ({
        ...peer,
        publicName: publicPeerName(peer.answers, peer.name, index),
      }));
  }

  async function publish() {
    if (!cls || hasIdentityConflicts) return;
    setBusy(true);
    setPageNotice(null);
    try {
      const generatedAt = new Date().toISOString();
      const teamStudents: Array<
        MatchStudent & { name: string; archetype: string; identifier: string | null }
      > = completed.map((response) => {
        const member = memberByStudent.get(response.student_id);
        const name = member?.display_name ?? nameOf(response.student_id);
        return {
          id: response.student_id,
          answers: response.answers,
          name,
          archetype: archetype(response.answers),
          identifier: member?.identifier ?? null,
        };
      });
      const teamPlan = formTeams(teamStudents, cls.team_size);
      const teamAssignments = buildTeamAssignmentSnapshot({
        plan: teamPlan,
        students: teamStudents,
        teamSize: cls.team_size,
        version: nextVersion,
        generatedAt,
      });
      const rows = completed.map((self) => {
        const ranked = rankedPeersFor(self);
        const assignedTeam = teamAssignmentForStudent(teamAssignments, self.student_id);
        const assignedTeammateIds = new Set(
          assignedTeam?.teammates.map((teammate) => teammate.student_id) ?? [],
        );
        const peerLists = splitPeerLists(ranked, assignedTeammateIds);
        const comparisonPeers = ranked.map((peer, index) => {
          const displayName = publicPeerName(peer.answers, peer.name, index);
          const safeFriendRisk =
            peer.friendRisk && displayName !== peer.name
              ? peer.friendRisk.replace(`flagged ${peer.name}`, `flagged ${displayName}`)
              : peer.friendRisk;
          const publicInsight = publicInsightForPeer(peer.answers, peer.insight);
          const publicFriction = publicFrictionForPeer(peer.answers, peer.friction);

          return {
            student_id: peer.student_id,
            name: displayName,
            identifier: publicPeerIdentifier(peer.answers, peer.identifier),
            archetype: peer.archetype,
            score: peer.score,
            assigned: assignedTeammateIds.has(peer.student_id),
            confidence: peer.breakdown.confidence,
            breakdown: peer.breakdown,
            proofs:
              publicInsight.why === peer.insight.why
                ? peer.proofs
                : [
                    "Private details are hidden by this classmate's visibility choice.",
                    "Synco still checked schedule, working fit, and project goals.",
                  ],
            riskProofs:
              publicFriction.why === peer.friction.why
                ? peer.riskProofs
                : [
                    "Private details are hidden by this classmate's visibility choice.",
                    "Ask the lead before assuming the exact reason this pairing needs care.",
                  ],
            riskScore: peer.riskScore,
            isRisky: peer.isRisky,
            friendFlagged: peer.friendFlagged,
            friendRisk: safeFriendRisk,
            why: publicInsight.why,
            brings: publicInsight.brings,
            agree: publicInsight.agree,
            move: publicInsight.move,
            watch: publicFriction.watch,
            riskWhy: publicFriction.why,
          };
        });

        const matches = peerLists.matches.map(
          (
            {
              insight,
              friction: _f,
              friendFlagged: _ff,
              friendRisk: _fr,
              riskProofs: _rp,
              riskScore: _rs,
              isRisky: _ir,
              answers,
              identifier: _id,
              publicName: _p,
              ...rest
            },
            index,
          ) => ({
            ...rest,
            name: publicPeerName(answers, rest.name, index),
            assigned: assignedTeammateIds.has(rest.student_id),
            proofs:
              publicInsightForPeer(answers, insight).why === insight.why
                ? rest.proofs
                : [
                    "Private details are hidden by this classmate's visibility choice.",
                    "Synco still checked schedule, working fit, and project goals.",
                  ],
            ...publicInsightForPeer(answers, insight),
          }),
        );
        const avoid = peerLists.avoid.map(
          (
            {
              friction,
              friendRisk,
              insight: _i,
              proofs: _pfs,
              answers,
              identifier: _id,
              publicName: _p,
              ...rest
            },
            index,
          ) => {
            const displayName = publicPeerName(answers, rest.name, index);
            const safeFriendRisk =
              friendRisk && displayName !== rest.name
                ? friendRisk.replace(`flagged ${rest.name}`, `flagged ${displayName}`)
                : friendRisk;

            return {
              ...rest,
              name: displayName,
              friendRisk: safeFriendRisk,
              riskProofs:
                publicFrictionForPeer(answers, friction).why === friction.why
                  ? rest.riskProofs
                  : [
                      "Private details are hidden by this classmate's visibility choice.",
                      "Ask the lead before assuming the exact reason this pairing needs care.",
                    ],
              ...publicFrictionForPeer(answers, friction),
            };
          },
        );
        const baseReadiness = buildReadinessCard(archetype(self.answers), matches, avoid);
        const assignedSuggestedGroup =
          assignedTeam?.teammates.map((member) => {
            const rankedPeer = ranked.find((peer) => peer.student_id === member.student_id);
            return {
              name: member.name,
              archetype: member.archetype,
              score: rankedPeer?.score ?? 0,
            };
          }) ?? [];
        const readiness =
          assignedTeam && assignedSuggestedGroup.length
            ? {
                ...baseReadiness,
                suggestedGroup: assignedSuggestedGroup,
                why: assignedTeam.rationale,
                disclaimer:
                  "This is your assigned team from the class-level matching plan. Use the match and watch lists below for extra context.",
              }
            : baseReadiness;
        const assignedPartnerId =
          cls.team_size === 2 ? (assignedTeam?.teammates[0]?.student_id ?? null) : null;

        return {
          class_id: id,
          student_id: self.student_id,
          generated_at: generatedAt,
          result_data: {
            results_version: nextVersion,
            generated_at: generatedAt,
            archetype: archetype(self.answers),
            meters: workStyleMeters(self.answers),
            matches,
            avoid,
            comparisonPeers,
            readiness,
            assigned_partner_id: assignedPartnerId,
            assigned_team_id: assignedTeam?.id ?? null,
            matching_algorithm: teamAssignments.algorithm,
            matching_weights:
              "29% availability, 21% academic fit, 24% complementary skills, 16% study style, 10% goals, with a penalty for duplicate skills that do not cover weak areas",
            submitted_count: completed.length,
            expected_count: cls.expected_count,
          } as never,
        };
      });
      if (rows.length) {
        const { error: resultError } = await supabase
          .from("match_results")
          .upsert(rows, { onConflict: "class_id,student_id" });
        if (resultError) throw resultError;
      }
      const { error: publishError } = await supabase
        .from("classes")
        .update({ is_published: true, team_assignments: teamAssignments as never })
        .eq("id", id);
      if (publishError) throw publishError;
      setConfirming(false);
      await load();
    } catch (err) {
      console.error("Failed to publish results:", err);
      setPageNotice({
        tone: "error",
        text: "Results could not be published. Check permissions and try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    setPageNotice(null);
    try {
      const { error } = await supabase.from("classes").update({ is_published: false }).eq("id", id);
      if (error) throw error;
      await load();
    } catch (err) {
      console.error("Failed to unpublish results:", err);
      setPageNotice({
        tone: "error",
        text: "Results could not be unpublished. Check permissions and try again.",
      });
    }
  }

  async function deleteSurvey(member: Member) {
    const response = respByStudent.get(member.student_id);
    if (!response || deletingSurveyId) return;

    const confirmed = await confirm({
      title: `Delete ${member.display_name}'s survey?`,
      description:
        "This removes their submitted answers and published result. Republish afterward to refresh recommendations for the rest of the class.",
      confirmLabel: "Delete survey",
      destructive: true,
    });
    if (!confirmed) return;

    setDeletingSurveyId(member.student_id);
    setPageNotice(null);
    try {
      const { error: responseError } = await supabase
        .from("survey_responses")
        .delete()
        .eq("class_id", id)
        .eq("student_id", member.student_id);
      if (responseError) throw responseError;

      const { error: resultError } = await supabase
        .from("match_results")
        .delete()
        .eq("class_id", id)
        .eq("student_id", member.student_id);
      if (resultError) throw resultError;

      setPageNotice({
        tone: "info",
        text: `${member.display_name}'s survey was deleted. Republish results to remove stale recommendations from other students' views.`,
      });
      await load();
    } catch {
      setPageNotice({
        tone: "error",
        text: "The survey could not be deleted. Check permissions and try again.",
      });
    } finally {
      setDeletingSurveyId(null);
    }
  }

  async function deleteClass() {
    if (!cls || busy) return;

    const confirmed = await confirm({
      title: `Delete "${cls.name}"?`,
      description:
        "This permanently erases the class roster, all student survey responses, and all published results. This action cannot be undone.",
      confirmLabel: "Delete class",
      destructive: true,
    });
    if (!confirmed) return;

    setBusy(true);
    setPageNotice(null);
    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("Failed to delete class:", err);
      setPageNotice({
        tone: "error",
        text: "Failed to delete class. Please check your network and permissions.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!cls) return;
    const ok = await copyText(`${window.location.origin}/join/${cls.invite_code}`);
    if (ok) {
      setCopied("invite");
      setTimeout(() => setCopied((current) => (current === "invite" ? null : current)), 2000);
    }
  }

  async function copyReminder() {
    if (!cls) return;
    const reminder = [
      `Reminder: please complete the Synco survey for ${cls.name}.`,
      `Join or return here: ${window.location.origin}/join/${cls.invite_code}`,
      "It is a focused set of questions. Your answers help classmates get more useful matches, and raw answers stay private.",
    ].join("\n\n");
    const ok = await copyText(reminder);
    if (ok) {
      setCopied("reminder");
      setTimeout(() => setCopied((current) => (current === "reminder" ? null : current)), 2000);
    }
  }

  function exportRosterCsv() {
    if (!cls) return;
    const memberRows = members.map((member) => {
      const response = respByStudent.get(member.student_id);
      return {
        name: member.display_name,
        identifier: member.identifier ?? "",
        joined: "yes",
        submitted: response?.completed ? "yes" : "no",
        submitted_at: response?.submitted_at ?? "",
      };
    });
    const rosterOnlyRows = unclaimedRoster.map((entry) => ({
      name: "",
      identifier: entry.identifier,
      joined: "no",
      submitted: "no",
      submitted_at: "",
    }));
    downloadCsv(`${slug(cls.name)}-roster.csv`, [
      ["Name", "Identifier", "Joined", "Submitted", "Submitted at"],
      ...[...memberRows, ...rosterOnlyRows].map((row) => [
        row.name,
        row.identifier,
        row.joined,
        row.submitted,
        row.submitted_at,
      ]),
    ]);
  }

  function exportMatchResultsCsv() {
    if (!cls) return;
    const completedList = responses.filter((r) => r.completed);
    const rows = completedList.map((self) => {
      const selfName = nameOf(self.student_id);
      const selfArch = archetype(self.answers);
      const top = completedList
        .filter((o) => o.student_id !== self.student_id)
        .map((o) => ({
          name: nameOf(o.student_id),
          score: matchBreakdown(self.answers, o.answers).final,
          arch: archetype(o.answers),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return [
        selfName,
        selfArch,
        top[0]?.name ?? "",
        top[0]?.arch ?? "",
        top[0]?.score ?? "",
        top[1]?.name ?? "",
        top[1]?.arch ?? "",
        top[1]?.score ?? "",
        top[2]?.name ?? "",
        top[2]?.arch ?? "",
        top[2]?.score ?? "",
      ];
    });

    downloadCsv(`${slug(cls.name)}-match-results.csv`, [
      [
        "Student Name",
        "Student Archetype",
        "Match 1 Name",
        "Match 1 Archetype",
        "Match 1 Score",
        "Match 2 Name",
        "Match 2 Archetype",
        "Match 2 Score",
        "Match 3 Name",
        "Match 3 Archetype",
        "Match 3 Score",
      ],
      ...rows,
    ]);
  }

  function exportMatchesCsv() {
    if (!cls) return;
    const rows = completed.flatMap((self) =>
      rankedPeersFor(self)
        .slice(0, 5)
        .map((peer, index) => [
          nameOf(self.student_id),
          archetype(self.answers),
          index + 1,
          peer.name,
          peer.archetype,
          peer.score,
          peer.breakdown.availability,
          peer.breakdown.academic,
          peer.breakdown.complementary,
          peer.breakdown.studyStyle,
          peer.breakdown.goals,
          peer.breakdown.confidence,
          "no",
          peer.insight.why,
          peer.insight.agree.join("; "),
          peer.insight.move,
        ]),
    );
    downloadCsv(`${slug(cls.name)}-match-rationale-v${nextVersion}.csv`, [
      [
        "Student",
        "Student archetype",
        "Rank",
        "Suggested classmate",
        "Classmate archetype",
        "Compatibility %",
        "Availability overlap",
        "Academic fit",
        "Complementary skills",
        "Study style",
        "Goal match",
        "Confidence",
        "Balanced assignment",
        "Why",
        "Agree on",
        "First move",
      ],
      ...rows,
    ]);
  }

  function printReport() {
    if (!cls) return;
    const riskHtml = riskPairs.length
      ? riskPairs
          .map(
            (risk) =>
              `<li><strong>${escapeHtml(risk.a)} + ${escapeHtml(risk.b)}</strong> (${risk.score}/100): ${escapeHtml(risk.watch)}</li>`,
          )
          .join("")
      : "<li>No major risk pairs found among submitted students.</li>";
    const completedStudentsHtml = completed
      .map((self) => {
        const arch = archetype(self.answers);
        const top = completed
          .filter((o) => o.student_id !== self.student_id)
          .map((o) => ({
            name: nameOf(o.student_id),
            score: matchBreakdown(self.answers, o.answers).final,
            arch: archetype(o.answers),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        const topMatchesStr = top.length
          ? top.map((t) => `${escapeHtml(t.name)} (${t.score}%)`).join(", ")
          : "None";

        return `<tr>
        <td><strong>${escapeHtml(nameOf(self.student_id))}</strong></td>
        <td>${escapeHtml(arch)}</td>
        <td>${topMatchesStr}</td>
      </tr>`;
      })
      .join("");
    const html = `<!doctype html>
      <html>
        <head>
          <title>${escapeHtml(cls.name)} Synco report</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1a1a1a; margin: 32px; line-height: 1.45; }
            h1, h2 { margin-bottom: 8px; }
            .muted { color: #666; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border-bottom: 1px solid #ddd; text-align: left; padding: 8px; font-size: 13px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Print or save PDF</button>
          <h1>${escapeHtml(cls.name)}</h1>
          <p class="muted">Synco decision report · version ${nextVersion} preview</p>
          <div class="grid">
            <div class="card"><strong>Expected</strong><br>${cls.expected_count}</div>
            <div class="card"><strong>Submitted</strong><br>${submitted}</div>
            <div class="card"><strong>Confidence</strong><br>${confidenceLabel}</div>
          </div>
          <h2>Publish outcome</h2>
          <p>${escapeHtml(publishOutcome)}</p>
          <p class="muted">${escapeHtml(missingSummary)}</p>
          <h2>Student top compatibility matches</h2>
          <p class="muted">Showing top 3 classmates ranked by compatibility based on availability, academic fit, skills, study style, and goals.</p>
          <table>
            <thead><tr><th>Student</th><th>Archetype</th><th>Top 3 Compatible Classmates</th></tr></thead>
            <tbody>${completedStudentsHtml}</tbody>
          </table>
          <h2>Risk pairs to review</h2>
          <ul>${riskHtml}</ul>
          <h2>Roster status</h2>
          <table>
            <thead><tr><th>Name</th><th>Identifier</th><th>Status</th><th>Submitted</th></tr></thead>
            <tbody>
              ${members
                .map((member) => {
                  const response = respByStudent.get(member.student_id);
                  return `<tr><td>${escapeHtml(member.display_name)}</td><td>${escapeHtml(member.identifier ?? "")}</td><td>Joined</td><td>${response?.completed ? "Yes" : "No"}</td></tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </body>
      </html>`;
    const report = window.open("", "_blank");
    if (!report) return;
    report.document.write(html);
    report.document.close();
    report.focus();
  }

  return (
    <div className="min-h-screen">
      {confirmationDialog}
      <header className="px-4 sm:px-6 md:px-12 py-4 sm:py-5 border-b border-border/60">
        <Link to="/dashboard" className="text-xs sm:text-sm text-muted hover:text-foreground">
          ← Dashboard
        </Link>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">{cls.name}</h1>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card hover:bg-muted text-xs sm:text-sm font-medium transition-colors"
            >
              {copied === "invite" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[color:var(--color-success)]" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Invite ·{" "}
                  <span className="font-mono text-xs">{cls.invite_code}</span>
                </>
              )}
            </button>
          </div>
          {cls.is_published && (
            <div className="rounded-lg bg-[color:var(--color-accent-light)] text-sm p-3 my-4 flex items-center justify-between gap-3 flex-wrap">
              <span>
                Version {resultMeta.version || 1} published · {resultIncluded} students included
                {lateSubmissions > 0
                  ? ` · ${lateSubmissions} late submission${lateSubmissions === 1 ? "" : "s"} pending`
                  : ""}
              </span>
              <button
                onClick={unpublish}
                className="text-destructive font-medium text-xs hover:underline"
              >
                Unpublish
              </button>
            </div>
          )}
          {pageNotice && (
            <div
              className={
                "rounded-lg border text-sm p-3 my-4 flex items-center justify-between gap-3 flex-wrap " +
                (pageNotice.tone === "error"
                  ? "border-destructive/30 bg-destructive/5 text-destructive"
                  : "border-accent/35 bg-[color:var(--color-accent-light)]")
              }
            >
              <span>{pageNotice.text}</span>
              <button
                type="button"
                onClick={() => setPageNotice(null)}
                className="text-xs font-medium text-muted hover:text-foreground transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 mt-8 mb-10">
            <Stat label="Expected" value={cls.expected_count} />
            <Stat label="Submitted" value={submitted} valueClass={statusColor} />
            <Stat label="Missing" value={missingTotal} />
          </div>

          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span className="font-medium uppercase tracking-wider">Coverage</span>
            <span className="font-mono">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden mb-10">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <section className="rounded-xl border border-border bg-card p-5 mb-10">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <h2 className="text-xl font-medium">Decision dashboard</h2>
                <p className="text-sm text-muted mt-1">{publishOutcome}</p>
              </div>
              <span className="rounded-full bg-[color:var(--color-accent-light)] px-3 py-1 text-xs font-medium">
                {cls.is_published
                  ? `Current version ${resultMeta.version || 1}`
                  : `Next version ${nextVersion}`}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <DecisionTile
                label="Confidence"
                value={confidenceLabel}
                detail={`${pct}% coverage`}
              />
              <DecisionTile
                label="Missing students"
                value={String(
                  missingJoined.length +
                    unclaimedRoster.length +
                    (cls.roster_lock_enabled ? 0 : expectedGap),
                )}
                detail={missingSummary}
              />
              <DecisionTile
                label="Matching System"
                value={cls.team_size === 2 ? "Optimal Pairs" : "Team Optimizer"}
                detail={`Uses the team engine for target size ${cls.team_size}`}
              />
              <DecisionTile
                label="Feedback"
                value={String(feedbackValues.length)}
                detail={feedbackSummary}
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-medium">Risk pairs to review</h3>
                  <span className="text-xs text-muted">{riskPairs.length} flagged</span>
                </div>
                {riskPairs.length ? (
                  <div className="space-y-3">
                    {riskPairs.map((risk) => (
                      <div key={`${risk.a}-${risk.b}`} className="text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">
                            {risk.a} + {risk.b}
                          </span>
                          <span className="font-mono text-xs text-destructive">{risk.score}</span>
                        </div>
                        <p className="text-xs text-muted mt-1">{risk.watch}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    No major risk pairs yet. This can change as more students submit.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="font-medium mb-3">Lead actions</h3>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={copyReminder}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    {copied === "reminder" ? (
                      <Check className="h-4 w-4 text-[color:var(--color-success)]" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    {copied === "reminder" ? "Reminder copied" : "Copy reminder"}
                  </button>
                  <button
                    type="button"
                    onClick={exportRosterCsv}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Export roster CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportMatchResultsCsv}
                    disabled={submitted < 2}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Export match results CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportMatchesCsv}
                    disabled={submitted < 2}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Export rationale CSV
                  </button>
                  <button
                    type="button"
                    onClick={printReport}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Print PDF report
                  </button>
                  <div className="border-t border-border/60 my-2 pt-2">
                    <button
                      type="button"
                      onClick={deleteClass}
                      disabled={busy}
                      className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive px-3 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete class
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {lateSubmissions > 0 && (
              <div className="mt-5 rounded-lg border border-accent/35 bg-[color:var(--color-accent-light)] p-3 text-sm">
                {lateSubmissions} student{lateSubmissions === 1 ? "" : "s"} submitted after the last
                publish. Republish to include them in version {nextVersion}.
              </div>
            )}
          </section>

          {cls.is_published && cls.team_assignments && (
            <section className="mb-12">
              <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight">
                    Assigned Teams
                  </h2>
                  <p className="text-sm text-muted mt-1">
                    Team size target {cls.team_assignments.team_size} ·{" "}
                    {cls.team_assignments.teams.length} team
                    {cls.team_assignments.teams.length === 1 ? "" : "s"} assigned
                  </p>
                </div>
                <span className="text-xs text-muted">
                  Version {cls.team_assignments.results_version}
                </span>
              </div>

              {cls.team_assignments.teams.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {cls.team_assignments.teams.map((team, index) => (
                    <div key={team.id} className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-lg">Team {index + 1}</h3>
                          <p className="text-xs text-muted">
                            {team.members.length} member{team.members.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span className="rounded-full bg-[color:var(--color-accent-light)] px-2.5 py-1 text-xs font-medium">
                          {team.average_score}% avg
                        </span>
                      </div>
                      <div className="space-y-2">
                        {team.members.map((member) => (
                          <div
                            key={member.student_id}
                            className="rounded-lg border border-border/60 bg-background px-3 py-2"
                          >
                            <span className="text-sm font-medium truncate">{member.name}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 border-t border-border/60 pt-3 text-sm text-muted truncate">
                        {team.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-background p-4 text-sm text-muted">
                  No complete teams could be assigned yet. Republish after more students submit or
                  review hard pairing constraints.
                </p>
              )}

              {cls.team_assignments.unmatched.length > 0 && (
                <div className="mt-4 rounded-lg border border-accent/35 bg-[color:var(--color-accent-light)] p-4">
                  <h3 className="text-sm font-medium">Unassigned students</h3>
                  <p className="mt-1 text-xs text-muted">
                    These students could not be placed without breaking hard constraints or team
                    size limits.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cls.team_assignments.unmatched.map((member) => (
                      <span
                        key={member.student_id}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs"
                      >
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {cls.is_published &&
            (() => {
              const completed = responses.filter((r) => r.completed);
              const nameOf = (sid: string) =>
                members.find((m) => m.student_id === sid)?.display_name ?? "Classmate";
              return (
                <section className="mb-12">
                  <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
                    <h2 className="text-xl font-medium">Published results</h2>
                    <span className="text-xs text-muted">
                      Lead preview · students see only their own view
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {completed.map((self) => {
                      const arch = archetype(self.answers);
                      const top = completed
                        .filter((o) => o.student_id !== self.student_id)
                        .map((o) => ({
                          id: o.student_id,
                          name: nameOf(o.student_id),
                          score: matchBreakdown(self.answers, o.answers).final,
                          arch: archetype(o.answers),
                        }))
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 3);
                      return (
                        <div
                          key={self.student_id}
                          className="rounded-xl border border-border bg-card p-5"
                        >
                          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                            <div>
                              <div className="font-medium">{nameOf(self.student_id)}</div>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[color:var(--color-accent-light)] text-xs font-medium">
                                {arch}
                              </span>
                              <p className="mt-2 text-xs text-muted">
                                Feedback:{" "}
                                <span className="font-medium text-foreground">
                                  {feedbackByStudent[self.student_id] ?? "Not submitted yet"}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-xs uppercase tracking-wider text-muted mb-2">
                            Top matches
                          </div>
                          <div className="grid sm:grid-cols-3 gap-2">
                            {top.map((t) => (
                              <div
                                key={t.id}
                                className="rounded-lg border border-border/60 bg-background p-3"
                              >
                                <div className="flex items-baseline justify-between">
                                  <span className="font-medium text-sm truncate">{t.name}</span>
                                  <span className="font-mono text-xs text-accent">{t.score}</span>
                                </div>
                                <div className="text-xs text-muted mt-0.5">{t.arch}</div>
                              </div>
                            ))}
                            {top.length === 0 && (
                              <div className="text-xs text-muted">No peers to match yet.</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })()}

          <div className="rounded-xl border border-border bg-card p-5 mb-10">
            <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
              <div>
                <h3 className="font-medium">
                  {cls.is_published
                    ? `Version ${resultMeta.version || 1} is published`
                    : submitted < 2
                      ? "Waiting for submissions"
                      : coverage >= 0.8
                        ? "Ready to publish"
                        : coverage >= 0.5
                          ? `Partial results — ${missingTotal} students missing`
                          : "Too few submissions — results may be unreliable"}
                </h3>
                <p className="text-sm text-muted mt-1">
                  {submitted < 2
                    ? `Matches need at least 2 completed surveys. ${submitted} submitted so far — share your invite code with classmates.`
                    : cls.is_published
                      ? "Republish when late submissions arrive or when you want to refresh every student's view."
                      : "Once you publish, students immediately see their insights. You can unpublish anytime."}
                </p>
              </div>
              <button
                onClick={() => setConfirming(true)}
                disabled={!canGenerate}
                className="h-11 px-5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-[color:var(--color-primary-hover)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cls.is_published ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Republish results
                  </span>
                ) : (
                  "Publish results"
                )}
              </button>
            </div>
          </div>

          {hasIdentityConflicts && (
            <div className="mb-10 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
              <div className="flex gap-3">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-destructive">Duplicate identifiers found</h3>
                  <p className="mt-1 text-muted">
                    Results are locked because multiple submitted surveys use the same class
                    identifier:{" "}
                    <span className="font-mono text-foreground">
                      {duplicateIdentifiers.slice(0, 5).join(", ")}
                    </span>
                    {duplicateIdentifiers.length > 5 ? "…" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-medium">Roster</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Identifier</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Submitted</th>
                  <th className="text-left p-4 font-medium">Survey</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted">
                      No one has joined yet. Share your invite code.
                    </td>
                  </tr>
                )}
                {filtered.map((m) => {
                  const r = respByStudent.get(m.student_id);
                  const status = r?.completed ? "submitted" : "joined";
                  return (
                    <tr key={m.student_id} className="border-b border-border last:border-0">
                      <td className="p-4 font-medium">{m.display_name}</td>
                      <td className="p-4 text-muted font-mono text-xs hidden md:table-cell">
                        {m.identifier ?? "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={
                            "inline-flex items-center gap-2 text-xs " +
                            (status === "submitted"
                              ? "text-[color:var(--color-success)]"
                              : "text-accent")
                          }
                        >
                          <span
                            className={
                              "h-2 w-2 rounded-full " +
                              (status === "submitted"
                                ? "bg-[color:var(--color-success)]"
                                : "bg-accent")
                            }
                          />
                          {status === "submitted" ? "Submitted" : "Joined"}
                        </span>
                      </td>
                      <td className="p-4 text-muted hidden md:table-cell">
                        {r?.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4">
                        {r ? (
                          <button
                            type="button"
                            onClick={() => deleteSurvey(m)}
                            disabled={deletingSurveyId === m.student_id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingSurveyId === m.student_id ? "Deleting" : "Delete"}
                          </button>
                        ) : (
                          <span className="text-xs text-muted">No survey</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>

      {confirming && (
        <div
          className="fixed inset-0 bg-foreground/30 grid place-items-center p-6 z-50"
          onClick={() => setConfirming(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="bg-card rounded-2xl p-7 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl mb-3">
              {publishVerb} version {nextVersion}?
            </h3>
            <p className="text-sm text-muted mb-6">
              {submitted} of {cls.expected_count} students are included. Students will see version{" "}
              {nextVersion} immediately. This refreshes match rationale and readiness cards for
              every completed student.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirming(false)}
                className="h-10 px-4 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors"
              >
                Not yet
              </button>
              <button
                onClick={publish}
                disabled={busy}
                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-[color:var(--color-primary-hover)] transition-colors disabled:opacity-60"
              >
                {busy ? "Publishing…" : `Yes, ${publishVerb.toLowerCase()}`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-muted mb-2">{label}</div>
      <div className={"font-display text-3xl " + valueClass}>{value}</div>
    </div>
  );
}

function DecisionTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted mb-2">{label}</div>
      <div className="font-display text-2xl">{value}</div>
      <p className="mt-2 text-xs text-muted">{detail}</p>
    </div>
  );
}

function ClassSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-8 space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats Cards grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-8 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Main content split */}
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Table skeleton */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <Skeleton className="h-6 w-36 rounded" />
            <Skeleton className="h-9 w-48 rounded" />
          </div>
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="flex items-center justify-between py-2 border-b border-border/40"
              >
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-3 w-1/4 rounded" />
                </div>
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar options skeleton */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-24 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-full rounded" />
              <Skeleton className="h-9 w-full rounded" />
              <Skeleton className="h-9 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
