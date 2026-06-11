import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  Users,
  HelpCircle,
  FileText,
  Lightbulb,
  TrendingUp,
  Settings,
} from "lucide-react";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({ component: Landing });

const motionEase = [0.22, 1, 0.36, 1] as const;
const sectionViewport = { once: true, margin: "-80px" };

const stagger = {
  hide: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hide: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: motionEase } },
};

const workflow = [
  {
    icon: Settings,
    title: "Set up your class",
    text: "Add roster, set team size, optionally lock to enrolled identifiers for secure participation.",
  },
  {
    icon: FileText,
    title: "Collect preferences",
    text: "Students complete a short, focused survey about their schedules, work pace, and study goals.",
  },
  {
    icon: TrendingUp,
    title: "Publish results",
    text: "Review the matching plan, adjust if needed, and instantly share teams with clear compatibility explanations.",
  },
];

const strengths = [
  {
    icon: ShieldCheck,
    title: "Privacy protected",
    text: "Student survey responses stay confidential. Only match summaries and explanations are shared—no raw data revealed.",
  },
  {
    icon: Lightbulb,
    title: "Transparent reasoning",
    text: "Every pairing shows why students match: shared availability, compatible pace, complementary skills, and first-meeting talking points.",
  },
  {
    icon: BarChart3,
    title: "Data-driven matching",
    text: "Algorithm weights availability (30%), academic goals (25%), strengths (20%), work style (15%), and personal goals (10%) for optimal teams.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Sleek background dynamic blur glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,_oklch(0.96_0.05_90/0.45)_0%,_transparent_65%)] pointer-events-none z-0" />
      <div className="absolute top-[20%] left-[10%] w-[380px] h-[380px] rounded-full bg-accent/3 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[10%] w-[420px] h-[420px] rounded-full bg-primary/4 blur-[130px] pointer-events-none z-0" />

      <LandingHeader />

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="border-b border-border/40 pb-12 pt-6 sm:pb-16 md:pb-24 md:pt-14">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 md:px-8 lg:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <motion.div initial="hide" animate="show" variants={stagger} className="max-w-2xl">
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
              >
                <Users className="h-3.5 w-3.5" />
                For every classroom
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="mt-5 font-display text-2xl leading-[1.06] sm:text-3xl md:text-5xl lg:text-6xl tracking-tight"
              >
                Smart team formation{" "}
                <span className="bg-gradient-to-tr from-primary via-primary to-accent bg-clip-text text-transparent block sm:inline">
                  based on student compatibility.
                </span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-sm sm:text-base md:text-lg lg:text-xl text-muted leading-relaxed"
              >
                Create a class, collect student work-style preferences, and automatically form
                balanced teams optimized for compatibility and shared schedules.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  to="/auth/signup"
                  className="motion-lift group inline-flex h-11 sm:h-12 items-center justify-center gap-3 rounded-[8px] bg-primary px-6 font-medium text-primary-foreground shadow-[0_14px_34px_rgba(28,61,46,0.16)] hover:bg-[color:var(--color-primary-hover)]"
                >
                  Create a class
                  <ArrowRight className="motion-icon h-4 w-4" />
                </Link>
                <Link
                  to="/join"
                  className="motion-lift inline-flex h-11 sm:h-12 items-center justify-center gap-3 rounded-[8px] border border-border bg-card px-6 font-medium hover:border-primary/40 hover:bg-muted"
                >
                  <LogIn className="h-4 w-4" />
                  Join with a code
                </Link>
              </motion.div>

              <motion.div
                variants={stagger}
                className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 text-xs sm:text-sm text-muted grid-cols-1 sm:grid-cols-3 border-t border-border/40 pt-6"
              >
                {["Private responses", "Invite-code onboarding", "Explainable matches"].map(
                  (item) => (
                    <motion.div key={item} variants={fadeUp} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-success)]" />
                      <span>{item}</span>
                    </motion.div>
                  ),
                )}
              </motion.div>
            </motion.div>

            <MockMatchCard />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="py-12 sm:py-16 md:py-20 bg-card/20 border-b border-border/40"
        >
          <motion.div
            initial="hide"
            whileInView="show"
            viewport={sectionViewport}
            variants={stagger}
            className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12"
          >
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="text-xs uppercase tracking-widest text-accent font-semibold bg-accent-light px-3 py-1 rounded-full">
                The Process
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl font-display md:text-4xl">
                Three simple steps to assign teams.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-muted">
                No complex setup. Just capture what matters: schedules, work style, and academic
                goals. Synco handles the matching.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {workflow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    variants={fadeUp}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.22, ease: motionEase }}
                    className="rounded-xl border border-border bg-card p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-3xl font-display font-bold text-primary/30 group-hover:text-primary/50 transition-colors">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted leading-relaxed">{step.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* FEATURES showcase */}
        <section id="features" className="py-12 sm:py-16 md:py-20">
          <motion.div
            initial="hide"
            whileInView="show"
            viewport={sectionViewport}
            variants={stagger}
            className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12"
          >
            <motion.div variants={fadeUp} className="mb-10 sm:mb-14 text-center max-w-2xl mx-auto">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                Why Instructors Choose Synco
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl font-display md:text-4xl">
                Built for classroom success.
              </h2>
            </motion.div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {strengths.map((strength) => {
                const Icon = strength.icon;
                return (
                  <motion.div
                    key={strength.title}
                    variants={fadeUp}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.22, ease: motionEase }}
                    className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--color-accent-light)]">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">{strength.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                      {strength.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* INTERACTIVE FAQ SECTION */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/5 text-primary mb-3">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-muted mt-2 text-xs sm:text-sm">
              Everything you need to know about Synco.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="item-1" className="border border-border bg-card rounded-xl px-5">
              <AccordionTrigger className="font-medium text-base hover:no-underline py-4">
                How is student privacy maintained?
              </AccordionTrigger>
              <AccordionContent className="text-muted leading-relaxed pb-4">
                Students' raw survey responses are completely confidential. Match results are only
                presented to classmates as overall compatibility percentages and general, anonymized
                work-style guidance. The instructor is the only person with full visibility over raw
                compatibility rationales.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border border-border bg-card rounded-xl px-5">
              <AccordionTrigger className="font-medium text-base hover:no-underline py-4">
                Can I import my existing class roster?
              </AccordionTrigger>
              <AccordionContent className="text-muted leading-relaxed pb-4">
                Yes! When creating a class, you can enable roster lock and paste your students' roll
                numbers, emails, or student IDs. Students must match these identifiers to join,
                preventing unlisted users or duplicates.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border border-border bg-card rounded-xl px-5">
              <AccordionTrigger className="font-medium text-base hover:no-underline py-4">
                How does the matching algorithm work?
              </AccordionTrigger>
              <AccordionContent className="text-muted leading-relaxed pb-4">
                We compute a mutual work-style score using a balanced set of weighted criteria: 30%
                availability, 25% academic focus, 20% complementary strengths, 15% study style, and
                10% goals. For cohorts up to 20 students, an exact bitmask solver finds the absolute
                optimal non-conflicting match plan. Larger cohorts use a highly optimized greedy
                matcher.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border border-border bg-card rounded-xl px-5">
              <AccordionTrigger className="font-medium text-base hover:no-underline py-4">
                What if the number of students in my class is odd?
              </AccordionTrigger>
              <AccordionContent className="text-muted leading-relaxed pb-4">
                If there is an odd student, they will remain unmatched in the draft pairing preview.
                The dashboard highlights them clearly so the instructor can manually place them in a
                compatible trio or larger working group.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* CTA BOTTOM SECTION */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 border-t border-border/40">
          <div className="rounded-2xl border border-primary/10 bg-primary/5 p-8 md:p-12 text-center max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-accent/8 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <p className="text-sm font-semibold text-accent uppercase tracking-wider">
              Get started today
            </p>
            <h2 className="mt-3 text-3xl font-display md:text-4xl max-w-2xl mx-auto">
              Start building better teams for your class.
            </h2>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/auth/signup"
                className="motion-lift group inline-flex h-12 items-center justify-center gap-3 rounded-[8px] bg-primary px-6 font-medium text-primary-foreground hover:bg-[color:var(--color-primary-hover)]"
              >
                Create a class
                <ArrowRight className="motion-icon h-4 w-4" />
              </Link>
              <Link
                to="/join"
                className="motion-lift inline-flex h-12 items-center justify-center gap-3 rounded-[8px] border border-border bg-card px-6 font-medium hover:border-primary/40 hover:bg-muted"
              >
                <LogIn className="h-4 w-4" />
                Join a class
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          to="/"
          className="font-display text-lg sm:text-xl md:text-2xl tracking-tight hover:opacity-80 transition-opacity"
        >
          Synco
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted md:flex font-medium">
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/auth/login"
            className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline mr-2"
          >
            Sign in
          </Link>
          <Link
            to="/auth/signup"
            className="motion-lift group inline-flex h-10 items-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-[color:var(--color-primary-hover)]"
          >
            Start
            <ArrowRight className="motion-icon h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function MockMatchCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl p-8 relative z-10 max-w-lg mx-auto w-full hover:shadow-3xl transition-shadow">
      <div className="flex items-center justify-between border-b border-border pb-6 mb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Perfect Match
          </span>
          <h3 className="mt-2 text-2xl font-display font-bold">Maya & Noor</h3>
        </div>
        <div className="text-right">
          <div className="text-4xl font-display font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            92%
          </div>
          <span className="block text-[9px] font-medium uppercase text-muted tracking-wider">
            Compatible
          </span>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
            Why this pairing works
          </h4>
          <p className="text-sm text-foreground leading-relaxed font-medium">
            Both prefer regular check-ins, active communication, and high academic standards. Noor's
            API design expertise complements Maya's needs.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border/60 rounded-lg p-3 bg-muted/30">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
              📅 Shared Hours
            </span>
            <span className="font-semibold text-sm text-foreground">4 slots</span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">Mon, Wed, Fri</span>
          </div>
          <div className="border border-border/60 rounded-lg p-3 bg-muted/30">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
              ⚡ Work Rhythm
            </span>
            <span className="font-semibold text-sm text-foreground">Structured</span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">Early starts</span>
          </div>
        </div>

        <div className="bg-accent/5 rounded-lg p-4 border border-accent/10">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-accent mb-3">
            First meeting checklist
          </h4>
          <ul className="text-xs text-foreground space-y-2">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              <span>Confirm preferred communication channel</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              <span>Set meeting frequency before task allocation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              <span>Establish shared deadline expectations</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LandingFooter() {
  return (
    <footer className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-border/40 px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 text-xs sm:text-sm text-muted md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1 sm:gap-2">
        <Link
          to="/"
          className="font-display text-sm sm:text-base hover:opacity-80 transition-opacity w-fit"
        >
          Synco
        </Link>
        <p className="text-xs text-muted">Sync your way to success</p>
      </div>
      <div className="flex flex-wrap gap-4 sm:gap-6 text-xs">
        <Link to="/auth/login" className="transition-colors hover:text-foreground">
          Sign in
        </Link>
        <Link to="/join" className="transition-colors hover:text-foreground">
          Join
        </Link>
        <span>private / honest / useful</span>
      </div>
    </footer>
  );
}
