// Transparent compatibility scoring for Synco.
export type AnswerValue = number | string | string[] | boolean | null | undefined;
export type Answers = Record<string, AnswerValue>;

export type MatchBreakdown = {
  availability: number;
  academic: number;
  complementary: number;
  studyStyle: number;
  goals: number;
  final: number;
  confidence: "High" | "Moderate" | "Low";
  commonSlots: string[];
  commonTopics: string[];
  complementaryTopics: string[];
  sharedWeakAreas: string[];
};

export type MatchStudent = {
  id: string;
  answers: Answers;
  name?: string;
  identifier?: string | null;
};

export type MatchingPlan = {
  algorithm: "maximum-weight" | "greedy";
  pairs: Array<{
    aId: string;
    bId: string;
    score: number;
    breakdown: MatchBreakdown;
  }>;
  unmatchedIds: string[];
  totalScore: number;
};

export type TeamMatchingPlan = {
  algorithm: "greedy-clustering";
  teamSize: number;
  teams: Array<{
    memberIds: string[];
    averageScore: number;
    pairScoreTotal: number;
    pairs: MatchingPlan["pairs"];
  }>;
  unmatchedIds: string[];
  totalScore: number;
};

export type TeamFormationPlan = MatchingPlan | TeamMatchingPlan;

const ONE_SIDED_REQUEST_BONUS = 12;
const FRIEND_RISK_SCORE_THRESHOLD = 65;

// Final match score = weighted sum of 5 sub-scores.
// Weights reflect real-world team success factors:
//   - Availability (30%): Can they actually meet? Blocks everything else.
//   - Academic (25%): Same course/topic focus? Shared context matters.
//   - Complementary (20%): Do strengths cover each other's gaps?
//   - Study style (15%): Compatible work rhythms and communication.
//   - Goals (10%): Similar ambition and grade targets.
export const MATCH_WEIGHTS = {
  availability: 0.3,
  academic: 0.25,
  complementary: 0.2,
  studyStyle: 0.15,
  goals: 0.1,
} as const;

// Proximity: how close two 1-5 Likert values are. Returns 0.0–1.0.
// Divides by 4 (max possible gap) to normalize. Same value → 1.0, opposite → 0.0.
const prox = (a: number, b: number) => 1 - Math.abs(a - b) / 4;

// Complementarity: rewards DIFFERENT skills when both have baseline competence.
// min(a,b)/5 ensures both are somewhat capable; gap bonus rewards coverage diversity.
const compl = (a: number, b: number) => (Math.min(a, b) / 5) * (1 + Math.abs(a - b) / 4);

// Average with a safe fallback of 0.65 (slightly above neutral) when no data exists.
// 0.65 avoids penalizing students who skipped optional questions.
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0.65);

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

// Extract numeric answer clamped to 1-5 Likert scale.
// Fallback = 3 (neutral midpoint) if missing, so unanswered questions don't skew scores.
function num(a: Answers, id: string, fallback = 3) {
  const value = a[id];
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(5, value))
    : fallback;
}

function text(a: Answers, id: string) {
  const value = a[id];
  return typeof value === "string" ? value.trim() : "";
}

function list(a: Answers, id: string) {
  const value = a[id];
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.includes(",")) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

const key = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function intersect(left: string[], right: string[]) {
  const rightKeys = new Set(right.map(key));
  return left.filter(
    (item, index) =>
      rightKeys.has(key(item)) && left.findIndex((x) => key(x) === key(item)) === index,
  );
}

function unionSize(left: string[], right: string[]) {
  return new Set([...left, ...right].map(key)).size;
}

// Scores categorical match between two text answers.
// 100 = exact match (e.g., both chose "WhatsApp").
// 82  = related match (e.g., "WhatsApp" and "text" are in the same family). ~80% credit.
// 48  = unrelated (below 50 signals friction, but not zero — still workable).
// null = one or both answers missing — excluded from average.
const EXACT_MATCH_SCORE = 100;
const RELATED_MATCH_SCORE = 82;
const UNRELATED_MATCH_SCORE = 48;

function exactOrRelatedScore(left: string, right: string, related: Array<[string, string]> = []) {
  if (!left || !right) return null;
  if (key(left) === key(right)) return EXACT_MATCH_SCORE;
  const leftKey = key(left);
  const rightKey = key(right);
  if (
    related.some(
      ([a, b]) =>
        (leftKey.includes(key(a)) && rightKey.includes(key(b))) ||
        (leftKey.includes(key(b)) && rightKey.includes(key(a))),
    )
  ) {
    return RELATED_MATCH_SCORE;
  }
  return UNRELATED_MATCH_SCORE;
}

function gradeRank(value: string) {
  const normalized = key(value);
  if (!normalized) return null;
  // Match against actual survey options: "top score", "a range", "b or better", "pass safely"
  if (normalized.includes("top")) return 5;
  if (normalized.startsWith("a ") || normalized === "a") return 4;
  if (normalized.startsWith("b ") || normalized === "b") return 3;
  if (normalized.includes("pass")) return 2;
  return null;
}

const NUMERIC_SIGNAL_IDS = Array.from({ length: 22 }, (_, index) => `q${index + 1}`);
const DETAIL_SIGNAL_IDS = [
  "availability",
  "topics",
  "strengths",
  "weakAreas",
  "studyStyle",
  "seriousness",
  "targetGrade",
  "communicationPreference",
  "meetingMode",
  "preferredLanguage",
  "energyStyle",
  "accountabilityPreference",
];
const SIGNAL_COUNT = NUMERIC_SIGNAL_IDS.length + DETAIL_SIGNAL_IDS.length;

function hasAnswer(a: Answers, id: string) {
  const value = a[id];
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function answeredFieldCount(a: Answers) {
  return [...NUMERIC_SIGNAL_IDS, ...DETAIL_SIGNAL_IDS].filter((id) => hasAnswer(a, id)).length;
}

// Confidence in the match quality based on how much data we have.
// High:     ≥70% questions answered AND score ≥70 — enough data to trust the result.
// Moderate: ≥45% answered OR score ≥75 — partial data but strong signal.
// Low:      sparse data and weak score — treat match as a rough suggestion.
export function pairConfidence(
  a: Answers,
  b: Answers,
  finalScore: number,
): "High" | "Moderate" | "Low" {
  const completeness = (answeredFieldCount(a) + answeredFieldCount(b)) / (SIGNAL_COUNT * 2);
  if (completeness >= 0.7 && finalScore >= 70) return "High";
  if (completeness >= 0.45 || finalScore >= 75) return "Moderate";
  return "Low";
}

function availabilityScore(a: Answers, b: Answers) {
  const aSlots = list(a, "availability");
  const bSlots = list(b, "availability");
  const commonSlots = intersect(aSlots, bSlots);

  // Practical logistics signals (all 1-5 Likert, normalized to 0-1):
  //   q10: flexibility with scheduling changes
  //   q14: ability to meet in person nearby
  //   q15: predictable class/lab presence
  //   q16: online meeting setup quality
  //   q20: timezone/schedule regularity
  const practicalFit = avg([
    prox(num(a, "q10"), num(b, "q10")),
    Math.min(num(a, "q14"), num(b, "q14")) / 5, // min = can the least-equipped person manage?
    Math.min(num(a, "q15"), num(b, "q15")) / 5,
    Math.min(num(a, "q16"), num(b, "q16")) / 5,
    prox(num(a, "q20"), num(b, "q20")),
  ]);

  if (aSlots.length && bSlots.length) {
    // Two overlap metrics blended:
    //   bySmaller (75% weight): "what fraction of the smaller schedule overlaps?" — recall-focused
    //   byUnion (25% weight): Jaccard similarity — penalizes wildly different total availability
    const bySmaller = commonSlots.length / Math.max(1, Math.min(aSlots.length, bSlots.length));
    const byUnion = commonSlots.length / Math.max(1, unionSize(aSlots, bSlots));
    const slotScore = bySmaller * 0.75 + byUnion * 0.25;
    // Slot overlap (70%) matters more than logistics (30%) — you can fix a bad mic, not a conflict.
    return { score: clampScore((slotScore * 0.7 + practicalFit * 0.3) * 100), commonSlots };
  }

  // No slot data → fall back to logistics-only estimate.
  return {
    score: clampScore(practicalFit * 100),
    commonSlots,
  };
}

function academicScore(a: Answers, b: Answers) {
  const aTopics = list(a, "topics");
  const bTopics = list(b, "topics");
  const aStrengths = list(a, "strengths");
  const bStrengths = list(b, "strengths");
  const aWeak = list(a, "weakAreas");
  const bWeak = list(b, "weakAreas");
  const commonTopics = intersect(aTopics, bTopics);
  const commonStrengths = intersect(aStrengths, bStrengths);
  const sharedWeakAreas = intersect(aWeak, bWeak);

  // 68 = neutral fallback when one side has no data. Slightly above midpoint
  // to avoid punishing students who didn't fill in optional topic lists.
  const NEUTRAL_ACADEMIC = 68;

  if (aTopics.length || bTopics.length || aStrengths.length || bStrengths.length) {
    // Topic overlap: what fraction of the smaller topic list is shared?
    const topicFit =
      aTopics.length && bTopics.length
        ? clampScore(
            (commonTopics.length / Math.max(1, Math.min(aTopics.length, bTopics.length))) * 100,
          )
        : NEUTRAL_ACADEMIC;

    // Shared strengths: base 70 + 10 per overlap (rewards having common ground).
    // 58 if no overlap (below neutral — having strengths but none shared is mildly negative).
    const strengthFit =
      aStrengths.length && bStrengths.length
        ? commonStrengths.length
          ? clampScore(70 + commonStrengths.length * 10)
          : 58
        : NEUTRAL_ACADEMIC;

    // Shared weaknesses: base 55 + 12 per overlap.
    // Sharing weak areas is slightly positive (mutual support) but the low base reflects
    // that two students struggling in the same area won't cover each other.
    // 70 if no shared weaknesses = mildly good (gaps don't compound).
    const weakFit =
      aWeak.length && bWeak.length
        ? sharedWeakAreas.length
          ? clampScore(55 + sharedWeakAreas.length * 12)
          : 70
        : NEUTRAL_ACADEMIC;

    // Blend: topics matter most (45%), then strengths (22%), weaknesses (18%),
    // plus q22 (self-rated course preparation, 15% via proximity scaled to 0-15).
    return {
      score: clampScore(
        topicFit * 0.45 +
          strengthFit * 0.22 +
          weakFit * 0.18 +
          prox(num(a, "q22"), num(b, "q22")) * 15,
      ),
      commonTopics,
      sharedWeakAreas,
    };
  }

  // No topic/strength data → fall back to numeric-only signals.
  //   q5: depth vs breadth preference
  //   q9: research intensity
  //   q22: course preparation level
  return {
    score: clampScore(
      avg([
        prox(num(a, "q5"), num(b, "q5")),
        prox(num(a, "q9"), num(b, "q9")),
        prox(num(a, "q22"), num(b, "q22")),
      ]) * 100,
    ),
    commonTopics,
    sharedWeakAreas,
  };
}

function complementaryScore(a: Answers, b: Answers) {
  const aStrengths = list(a, "strengths");
  const bStrengths = list(b, "strengths");
  const aWeak = list(a, "weakAreas");
  const bWeak = list(b, "weakAreas");
  const aHelpsB = intersect(aStrengths, bWeak); // A's strengths covering B's gaps
  const bHelpsA = intersect(bStrengths, aWeak); // B's strengths covering A's gaps
  const complementaryTopics = [...aHelpsB, ...bHelpsA].filter(
    (item, index, all) => all.findIndex((x) => key(x) === key(item)) === index,
  );

  if (aStrengths.length || bStrengths.length || aWeak.length || bWeak.length) {
    // Found complementary coverage: base 62 + 12 per topic covered.
    // 62 base reflects that even 1 complementary topic is already a useful signal.
    // 12 per additional topic because each extra coverage area is diminishing returns.
    if (complementaryTopics.length) {
      return { score: clampScore(62 + complementaryTopics.length * 12), complementaryTopics };
    }
    // 52: they share weak areas but no complementary coverage — mild negative.
    if (intersect(aWeak, bWeak).length) return { score: 52, complementaryTopics };
    // 44: no complementary match at all — clearly below neutral.
    return { score: 44, complementaryTopics };
  }

  // No topic data → estimate from numeric signals:
  //   q6: teaching/explaining comfort (complementary if one teaches, other learns)
  //   q7: initiative level (complementary if one leads, other supports)
  return {
    score: clampScore(
      avg([compl(num(a, "q6"), num(b, "q6")), compl(num(a, "q7"), num(b, "q7"))]) * 100,
    ),
    complementaryTopics,
  };
}

// Study style compatibility: blends categorical matches with numeric proximity signals.
// Categorical signals (study style, comm preference, meeting mode, language, energy)
// use exactOrRelatedScore → 100/82/48 scores.
// Numeric signals (q1, q2, q8, q11, q17, q19, q21) use proximity on 1-5 scale.
function studyStyleScore(a: Answers, b: Answers) {
  const scores = [
    // Study approach: "practice problems" ≈ "problem sets", "quiet study" ≈ "review"
    exactOrRelatedScore(text(a, "studyStyle"), text(b, "studyStyle"), [
      ["practice", "problem"],
      ["quiet", "review"],
      ["teach", "explain"],
    ]),
    // Communication tool: WhatsApp ≈ text, Discord ≈ Slack, video ≈ online
    exactOrRelatedScore(text(a, "communicationPreference"), text(b, "communicationPreference"), [
      ["whatsapp", "text"],
      ["discord", "slack"],
      ["video", "online"],
    ]),
    // Meeting format: hybrid is compatible with both online and in-person
    exactOrRelatedScore(text(a, "meetingMode"), text(b, "meetingMode"), [
      ["hybrid", "online"],
      ["hybrid", "in person"],
    ]),
    // Language: exact match only (no related pairs)
    exactOrRelatedScore(text(a, "preferredLanguage"), text(b, "preferredLanguage")),
    // Energy style: ambivert bridges introvert and extrovert
    exactOrRelatedScore(text(a, "energyStyle"), text(b, "energyStyle"), [
      ["ambivert", "introvert"],
      ["ambivert", "extrovert"],
    ]),
  ].filter((score): score is number => score !== null);

  // Numeric work-rhythm signals:
  //   q1: structure preference, q2: communication frequency,
  //   q8: speed/urgency, q11: role flexibility,
  //   q17: comfort with new people, q19: async comfort,
  //   q21: accountability follow-up style
  const numericStyle = avg([
    prox(num(a, "q1"), num(b, "q1")),
    prox(num(a, "q2"), num(b, "q2")),
    prox(num(a, "q8"), num(b, "q8")),
    prox(num(a, "q11"), num(b, "q11")),
    prox(num(a, "q17"), num(b, "q17")),
    prox(num(a, "q19"), num(b, "q19")),
    prox(num(a, "q21"), num(b, "q21")),
  ]);

  // When we have categorical data, blend it with numeric (average together).
  if (scores.length) return clampScore(avg([...scores, numericStyle * 100]));

  return clampScore(numericStyle * 100);
}

// Goals alignment: do they want the same things from this course?
function goalsScore(a: Answers, b: Answers) {
  const scores: number[] = [];

  // Seriousness proximity (how much effort they plan to invest)
  const seriousnessA = typeof a.seriousness === "number" ? num(a, "seriousness") : null;
  const seriousnessB = typeof b.seriousness === "number" ? num(b, "seriousness") : null;
  if (seriousnessA && seriousnessB) scores.push(prox(seriousnessA, seriousnessB) * 100);

  // Grade target alignment: same grade = 100, each rank apart costs 22 points.
  // Floor at 20 to avoid completely zeroing out (even A vs Pass = 20, not 0).
  // 22 per rank: grades span 4 ranks (2-5), so max penalty = 3*22 = 66 → min 34.
  const gradeA = gradeRank(text(a, "targetGrade"));
  const gradeB = gradeRank(text(b, "targetGrade"));
  if (gradeA && gradeB) scores.push(Math.max(20, 100 - Math.abs(gradeA - gradeB) * 22));

  // Accountability style: strict ≈ regular, gentle ≈ regular
  const accountability = exactOrRelatedScore(
    text(a, "accountabilityPreference"),
    text(b, "accountabilityPreference"),
    [
      ["strict", "regular"],
      ["gentle", "regular"],
    ],
  );
  if (accountability !== null) scores.push(accountability);

  // q18: milestone planning style (how far ahead they plan)
  scores.push(prox(num(a, "q18"), num(b, "q18")) * 100);

  if (scores.length) return clampScore(avg(scores));

  // Fallback when no categorical goal data exists:
  //   q3: deadline buffer preference, q10: scheduling flexibility
  return clampScore(
    avg([prox(num(a, "q3"), num(b, "q3")), prox(num(a, "q10"), num(b, "q10"))]) * 100,
  );
}

export function matchBreakdown(a: Answers, b: Answers): MatchBreakdown {
  const availability = availabilityScore(a, b);
  const academic = academicScore(a, b);
  const complementary = complementaryScore(a, b);
  const studyStyle = studyStyleScore(a, b);
  const goals = goalsScore(a, b);
  const final = clampScore(
    availability.score * MATCH_WEIGHTS.availability +
      academic.score * MATCH_WEIGHTS.academic +
      complementary.score * MATCH_WEIGHTS.complementary +
      studyStyle * MATCH_WEIGHTS.studyStyle +
      goals * MATCH_WEIGHTS.goals,
  );

  return {
    availability: availability.score,
    academic: academic.score,
    complementary: complementary.score,
    studyStyle,
    goals,
    final,
    confidence: pairConfidence(a, b, final),
    commonSlots: availability.commonSlots,
    commonTopics: academic.commonTopics,
    complementaryTopics: complementary.complementaryTopics,
    sharedWeakAreas: academic.sharedWeakAreas,
  };
}

export function pairScore(a: Answers, b: Answers) {
  return matchBreakdown(a, b).final;
}

export function archetype(a: Answers): string {
  if (num(a, "q3") <= 2 && num(a, "q10") <= 2) return "Reliable Finisher";
  if (num(a, "q8") >= 4 && num(a, "q7") >= 4) return "Fast Starter";
  if (num(a, "q6") >= 4 && num(a, "q5") <= 2) return "Concept Explainer";
  if (num(a, "q11") >= 4 && num(a, "q2") <= 2) return "Flexible Collaborator";
  if (num(a, "q9") <= 2 && num(a, "q4") <= 2) return "Deep Thinker";
  if (num(a, "q1") <= 2 && num(a, "q11") <= 2) return "Steady Organizer";
  return "Adaptive Generalist";
}

export const archetypeBlurb: Record<string, string> = {
  "Reliable Finisher":
    "You build in buffer time and deliver early. Teammates can plan around you with confidence.",
  "Fast Starter":
    "You move quickly from idea to action and naturally take initiative when no one else does.",
  "Concept Explainer":
    "You learn by going deep, and you enjoy unpacking ideas for teammates who are still catching up.",
  "Flexible Collaborator":
    "You adapt to whatever shape the group takes and keep things moving across long async stretches.",
  "Deep Thinker": "You go deep on fewer things and need quiet to do your best work.",
  "Steady Organizer":
    "You like clear plans and defined roles, and you bring structure that everyone leans on.",
  "Adaptive Generalist": "You shift between styles depending on what the project needs.",
};

export function workStyleMeters(a: Answers) {
  return {
    structure: Math.round(100 - ((num(a, "q1") + num(a, "q11")) / 10) * 100),
    commPace: Math.round((num(a, "q2") / 5) * 100),
    deadlineBuffer: Math.round(100 - (num(a, "q3") / 5) * 100),
    initiative: Math.round((num(a, "q7") / 5) * 100),
    teachingComfort: Math.round((num(a, "q6") / 5) * 100),
  };
}

export function confidence(submittedPct: number) {
  if (submittedPct >= 0.85) return "High";
  if (submittedPct >= 0.6) return "Moderate";
  return "Low";
}

export function pairInsight(a: Answers, b: Answers) {
  const breakdown = matchBreakdown(a, b);
  const why: string[] = [];
  const targetA = text(a, "targetGrade");
  const targetB = text(b, "targetGrade");
  const styleA = text(a, "studyStyle");
  const styleB = text(b, "studyStyle");
  const communicationA = text(a, "communicationPreference");
  const communicationB = text(b, "communicationPreference");

  if (breakdown.commonSlots.length) {
    why.push(
      `${breakdown.commonSlots.length} common free slot${breakdown.commonSlots.length === 1 ? "" : "s"}`,
    );
  }
  if (targetA && targetB && key(targetA) === key(targetB))
    why.push(`same target grade (${targetA})`);
  if (breakdown.commonTopics.length) {
    why.push(`shared focus on ${breakdown.commonTopics.slice(0, 2).join(" and ")}`);
  }
  if (breakdown.complementaryTopics.length) {
    why.push(
      `complementary strengths in ${breakdown.complementaryTopics.slice(0, 2).join(" and ")}`,
    );
  }
  if (styleA && styleB && key(styleA) === key(styleB)) why.push(`same study style (${styleA})`);
  if (communicationA && communicationB && key(communicationA) === key(communicationB)) {
    why.push(`same communication preference (${communicationA})`);
  }
  if (Math.min(num(a, "q16"), num(b, "q16")) >= 4) why.push("reliable online meeting setup");
  if (Math.min(num(a, "q17"), num(b, "q17")) >= 4)
    why.push("both comfortable starting with a new classmate");
  if (!why.length && breakdown.final >= 70) why.push("similar schedule, goals, and work rhythm");
  if (!why.length) why.push("a workable fit if you agree on expectations early");

  const bStrengths = list(b, "strengths");
  const brings = bStrengths.length
    ? `Strength in ${bStrengths.slice(0, 2).join(" and ")}.`
    : num(b, "q7") >= 4
      ? "Natural initiative and a clear sense of direction."
      : num(b, "q6") >= 4
        ? "Patience with complexity and a willingness to teach."
        : num(b, "q3") <= 2
          ? "Discipline around timelines and early submission."
          : "Adaptability across roles and shifting plans.";

  const agree: string[] = [];
  if (breakdown.availability < 70) agree.push("Meeting times");
  if (breakdown.studyStyle < 70 || Math.abs(num(a, "q2") - num(b, "q2")) >= 2) {
    agree.push("Communication channel");
  }
  if (breakdown.goals < 70 || Math.abs(num(a, "q3") - num(b, "q3")) >= 2) {
    agree.push("Deadline rhythm");
  }
  if (Math.abs(num(a, "q11") - num(b, "q11")) >= 2) agree.push("Role clarity");
  if (!agree.length) agree.push("First check-in cadence");

  const move =
    "Start with a 15-minute call: confirm availability, choose one communication channel, and name the first task owner.";
  return {
    why: `Why: ${why.slice(0, 3).join(", ")}.`,
    brings,
    agree,
    move,
    breakdown,
    confidence: breakdown.confidence,
  };
}

type FrictionFactor = "Availability" | "Academic fit" | "Complementary skills" | "Study style";
type FrictionFactorWithGoals = FrictionFactor | "Goal match";

function pairFrictionDetails(a: Answers, b: Answers) {
  const breakdown = matchBreakdown(a, b);
  const risks: string[] = [];
  if (breakdown.availability < 45) risks.push("few shared free slots");
  if (breakdown.academic < 50) risks.push("different course/topic needs");
  if (breakdown.complementary < 50) risks.push("limited strength/weak-area coverage");
  if (breakdown.studyStyle < 50) risks.push("different study or communication styles");
  if (breakdown.goals < 55) risks.push("different seriousness or grade goals");
  if (Math.min(num(a, "q14"), num(b, "q14")) <= 2) risks.push("meeting nearby may be hard");
  if (Math.min(num(a, "q16"), num(b, "q16")) <= 2) risks.push("online study may be unreliable");
  if (Math.min(num(a, "q17"), num(b, "q17")) <= 2) risks.push("a lead introduction may be needed");
  if (Math.abs(num(a, "q3") - num(b, "q3")) >= 3) risks.push("opposite deadline rhythm");
  if (!risks.length) risks.push("expectations may still be unclear");

  const factors: Array<[FrictionFactorWithGoals, number]> = [
    ["Availability", breakdown.availability],
    ["Academic fit", breakdown.academic],
    ["Complementary skills", breakdown.complementary],
    ["Study style", breakdown.studyStyle],
    ["Goal match", breakdown.goals],
  ];
  const lowest = [...factors].sort((left, right) => left[1] - right[1])[0]?.[0];
  const lowestFriendFactor = [...factors.slice(0, 4)].sort(
    (left, right) => left[1] - right[1],
  )[0]?.[0] as FrictionFactor | undefined;

  const watch =
    lowest === "Availability"
      ? "Meeting times. A good match still fails if no one can actually meet."
      : lowest === "Academic fit"
        ? "Course focus. They may be preparing for different topics."
        : lowest === "Complementary skills"
          ? "Skill coverage. Neither person may cover the other's weak area."
          : lowest === "Study style"
            ? "Working rhythm. One person may want quiet review while the other wants active discussion."
            : "Motivation. Expectations around effort and target grade may differ.";

  return { breakdown, risks, lowest, lowestFriendFactor, watch };
}

export function pairFrictionInsight(a: Answers, b: Answers) {
  const { breakdown, risks, watch } = pairFrictionDetails(a, b);
  const move =
    "If this pairing is needed, set meeting times and task ownership before any real work starts.";
  return {
    why: `Why this is hard: ${risks.slice(0, 2).join(" and ")}.`,
    watch,
    move,
    breakdown,
    confidence: breakdown.confidence,
  };
}

export function privacyMode(a: Answers) {
  return text(a, "privacyPreference");
}

export function pairKey(aId: string, bId: string) {
  return [aId, bId].sort().join("::");
}

function blockTargets(student: MatchStudent) {
  return [student.name, student.identifier, student.id]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map(key);
}

function blockEntries(student: MatchStudent) {
  return textEntries(student, "doNotPairWith");
}

function requestEntries(student: MatchStudent) {
  return textEntries(student, "wantToWorkWith");
}

function friendEntries(student: MatchStudent) {
  return textEntries(student, "friendsInClass");
}

function textEntries(student: MatchStudent, field: string) {
  const raw = text(student.answers, field);
  return raw
    .split(/[,;\n]+/)
    .map(key)
    .filter((entry) => entry.length >= 2);
}

function matchesTarget(entries: string[], targets: string[]) {
  return entries.some((entry) =>
    targets.some((target) => target.includes(entry) || entry.includes(target)),
  );
}

function requestedBy(requester: MatchStudent, target: MatchStudent) {
  return matchesTarget(requestEntries(requester), blockTargets(target));
}

export function pairBlocked(a: MatchStudent, b: MatchStudent) {
  const aBlocks = blockEntries(a);
  const bBlocks = blockEntries(b);
  const aTargets = blockTargets(a);
  const bTargets = blockTargets(b);
  return matchesTarget(aBlocks, bTargets) || matchesTarget(bBlocks, aTargets);
}

export function mutualRequest(a: MatchStudent, b: MatchStudent) {
  return requestedBy(a, b) && requestedBy(b, a);
}

export function isFlaggedFriend(a: MatchStudent, b: MatchStudent) {
  return matchesTarget(friendEntries(a), blockTargets(b));
}

export function friendRiskInsight(a: MatchStudent, b: MatchStudent) {
  if (!isFlaggedFriend(a, b)) return null;

  const details = pairFrictionDetails(a.answers, b.answers);
  if (details.breakdown.final >= FRIEND_RISK_SCORE_THRESHOLD) return null;

  const friendName = b.name?.trim() || "this classmate";
  const risk = friendRiskForFactor(details.lowestFriendFactor, details.risks);
  const cost = friendCostForFactor(details.lowestFriendFactor);

  return `You flagged ${friendName} as a friend. The numbers disagree: ${risk}. ${cost}`;
}

function friendRiskForFactor(factor: FrictionFactor | undefined, risks: string[]) {
  if (factor === "Availability") return "you have few shared free slots";
  if (factor === "Academic fit") return "you are preparing for different course or topic needs";
  if (factor === "Complementary skills") return "the strengths do not cover the weak areas";
  if (factor === "Study style") {
    return "your study or communication styles pull in different directions";
  }
  return risks[0] ?? "the fit signals are weak";
}

function friendCostForFactor(factor: FrictionFactor | undefined) {
  if (factor === "Availability") {
    return "Friendship doesn't create meeting time - this pairing will cost you time you don't have.";
  }
  if (factor === "Academic fit") {
    return "Friendship doesn't make you study the same material - this pairing will cost you time you don't have.";
  }
  if (factor === "Complementary skills") {
    return "Friendship doesn't cover missing skills - this pairing will cost you time you don't have.";
  }
  if (factor === "Study style") {
    return "Friendship doesn't fix work rhythm - this pairing will cost you time you don't have.";
  }
  return "Friendship doesn't fix the mismatch - this pairing will cost you time you don't have.";
}

export function maximumWeightMatching(
  students: MatchStudent[],
  blockedPairKeys = new Set<string>(),
): MatchingPlan {
  if (students.length <= 20) return exactMaximumWeightMatching(students, blockedPairKeys);
  return greedyMatching(students, blockedPairKeys);
}

export function formTeams(
  students: MatchStudent[],
  teamSize: number,
  blockedPairKeys = new Set<string>(),
): TeamFormationPlan {
  if (teamSize === 2) return maximumWeightMatching(students, blockedPairKeys);

  const targetTeamSize = Number.isFinite(teamSize) ? Math.max(3, Math.floor(teamSize)) : 3;
  const unassigned = [...students];
  const teamMembers = forcedRequestSubgroups(unassigned, targetTeamSize, blockedPairKeys);

  for (const team of teamMembers) {
    while (team.length < targetTeamSize) {
      const next = bestFitStudentForTeam(unassigned, team, blockedPairKeys);
      if (!next) break;
      team.push(next.student);
      removeStudent(unassigned, next.student.id);
    }
  }

  while (unassigned.length >= targetTeamSize) {
    const seed = bestSeedPair(unassigned, blockedPairKeys);
    if (!seed) break;

    const team = [seed.left, seed.right];
    removeStudent(unassigned, seed.left.id);
    removeStudent(unassigned, seed.right.id);

    while (team.length < targetTeamSize) {
      const next = bestFitStudentForTeam(unassigned, team, blockedPairKeys);
      if (!next) break;
      team.push(next.student);
      removeStudent(unassigned, next.student.id);
    }

    teamMembers.push(team);
  }

  for (const student of [...unassigned]) {
    const fit = bestFitExistingTeam(student, teamMembers, targetTeamSize, blockedPairKeys);
    if (!fit) continue;
    teamMembers[fit.teamIndex]?.push(student);
    removeStudent(unassigned, student.id);
  }

  const teams = teamMembers.map((team) => summarizeTeam(team));

  return {
    algorithm: "greedy-clustering",
    teamSize: targetTeamSize,
    teams,
    unmatchedIds: unassigned.map((student) => student.id),
    totalScore: teams.reduce((sum, team) => sum + team.pairScoreTotal, 0),
  };
}

function pairAllowed(a: MatchStudent, b: MatchStudent, blockedPairKeys: Set<string>) {
  return !blockedPairKeys.has(pairKey(a.id, b.id)) && !pairBlocked(a, b);
}

function oneSidedRequest(a: MatchStudent, b: MatchStudent) {
  return requestedBy(a, b) !== requestedBy(b, a);
}

function buildPair(
  a: MatchStudent,
  b: MatchStudent,
  blockedPairKeys: Set<string>,
  requestBonus = false,
): MatchingPlan["pairs"][number] | null {
  if (!pairAllowed(a, b, blockedPairKeys)) return null;
  const breakdown = matchBreakdown(a.answers, b.answers);
  const score =
    requestBonus && oneSidedRequest(a, b)
      ? clampScore(breakdown.final + ONE_SIDED_REQUEST_BONUS)
      : breakdown.final;
  return {
    aId: a.id,
    bId: b.id,
    score,
    breakdown,
  };
}

function betterPair(
  candidate: MatchingPlan["pairs"][number],
  current: MatchingPlan["pairs"][number] | null,
) {
  if (!current) return true;
  if (candidate.score !== current.score) return candidate.score > current.score;
  return pairKey(candidate.aId, candidate.bId) < pairKey(current.aId, current.bId);
}

function bestSeedPair(students: MatchStudent[], blockedPairKeys: Set<string>) {
  let best: {
    left: MatchStudent;
    right: MatchStudent;
    pair: MatchingPlan["pairs"][number];
  } | null = null;

  for (let i = 0; i < students.length; i += 1) {
    for (let j = i + 1; j < students.length; j += 1) {
      const left = students[i];
      const right = students[j];
      if (!left || !right) continue;
      const pair = buildPair(left, right, blockedPairKeys, true);
      if (!pair || !betterPair(pair, best?.pair ?? null)) continue;
      best = { left, right, pair };
    }
  }

  return best;
}

function averageFitForTeam(
  student: MatchStudent,
  team: MatchStudent[],
  blockedPairKeys: Set<string>,
) {
  if (!team.length) return null;
  let total = 0;

  for (const teammate of team) {
    const pair = buildPair(student, teammate, blockedPairKeys, true);
    if (!pair) return null;
    total += pair.score;
  }

  return total / team.length;
}

function bestFitStudentForTeam(
  candidates: MatchStudent[],
  team: MatchStudent[],
  blockedPairKeys: Set<string>,
) {
  let best: { student: MatchStudent; averageScore: number } | null = null;

  for (const student of candidates) {
    const averageScore = averageFitForTeam(student, team, blockedPairKeys);
    if (averageScore === null) continue;
    if (
      !best ||
      averageScore > best.averageScore ||
      (averageScore === best.averageScore && student.id < best.student.id)
    ) {
      best = { student, averageScore };
    }
  }

  return best;
}

function forcedRequestSubgroups(
  unassigned: MatchStudent[],
  targetTeamSize: number,
  blockedPairKeys: Set<string>,
) {
  const groups: MatchStudent[][] = [];

  while (true) {
    const seed = bestMutualSeedPair(unassigned, blockedPairKeys);
    if (!seed) break;

    const group = [seed.left, seed.right];
    removeStudent(unassigned, seed.left.id);
    removeStudent(unassigned, seed.right.id);

    while (group.length < targetTeamSize) {
      const next = bestMutualFitStudentForGroup(unassigned, group, blockedPairKeys);
      if (!next) break;
      group.push(next.student);
      removeStudent(unassigned, next.student.id);
    }

    groups.push(group);
  }

  return groups;
}

function bestMutualSeedPair(students: MatchStudent[], blockedPairKeys: Set<string>) {
  let best: {
    left: MatchStudent;
    right: MatchStudent;
    pair: MatchingPlan["pairs"][number];
  } | null = null;

  for (let i = 0; i < students.length; i += 1) {
    for (let j = i + 1; j < students.length; j += 1) {
      const left = students[i];
      const right = students[j];
      if (!left || !right || !mutualRequest(left, right)) continue;
      const pair = buildPair(left, right, blockedPairKeys);
      if (!pair || !betterPair(pair, best?.pair ?? null)) continue;
      best = { left, right, pair };
    }
  }

  return best;
}

function bestMutualFitStudentForGroup(
  candidates: MatchStudent[],
  group: MatchStudent[],
  blockedPairKeys: Set<string>,
) {
  let best: { student: MatchStudent; averageScore: number } | null = null;

  for (const student of candidates) {
    if (!group.some((member) => mutualRequest(student, member))) continue;
    const averageScore = rawAverageFitForTeam(student, group, blockedPairKeys);
    if (averageScore === null) continue;
    if (
      !best ||
      averageScore > best.averageScore ||
      (averageScore === best.averageScore && student.id < best.student.id)
    ) {
      best = { student, averageScore };
    }
  }

  return best;
}

function rawAverageFitForTeam(
  student: MatchStudent,
  team: MatchStudent[],
  blockedPairKeys: Set<string>,
) {
  if (!team.length) return null;
  let total = 0;

  for (const teammate of team) {
    const pair = buildPair(student, teammate, blockedPairKeys);
    if (!pair) return null;
    total += pair.score;
  }

  return total / team.length;
}

function bestFitExistingTeam(
  student: MatchStudent,
  teams: MatchStudent[][],
  targetTeamSize: number,
  blockedPairKeys: Set<string>,
) {
  let best: { teamIndex: number; averageScore: number } | null = null;

  for (let teamIndex = 0; teamIndex < teams.length; teamIndex += 1) {
    const team = teams[teamIndex];
    if (!team || team.length >= targetTeamSize + 1) continue;
    if (team.length >= targetTeamSize && team.some((member) => mutualRequest(student, member))) {
      continue;
    }
    const averageScore = averageFitForTeam(student, team, blockedPairKeys);
    if (averageScore === null) continue;
    if (
      !best ||
      averageScore > best.averageScore ||
      (averageScore === best.averageScore && teamIndex < best.teamIndex)
    ) {
      best = { teamIndex, averageScore };
    }
  }

  return best;
}

function removeStudent(students: MatchStudent[], id: string) {
  const index = students.findIndex((student) => student.id === id);
  if (index >= 0) students.splice(index, 1);
}

function summarizeTeam(team: MatchStudent[]): TeamMatchingPlan["teams"][number] {
  const pairs: MatchingPlan["pairs"] = [];

  for (let i = 0; i < team.length; i += 1) {
    for (let j = i + 1; j < team.length; j += 1) {
      const left = team[i];
      const right = team[j];
      if (!left || !right) continue;
      const breakdown = matchBreakdown(left.answers, right.answers);
      pairs.push({
        aId: left.id,
        bId: right.id,
        score: breakdown.final,
        breakdown,
      });
    }
  }

  const pairScoreTotal = pairs.reduce((sum, pair) => sum + pair.score, 0);

  return {
    memberIds: team.map((student) => student.id),
    averageScore: pairs.length ? Math.round(pairScoreTotal / pairs.length) : 0,
    pairScoreTotal,
    pairs,
  };
}

function exactMaximumWeightMatching(
  students: MatchStudent[],
  blockedPairKeys: Set<string>,
): MatchingPlan {
  type State = { pairCount: number; totalScore: number; pairs: MatchingPlan["pairs"] };
  const memo = new Map<number, State>();
  const n = students.length;
  const scoreMatrix = Array.from({ length: n }, () =>
    Array<number>(n).fill(Number.NEGATIVE_INFINITY),
  );
  const breakdownMatrix = Array.from({ length: n }, () =>
    Array<MatchBreakdown | null>(n).fill(null),
  );

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const left = students[i];
      const right = students[j];
      if (!left || !right || !pairAllowed(left, right, blockedPairKeys)) continue;
      const breakdown = matchBreakdown(left.answers, right.answers);
      scoreMatrix[i][j] = breakdown.final;
      breakdownMatrix[i][j] = breakdown;
    }
  }

  const better = (candidate: State, current: State) =>
    candidate.pairCount > current.pairCount ||
    (candidate.pairCount === current.pairCount && candidate.totalScore > current.totalScore);

  const solve = (mask: number): State => {
    if (mask === 0) return { pairCount: 0, totalScore: 0, pairs: [] };
    const cached = memo.get(mask);
    if (cached) return cached;

    let first = 0;
    while (first < n && (mask & (1 << first)) === 0) first += 1;

    let best = solve(mask & ~(1 << first));

    for (let j = first + 1; j < n; j += 1) {
      if ((mask & (1 << j)) === 0 || scoreMatrix[first][j] === Number.NEGATIVE_INFINITY) continue;
      const rest = solve(mask & ~(1 << first) & ~(1 << j));
      const left = students[first];
      const right = students[j];
      const breakdown = breakdownMatrix[first][j];
      if (!left || !right || !breakdown) continue;
      const candidate: State = {
        pairCount: rest.pairCount + 1,
        totalScore: rest.totalScore + scoreMatrix[first][j],
        pairs: [
          ...rest.pairs,
          {
            aId: left.id,
            bId: right.id,
            score: scoreMatrix[first][j],
            breakdown,
          },
        ],
      };
      if (better(candidate, best)) best = candidate;
    }

    memo.set(mask, best);
    return best;
  };

  const result = solve((1 << n) - 1);
  const matched = new Set(result.pairs.flatMap((pair) => [pair.aId, pair.bId]));
  return {
    algorithm: "maximum-weight",
    pairs: result.pairs.sort((a, b) => b.score - a.score),
    unmatchedIds: students
      .filter((student) => !matched.has(student.id))
      .map((student) => student.id),
    totalScore: result.totalScore,
  };
}

function greedyMatching(students: MatchStudent[], blockedPairKeys: Set<string>): MatchingPlan {
  const candidates: MatchingPlan["pairs"] = [];
  for (let i = 0; i < students.length; i += 1) {
    for (let j = i + 1; j < students.length; j += 1) {
      const left = students[i];
      const right = students[j];
      if (!left || !right || !pairAllowed(left, right, blockedPairKeys)) continue;
      const breakdown = matchBreakdown(left.answers, right.answers);
      candidates.push({
        aId: left.id,
        bId: right.id,
        score: breakdown.final,
        breakdown,
      });
    }
  }

  const used = new Set<string>();
  const pairs = candidates
    .sort((a, b) => b.score - a.score)
    .filter((pair) => {
      if (used.has(pair.aId) || used.has(pair.bId)) return false;
      used.add(pair.aId);
      used.add(pair.bId);
      return true;
    });

  return {
    algorithm: "greedy",
    pairs,
    unmatchedIds: students.filter((student) => !used.has(student.id)).map((student) => student.id),
    totalScore: pairs.reduce((sum, pair) => sum + pair.score, 0),
  };
}
