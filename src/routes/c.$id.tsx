import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Users, Sparkles, ClipboardList, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { setActiveClassId } from "@/lib/class-flow";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/c/$id")({ component: ClassHub });

type HubState = {
  className: string;
  published: boolean;
  surveyCompleted: boolean;
  submitted: number;
  expected: number;
};

function ClassHub() {
  const { id } = useParams({ from: "/c/$id" });
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<HubState | null>(null);
  const [classDeleted, setClassDeleted] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: cls } = await supabase
        .from("classes")
        .select("name,is_published,expected_count")
        .eq("id", id)
        .maybeSingle();
      if (!cls) {
        setClassDeleted(true);
        return;
      }
      const { count } = await supabase
        .from("survey_responses")
        .select("id", { count: "exact", head: true })
        .eq("class_id", id)
        .eq("completed", true);
      const { data: own } = await supabase
        .from("survey_responses")
        .select("completed")
        .eq("class_id", id)
        .eq("student_id", user.id)
        .maybeSingle();
      setActiveClassId(id);
      setState({
        className: cls.name,
        published: cls.is_published,
        surveyCompleted: !!own?.completed,
        submitted: count ?? 0,
        expected: cls.expected_count,
      });
    })();
  }, [user, id, navigate]);

  if (classDeleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Class no longer exists
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-sm mx-auto">
            The administrator or class lead has deleted this class workspace. You can no longer join
            or view matches for it.
          </p>
          <div className="pt-4">
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-colors"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!state) return <ClassHubSkeleton />;

  return (
    <div className="min-h-screen">
      <header className="px-6 md:px-12 py-5 border-b border-border/60">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary grid place-items-center text-primary-foreground font-display text-sm">
            P
          </div>
          <span className="font-display text-lg">PeerGraph</span>
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
            You're in
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-3">{state.className}</h1>
          <p className="text-muted mb-10">
            {state.published
              ? `Results are live · ${state.submitted} of ${state.expected} students included.`
              : `${state.submitted} of ${state.expected} students have submitted. Results unlock once your class lead publishes them.`}
          </p>

          {state.published ? (
            <div className="grid gap-4">
              {state.surveyCompleted ? (
                <>
                  <HubCard
                    to="/results"
                    icon={<Sparkles className="h-5 w-5" />}
                    title="Open my detailed profile"
                    desc="Your archetype, your work-style meters, your top 5 matches, and 5 pairings to be careful about — with reasons for each."
                    primary
                  />
                  <HubCard
                    to="/c/$id/roster"
                    params={{ id }}
                    icon={<Users className="h-5 w-5" />}
                    title="Browse the published list"
                    desc="See everyone in the class. Tap your name to open your profile."
                  />
                </>
              ) : (
                <>
                  <HubCard
                    to="/survey/guide"
                    icon={<ClipboardList className="h-5 w-5" />}
                    title="Take the survey to unlock your profile"
                    desc="A few focused minutes. Until you submit, your matches and friction pairings stay locked."
                    primary
                  />
                  <HubCard
                    to="/c/$id/roster"
                    params={{ id }}
                    icon={<Users className="h-5 w-5" />}
                    title="Browse the published list"
                    desc="See who else is in your class while you decide."
                  />
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {state.surveyCompleted ? (
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="h-10 w-10 rounded-full bg-[color:var(--color-accent-light)] grid place-items-center mb-3">
                    <Check className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-medium text-lg mb-1">Your survey is done.</h3>
                  <p className="text-sm text-muted">
                    We'll show your matches the moment your class lead publishes. You don't need to
                    do anything else.
                  </p>
                  <Link
                    to="/results"
                    className="mt-5 inline-flex items-center justify-center h-10 px-4 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
                  >
                    Check results
                  </Link>
                </div>
              ) : (
                <HubCard
                  to="/survey/guide"
                  icon={<ClipboardList className="h-5 w-5" />}
                  title="Take the survey"
                  desc="Six honest minutes. That's the whole thing."
                  primary
                />
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

type HubCardProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  primary?: boolean;
} & (
  | { to: "/results" | "/survey/guide"; params?: never }
  | { to: "/c/$id/roster"; params: { id: string } }
);

function HubCard(props: HubCardProps) {
  const { icon, title, desc, primary } = props;
  const className =
    "group block rounded-xl border p-6 transition-all hover:-translate-y-0.5 " +
    (primary
      ? "border-primary bg-primary text-primary-foreground hover:bg-[color:var(--color-primary-hover)]"
      : "border-border bg-card hover:border-primary");

  const content = (
    <div className="flex items-start gap-4">
      <div
        className={
          "h-10 w-10 rounded-full grid place-items-center shrink-0 " +
          (primary
            ? "bg-primary-foreground/15"
            : "bg-[color:var(--color-accent-light)] text-accent")
        }
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="font-medium text-lg">{title}</h3>
          <ArrowRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <p className={"text-sm " + (primary ? "text-primary-foreground/80" : "text-muted")}>
          {desc}
        </p>
      </div>
    </div>
  );

  if (props.to === "/c/$id/roster") {
    return (
      <Link to="/c/$id/roster" params={props.params} className={className}>
        {content}
      </Link>
    );
  }
  if (props.to === "/results") {
    return (
      <Link to="/results" className={className}>
        {content}
      </Link>
    );
  }
  return (
    <Link to="/survey/guide" className={className}>
      {content}
    </Link>
  );
}

function ClassHubSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <header className="px-6 md:px-12 py-5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12 md:py-16 space-y-8">
        <div className="space-y-3 pb-6 border-b border-border">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-9 w-64 rounded-lg" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
