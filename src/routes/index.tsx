import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { Reveal, ScrollProgress, StaggerContainer } from "@/components/animations/reveal";
import { supabase } from "@/integrations/supabase/client";
import {
  defaultLandingContent,
  parseLandingContent,
  type LandingContent,
  type LandingFaqItem,
  type LandingPreview,
} from "@/lib/landing-content";

export const Route = createFileRoute("/")({ component: Landing });

const pageContainer = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const sectionPadding = "py-10 sm:py-14 lg:py-20";
const primaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-[8px] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--color-primary-hover)]";
const textLinkClass =
  "inline-flex h-11 items-center justify-center text-sm font-medium text-[color:var(--color-primary)] transition-colors hover:text-[color:var(--color-primary-hover)]";

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
  const [content, setContent] = useState<LandingContent>(defaultLandingContent);

  useEffect(() => {
    let cancelled = false;

    async function loadLandingContent() {
      const { data, error } = await supabase
        .from("platform_content")
        .select("body")
        .eq("content_key", "landing_page")
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Failed to load landing page content:", error);
        return;
      }

      setContent(parseLandingContent(data?.body));
    }

    void loadLandingContent();

    return () => {
      cancelled = true;
    };
  }, []);

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
                immediate
                className="text-sm font-medium text-[color:var(--color-primary)]"
              >
                {content.heroEyebrow}
              </Reveal>
              <Reveal
                as="h1"
                delay={0.08}
                immediate
                className="mt-4 font-sans text-4xl font-semibold leading-[1.08] tracking-normal sm:text-5xl"
              >
                {content.heroTitle}
              </Reveal>
              <Reveal
                as="p"
                blur={false}
                delay={0.16}
                immediate
                className="mt-5 max-w-lg text-base leading-7 text-muted"
              >
                {content.heroSubtitle}
              </Reveal>

              <Reveal
                blur={false}
                delay={0.24}
                immediate
                className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Link to="/auth/signup" className={`${primaryButtonClass} sm:w-fit`}>
                  {content.heroPrimaryCta}
                </Link>
                <a href="#student-payoff" className={`${textLinkClass} sm:w-fit`}>
                  {content.heroSecondaryCta}
                </a>
              </Reveal>

              <Reveal blur={false} delay={0.32} immediate className="mt-7">
                <WorkflowLine steps={content.workflowSteps} />
              </Reveal>
            </div>

            <Reveal delay={0.18} immediate mask scale={0.97}>
              <MockMatchCard preview={content.preview} />
            </Reveal>
          </div>
        </section>

        <section
          id="student-payoff"
          className={`border-b border-border/70 bg-secondary py-8 sm:py-10 lg:py-12`}
        >
          <div className={pageContainer}>
            <StaggerContainer className="grid gap-4 md:grid-cols-3" immediate>
              {content.audienceBenefits.map((benefit) => (
                <Reveal
                  key={benefit.title}
                  staggerItem
                  className="motion-lift rounded-[8px] border border-border bg-card p-5 hover:border-[color:var(--color-primary)]/25 hover:shadow-[0_12px_30px_oklch(0.18_0_0_/_0.05)]"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-primary)]">
                    {benefit.label}
                  </p>
                  <h2 className="mt-3 font-sans text-base font-semibold">{benefit.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{benefit.text}</p>
                </Reveal>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section
          id="how-it-works"
          className={`border-b border-border/70 bg-background ${sectionPadding}`}
        >
          <div className={`${pageContainer} grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12`}>
            <Reveal className="max-w-md">
              <p className="text-sm font-medium text-[color:var(--color-primary)]">
                {content.howIntroEyebrow}
              </p>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                {content.howIntroTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                {content.howIntroSubtitle}
              </p>
            </Reveal>

            <StaggerContainer as="ol" className="grid gap-4 sm:grid-cols-2">
              {content.howSyncoWorks.map((step, index) => (
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
              <p className="text-sm font-medium text-[color:var(--color-primary)]">
                {content.studentPayoffEyebrow}
              </p>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                {content.studentPayoffTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                {content.studentPayoffSubtitle}
              </p>
            </Reveal>

            <StaggerContainer className="mt-8 grid gap-4 md:grid-cols-3">
              {content.productivityBenefits.map((benefit) => (
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
                {content.matchingIntroEyebrow}
              </p>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                {content.matchingIntroTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                {content.matchingIntroSubtitle}
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="max-w-2xl text-base leading-7 text-muted">{content.matchingLead}</p>
              <StaggerContainer className="mt-6 grid gap-3 sm:grid-cols-2" delay={0.08}>
                {content.matchingFactors.map((factor) => (
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
                {content.outputCards.map((item) => (
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
              <p className="text-sm font-medium text-[color:var(--color-primary)]">
                {content.featuresEyebrow}
              </p>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                {content.featuresTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                {content.featuresSubtitle}
              </p>
            </Reveal>

            <StaggerContainer className="grid gap-4 sm:grid-cols-2">
              {content.classBenefits.map((benefit) => (
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
                {content.faqIntroEyebrow}
              </p>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                {content.faqIntroTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
                {content.faqIntroSubtitle}
              </p>
            </Reveal>
            <Reveal blur={false} delay={0.08} className="mt-8">
              <LandingFaq faqs={content.faqs} />
            </Reveal>
          </div>
        </section>

        <section className="border-t border-border/70 bg-secondary py-8 sm:py-10 lg:py-14">
          <div className={pageContainer}>
            <Reveal className="flex flex-col items-start justify-between gap-6 rounded-[8px] border border-border bg-card p-6 sm:p-8 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-medium text-[color:var(--color-primary)]">
                  {content.finalCtaEyebrow}
                </p>
                <h2 className="mt-2 font-sans text-2xl font-semibold tracking-normal sm:text-3xl">
                  {content.finalCtaTitle}
                </h2>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link to="/auth/signup" className={`${primaryButtonClass} w-full sm:w-auto`}>
                  Create a class
                </Link>
                <Link to="/join" className={`${textLinkClass} w-full sm:w-auto`}>
                  Join with a code
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function WorkflowLine({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-[8px] border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        {steps.map((step, index) => (
          <span key={step} className="inline-flex items-center gap-2">
            <span className="font-medium text-foreground">{step}</span>
            {index < steps.length - 1 ? (
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

function LandingFaq({ faqs }: { faqs: LandingFaqItem[] }) {
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
            to="/join"
            className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline"
          >
            Join
          </Link>
          <Link
            to="/auth/signup"
            className="inline-flex h-10 items-center rounded-[8px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--color-primary-hover)]"
          >
            Try Synco
          </Link>
        </div>
      </div>
    </header>
  );
}

function MockMatchCard({ preview }: { preview: LandingPreview }) {
  return (
    <div
      className="rounded-[8px] border border-border bg-card shadow-[0_12px_36px_oklch(0.18_0_0_/_0.05)]"
      aria-label="Preview of class team results"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-semibold">{preview.headerTitle}</p>
          <p className="text-xs text-muted">{preview.headerSubtitle}</p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-[color:var(--color-primary)]">
          {preview.badge}
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-[8px] border border-border bg-background">
            {preview.stats.map(([label, value]) => (
              <div key={label} className="min-w-0 px-3 py-3">
                <p className="text-[0.7rem] font-medium leading-4 text-muted">{label}</p>
                <p className="mt-1 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {preview.teams.map((team) => (
              <div key={team.name} className="rounded-[8px] border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-sans text-sm font-semibold">{team.name}</h3>
                  <span className="text-xs font-medium text-[color:var(--color-accent)]">
                    {team.fit ?? "92% fit"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground">{team.members}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{team.rationale}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[8px] border border-border bg-background p-4">
            <h3 className="font-sans text-sm font-semibold">{preview.peopleTitle}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              {preview.people.map(([label, names]) => (
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
              <h3 className="font-sans text-sm font-semibold">{preview.graphTitle}</h3>
              <p className="mt-1 text-xs leading-5 text-muted">{preview.graphSubtitle}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[color:var(--color-accent-light)] px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {preview.graphBadge}
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
          <Link to="/contact" className="transition-colors hover:text-foreground">
            Contact
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
