import {
  pairBlocked,
  pairFrictionInsight,
  matchBreakdown,
  pairInsight,
  privacyMode,
  archetype,
  type Answers,
} from "@/lib/peergraph";

export type Member = { student_id: string; display_name: string; identifier: string | null };
export type Resp = {
  student_id: string;
  answers: Answers;
  completed: boolean;
  submitted_at: string | null;
};

export function buildRiskPairs(completed: Resp[], members: Member[]) {
  const pairs: Array<{ a: string; b: string; score: number; watch: string }> = [];
  const nameOf = (sid: string) =>
    members.find((m) => m.student_id === sid)?.display_name ?? "Classmate";

  for (let i = 0; i < completed.length; i += 1) {
    for (let j = i + 1; j < completed.length; j += 1) {
      const left = completed[i];
      const right = completed[j];
      if (!left || !right) continue;
      const leftMember = members.find((member) => member.student_id === left.student_id);
      const rightMember = members.find((member) => member.student_id === right.student_id);
      if (
        pairBlocked(
          {
            id: left.student_id,
            answers: left.answers,
            name: leftMember?.display_name ?? nameOf(left.student_id),
            identifier: leftMember?.identifier ?? null,
          },
          {
            id: right.student_id,
            answers: right.answers,
            name: rightMember?.display_name ?? nameOf(right.student_id),
            identifier: rightMember?.identifier ?? null,
          },
        )
      ) {
        continue;
      }
      const score = matchBreakdown(left.answers, right.answers).final;
      if (score >= 65) continue;
      pairs.push({
        a: nameOf(left.student_id),
        b: nameOf(right.student_id),
        score,
        watch: pairFrictionInsight(left.answers, right.answers).watch,
      });
    }
  }

  return pairs.sort((a, b) => a.score - b.score);
}

export function publicPeerName(answers: Answers, actualName: string, index: number) {
  return privacyMode(answers) === "Lead introduction only" ? `Classmate ${index + 1}` : actualName;
}

export function publicInsightForPeer(answers: Answers, insight: ReturnType<typeof pairInsight>) {
  const mode = privacyMode(answers);
  if (mode === "Show name but keep reasons general") {
    return {
      ...insight,
      why: "Why: compatible availability, academic fit, and goals without showing private survey details.",
      brings: "A compatible working pattern without exposing private survey details.",
    };
  }
  if (mode === "Lead introduction only") {
    return {
      ...insight,
      why: "Why: your lead will handle the introduction. Compatibility is based on schedule, academic fit, and goals.",
      brings: "A potential fit selected without revealing their identity yet.",
    };
  }
  return insight;
}

export function publicFrictionForPeer(
  answers: Answers,
  friction: ReturnType<typeof pairFrictionInsight>,
) {
  const mode = privacyMode(answers);
  if (mode === "Show name but keep reasons general" || mode === "Lead introduction only") {
    return {
      ...friction,
      why: "Why this is hard: some fit signals are weaker, but private survey details are hidden.",
      watch: "Ask the lead before assuming why this pairing is risky.",
    };
  }
  return friction;
}

export function buildReadinessCard(
  selfArchetype: string,
  matches: Array<{
    name: string;
    archetype: string;
    score: number;
    why: string;
    agree: string[];
    move: string;
  }>,
  avoid: Array<{ name: string; watch: string; move: string }>,
) {
  const suggestedGroup = matches.slice(0, 3).map((match) => ({
    name: match.name,
    archetype: match.archetype,
    score: match.score,
  }));
  const firstMatch = matches[0];
  const topAgreements = Array.from(new Set(matches.flatMap((match) => match.agree))).slice(0, 3);

  return {
    suggestedGroup,
    why:
      firstMatch?.why ??
      "There are not enough completed surveys yet to explain a strong working group.",
    friction:
      avoid[0]?.watch ??
      "Even strong matches should agree on expectations before starting real work.",
    agenda: [
      "Share availability and preferred communication channel.",
      `Agree on ${topAgreements[0] ?? "check-in cadence"} before assigning tasks.`,
      "Name one backup owner for deadlines so work does not silently stall.",
      "Schedule a 15-minute reset after the first milestone.",
    ],
    roles: [
      roleSuggestion(selfArchetype),
      ...suggestedGroup.slice(0, 2).map((member) => roleSuggestion(member.archetype, member.name)),
    ],
    disclaimer:
      "Use this as a practical starting point. A good team still needs a first conversation, clear roles, and instructor judgment.",
  };
}

export function roleSuggestion(archetype: string, name = "You") {
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

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function csvCell(value: string | number) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}
