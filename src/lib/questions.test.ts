import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./questions";

describe("survey question bank", () => {
  it("keeps the stable q1-q22 ids used by stored survey answers", () => {
    expect(QUESTIONS).toHaveLength(22);
    expect(QUESTIONS.map((question) => question.id)).toEqual(
      Array.from({ length: 22 }, (_, index) => `q${index + 1}`),
    );
  });

  it("keeps core questions focused on behavior instead of protected traits", () => {
    const copy = QUESTIONS.flatMap((question) => [
      question.framing,
      question.question,
      question.low,
      question.high,
    ])
      .join(" ")
      .toLowerCase();

    expect(copy).toContain("project");
    expect(copy).toContain("team");
    expect(copy).not.toMatch(/\b(gender|race|religion|disability|income)\b/);
  });
});
