import { describe, expect, it } from "vitest";
import {
  exampleClassIdentifier,
  normalizeClassIdentifier,
  normalizeIdentifierPrefix,
  normalizeStudentIdentifier,
} from "./class-flow";

describe("class identifier formatting", () => {
  it("normalizes basic identifiers without changing their meaning", () => {
    expect(normalizeStudentIdentifier(" SP25 - BCS - 006 ")).toBe("sp25-bcs-006");
  });

  it("normalizes a roll prefix from different university-style spacing", () => {
    expect(normalizeIdentifierPrefix(" SP25 BCS ")).toBe("sp25-bcs");
  });

  it("lets students enter only the numeric ending when a prefix is configured", () => {
    expect(
      normalizeClassIdentifier("006", {
        identifierType: "roll",
        identifierPrefix: "SP25-BCS",
        identifierSuffixDigits: 3,
      }),
    ).toBe("sp25-bcs-006");
  });

  it("accepts the full roll number even if the student misses dashes or casing", () => {
    expect(
      normalizeClassIdentifier("sp25bcs6", {
        identifierType: "roll",
        identifierPrefix: "SP25-BCS",
        identifierSuffixDigits: 3,
      }),
    ).toBe("sp25-bcs-006");
  });

  it("supports classes whose roll numbers are only the numeric part", () => {
    expect(
      normalizeClassIdentifier("6", {
        identifierType: "roll",
        identifierSuffixDigits: 3,
      }),
    ).toBe("006");
  });

  it("builds a readable example from the configured format", () => {
    expect(
      exampleClassIdentifier({
        identifierType: "roll",
        identifierPrefix: "SP25-BCS",
        identifierSuffixDigits: 3,
      }),
    ).toBe("sp25-bcs-006");
  });
});
