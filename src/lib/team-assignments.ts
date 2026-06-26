import type {
  MatchBreakdown,
  MatchingPlan,
  MatchStudent,
  TeamFormationPlan,
  TeamQualityBreakdown,
} from "@/lib/synco";

type TeamAssignmentMember = {
  student_id: string;
  name: string;
  archetype: string;
  identifier: string | null;
};

type TeamAssignment = {
  id: string;
  member_ids: string[];
  members: TeamAssignmentMember[];
  average_score: number;
  quality_score?: number;
  quality?: TeamQualityBreakdown;
  pair_score_total: number;
  rationale: string;
};

export type TeamAssignmentSnapshot = {
  results_version: number;
  generated_at: string;
  team_size: number;
  algorithm: TeamFormationPlan["algorithm"];
  teams: TeamAssignment[];
  unmatched: TeamAssignmentMember[];
  total_score: number;
};

export type StudentTeamAssignment = TeamAssignment & {
  teammates: TeamAssignmentMember[];
};

type StudentWithMeta = MatchStudent & {
  name: string;
  archetype: string;
  identifier: string | null;
};

type PairSummary = {
  score: number;
  breakdown: MatchBreakdown;
};

type TeamInput = {
  memberIds: string[];
  averageScore: number;
  pairScoreTotal: number;
  pairs: MatchingPlan["pairs"];
  quality?: TeamQualityBreakdown;
  rationale?: string;
};

const SCORE_COMPONENTS = [
  ["Availability", "availability"],
  ["Academic fit", "academic"],
  ["Complementary skills", "complementary"],
  ["Study style", "studyStyle"],
  ["Goals", "goals"],
] as const;

export function buildTeamAssignmentSnapshot({
  plan,
  students,
  teamSize,
  version,
  generatedAt,
}: {
  plan: TeamFormationPlan;
  students: StudentWithMeta[];
  teamSize: number;
  version: number;
  generatedAt: string;
}): TeamAssignmentSnapshot {
  const studentById = new Map(students.map((student) => [student.id, student]));
  const teamInputs: TeamInput[] = "teams" in plan ? plan.teams : pairsAsTeams(plan.pairs);
  const teams = teamInputs.map((team, index) => {
    const members = team.memberIds
      .map((memberId) => studentById.get(memberId))
      .filter((student): student is StudentWithMeta => Boolean(student))
      .map(memberAssignment);
    return {
      id: `team-${index + 1}`,
      member_ids: members.map((member) => member.student_id),
      members,
      average_score: team.averageScore,
      quality_score: team.quality?.score ?? team.averageScore,
      quality: team.quality,
      pair_score_total: team.pairScoreTotal,
      rationale: team.rationale ?? teamRationale(team.pairs, team.averageScore),
    };
  });

  return {
    results_version: version,
    generated_at: generatedAt,
    team_size: teamSize,
    algorithm: plan.algorithm,
    teams,
    unmatched: plan.unmatchedIds
      .map((studentId) => studentById.get(studentId))
      .filter((student): student is StudentWithMeta => Boolean(student))
      .map(memberAssignment),
    total_score: plan.totalScore,
  };
}

export function teamAssignmentForStudent(
  snapshot: TeamAssignmentSnapshot | null | undefined,
  studentId: string,
): StudentTeamAssignment | null {
  const team = snapshot?.teams.find((candidate) => candidate.member_ids.includes(studentId));
  if (!team) return null;
  return {
    ...team,
    teammates: team.members.filter((member) => member.student_id !== studentId),
  };
}

export function studentIsUnmatched(
  snapshot: TeamAssignmentSnapshot | null | undefined,
  studentId: string,
) {
  return Boolean(snapshot?.unmatched.some((member) => member.student_id === studentId));
}

function memberAssignment(student: StudentWithMeta): TeamAssignmentMember {
  return {
    student_id: student.id,
    name: student.name,
    archetype: student.archetype,
    identifier: student.identifier,
  };
}

function pairsAsTeams(pairs: MatchingPlan["pairs"]) {
  return pairs.map((pair) => ({
    memberIds: [pair.aId, pair.bId],
    averageScore: pair.score,
    pairScoreTotal: pair.score,
    pairs: [pair],
  }));
}

function teamRationale(pairs: PairSummary[], averageScore: number) {
  if (!pairs.length) {
    return "This team was assigned from available submissions, but there is not enough pair data for a detailed rationale yet.";
  }

  const componentAverages = SCORE_COMPONENTS.map(([label, key]) => ({
    label,
    value: Math.round(pairs.reduce((sum, pair) => sum + pair.breakdown[key], 0) / pairs.length),
  })).sort((a, b) => b.value - a.value);
  const strongest = componentAverages[0];
  const watch = componentAverages[componentAverages.length - 1];

  return `Average compatibility is ${averageScore}%. Strongest signal: ${strongest?.label ?? "overall fit"} (${strongest?.value ?? averageScore}%). First check-in should align on ${watch?.label.toLowerCase() ?? "working expectations"}.`;
}
