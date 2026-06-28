import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ClipboardList, Lock, CheckCircle, Clock, Users, ArrowRight } from "lucide-react";
import { QUESTIONS } from "@/lib/questions";

export const Route = createFileRoute("/survey_/guide")({ component: Guide });

const principles = [
  {
    icon: ClipboardList,
    t: "Answer from real behavior",
    b: "Base your answers on the last 4 weeks — not your ideal self.",
  },
  {
    icon: Lock,
    t: "Private by default",
    b: "Your raw answers are never shown to anyone. Only insights are shared.",
  },
  {
    icon: CheckCircle,
    t: "No right answers",
    b: "Honest responses create better matches. This is not a test or grade.",
  },
  {
    icon: Clock,
    t: "A focused survey",
    b: "There are several short screens. Answer in one sitting if you can; progress saves automatically.",
  },
  {
    icon: Users,
    t: "It helps your whole class",
    b: "The more honest your class is, the better everyone's results.",
  },
];

function Guide() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 sm:px-6 md:px-12 py-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary grid place-items-center text-primary-foreground font-display text-sm">
            S
          </div>
          <span className="font-display text-lg">Synco</span>
        </Link>
      </header>
      <main className="flex-1 px-4 sm:px-6 md:px-12 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-3xl mx-auto"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Before you start
          </span>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl mt-3 mb-10">
            A few things before you start.
          </h1>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
            {principles.map(({ icon: Icon, t, b }, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="flex gap-4"
              >
                <Icon className="h-5 w-5 mt-1 text-primary shrink-0" />
                <div>
                  <div className="font-medium mb-1">{t}</div>
                  <p className="text-sm text-muted leading-relaxed">{b}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-sm text-muted mb-6">
            {QUESTIONS.length} quick behavior questions in 5 parts + project details · Saved
            automatically
          </p>
          <button
            onClick={() => navigate({ to: "/survey" })}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-[color:var(--color-primary-hover)] transition-all hover:scale-[1.01] active:scale-[0.99] inline-flex items-center justify-center gap-2"
          >
            I'm ready — start the survey <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </main>
    </div>
  );
}
