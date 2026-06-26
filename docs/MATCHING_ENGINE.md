# Matching Engine

The matching engine lives in `src/lib/synco.ts`. It converts survey answers and peer references into scores, team assignments, explanations, and risk messages.

## Inputs

The main input type is:

```ts
type MatchStudent = {
  id: string;
  answers: Answers;
};
```

At publish time the route enriches students with:

- Name.
- Archetype.
- Identifier.

## Survey Inputs Used

Synco uses:

- 22 slider questions.
- Availability selections.
- Strengths.
- Weak areas.
- Study styles.
- Planning style.
- Deadline behavior.
- Ambiguity handling.
- Working mode.
- Check-in rhythm.
- Response expectation.
- Delivery reliability.
- Momentum style.
- Team role preference.
- Conflict style.
- Project outcome target.
- Role flexibility.
- Target grade.
- Communication preferences.
- Meeting modes.
- Languages.
- Energy style.
- Accountability preference.
- Privacy preference.
- Friend/request/do-not-pair text fields.

The engine should keep using the full survey. Avoid reducing matching to only "skills"; skill matching is strongest when it checks complementarity and coverage.

## Pair Scoring

The central pair function is:

```ts
matchBreakdown(a: Answers, b: Answers): MatchBreakdown
```

The final score combines:

- Availability.
- Academic fit.
- Complementary skills.
- Study style.
- Goals.
- Confidence.

The publish payload describes weights as:

```text
29% availability,
21% academic fit,
24% complementary skills,
16% study style,
10% goals,
with a penalty for duplicate skills that do not cover weak areas
```

Important: do not treat duplicate strengths as automatically good. The current model penalizes skill redundancy when students do not cover each other's weak areas.

## Pair Outputs

Important pair-level exports:

- `pairScore(a, b)`
- `pairInsight(a, b)`
- `pairFrictionInsight(a, b)`
- `pairRiskScore(a, b)`
- `pairIsRisky(a, b)`
- `matchProofs(a, b)`
- `riskProofs(a, b)`
- `friendRiskInsight(a, b, signals)`

## Archetypes

`archetype(answers)` returns one of the current work-style labels such as:

- Reliable Finisher.
- Fast Starter.
- Concept Explainer.
- Steady Organizer.
- Deep Thinker.
- Flexible Collaborator.

These are used for student result profiles, team cards, and readiness text.

## Work-Style Meters

`workStyleMeters(answers)` produces:

- Structure.
- Communication pace.
- Deadline buffer.
- Initiative.
- Teaching comfort.

These power the result profile meters.

## Peer References

Optional survey fields:

- `wantToWorkWith`
- `friendsInClass`
- `doNotPairWith`

Each field accepts names or identifiers separated by commas, semicolons, or new lines.

Synco resolves references by:

- Exact student IDs if future ID-backed inputs exist.
- Identifiers/roll numbers.
- Unique names.
- Loose normalized text matching.

If a name is ambiguous, Synco ignores it instead of guessing the wrong student. The lead publish page warns about ambiguous references and asks students to use identifiers when names repeat.

## Do-Not-Pair Rules

`pairBlocked` and signal-aware variants ensure blocked pairs are never placed together.

For publishing and team formation, use:

```ts
const signals = buildPeerSignalMap(students);
pairBlockedBySignals(a, b, signals);
```

The signal map is class-aware and safer than raw name matching.

## Mutual Requests

`mutualRequest(a, b)` is true only when both students list each other in `wantToWorkWith`.

In team formation:

- Mutual requests are forced up to team size.
- One-sided requests add a score bonus.
- Requests do not override do-not-pair blocks.

## Friend Reality Check

`friendsInClass` is one-directional. If a student flags someone as a friend and the score is low, Synco can show a blunt warning.

`friendRiskInsight(a, b, signals)` returns a message only when:

- Student `a` flagged student `b` as a friend.
- The pair score is low enough to belong in the risk/watch-out range.

The message uses the weakest factor, such as availability or study style.

## Team Formation

The public function is:

```ts
formTeams(students, teamSize, blockedPairKeys);
```

Rules:

- If `teamSize === 2`, it delegates to `maximumWeightMatching`.
- If `teamSize >= 3`, it forms teams through class-level assignment logic.
- It respects blocked pairs.
- It prioritizes balanced teams over simply stacking similar students.
- It accounts for team quality, skill coverage, role coverage, request satisfaction, and risk.
- It places leftovers into the best-fitting existing team when possible.

## Matching Plans

For pair teams, `MatchingPlan` contains:

- `pairs`
- `unmatchedIds`
- `totalScore`
- `algorithm`

For teams of 3+, `TeamMatchingPlan` contains:

- `teams`
- `unmatchedIds`
- `totalScore`
- `algorithm`

## Team Quality

`teamBreakdown(team, signals)` evaluates a whole team.

Important quality dimensions:

- Average pair fit.
- Worst pair fit.
- Availability.
- Academic fit.
- Complementary skills.
- Study style.
- Goals.
- Skill coverage.
- Role coverage.
- Role balance.
- Request satisfaction.
- Risk flags.

This is why the system should not only optimize pair scores. A team can have decent pair averages but still be weak if everyone brings the same role or has the same blind spot.

## Team Assignment Snapshot

`buildTeamAssignmentSnapshot` in `src/lib/team-assignments.ts` converts a matching plan into a saved JSON snapshot:

- Results version.
- Generated timestamp.
- Team size.
- Algorithm name.
- Teams.
- Members.
- Average score.
- Quality score.
- Rationale.
- Unmatched members.
- Total score.

The snapshot is stored in `classes.team_assignments`.

## Publish-Time Result Payload

Each `match_results.result_data` row includes:

- Results version.
- Generated timestamp.
- Archetype.
- Work-style meters.
- Top matches.
- Avoid/watch-out peers.
- Comparison peers.
- Readiness card.
- Assigned team ID.
- Assigned partner ID for team size 2.
- Matching algorithm label.
- Matching weights.
- Submitted count.
- Expected count.
- Feedback after week, once submitted.

## Privacy In Matching Output

The engine can compute with raw answers, but public output is filtered through helpers:

- `publicPeerName`
- `publicPeerIdentifier`
- `publicInsightForPeer`
- `publicFrictionForPeer`

This lets Synco keep matching accurate while respecting student display choices.

## Tests

The main tests live in:

```text
src/lib/synco.test.ts
```

Coverage includes:

- Pair scoring.
- Risk logic.
- Team formation.
- Duplicate-role avoidance.
- Mutual requests.
- Blocked pairs.
- Friend risk.
- Peer reference resolution.
- Roll/identifier matching.

Run:

```bash
npm test
```

## Future Matching Improvements

High-value future ideas:

- More validation around survey answer completeness.
- A teacher-facing "why this team" expansion.
- Lead-visible team quality breakdown export.
- More robust comparison search by normalized identifier.
- Calibration tests using real anonymized class outcomes.
- Feedback loop that compares published matches to student feedback after projects.
