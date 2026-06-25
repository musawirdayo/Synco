# Stronger Team Matching for Synco

Synco should not behave like a personality sorter. The evidence on student teamwork points in a different direction: the biggest practical drivers of success are compatible logistics, clear norms, good-quality communication, trust, accountable contribution, and role or skill coverage that fits the task. Collaborative learning can improve achievement and teamwork skills, but those gains are not automatic; poorly composed or poorly supported teams can create resentment, conflict, and free-riding instead. That means Synco’s matcher should treat team formation as a constrained optimisation problem with a safety floor, not as a “find similar people” exercise. citeturn32view0turn11view2turn34view0turn31view2turn26search0

A stronger Synco design therefore needs four layers working together. First, it needs a short, behaviourally anchored survey that asks about how students plan, communicate, meet deadlines, ask for help, and cover skills. Second, it needs sub-scores that separate “needs to match” factors from “should complement” factors. Third, it needs a team-level algorithm that protects against unsafe pairings, duplicated roles, no-meeting-time teams, and one-person-sacrifice teams. Fourth, it needs explanations that are plain, practical, and privacy-conscious. The system should help, not overclaim: it can reduce obvious mismatch and surface better options, but it cannot guarantee performance. citeturn17view0turn17view2turn7view5turn7view6turn7view7turn31view0

## Research foundation

### What the evidence says

Research on student teamwork repeatedly comes back to a fairly stable set of conditions. Effective teams tend to have clear goals, explicit expectations, open and respectful communication, defined responsibilities, trust, and ways to address conflict and unequal contribution early. Reviews of higher-education group projects also emphasise milestones, norms, and accountability rather than hoping students will “just work it out”. citeturn11view2turn32view0turn12search9

Communication matters, but not in the simplistic sense of “more messages = better teamwork”. A meta-analysis of team communication found that communication quality has a much stronger relationship with team performance than communication frequency, and that information elaboration and knowledge sharing matter more than mere message volume. Familiar, face-to-face teams also showed a stronger communication–performance link. For Synco, that means aligning communication rhythm and expectations is more useful than rewarding hyperactive chatters. citeturn31view2turn27search5

Trust is another major signal. A meta-analysis found intrateam trust positively related to team performance, with an above-average effect size. Conflict, by contrast, is costly: relationship conflict is strongly and negatively associated with performance and satisfaction, and even task conflict can spill into relationship conflict if not handled well. In classroom settings, that argues for a “minimum pair safety” rule inside every team, rather than allowing one visibly bad pairing because the team’s average score looks good. citeturn26search0turn13search12turn13search24

Personality is relevant, but broad type labels should only play a supporting role. Meta-analytic evidence shows that teams with higher average agreeableness and conscientiousness perform somewhat better, while greater variability in those traits tends to hurt performance. Bell’s meta-analysis goes further: team minimum agreeableness and team mean conscientiousness were among the strongest deep-level predictors. The practical translation is not “sort by personality type”; it is “protect against teams with no co-operative floor and no follow-through floor”. citeturn7view8turn24search0

Diversity findings are more nuanced than most product pitches imply. Task-related diversity is more consistently useful than biodemographic diversity, especially when the diversity concerns skills, knowledge, or relevant perspectives. But the overall average link between diversity and performance is small and context-dependent. A large recent meta-analysis found the average linear relationships between demographic, job-related, and cognitive diversity and performance to be positive but insubstantial overall, with more favourable results in complex, creative, and innovative tasks. That is exactly the pattern Synco should follow: use complementarity for skills and perspectives where the task benefits from it, but do not assume “more diversity” or “more similarity” is universally better. citeturn30search1turn31view0turn31view1

Friendship is helpful on average, but it is not a free pass. A meta-analysis covering 1,016 groups found that friendship had a positive average effect on group task performance, with stronger effects in larger groups and on tasks emphasising quantity of output rather than a single high-quality deliverable. Other work, including student design-project research, found that prior friendship can correlate with worse performance in some contexts, especially when it reduces criticism, increases off-task behaviour, or creates mixed-friendship cliques. Synco should therefore treat friend requests as a bounded preference bonus, not as a dominant rule. citeturn19view2turn19view1turn20view0

The most common failure modes in student teams are also well known. Social loafing rises with project scope and team size; multiple peer evaluations during the project can reduce it. Students also report trouble when roles are unclear, communication stalls, deadlines slip, expectations are ambiguous, or goals diverge sharply within the team. Instructors and students in studies of algorithmic team formation additionally ask for more transparency and better explanations of why teams were built the way they were. citeturn34view0turn14view2turn11view0turn11view2turn17view0turn17view2

### What Synco should optimise

For classroom project teams, the strongest first-order factors are not “compatible archetypes”. They are meeting-time overlap, willingness to contribute, aligned seriousness, workable communication expectations, and a minimum floor of co-operativeness and reliability. If those basics fail, even complementary skills will not save the team. That is the main reason your current “two Reliable Finishers” problem happens: the system is rewarding local similarity without checking whether the team as a whole has breadth, coverage, or internal safety. citeturn10view1turn24search0turn34view0turn31view2

A practical ranking for Synco is:

| Priority tier | Factors | Why |
|---|---|---|
| First-order gatekeepers | Availability overlap, blocked pairs, severe goal mismatch, severe reliability mismatch | These are common breakpoints for team viability. |
| First-order fit | Communication rhythm, response expectations, deadline pace, seriousness, target outcome | These drive day-to-day coordination and perceived fairness. |
| Second-order structure | Skill complementarity, role coverage, no duplicate overload, no isolated student | These improve task coverage and reduce “everyone brings the same thing”. |
| Third-order nuance | Thinking approach, initiative mix, leadership balance, friend requests | Valuable when the safety and logistics floor is already met. |
| Low-weight or explanation-only | Broad personality labels, self-described archetypes | Evidence is too coarse for primary matching. |

That ranking is consistent with the literature and with how automated team-formation tools are perceived in practice: students and instructors want rational criteria, but they also want to know why those criteria were chosen and how they affected the outcome. citeturn17view0turn17view2turn8view0turn8view1

## Recommended factor model

### Similarity, complementarity, and balanced diversity

The cleanest way to strengthen Synco is to split factors by the type of matching they deserve.

**Similarity-based factors** should be the backbone of the model. These are the variables where mismatch usually creates friction, missed meetings, or perceived unfairness. In Synco, similarity should be rewarded for availability, meeting mode, response-time expectations, deadline pace, seriousness, target outcome, and privacy boundaries. Reliability should also contain a similarity element, because large gaps in dependable delivery often drive resentment and social loafing complaints. citeturn10view1turn31view2turn34view0turn11view2

**Complementarity-based factors** should apply mostly to what students contribute to the work itself. These are skills, project strengths, weak-area coverage, and some task roles. If one student is strong in structuring a report and another is strong in building a prototype, that is real complementarity. If both mainly bring the same scarce strength while sharing the same gaps, the team does not get broader. This is where your current system should become much stricter. citeturn30search1turn17view1

**Balanced-diversity factors** sit in the middle. For thinking approach, planning style, initiative, and leadership preference, the goal is rarely “as similar as possible” or “as different as possible”. The healthier target is usually moderate spread without polar clash. For example, a team can benefit from having both someone who explores options and someone who narrows decisions, but a team with only explorers, or only controllers, often struggles. Likewise, one or two students comfortable coordinating can help, but too many “must lead” responses create friction, while a team of four with nobody willing to coordinate creates drift. citeturn31view0turn32view0turn11view2

A practical Synco rule is therefore:

| Matching mode | Use for | Desired pattern |
|---|---|---|
| Similarity | Availability, meeting mode, message-response expectations, deadline pace, seriousness, target outcome, privacy | High similarity is good |
| Complementarity | Skill strengths, weak-area coverage, project-role coverage | High complementarity is good |
| Balanced diversity | Thinking approach, planning approach, initiative, leadership/followership, conflict approach | Moderate diversity is good; extreme mismatch is bad |

### What not to use as primary matching logic

Synco should be explicit about what it is **not** doing.

The **Big Five** remains the best-supported broad personality framework in the team literature, but even there the evidence is about averages, minima, and tendencies, not rigid student “types”. If you use the literature at all, use it indirectly to justify narrow behavioural items such as follow-through, co-operativeness, initiative, and openness to new ideas. Do not ask students to take a long personality inventory unless you have a compelling pedagogical reason. citeturn7view8turn24search0

**MBTI** should not be a primary matcher. It has long-standing psychometric criticisms, and more recent work continues to note weak evidence for its predictive use in leadership-related behaviour. It can be interesting as a reflection prompt, but it is not a strong basis for allocating classroom teams. citeturn21search4turn21search5

**Belbin** is more useful as a language for discussing team contributions than as a hard assignment engine. Its evidence base is mixed, and reviews note weak discriminant validity among some scales. If Synco wants role language, it should derive lightweight role signals from behaviour and skills rather than importing Belbin wholesale. citeturn14view4

**DISC** is popular and may be useful in facilitation contexts, but the evidence base located here is far thinner and more vendor-led than the Big Five literature. That makes it a weak choice for a research-facing classroom matcher. citeturn23view0

**Learning styles** in the VARK or “meshing hypothesis” sense should be avoided. The evidence does not support matching instruction to a student’s preferred sensory style as a reliable route to better learning outcomes. For Synco, the better concept is **working mode preference**—for example, solo-first versus live co-working—not “visual learner” versus “auditory learner”. citeturn31view4

The broader fairness lesson is equally important: do not use protected traits or sensitive personal data in the production matcher. Educational algorithms can reproduce social bias, create allocative harms, and become opaque. Synco should be explainable, human-centred, privacy-minimising, and overrideable by a teacher or class lead when necessary. citeturn7view5turn7view6turn7view7

## Synco survey question bank

### Survey design principles

The survey should be short enough to finish in roughly five to seven minutes, mostly multiple-choice, and behaviourally anchored rather than psychologically diagnostic. Required questions should focus on viability and collaboration. Optional questions should cover preferences, friend requests, and explanations. Avoid asking anything clinical, financial, family-related, or identity-related. Because self-report can be noisy, especially on “good student” traits, Synco should treat certain questions as coarse signals and later strengthen them with behavioural feedback only if the course policy allows that. citeturn17view2turn34view0turn31view4

### Proposed questions

The table below is a practical Synco question bank. The wording is student-facing.

| Question | Answer options | Signal measured | Use in model | Required or optional | Caution |
|---|---|---|---|---|---|
| **Which times could you reliably meet for this project most weeks?** | Weekly availability grid; plus “I can only do asynchronous collaboration this term.” | Availability overlap | Similarity, hard feasibility, explanation | Required | High value; do not overcomplicate the grid |
| **If your team needs live meetings, which format usually works for you?** | Mostly in person; mostly online; either works; asynchronous only | Meeting mode | Similarity, feasibility, explanation | Required | Keep separate from full availability |
| **How do you prefer to plan project work?** | Detailed plan early; rough milestones then adapt; light plan and adjust as we go; I prefer someone else to set the structure | Planning style | Similarity and balanced diversity | Required | Reliable enough if framed as preference rather than trait |
| **When do you usually begin your share of the work?** | As soon as the task is clear; steadily over time; once the team has a solid direction; close to the deadline but in a focused burst | Deadline behaviour | Similarity, risk detection, explanation | Required | Self-report can be flattering |
| **If the brief is unclear, what is your first move?** | Brainstorm options; research examples/data; ask clarifying questions; outline a step-by-step plan; make a quick draft/prototype | Thinking approach under ambiguity | Balanced diversity, explanation | Required | Good behavioural proxy for “thinking style” |
| **How do you prefer to work through ideas?** | Think alone first then share; work in pairs/small splits; work together live; depends on task | Working mode | Similarity, explanation | Required | Avoid calling this “learning style” |
| **How often do you like team check-ins during an active project?** | Daily short updates; 2–3 times per week; weekly scheduled check-in; milestone-only check-ins | Communication rhythm | Similarity, explanation | Required | More about norm alignment than frequency itself |
| **What response time do you usually consider reasonable for team messages?** | Within a few hours; by the end of the day; within 24 hours; I prefer scheduled check-ins over frequent messaging | Communication expectation | Similarity, risk detection | Required | Strong friction reducer |
| **If you agree to a task with a deadline, how often do you deliver on time?** | Almost always; usually; about half the time; often late | Delivery reliability | Similarity, risk detection, explanation | Required | Sensitive to self-presentation; use coarsely |
| **When a team needs momentum, what do you usually do?** | Start the first draft; turn ideas into a plan; keep people organised; wait for a clear task and then execute | Initiative | Similarity and role coverage | Required | This is better than asking “Are you a leader?” |
| **What role do you prefer in a team?** | Happy coordinating; happy sharing leadership; prefer a focused contributor role; prefer a support/review role | Leadership/followership | Balanced diversity, role coverage, explanation | Required | Do not make this destiny |
| **When you disagree with teammates, what do you usually do?** | Raise it early and directly; ask questions and look for middle ground; try their approach first; involve the class lead only if the team is stuck | Conflict style | Similarity, risk detection, explanation | Required | Keep neutral; no “good/bad” language |
| **How comfortable are you asking teammates for help when you are stuck?** | 5-point scale from “Very uncomfortable” to “Very comfortable” | Help-seeking | Balanced diversity, explanation | Required | Useful for pairing isolated strugglers with supportive peers |
| **How comfortable are you helping teammates in an area you know well?** | 5-point scale from “Very uncomfortable” to “Very comfortable” | Help-giving | Balanced diversity, role coverage, explanation | Required | Good for learning-oriented courses |
| **How seriously are you treating this project?** | I mainly want to pass; I want a solid result; I want a strong grade; I want an excellent result; I want portfolio/showcase quality if possible | Motivation/seriousness | Similarity, risk detection, explanation | Required | Very important for goal alignment |
| **What matters most to you in this project?** | Learn new skills; finish efficiently; get the best grade possible; produce something I can proudly show; have a steady low-friction team experience | Target outcome | Similarity, explanation | Required | Use “primary goal” only to keep it quick |
| **Choose up to three areas you can contribute strongly.** | Instructor-defined or course-wide skill list, e.g. research, data analysis, design, coding, writing, presenting, organising, project management, prototyping | Skill strengths | Complementarity, role coverage, explanation | Required | Better than asking for GPA |
| **Choose up to three areas where you would most value support from teammates.** | Same skill list | Skill gaps / support needs | Complementarity, explanation | Optional but strongly encouraged | Safe if framed as support, not weakness |
| **If your team needs it, which roles would you be comfortable covering?** | Organiser/scheduler; researcher; writer/editor; builder/maker/coder; analyst; presenter/facilitator; quality checker | Role flexibility | Role coverage, explanation | Optional | Useful when strengths data are sparse |
| **If possible, is there a classmate you would especially like to work with?** | Up to two names; “no preference” | Friend/request preference | Friend handling | Optional | Cap requests to prevent gaming |
| **Is there a classmate you should not be assigned with for this project?** | Up to two names; “no preference” | Avoid/block preference | Blocked-pair handling, risk detection | Optional and confidential | Very sensitive; keep private and rate-limited |
| **How should Synco explain your matches to others?** | Broad reasons only; broad reasons plus skills; team-level reasons only; do not mention my individual preferences to classmates | Privacy preference | Explanation policy | Required | Strong classroom-safety feature |

Two things should be deliberately excluded. First, there should be no protected-trait questions in the matching survey. Second, there should be no VARK-style “how do you learn best?” question. If Synco needs more data later, the best additions are course-specific skill items or a mid-project pulse, not deeper personality labelling. citeturn7view5turn7view7turn31view4

## Scoring rubric

### Pair-level sub-scores

The pair model should separate feasibility, fit, and risk. A good default is to score each sub-score on a 0–100 scale, then combine them into a confidence-adjusted pair score.

A useful adjustment is:

```text
base_pair(i,j) = weighted mean of observed sub-scores
confidence(i,j) = observed_weight / total_possible_weight
adjusted_pair(i,j) = confidence * base_pair + (1 - confidence) * 50
```

This treats missing answers as **unknown**, not as bad. Neutral 50 prevents students with sparse data from being accidentally overranked or unfairly punished.

The recommended pair-level rubric is below.

| Sub-score | How to calculate | Suggested default weight | Desired pattern | Missing-answer rule |
|---|---|---:|---|---|
| **Logistical fit** | Availability overlap score + meeting-mode compatibility. A simple version is: `0.8 * overlap_ratio + 0.2 * mode_match`, scaled to 100. Impose a hard floor if overlap is below the course minimum. | 22 | High similarity | If availability missing, pair cannot be auto-suggested; teacher review flag |
| **Working-style fit** | Compare planning style, work mode, initiative pace, and deadline behaviour using distance-based similarity. Prefer same or adjacent answers; penalise opposite ends. | 16 | Mostly similarity | Drop unanswered items; no penalty beyond lower confidence |
| **Thinking-style fit** | Use ambiguity-response items. Score same or adjacent responses highest; allow modest bonus for one-step complementarity; penalise polar opposites. | 8 | Balanced diversity | Neutral if missing |
| **Motivation/goals fit** | Compare seriousness and target outcome; use strong penalties for “minimal pass” paired with “portfolio/showcase” when project stakes are high. | 12 | High similarity | Neutral if missing, but lower confidence |
| **Communication fit** | Compare check-in rhythm and response-time expectations. Add a small bonus if both accept the same meeting mode. | 10 | High similarity | Neutral if missing |
| **Reliability/risk fit** | Compute a coarse reliability tier from on-time delivery, deadline behaviour, and response expectation. Use the pair’s minimum tier as the main driver, plus a mismatch penalty for very different deadline habits. | 18 | Similarity plus safety floor | If reliability items missing, do not infer low reliability; mark confidence low |
| **Skill complementarity** | Reward cases where one student’s strength covers the other’s support area, and where union coverage widens the team profile. Penalise pure overlap if no new coverage is added. | 8 | High complementarity | If skill-gap item missing, use strengths only and reduce confidence |
| **Role complementarity** | Derive lightweight role affinities from initiative, planning, help-giving, and skills. Reward useful pairings such as organiser + maker or researcher + presenter. Penalise “two must-leads” slightly. | 6 | Balanced diversity | Use only if enough source items exist |
| **Friend/request handling** | Apply as a capped bonus, not as part of the core fit. Mutual request: +0 to +8 only if pair safety is above threshold. One-sided request: +0 to +3. | bonus only | Preference-sensitive | If missing, no bonus |
| **Blocked-pair handling** | Mutual avoid or explicit block should usually make the pair infeasible. One-sided avoid should create a strong penalty or manual-review rule. | hard constraint | N/A | N/A |

This weighting deliberately puts behaviour and logistics ahead of skills. That is the right choice for course teamwork. Skill complementarity is valuable, but studies of student teams show that poor communication, loafing, and incompatible coordination habits can overwhelm technical balance very quickly. citeturn34view0turn31view2turn11view2turn24search0

A strong operational rule for Synco is that a pair should never appear in “Top matches” if either of the following is true:

```text
availability_overlap < minimum_live_overlap
OR
pair_safety_score < safety_threshold
```

Where `pair_safety_score` is a composite of blocked-pair status, reliability floor, and severe goal mismatch.

### Team-level objective

The team algorithm must avoid simply averaging pair scores. A stronger team objective is:

```text
team_score(T) =
  0.24 * min_pair_safety(T)
+ 0.18 * mean_pair_fit(T)
+ 0.14 * team_availability(T)
+ 0.10 * motivation_alignment(T)
+ 0.12 * skill_coverage(T)
+ 0.10 * role_coverage(T)
+ 0.06 * no_role_overload(T)
+ 0.06 * no_isolation(T)
+ 0.05 * request_satisfaction(T)
- hard_penalties(T)
```

Where:

- `min_pair_safety(T)` is the **lowest** pair safety in the team.
- `mean_pair_fit(T)` is the average adjusted pair score.
- `team_availability(T)` measures whether the whole team has workable overlap, not just some pairs.
- `skill_coverage(T)` rewards broad coverage and cross-support.
- `role_coverage(T)` rewards presence of needed contribution types.
- `no_role_overload(T)` penalises teams overloaded with the same dominant role while missing others.
- `no_isolation(T)` penalises any student whose average fit to the rest of the team is very low.
- `request_satisfaction(T)` handles mutual and one-sided requests only after feasibility and safety.

This objective is deliberately *max-min aware*. Bell’s emphasis on minimum agreeableness and the general conflict literature both argue against sacrificing one bad pair to improve the team average. citeturn24search0turn13search12

For team sizes, Synco should support 2–6 because instructors may need them. But the product should still nudge most use cases toward **3–5** as the default range. Teams of two have limited redundancy and weaker internal conflict resolution; teams larger than five are more likely to fragment or develop cliques unless the project is genuinely large. citeturn10view1turn32view0

## Team formation algorithm

### Algorithm comparison

| Approach | Strengths | Weaknesses | Verdict for Synco |
|---|---|---|---|
| **Greedy clustering** | Fast, simple | Myopic; often creates one bad leftover team; weak on min-pair safety and uneven team sizes | Good only as a fallback or seed |
| **Exact combinatorial search** | True optimum on tiny classes | Explodes rapidly as class size grows | Fine for very small classes only |
| **Integer programming or CP-SAT** | Handles hard constraints, soft objectives, size patterns, request logic, and lexicographic goals; reproducible and explainable | Requires careful modelling and a solver service | Best practical core choice |
| **Graph matching** | Elegant for pairing or size-2 teams | Awkward for teams of 3–6 and higher-order constraints | Use only for pair-only mode |
| **Local search or swap optimisation** | Excellent at polishing a feasible solution; easy to add | Sensitive to starting state; can settle in local optima | Best as a second-stage optimiser |
| **Genetic algorithm** | Flexible in messy spaces | Harder to explain, tune, and reproduce; can be unstable | Not ideal for a classroom app |
| **Simulated annealing** | Better than greedy at escaping local minima | Still heuristic, opaque to many users | Possible but not the best first choice |
| **Constraint satisfaction without scoring** | Great for feasibility | Weak when many feasible solutions exist but quality differs | Use only as part of a scored solver |

This recommendation is consistent with the literature on educational team formation. CATME’s Team-Maker uses a heuristic, max-min style approach and later hill-climbing improvements; newer work shows exact ILP formulations can optimise preference and skill constraints directly; and the review literature notes that the field lacks strong common comparison standards, which is another reason to prefer a transparent, constraint-based core rather than a black-box evolutionary method. citeturn8view0turn8view1turn14view8turn14view6

### Recommended solver flow

The best practical architecture for Synco is:

**Build pair matrices in TypeScript, solve teams in a dedicated optimisation job, then polish with local swaps.**

The publish-time flow should be:

1. Validate survey completion and compute pairwise matrices.
2. Mark hard constraints: blocked pairs, impossible schedule combinations, manual teacher locks.
3. Enumerate allowed team-size patterns for the class size and requested size range.
4. For each pattern, solve a constrained optimisation problem that first maximises the minimum pair safety, then maximises total team score, then improves fairness and request satisfaction.
5. Run a local swap pass to catch small improvements the main solution may miss.
6. Generate explanations from the winning solution using only explainable factors permitted by each student’s privacy settings.

This needs to be deterministic enough for trust. Use a reproducible random seed where randomness is involved, log the final objective terms, and store a machine-readable breakdown of why each team won.

A good size-pattern routine is simple:

- Class of **6**, target 3 → `3 + 3`
- Class of **7**, target 4 → `4 + 3`
- Class of **24**, target 4 → `4 + 4 + 4 + 4 + 4 + 4`
- If the instructor allows a range, choose the pattern that maximises the overall objective while minimising team-size spread.

### Pseudocode

```text
INPUTS
  students S
  team_size_range = [k_min, k_max]
  survey_answers
  instructor_constraints
  roster_history (optional)

PRECOMPUTE
  pairScores[i][j]
  pairSafety[i][j]
  pairReasons[i][j]
  blocked[i][j]
  mutualRequest[i][j]
  oneSidedRequest[i][j]
  skillVectors[i]
  roleVectors[i]
  availability[i]

FUNCTION buildPairScore(i, j):
  if blocked[i][j]:
    return INFEASIBLE

  logistics = scoreLogistics(i, j)
  working = scoreWorkingStyle(i, j)
  thinking = scoreThinkingStyle(i, j)
  goals = scoreMotivation(i, j)
  comms = scoreCommunication(i, j)
  reliability = scoreReliability(i, j)
  skills = scoreSkillComplementarity(i, j)
  roles = scoreRoleComplementarity(i, j)

  base = weightedMean([
    logistics, working, thinking, goals,
    comms, reliability, skills, roles
  ])

  confidence = observedWeight(i, j) / totalPossibleWeight
  adjusted = confidence * base + (1 - confidence) * 50

  requestBonus = cappedRequestBonus(i, j, pairSafetyFloor = reliability)
  return clamp(adjusted + requestBonus, 0, 100)

FUNCTION teamScore(team T):
  if any blocked pair inside T:
    return INFEASIBLE

  minSafety = min(pairSafety[a][b] for all pairs in T)
  if minSafety < SAFETY_THRESHOLD:
    return INFEASIBLE

  meanPair = mean(pairScores[a][b] for all pairs in T)
  teamAvail = scoreTeamAvailability(T)
  goalAlign = scoreTeamGoalAlignment(T)
  skillCover = scoreSkillCoverage(T)
  roleCover = scoreRoleCoverage(T)
  overload = scoreNoRoleOverload(T)
  isolation = scoreNoIsolation(T)
  requestSat = scoreRequests(T)

  return (
    0.24 * minSafety +
    0.18 * meanPair +
    0.14 * teamAvail +
    0.10 * goalAlign +
    0.12 * skillCover +
    0.10 * roleCover +
    0.06 * overload +
    0.06 * isolation +
    0.05 * requestSat
  )

FUNCTION solveForPattern(pattern P):
  create decision variable x[i][t] = 1 if student i assigned to team slot t
  constrain each student to exactly one team
  constrain team sizes to pattern P
  constrain blocked pairs not to share a team
  constrain minimum team availability if required
  optimise lexicographically:
    1. maximise minimum pair safety across all teams
    2. maximise sum(teamScore(T))
    3. minimise variance in team scores
    4. maximise satisfied mutual requests
  return assignment

FUNCTION polish(solution):
  improved = true
  while improved:
    improved = false
    for each valid swap or move:
      if swap improves global objective and preserves hard constraints:
        apply swap
        improved = true
  return solution

MAIN
  patterns = enumerateTeamSizePatterns(|S|, k_min, k_max)
  candidateSolutions = []

  for P in patterns:
    sol = solveForPattern(P)
    if sol feasible:
      sol = polish(sol)
      candidateSolutions.append(sol)

  best = argmax(candidateSolutions by objective)
  explanations = generateExplanations(best, privacySettings)
  return best, explanations
```

## Matches, explanations, safeguards, and rollout

### Top matches, avoid list, and friend reality check

Synco should generate **Top matches** and **Avoid/risk** from separate logic, not from opposite ends of the same ranking.

For **Top matches**, the rule should be:

- rank only classmates with `pair_safety >= threshold`;
- exclude anyone on the risk list;
- exclude anyone with impossible logistics;
- show up to five classmates, but fewer if the class is small or the safe pool is smaller.

A student in a class with only five classmates should absolutely be allowed to see **two** or **three** top suggestions if only those are genuinely strong. “Top five” is a maximum, not a quota.

For **Avoid/risk**, Synco should show a classmate only when there is a **real reason**, such as:

- effectively no overlapping meeting time;
- explicit block or strong avoid signal;
- severe seriousness mismatch;
- severe delivery-style mismatch;
- strong likelihood of a cold-start conflict, such as both pair members signalling “I only want someone else to structure everything” in a pair project.

The risk list should not simply be “the bottom five classmates”. In small classes it is perfectly acceptable to show **no risk list at all** if nobody crosses the threshold.

A clean decision rule is:

```text
if blocked pair:
  show as "cannot place together" only in teacher view
elif pair_safety < 35:
  eligible for student risk list
elif logistics < 30 and friend-request exists:
  show friend reality check
else:
  do not show in risk list
```

This also prevents the same classmate appearing in both lists. The sequence should always be: **build risk pool first, remove it from suggestion pool, rank the remainder**.

A good **best-match explanation** should mention two or three concrete reasons, such as:

- “You have strong overlap in meeting time.”
- “You prefer a similar working pace and response rhythm.”
- “Your skill strengths fill each other’s gaps in research and presentation.”

A good **risk explanation** should stay practical and non-judgemental:

- “You have very little shared meeting time.”
- “Your delivery pace signals are far apart.”
- “You appear to want very different project outcomes.”

It should never say things like “Jordan is unreliable” or reveal another student’s confidential request.

The **friend reality check** should be candid, because that is one of Synco’s product differentiators. A good default template is:

> **You flagged Alex as a friend. Synco did not treat this as a strong project match here.**
>
> The main issue is practical, not personal: you have almost no reliable meeting overlap and your project pace signals are far apart. Friendship can help trust, but it does not create shared time or aligned delivery habits.

That tone is justified by the evidence. Friendship may help on average, but it is contingent and should not override viability. citeturn19view2turn20view0turn10view1

### Explanation templates

Below are simple templates Synco can use.

**Assigned team rationale**

> **Why this team was assigned**
>
> This team was chosen because it met the practical basics first: you have workable meeting overlap, no blocked pairings, and a similar level of project seriousness. The team also has complementary strengths across [skill A], [skill B], and [skill C], with a good spread of organising, making, and reviewing work. No pair inside the team fell below Synco’s safety threshold.

**Individual best match reason**

> **Why [Name] is a strong match**
>
> You and [Name] have strong overlap in [meeting time / communication rhythm / project pace]. You also complement each other in [skill area]. This looks like a practical pairing with lower coordination friction than average.

**Avoid/risk reason**

> **Why this may be hard**
>
> You and [Name] may struggle to work smoothly because [reason]. This does not mean you could never work together, but the current signals suggest higher coordination risk than average.

**Friend reality check**

> **Friendship note**
>
> You flagged [Name] as a friend. Synco checks that against project fit. In this case the practical signals disagree, mainly because [reason]. Friendship can help comfort and trust, but it does not remove scheduling, pace, or communication constraints.

**Teacher or class-lead summary**

> **Formation summary**
>
> Teams were built by optimising schedule viability, pair safety, goal alignment, and skill/role coverage. [X] mutual requests were satisfied, [Y] one-sided requests were satisfied where feasible, and [Z] blocked pairings were enforced. Manual review is recommended for [students/teams] because of low data confidence or unusually tight constraints.

These explanations answer the student demand for transparency that automated team-formation studies have highlighted, while staying inside privacy limits. citeturn17view2

### Edge cases and test cases

The matcher needs explicit regression tests. These are the minimum worthwhile scenarios.

| Scenario | Expected behaviour | Pass condition |
|---|---|---|
| **All students have the same archetype profile** | Do not invent fake diversity. Use logistics, seriousness, communication, and skills to differentiate. | Teams still have balanced skill coverage where possible; no random “type balancing” artefacts |
| **One student is hard to place** | Do not dump them into the worst team by average-fit logic. | Their final team clears the safety floor and no-isolation rule |
| **Two friends request each other but are a poor fit** | Friend bonus should not override viability. | Request denied if schedule/safety threshold fails; friend reality check shown |
| **One-sided friend request** | Small bonus only | Pair occurs only if already near-feasible; no major distortion of whole class |
| **Blocked pair** | Hard constraint unless human override | No solution contains the pair without explicit override |
| **Class of 6** | Solve exactly; avoid showing forced risk lists | Safe team pattern chosen; top matches capped by reality |
| **Class of 7** | Handle uneven sizes gracefully | Best pattern like 4+3 or 3+2+2 chosen by objective |
| **Class of 24 with target size 4** | Scale without heuristic collapse | All teams meet minimum safety and no role-overload checks |
| **Many missing answers** | Avoid punitive inference | Missing lowers confidence, not worth; manual review flags triggered |
| **Same skill strengths duplicated** | Avoid all-same-strength teams if alternatives exist | Coverage score favours teams that broaden strengths |
| **Complementary strengths distributed well** | Recognise and reward coverage | Teams show wider coverage than similarity baseline |
| **High overall scorer but bad availability** | Availability should win | Student is not placed with incompatible schedules |
| **High similarity but low complementarity** | Do not over-reward sameness | Team objective penalises duplicated-role overload |
| **All students want to lead** | Avoid stacking control-heavy teams | Leadership balance rule spreads strong coordinators |
| **Nobody wants to lead** | Avoid leaderless teams of 4–6 | Teams flagged or assigned at least one willing coordinator where possible |
| **Only two students have high reliability signals** | Do not concentrate them in one team unless task demands it | Min-pair-safety and fairness regulariser spread the floor |
| **Very small class with no genuine risks** | Do not show an avoid list | Risk list empty |
| **Conflicting avoid requests make solution impossible** | Escalate to teacher | Manual review report generated; student-facing output stays neutral |

The highest-value product safeguard is to pair the matcher with a light **post-formation support layer**: team norms prompt, first-week check-in, and a midpoint pulse. The research is clear that team formation alone does not secure team quality; management, norms, and accountability matter too. citeturn32view0turn12search9turn34view0turn11view2

### TypeScript implementation roadmap

| Phase | What to build | Notes |
|---|---|---|
| **Data model** | Survey schema, enums, team constraints, privacy settings, reason-code schema | Keep raw answers and derived scores separate |
| **Scoring library** | Pure TypeScript functions for pair sub-scores, confidence, role derivation, skill coverage | Unit-test heavily; deterministic output |
| **Optimisation job** | Solver service for team assignment with hard constraints and lexicographic objectives | Keep it asynchronous at publish time |
| **Swap polisher** | Local improvement pass over the solver result | Easy win for edge cases |
| **Explanation engine** | Template generator from reason codes and privacy settings | Never use raw confidential inputs in student-facing text |
| **Teacher review UI** | Team-score breakdowns, request outcomes, manual lock and swap tools, low-confidence flags | Essential for trust and classroom safety |
| **Validation harness** | Scenario fixtures, Monte Carlo classrooms, shadow-mode comparison to existing matcher | Run before replacing the old system |
| **Rollout** | Shadow mode, teacher beta, then default-on with override | Start with visibility, not silent replacement |

A sensible data structure is:

```text
Student {
  id
  availabilityGrid
  meetingMode
  planningStyle
  deadlineStyle
  ambiguityResponse
  workingMode
  checkinRhythm
  responseExpectation
  deliveryReliability
  initiativeMode
  leadershipPreference
  conflictStyle
  askHelpComfort
  helpOthersComfort
  seriousness
  targetOutcome
  strengths[]
  supportNeeds[]
  roleFlex[]
  preferredPeers[]
  blockedPeers[]
  privacyPreference
}
```

In the existing app, the migration strategy should be incremental. Keep the old matcher running in shadow mode for a few cohorts, compare its team outputs against the new one, and log the following evaluation metrics: satisfied mutual requests, hard-constraint violations, minimum pair safety, average team availability overlap, skill-coverage score, rate of manual overrides, and rate of student complaints or reassignments. This is a safer deployment pattern than a hard switchover, and it aligns with the broader caution in educational algorithm design about opacity and harm. citeturn7view5turn7view6turn17view2

### Warnings about what not to do

Do not use MBTI, DISC, Belbin, or fixed archetypes as the primary allocation engine. If you keep role labels for engagement, derive them from current survey behaviour and skills, keep them soft, and never let them overpower logistics and safety. citeturn21search4turn14view4turn23view0

Do not maximise average pair compatibility alone. That is how you get one sacrificed student, one toxic pairing hidden inside an otherwise “great” team, or one team full of duplicate strengths.

Do not over-weight self-reported reliability. Students are not always good judges of their own delivery habits, and social desirability bias is real. Use reliability as a coarse floor and, if the course permits, improve it later with light-touch midway signals rather than trying to infer a moral ranking on day one. citeturn17view2turn34view0

Do not force every student to see both a best-match list and an avoid list. In small classes, that turns weak evidence into needless interpersonal damage.

Do not expose another student’s confidential request, weak-area answer, or avoid flag in explanations. Student-facing text should describe practical fit factors, not reveal who “did not want to work with you”.

Do not use protected traits or sensitive personal data to build the production matcher. If an institution wants to audit fairness, that should happen separately under governance, not through everyday classroom assignment logic. citeturn7view5turn7view7turn7view6

Do not sell this as “guaranteed productivity”. The literature on team composition is too contextual for that. A fair claim is that Synco can reduce obvious mismatch, improve transparency, and build teams with better logistical fit and broader coverage than a naive similarity matcher. citeturn31view0turn17view0turn8view0