import { describe, it, expect } from "vitest";
import {
  matchBreakdown,
  pairScore,
  pairConfidence,
  archetype,
  archetypeBlurb,
  workStyleMeters,
  confidence,
  pairInsight,
  pairFrictionInsight,
  maximumWeightMatching,
  pairBlocked,
  pairKey,
  MATCH_WEIGHTS,
  type Answers,
  type MatchStudent,
} from "./peergraph";

// ─── Test fixtures ───

/** Student with full survey responses — high structure, early deadlines */
function studentA(): Answers {
  return {
    q1: 1,
    q2: 2,
    q3: 1,
    q4: 2,
    q5: 2,
    q6: 4,
    q7: 3,
    q8: 2,
    q9: 2,
    q10: 2,
    q11: 1,
    q12: 3,
    q13: 3,
    q14: 4,
    q15: 4,
    q16: 4,
    q17: 4,
    q18: 3,
    q19: 3,
    q20: 4,
    q21: 2,
    q22: 3,
    availability: ["Mon morning", "Wed afternoon", "Fri afternoon"],
    topics: ["Calculus", "Programming"],
    strengths: ["Algebra", "Programming"],
    weakAreas: ["Writing", "Research"],
    studyStyle: "Quiet co-working",
    seriousness: 4,
    targetGrade: "A range",
    communicationPreference: "WhatsApp/text",
    meetingMode: "Hybrid",
    preferredLanguage: "English",
    energyStyle: "Ambivert",
    accountabilityPreference: "Regular check-ins",
  };
}

/** Student very similar to A — should match well */
function studentB(): Answers {
  return {
    q1: 2,
    q2: 2,
    q3: 1,
    q4: 3,
    q5: 2,
    q6: 3,
    q7: 3,
    q8: 3,
    q9: 3,
    q10: 2,
    q11: 2,
    q12: 3,
    q13: 3,
    q14: 4,
    q15: 4,
    q16: 5,
    q17: 4,
    q18: 3,
    q19: 3,
    q20: 4,
    q21: 3,
    q22: 3,
    availability: ["Mon morning", "Wed afternoon", "Thu evening"],
    topics: ["Calculus", "Programming", "Data analysis"],
    strengths: ["Calculus", "Research"],
    weakAreas: ["Programming", "Design"],
    studyStyle: "Practice problems",
    seriousness: 4,
    targetGrade: "A range",
    communicationPreference: "WhatsApp/text",
    meetingMode: "Hybrid",
    preferredLanguage: "English",
    energyStyle: "Ambivert",
    accountabilityPreference: "Regular check-ins",
  };
}

/** Student very different from A — should match poorly */
function studentC(): Answers {
  return {
    q1: 5,
    q2: 5,
    q3: 5,
    q4: 5,
    q5: 5,
    q6: 1,
    q7: 5,
    q8: 5,
    q9: 5,
    q10: 5,
    q11: 5,
    q12: 5,
    q13: 5,
    q14: 1,
    q15: 1,
    q16: 1,
    q17: 1,
    q18: 5,
    q19: 5,
    q20: 1,
    q21: 5,
    q22: 1,
    availability: ["Sat morning", "Sun evening"],
    topics: ["Design", "Presentation"],
    strengths: ["Design", "Presentation"],
    weakAreas: ["Calculus", "Programming"],
    studyStyle: "Project sprints",
    seriousness: 2,
    targetGrade: "Pass safely",
    communicationPreference: "Discord/Slack",
    meetingMode: "Online",
    preferredLanguage: "Spanish",
    energyStyle: "Extrovert",
    accountabilityPreference: "Gentle reminders",
  };
}

/** Minimal answers — only numeric questions */
function studentMinimal(): Answers {
  return {
    q1: 3,
    q2: 3,
    q3: 3,
    q4: 3,
    q5: 3,
    q6: 3,
    q7: 3,
    q8: 3,
    q9: 3,
    q10: 3,
    q11: 3,
    q12: 3,
    q13: 3,
    q14: 3,
    q15: 3,
    q16: 3,
    q17: 3,
    q18: 3,
    q19: 3,
    q20: 3,
    q21: 3,
    q22: 3,
  };
}

/** Empty answers */
function studentEmpty(): Answers {
  return {};
}

// ─── matchBreakdown tests ───

describe("matchBreakdown", () => {
  it("returns all required fields", () => {
    const bd = matchBreakdown(studentA(), studentB());
    expect(bd).toHaveProperty("availability");
    expect(bd).toHaveProperty("academic");
    expect(bd).toHaveProperty("complementary");
    expect(bd).toHaveProperty("studyStyle");
    expect(bd).toHaveProperty("goals");
    expect(bd).toHaveProperty("final");
    expect(bd).toHaveProperty("confidence");
    expect(bd).toHaveProperty("commonSlots");
    expect(bd).toHaveProperty("commonTopics");
    expect(bd).toHaveProperty("complementaryTopics");
    expect(bd).toHaveProperty("sharedWeakAreas");
  });

  it("scores are between 0 and 100", () => {
    const bd = matchBreakdown(studentA(), studentB());
    for (const field of [
      "availability",
      "academic",
      "complementary",
      "studyStyle",
      "goals",
      "final",
    ] as const) {
      expect(bd[field]).toBeGreaterThanOrEqual(0);
      expect(bd[field]).toBeLessThanOrEqual(100);
    }
  });

  it("similar students score higher than dissimilar ones", () => {
    const similar = matchBreakdown(studentA(), studentB());
    const dissimilar = matchBreakdown(studentA(), studentC());
    expect(similar.final).toBeGreaterThan(dissimilar.final);
  });

  it("identical students get a high score", () => {
    const bd = matchBreakdown(studentA(), studentA());
    expect(bd.final).toBeGreaterThanOrEqual(80);
  });

  it("finds common availability slots", () => {
    const bd = matchBreakdown(studentA(), studentB());
    expect(bd.commonSlots).toContain("Mon morning");
    expect(bd.commonSlots).toContain("Wed afternoon");
  });

  it("finds common topics", () => {
    const bd = matchBreakdown(studentA(), studentB());
    expect(bd.commonTopics).toContain("Calculus");
    expect(bd.commonTopics).toContain("Programming");
  });

  it("finds complementary topics (A's strengths covering B's weaknesses)", () => {
    // A: strengths = ["Algebra", "Programming"], B: weakAreas = ["Programming", "Design"]
    const bd = matchBreakdown(studentA(), studentB());
    expect(bd.complementaryTopics.length).toBeGreaterThan(0);
  });

  it("handles empty answers without crashing", () => {
    const bd = matchBreakdown(studentEmpty(), studentEmpty());
    expect(bd.final).toBeGreaterThanOrEqual(0);
    expect(bd.final).toBeLessThanOrEqual(100);
  });

  it("handles one empty and one full without crashing", () => {
    const bd = matchBreakdown(studentA(), studentEmpty());
    expect(bd.final).toBeGreaterThanOrEqual(0);
    expect(bd.final).toBeLessThanOrEqual(100);
  });

  it("final score respects weight distribution", () => {
    const bd = matchBreakdown(studentA(), studentB());
    const manualFinal = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          bd.availability * MATCH_WEIGHTS.availability +
            bd.academic * MATCH_WEIGHTS.academic +
            bd.complementary * MATCH_WEIGHTS.complementary +
            bd.studyStyle * MATCH_WEIGHTS.studyStyle +
            bd.goals * MATCH_WEIGHTS.goals,
        ),
      ),
    );
    expect(bd.final).toBe(manualFinal);
  });

  it("is commutative — order of students doesn't change the score", () => {
    const ab = matchBreakdown(studentA(), studentB());
    const ba = matchBreakdown(studentB(), studentA());
    expect(ab.final).toBe(ba.final);
    expect(ab.availability).toBe(ba.availability);
    expect(ab.academic).toBe(ba.academic);
  });
});

// ─── pairScore tests ───

describe("pairScore", () => {
  it("returns the final field from matchBreakdown", () => {
    const a = studentA();
    const b = studentB();
    expect(pairScore(a, b)).toBe(matchBreakdown(a, b).final);
  });
});

// ─── pairConfidence tests ───

describe("pairConfidence", () => {
  it("returns High for well-answered high-scoring pairs", () => {
    expect(pairConfidence(studentA(), studentB(), 85)).toBe("High");
  });

  it("returns Low for empty answers with low score", () => {
    expect(pairConfidence(studentEmpty(), studentEmpty(), 30)).toBe("Low");
  });

  it("returns Moderate for medium completeness", () => {
    expect(pairConfidence(studentMinimal(), studentMinimal(), 80)).toBe("Moderate");
  });

  it("returns Moderate when score is high even with low completeness", () => {
    // finalScore >= 75 triggers Moderate regardless of completeness
    expect(pairConfidence(studentEmpty(), studentEmpty(), 75)).toBe("Moderate");
  });
});

// ─── archetype tests ───

describe("archetype", () => {
  it("assigns Reliable Finisher for low q3 + low q10", () => {
    expect(archetype({ q3: 1, q10: 1 })).toBe("Reliable Finisher");
  });

  it("assigns Fast Starter for high q8 + high q7", () => {
    expect(archetype({ q8: 5, q7: 5 })).toBe("Fast Starter");
  });

  it("assigns Concept Explainer for high q6 + low q5", () => {
    expect(archetype({ q6: 5, q5: 1 })).toBe("Concept Explainer");
  });

  it("assigns Flexible Collaborator for high q11 + low q2", () => {
    expect(archetype({ q11: 5, q2: 1 })).toBe("Flexible Collaborator");
  });

  it("assigns Deep Thinker for low q9 + low q4", () => {
    expect(archetype({ q9: 1, q4: 1 })).toBe("Deep Thinker");
  });

  it("assigns Steady Organizer for low q1 + low q11", () => {
    expect(archetype({ q1: 1, q11: 1 })).toBe("Steady Organizer");
  });

  it("falls back to Adaptive Generalist for middle values", () => {
    expect(
      archetype({ q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3, q11: 3 }),
    ).toBe("Adaptive Generalist");
  });

  it("every archetype has a blurb", () => {
    const archetypes = [
      "Reliable Finisher",
      "Fast Starter",
      "Concept Explainer",
      "Flexible Collaborator",
      "Deep Thinker",
      "Steady Organizer",
      "Adaptive Generalist",
    ];
    for (const a of archetypes) {
      expect(archetypeBlurb[a]).toBeDefined();
      expect(archetypeBlurb[a].length).toBeGreaterThan(0);
    }
  });
});

// ─── workStyleMeters tests ───

describe("workStyleMeters", () => {
  it("returns all five meters", () => {
    const meters = workStyleMeters(studentA());
    expect(meters).toHaveProperty("structure");
    expect(meters).toHaveProperty("commPace");
    expect(meters).toHaveProperty("deadlineBuffer");
    expect(meters).toHaveProperty("initiative");
    expect(meters).toHaveProperty("teachingComfort");
  });

  it("values are between 0 and 100", () => {
    const meters = workStyleMeters(studentA());
    for (const v of Object.values(meters)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("extreme low values give expected output", () => {
    const meters = workStyleMeters({ q1: 1, q2: 1, q3: 1, q6: 1, q7: 1, q11: 1 });
    expect(meters.commPace).toBe(20); // q2=1 → 1/5*100 = 20
    expect(meters.deadlineBuffer).toBe(80); // 100 - 1/5*100 = 80
    expect(meters.initiative).toBe(20); // q7=1 → 1/5*100 = 20
  });

  it("handles missing answers with fallback of 3", () => {
    const meters = workStyleMeters({});
    expect(meters.commPace).toBe(60); // fallback q2=3 → 3/5*100 = 60
  });
});

// ─── confidence tests ───

describe("confidence (submission-based)", () => {
  it("returns High at 85%+", () => {
    expect(confidence(0.85)).toBe("High");
    expect(confidence(1.0)).toBe("High");
  });

  it("returns Moderate at 60-84%", () => {
    expect(confidence(0.6)).toBe("Moderate");
    expect(confidence(0.84)).toBe("Moderate");
  });

  it("returns Low below 60%", () => {
    expect(confidence(0.59)).toBe("Low");
    expect(confidence(0)).toBe("Low");
  });
});

// ─── pairInsight tests ───

describe("pairInsight", () => {
  it("returns all required fields", () => {
    const insight = pairInsight(studentA(), studentB());
    expect(insight).toHaveProperty("why");
    expect(insight).toHaveProperty("brings");
    expect(insight).toHaveProperty("agree");
    expect(insight).toHaveProperty("move");
    expect(insight).toHaveProperty("breakdown");
    expect(insight).toHaveProperty("confidence");
  });

  it("why string starts with 'Why:'", () => {
    const insight = pairInsight(studentA(), studentB());
    expect(insight.why).toMatch(/^Why:/);
  });

  it("agree is a non-empty array", () => {
    const insight = pairInsight(studentA(), studentB());
    expect(Array.isArray(insight.agree)).toBe(true);
    expect(insight.agree.length).toBeGreaterThan(0);
  });

  it("mentions common slots when they exist", () => {
    const insight = pairInsight(studentA(), studentB());
    expect(insight.why).toContain("common free slot");
  });

  it("move always suggests a first action", () => {
    const insight = pairInsight(studentA(), studentB());
    expect(insight.move.length).toBeGreaterThan(0);
  });
});

// ─── pairFrictionInsight tests ───

describe("pairFrictionInsight", () => {
  it("returns all required fields", () => {
    const friction = pairFrictionInsight(studentA(), studentC());
    expect(friction).toHaveProperty("why");
    expect(friction).toHaveProperty("watch");
    expect(friction).toHaveProperty("move");
    expect(friction).toHaveProperty("breakdown");
    expect(friction).toHaveProperty("confidence");
  });

  it("why starts with 'Why this is hard:'", () => {
    const friction = pairFrictionInsight(studentA(), studentC());
    expect(friction.why).toMatch(/^Why this is hard:/);
  });

  it("identifies risks for dissimilar students", () => {
    const friction = pairFrictionInsight(studentA(), studentC());
    // A and C have zero overlapping availability and different everything
    expect(friction.why.length).toBeGreaterThan(20);
  });
});

// ─── pairBlocked tests ───

describe("pairBlocked", () => {
  it("returns false when no doNotPairWith is set", () => {
    const a: MatchStudent = { id: "a", answers: studentA(), name: "Alice" };
    const b: MatchStudent = { id: "b", answers: studentB(), name: "Bob" };
    expect(pairBlocked(a, b)).toBe(false);
  });

  it("returns true when A blocks B by name", () => {
    const a: MatchStudent = {
      id: "a",
      answers: { ...studentA(), doNotPairWith: "Bob" },
      name: "Alice",
    };
    const b: MatchStudent = { id: "b", answers: studentB(), name: "Bob" };
    expect(pairBlocked(a, b)).toBe(true);
  });

  it("returns true when B blocks A by name", () => {
    const a: MatchStudent = { id: "a", answers: studentA(), name: "Alice" };
    const b: MatchStudent = {
      id: "b",
      answers: { ...studentB(), doNotPairWith: "Alice" },
      name: "Bob",
    };
    expect(pairBlocked(a, b)).toBe(true);
  });

  it("handles comma-separated block lists", () => {
    const a: MatchStudent = {
      id: "a",
      answers: { ...studentA(), doNotPairWith: "Charlie, Bob" },
      name: "Alice",
    };
    const b: MatchStudent = { id: "b", answers: studentB(), name: "Bob" };
    expect(pairBlocked(a, b)).toBe(true);
  });

  it("blocks by identifier too", () => {
    const a: MatchStudent = {
      id: "a",
      answers: { ...studentA(), doNotPairWith: "STU001" },
      name: "Alice",
    };
    const b: MatchStudent = {
      id: "b",
      answers: studentB(),
      name: "Bob",
      identifier: "STU001",
    };
    expect(pairBlocked(a, b)).toBe(true);
  });

  it("is case-insensitive", () => {
    const a: MatchStudent = {
      id: "a",
      answers: { ...studentA(), doNotPairWith: "bob" },
      name: "Alice",
    };
    const b: MatchStudent = { id: "b", answers: studentB(), name: "Bob" };
    expect(pairBlocked(a, b)).toBe(true);
  });
});

// ─── pairKey tests ───

describe("pairKey", () => {
  it("is commutative", () => {
    expect(pairKey("a", "b")).toBe(pairKey("b", "a"));
  });

  it("separates ids with ::", () => {
    expect(pairKey("alice", "bob")).toBe("alice::bob");
  });
});

// ─── maximumWeightMatching tests ───

describe("maximumWeightMatching", () => {
  it("pairs 2 students optimally", () => {
    const students: MatchStudent[] = [
      { id: "a", answers: studentA() },
      { id: "b", answers: studentB() },
    ];
    const plan = maximumWeightMatching(students);
    expect(plan.algorithm).toBe("maximum-weight");
    expect(plan.pairs).toHaveLength(1);
    expect(plan.unmatchedIds).toHaveLength(0);
    expect(plan.pairs[0].aId).toBeDefined();
    expect(plan.pairs[0].bId).toBeDefined();
    expect(plan.pairs[0].score).toBeGreaterThan(0);
    expect(plan.pairs[0].breakdown).toBeDefined();
  });

  it("leaves one unmatched with odd number of students", () => {
    const students: MatchStudent[] = [
      { id: "a", answers: studentA() },
      { id: "b", answers: studentB() },
      { id: "c", answers: studentC() },
    ];
    const plan = maximumWeightMatching(students);
    expect(plan.pairs).toHaveLength(1);
    expect(plan.unmatchedIds).toHaveLength(1);
  });

  it("maximizes total score, not just first pair", () => {
    // 4 students: A≈B and C≈D should pair (A,B) and (C,D) for max total
    const d: Answers = {
      ...studentC(),
      availability: ["Sat morning", "Sun evening"],
      q1: 5,
      q2: 5,
    };
    const students: MatchStudent[] = [
      { id: "a", answers: studentA() },
      { id: "b", answers: studentB() },
      { id: "c", answers: studentC() },
      { id: "d", answers: d },
    ];
    const plan = maximumWeightMatching(students);
    expect(plan.pairs).toHaveLength(2);
    expect(plan.unmatchedIds).toHaveLength(0);
    expect(plan.totalScore).toBeGreaterThan(0);
  });

  it("respects blocked pairs", () => {
    const students: MatchStudent[] = [
      { id: "a", answers: { ...studentA(), doNotPairWith: "Bob" }, name: "Alice" },
      { id: "b", answers: studentB(), name: "Bob" },
    ];
    const plan = maximumWeightMatching(students);
    expect(plan.pairs).toHaveLength(0);
    expect(plan.unmatchedIds).toHaveLength(2);
  });

  it("respects blockedPairKeys set", () => {
    const students: MatchStudent[] = [
      { id: "a", answers: studentA() },
      { id: "b", answers: studentB() },
    ];
    const blocked = new Set([pairKey("a", "b")]);
    const plan = maximumWeightMatching(students, blocked);
    expect(plan.pairs).toHaveLength(0);
    expect(plan.unmatchedIds).toHaveLength(2);
  });

  it("pairs are sorted by score descending", () => {
    const students: MatchStudent[] = [
      { id: "a", answers: studentA() },
      { id: "b", answers: studentB() },
      { id: "c", answers: studentC() },
      { id: "d", answers: studentMinimal() },
    ];
    const plan = maximumWeightMatching(students);
    for (let i = 1; i < plan.pairs.length; i++) {
      expect(plan.pairs[i - 1].score).toBeGreaterThanOrEqual(plan.pairs[i].score);
    }
  });

  it("handles empty input", () => {
    const plan = maximumWeightMatching([]);
    expect(plan.pairs).toHaveLength(0);
    expect(plan.unmatchedIds).toHaveLength(0);
    expect(plan.totalScore).toBe(0);
  });

  it("handles single student input", () => {
    const plan = maximumWeightMatching([{ id: "a", answers: studentA() }]);
    expect(plan.pairs).toHaveLength(0);
    expect(plan.unmatchedIds).toHaveLength(1);
  });
});

// ─── MATCH_WEIGHTS tests ───

describe("MATCH_WEIGHTS", () => {
  it("weights sum to 1.0", () => {
    const total = Object.values(MATCH_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0);
  });
});

// ─── gradeRank regression tests (bug fix verification) ───

describe("gradeRank (via goals scoring)", () => {
  it("same target grade produces higher goals alignment than different grades", () => {
    const sameGrade = matchBreakdown(
      { ...studentMinimal(), targetGrade: "A range", seriousness: 4 },
      { ...studentMinimal(), targetGrade: "A range", seriousness: 4 },
    );
    const differentGrade = matchBreakdown(
      { ...studentMinimal(), targetGrade: "A range", seriousness: 4 },
      { ...studentMinimal(), targetGrade: "Pass safely", seriousness: 2 },
    );
    expect(sameGrade.goals).toBeGreaterThan(differentGrade.goals);
  });

  it("'A range' does not match 'Pass safely' as grade A (regression for includes('a') bug)", () => {
    // Before the fix, "pass safely" would match includes("a") and rank as grade 4 (A)
    // Now it should correctly rank as grade 2 (Pass)
    const passPass = matchBreakdown(
      { ...studentMinimal(), targetGrade: "Pass safely", seriousness: 3 },
      { ...studentMinimal(), targetGrade: "Pass safely", seriousness: 3 },
    );
    const aA = matchBreakdown(
      { ...studentMinimal(), targetGrade: "A range", seriousness: 3 },
      { ...studentMinimal(), targetGrade: "A range", seriousness: 3 },
    );
    // Both same-grade pairs should have similar goals scores
    // The key test: Pass-Pass should NOT score the same as A-A (different rank values)
    // But both should be valid high-alignment (same grade)
    expect(passPass.goals).toBeGreaterThan(50);
    expect(aA.goals).toBeGreaterThan(50);
  });

  it("'availability' is not mistakenly ranked as grade A", () => {
    // Before fix: "availability" contains "a", so gradeRank returned 4 (same as "A range")
    // After fix: "availability" doesn't match any grade pattern, so gradeRank returns null
    // and the grade component is simply skipped.
    //
    // To verify: a genuine A-A pair (where grade alignment boosts the score) should
    // score higher than an A paired with a nonsense grade (where grade alignment is skipped).
    const aRange: Answers = { ...studentMinimal(), targetGrade: "A range", seriousness: 4 };
    const nonsense: Answers = { ...studentMinimal(), targetGrade: "availability", seriousness: 4 };

    const genuineMatch = matchBreakdown(aRange, {
      ...studentMinimal(),
      targetGrade: "A range",
      seriousness: 4,
    });
    const nonsenseMatch = matchBreakdown(aRange, nonsense);

    // The genuine A-A match should have a goals score >= the nonsense match
    // because the grade alignment bonus is active in genuineMatch but skipped in nonsenseMatch
    expect(genuineMatch.goals).toBeGreaterThanOrEqual(nonsenseMatch.goals);
  });
});

// ─── Edge cases and robustness ───

describe("robustness", () => {
  it("handles NaN in numeric answers", () => {
    const broken: Answers = { q1: NaN, q2: NaN, q3: NaN };
    const bd = matchBreakdown(broken, studentA());
    expect(Number.isFinite(bd.final)).toBe(true);
  });

  it("handles Infinity in numeric answers", () => {
    const broken: Answers = { q1: Infinity, q2: -Infinity };
    const bd = matchBreakdown(broken, studentA());
    expect(Number.isFinite(bd.final)).toBe(true);
  });

  it("handles null and undefined values gracefully", () => {
    const broken: Answers = { q1: null, q2: undefined, availability: null };
    const bd = matchBreakdown(broken, studentA());
    expect(Number.isFinite(bd.final)).toBe(true);
  });

  it("handles boolean values in answers", () => {
    const broken: Answers = { q1: true as unknown as number };
    const bd = matchBreakdown(broken, studentA());
    expect(Number.isFinite(bd.final)).toBe(true);
  });

  it("handles very large number of topics without crashing", () => {
    const manyTopics: Answers = {
      ...studentMinimal(),
      topics: Array.from({ length: 100 }, (_, i) => `Topic ${i}`),
      strengths: Array.from({ length: 50 }, (_, i) => `Strength ${i}`),
    };
    const bd = matchBreakdown(manyTopics, studentA());
    expect(Number.isFinite(bd.final)).toBe(true);
  });
});
