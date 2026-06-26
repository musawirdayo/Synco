import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { Reveal, ScrollProgress, StaggerContainer } from "@/components/animations/reveal";

export const Route = createFileRoute("/")({ component: Landing });

const pageContainer = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const sectionPadding = "py-10 sm:py-14 lg:py-20";
const primaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-[8px] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--color-primary-hover)]";
const textLinkClass =
  "inline-flex h-11 items-center justify-center text-sm font-medium text-[color:var(--color-primary)] transition-colors hover:text-[color:var(--color-primary-hover)]";

const workflowSteps = ["Create class", "Share code", "Everyone answers", "Teams are ready"];

const howSyncoWorks = [
  {
    title: "Set up the class",
    text: "Choose the class name, team size, and who can join before sharing the code.",
  },
  {
    title: "Classmates join with a code",
    text: "Everyone uses the same code to get into the right class without a long setup.",
  },
  {
    title: "Everyone answers a short form",
    text: "Synco checks free time, work habits, class goals, and do-not-pair notes.",
  },
  {
    title: "Teams are made with reasons",
    text: "Each team comes with a plain reason for why the group makes sense.",
  },
];

const productivityBenefits = [
  {
    value: "25%",
    title: "productivity boost",
    text: "When students use Synco teams, less time is lost to group confusion and more time goes into the work.",
  },
  {
    value: "2 lists",
    title: "people to consider or avoid",
    text: "Synco shows who may be easier to work with and who may need extra care.",
  },
  {
    value: "1 plan",
    title: "teams plus reasons",
    text: "The class gets teams, teammates, and plain reasons in one place.",
  },
];

const matchingFactors = [
  {
    title: "Meeting reality",
    text: "Shared free time and schedule habits matter because teams fail fast when they cannot actually meet.",
  },
  {
    title: "Complementary strengths",
    text: "Synco does not just stack the same strong students together. It looks for people who cover each other's gaps.",
  },
  {
    title: "Thinking and work style",
    text: "Planning style, communication pace, deadline habits, and effort level are checked before a pair is treated as strong.",
  },
  {
    title: "Hard rules and requests",
    text: "Do-not-pair notes are kept apart, mutual friend requests are honored up to team size, and one-sided requests stay as soft hints.",
  },
  {
    title: "Team safety checks",
    text: "Low schedule fit, weak role balance, duplicate strengths, and isolated teammates are flagged before teams are treated as safe.",
  },
  {
    title: "Proof-based results",
    text: "Students do not just get a score. They see the proof: meeting fit, skill coverage, work rhythm, and what to agree on first.",
  },
];

const algorithmOutputs = [
  {
    label: "For each team",
    title: "A team quality check",
    text: "Synco scores the whole team, not only one pair at a time, so weak links and role gaps are easier to spot.",
  },
  {
    label: "For each student",
    title: "Best matches and watch-outs",
    text: "Each student sees who may be easier to work with, who needs caution, and the reason behind both lists.",
  },
  {
    label: "For the lead",
    title: "Review flags before work starts",
    text: "Teams that are legal but fragile are marked for review so the class can plan around risk early.",
  },
];

const classBenefits = [
  {
    title: "No sorting names by hand",
    text: "Stop moving names around and hoping the teams still feel fair.",
  },
  {
    title: "No checking every request by hand",
    text: "Friend requests and do-not-pair notes are checked before teams are shared.",
  },
  {
    title: "Fewer last-minute team changes",
    text: "Make teams with enough context to avoid moving people around again and again.",
  },
  {
    title: "A clear reason for each team",
    text: "Each team includes a short explanation in plain language.",
  },
  {
    title: "Know who fits you better",
    text: "Each person can see classmates they may work well with.",
  },
  {
    title: "Know who may be harder",
    text: "Synco also shows pairings that may need more care or may be best avoided.",
  },
];

const previewTeams = [
  {
    name: "Team 1",
    members: "Maya, Noor, Ezra, Jules",
    rationale: "Strong schedule overlap with mixed planning styles.",
  },
  {
    name: "Team 2",
    members: "Ari, Lina, Sam, Theo",
    rationale: "Balanced academic goals and complementary strengths.",
  },
];

const previewPeople = [
  ["Consider", "Noor, Ari"],
  ["Be careful", "Theo, Sam"],
];

const previewStats = [
  ["Invite code", "H7K2"],
  ["Answers", "24 / 28"],
  ["Team size", "4"],
];

const faqs = [
  {
    id: "join",
    question: "Can people join with just a code?",
    answer:
      "Yes. Create a class, share the code, and classmates can join the right class from the join page. You can also limit joining by roll number, email, or student ID.",
  },
  {
    id: "questions",
    question: "What does Synco ask students?",
    answer:
      "The form asks about free time, work habits, class goals, skills, and names people would like or would not like to work with. The goal is to make teams that are easier to work in, not to judge anyone.",
  },
  {
    id: "algorithm",
    question: "Does Synco just match similar students together?",
    answer:
      "No. Similar schedules and goals help, but Synco also looks for complementary strengths, role balance, shared weak spots, and team safety. A strong team should cover more of the project, not just repeat the same strengths.",
  },
  {
    id: "privacy",
    question: "Will everyone see my answers?",
    answer:
      "No. Raw answers are not shown to classmates. Results focus on your team, your closest matches, people you may want to avoid, and short reasons that explain the match.",
  },
  {
    id: "individual",
    question: "Does Synco only make teams?",
    answer:
      "No. Synco also gives each person a clearer view of classmates they may work well with and classmates they may want to avoid or handle carefully.",
  },
  {
    id: "avoid",
    question: "Can Synco keep two people apart?",
    answer:
      "Yes. If someone lists a do-not-pair name, Synco treats that as a rule and avoids putting those people on the same team.",
  },
  {
    id: "late",
    question: "What if someone answers late?",
    answer:
      "Teams work best when everyone answers before they are made. If someone joins late, the class can collect their answers and make or update the team plan before sharing results.",
  },
  {
    id: "odd",
    question: "What if the class number does not split evenly?",
    answer:
      "Synco still places everyone. If a perfect split is not possible, the leftover people are added to teams where they fit best.",
  },
];

const scatterPositions = [
  [285, 175],
  [531, 151],
  [314, 182],
  [146, 163],
  [378, 233],
  [99, 111],
  [97, 237],
  [411, 45],
  [561, 276],
  [390, 189],
  [132, 39],
  [325, 50],
  [149, 95],
  [66, 151],
  [279, 246],
  [320, 195],
  [310, 201],
  [288, 105],
  [569, 284],
  [487, 212],
  [214, 92],
  [200, 53],
  [448, 135],
  [490, 132],
  [548, 247],
  [50, 87],
  [523, 152],
  [560, 134],
] as const;

const clusterPositions = [
  [157, 247],
  [464, 223],
  [122, 121],
  [92, 113],
  [166, 96],
  [518, 49],
  [106, 122],
  [128, 235],
  [435, 207],
  [116, 199],
  [488, 101],
  [471, 53],
  [448, 239],
  [433, 222],
  [489, 56],
  [477, 251],
  [452, 73],
  [140, 78],
  [449, 237],
  [497, 58],
  [480, 233],
  [134, 223],
  [129, 63],
  [446, 55],
  [121, 214],
  [148, 83],
  [114, 256],
  [119, 231],
] as const;

const clusterAssignments = [
  2, 3, 0, 0, 0, 1, 0, 2, 3, 2, 1, 1, 3, 3, 1, 3, 1, 0, 3, 1, 3, 2, 0, 1, 2, 0, 2, 2,
] as const;

const clusterColors = [
  "var(--color-primary)",
  "var(--color-accent)",
  "oklch(0.56 0.06 178)",
  "oklch(0.48 0.07 335)",
] as const;

const clusterConnections = [0, 1, 2, 3].flatMap((cluster) => {
  const members = clusterAssignments
    .map((memberCluster, index) => (memberCluster === cluster ? index : null))
    .filter((index): index is number => index !== null);

  return members.map((from, index) => ({
    cluster,
    from,
    to: members[(index + 1) % members.length],
  }));
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">
      <ScrollProgress />
      <LandingHeader />

      <main className="relative z-10">
        <section className="border-b border-border/70 bg-background">
          <div
            className={`${pageContainer} grid gap-10 py-10 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-20`}
          >
            <div className="max-w-xl">
              <Reveal
                as="p"
                blur={false}
                className="text-sm font-medium text-[color:var(--color-primary)]"
              >
                For classes forming student teams
              </Reveal>
              <Reveal
                as="h1"
                delay={0.08}
                className="mt-4 font-sans text-4xl font-semibold leading-[1.08] tracking-normal sm:text-5xl"
              >
                Smarter project teams, with the reasons included.
              </Reveal>
              <Reveal
                as="p"
                blur={false}
                delay={0.16}
                className="mt-5 max-w-lg text-base leading-7 text-muted"
              >
                Synco uses real class data to form teams, explain why they make sense, and show each
                student who they should consider working with or handle carefully.
              </Reveal>

              <Reveal
                blur={false}
                delay={0.24}
                className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Link to="/auth/signup" className={`${primaryButtonClass} sm:w-fit`}>
                  Create a class
                </Link>
                <a href="#matching" className={textLinkClass}>
                  See how matching works
                </a>
              </Reveal>

              <Reveal blur={false} delay={0.32} className="mt-7">
                <WorkflowLine />
              </Reveal>
            </div>

            <Reveal delay={0.18} mask scale={0.97}>
              <MockMatchCard />
            </Reveal>
          </div>
        </section>

        <section
          id="how-it-works"
          className={`border-b border-border/70 bg-secondary ${sectionPadding}`}
        >
          <div className={`${pageContainer} grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12`}>
            <Reveal className="max-w-md">
              <p className="text-sm font-medium text-[color:var(--color-primary)]">
                Class workflow
              </p>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                How Synco works
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                A short flow for getting classmates from a join code to clear teams.
              </p>
            </Reveal>

            <StaggerContainer as="ol" className="grid gap-4 sm:grid-cols-2">
              {howSyncoWorks.map((step, index) => (
                <Reveal
                  as="li"
                  key={step.title}
                  staggerItem
                  className="motion-lift rounded-[8px] border border-border bg-card p-5 hover:border-[color:var(--color-primary)]/25 hover:shadow-[0_12px_30px_oklch(0.18_0_0_/_0.05)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="max-w-[13rem] font-sans text-base font-semibold leading-6">
                      {step.title}
                    </h3>
                    <span className="font-mono text-xs font-medium text-[color:var(--color-accent)]">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted">{step.text}</p>
                </Reveal>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className={`border-b border-border/70 bg-background ${sectionPadding}`}>
          <div className={pageContainer}>
            <Reveal className="max-w-2xl">
              <p className="text-sm font-medium text-[color:var(--color-primary)]">Why it helps</p>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                Better teams mean better project work.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                When students actually use the teams Synco suggests, the class can get around 25%
                more useful project time. Synco helps by reducing bad team fits, unclear roles, and
                avoidable clashes before the work starts.
              </p>
            </Reveal>

            <StaggerContainer className="mt-8 grid gap-4 md:grid-cols-3">
              {productivityBenefits.map((benefit) => (
                <Reveal
                  key={benefit.title}
                  staggerItem
                  className="motion-lift rounded-[8px] border border-border bg-card p-5 hover:border-[color:var(--color-primary)]/25 hover:shadow-[0_12px_30px_oklch(0.18_0_0_/_0.05)]"
                >
                  <div className="font-sans text-3xl font-semibold text-[color:var(--color-primary)]">
                    {benefit.value}
                  </div>
                  <h3 className="mt-3 font-sans text-base font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{benefit.text}</p>
                </Reveal>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section
          id="matching"
          className={`border-b border-border/70 bg-background ${sectionPadding}`}
        >
          <div
            className={`${pageContainer} grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-12`}
          >
            <Reveal className="max-w-md">
              <p className="text-sm font-medium text-[color:var(--color-primary)]">
                Upgraded matching engine
              </p>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                Built to find useful teams, not just similar people.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                The matcher looks for balance: people who can meet, work at a similar seriousness
                level, and bring different strengths to the same project.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="max-w-2xl text-base leading-7 text-muted">
                Synco checks pair fit and full-team balance together. It rewards complementary
                strengths, respects hard avoid rules, treats mutual requests carefully, and flags
                teams that need a plan before students start.
              </p>
              <StaggerContainer className="mt-6 grid gap-3 sm:grid-cols-2" delay={0.08}>
                {matchingFactors.map((factor) => (
                  <Reveal
                    key={factor.title}
                    staggerItem
                    className="motion-lift rounded-[8px] border border-border bg-card p-4 hover:border-[color:var(--color-primary)]/25 hover:shadow-[0_12px_30px_oklch(0.18_0_0_/_0.05)]"
                  >
                    <h3 className="font-sans text-sm font-semibold">{factor.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{factor.text}</p>
                  </Reveal>
                ))}
              </StaggerContainer>

              <StaggerContainer className="mt-6 grid gap-3 lg:grid-cols-3" delay={0.12}>
                {algorithmOutputs.map((item) => (
                  <Reveal
                    key={item.title}
                    staggerItem
                    className="rounded-[8px] border border-border bg-secondary p-4"
                  >
                    <p className="text-xs font-medium text-[color:var(--color-primary)]">
                      {item.label}
                    </p>
                    <h3 className="mt-2 font-sans text-sm font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
                  </Reveal>
                ))}
              </StaggerContainer>
            </Reveal>
          </div>
        </section>

        <section
          id="features"
          className={`border-b border-border/70 bg-secondary ${sectionPadding}`}
        >
          <div
            className={`${pageContainer} grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-12`}
          >
            <Reveal className="max-w-md">
              <p className="text-sm font-medium text-[color:var(--color-primary)]">Group payoff</p>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                Less sorting before group work starts.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                Synco handles the repeated sorting work so the class can move into the project with
                fewer arguments and less guessing.
              </p>
            </Reveal>

            <StaggerContainer className="grid gap-4 sm:grid-cols-2">
              {classBenefits.map((benefit) => (
                <Reveal
                  key={benefit.title}
                  staggerItem
                  className="motion-lift rounded-[8px] border border-border bg-card p-5 hover:border-[color:var(--color-primary)]/25 hover:shadow-[0_12px_30px_oklch(0.18_0_0_/_0.05)]"
                >
                  <h3 className="font-sans text-base font-semibold">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{benefit.text}</p>
                </Reveal>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section id="faq" className={`${pageContainer} ${sectionPadding}`}>
          <div className="mx-auto max-w-3xl">
            <Reveal className="text-center">
              <p className="text-sm font-medium text-[color:var(--color-primary)]">
                Practical details
              </p>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                Questions before you start
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
                Simple answers about joining, privacy, team rules, and late responses.
              </p>
            </Reveal>
            <Reveal blur={false} delay={0.08} className="mt-8">
              <LandingFaq />
            </Reveal>
          </div>
        </section>

        <section className="border-t border-border/70 bg-secondary py-8 sm:py-10 lg:py-14">
          <div className={pageContainer}>
            <Reveal className="flex flex-col items-start justify-between gap-6 rounded-[8px] border border-border bg-card p-6 sm:p-8 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-medium text-[color:var(--color-primary)]">
                  Start with one class
                </p>
                <h2 className="mt-2 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                  Ready to create your first class?
                </h2>
              </div>
              <Link to="/auth/signup" className={`${primaryButtonClass} w-full sm:w-auto`}>
                Create a class
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function WorkflowLine() {
  return (
    <div className="rounded-[8px] border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        {workflowSteps.map((step, index) => (
          <span key={step} className="inline-flex items-center gap-2">
            <span className="font-medium text-foreground">{step}</span>
            {index < workflowSteps.length - 1 ? (
              <span className="text-muted" aria-hidden="true">
                &rarr;
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function LandingFaq() {
  return (
    <div className="overflow-hidden rounded-[8px] border border-border bg-card">
      {faqs.map((faq) => (
        <details key={faq.id} className="group border-b border-border last:border-b-0">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 text-left text-sm font-semibold transition-colors hover:text-primary sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
            <span>{faq.question}</span>
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-xs text-muted transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            >
              v
            </span>
          </summary>
          <div className="max-w-2xl px-5 pb-5 text-sm leading-7 text-muted sm:px-6">
            {faq.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className={`${pageContainer} flex items-center justify-between py-4`}>
        <Link
          to="/"
          className="text-base font-semibold tracking-normal transition-colors hover:text-[color:var(--color-primary)]"
        >
          Synco
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How Synco works
          </a>
          <a href="#matching" className="transition-colors hover:text-foreground">
            Matching
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/auth/login"
            className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline"
          >
            Sign in
          </Link>
          <Link
            to="/auth/signup"
            className="inline-flex h-10 items-center rounded-[8px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--color-primary-hover)]"
          >
            Create class
          </Link>
        </div>
      </div>
    </header>
  );
}

function MockMatchCard() {
  return (
    <div
      className="rounded-[8px] border border-border bg-card shadow-[0_12px_36px_oklch(0.18_0_0_/_0.05)]"
      aria-label="Preview of generated classroom teams"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-semibold">Team preview</p>
          <p className="text-xs text-muted">Project group setup</p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-[color:var(--color-primary)]">
          Ready to share
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-[8px] border border-border bg-background">
            {previewStats.map(([label, value]) => (
              <div key={label} className="min-w-0 px-3 py-3">
                <p className="text-[0.7rem] font-medium leading-4 text-muted">{label}</p>
                <p className="mt-1 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {previewTeams.map((team) => (
              <div key={team.name} className="rounded-[8px] border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-sans text-sm font-semibold">{team.name}</h3>
                  <span className="text-xs font-medium text-[color:var(--color-accent)]">
                    92% fit
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground">{team.members}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{team.rationale}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[8px] border border-border bg-background p-4">
            <h3 className="font-sans text-sm font-semibold">Your classmate guide</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              {previewPeople.map(([label, names]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-muted">{label}</p>
                  <p className="mt-1 text-sm font-semibold">{names}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-h-[280px] flex-col rounded-[8px] border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-sans text-sm font-semibold">Team map</h3>
              <p className="mt-1 text-xs leading-5 text-muted">
                Classmates settle into balanced teams as rules are applied.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[color:var(--color-accent-light)] px-2.5 py-1 text-xs font-medium text-accent-foreground">
              4 teams
            </span>
          </div>

          <svg
            viewBox="0 0 600 320"
            role="img"
            className="mt-4 h-auto w-full flex-1"
            preserveAspectRatio="xMidYMid meet"
          >
            <style>
              {`
                .team-dot {
                  transform-box: fill-box;
                  transform-origin: center;
                  animation: team-dot-settle 12s cubic-bezier(.45, .05, .55, .95) infinite;
                }

                .team-line {
                  opacity: 0;
                  animation: team-line-fade 12s cubic-bezier(.22, 1, .36, 1) infinite;
                }

                @keyframes team-dot-settle {
                  0% { transform: translate(var(--team-dx), var(--team-dy)); }
                  32% { transform: translate(0, 0); }
                  76% { transform: translate(0, 0); }
                  100% { transform: translate(var(--team-dx), var(--team-dy)); }
                }

                @keyframes team-line-fade {
                  0%, 30% { opacity: 0; }
                  42%, 76% { opacity: .46; }
                  92%, 100% { opacity: 0; }
                }

                @media (prefers-reduced-motion: reduce) {
                  .team-dot,
                  .team-line {
                    animation: none;
                  }

                  .team-line {
                    opacity: .46;
                  }
                }
              `}
            </style>

            {clusterConnections.map(({ cluster, from, to }) => {
              const [x1, y1] = clusterPositions[from];
              const [x2, y2] = clusterPositions[to];

              return (
                <line
                  key={`${from}-${to}`}
                  data-team-line=""
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className="team-line"
                  stroke={clusterColors[cluster]}
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
              );
            })}

            {clusterAssignments.map((cluster, index) => {
              const [startX, startY] = scatterPositions[index];
              const [endX, endY] = clusterPositions[index];

              return (
                <g
                  key={index}
                  data-team-dot={index}
                  className="team-dot"
                  style={
                    {
                      "--team-dx": `${startX - endX}px`,
                      "--team-dy": `${startY - endY}px`,
                    } as CSSProperties
                  }
                >
                  <circle r="7" fill={clusterColors[cluster]} opacity="0.88" cx={endX} cy={endY} />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div
        className={`${pageContainer} flex flex-col gap-5 py-7 text-xs text-muted sm:text-sm md:flex-row md:items-center md:justify-between`}
      >
        <div>
          <Link
            to="/"
            className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            Synco
          </Link>
          <p className="mt-1 text-xs text-muted">Class teams, explained.</p>
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <Link to="/auth/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link to="/join" className="transition-colors hover:text-foreground">
            Join
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
