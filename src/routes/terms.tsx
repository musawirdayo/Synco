import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/terms")({ component: Terms });

function Terms() {
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
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Terms</span>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl mt-3 mb-5">
            Terms of service coming soon.
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            This page is a placeholder. Human-written terms should be added before public launch.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
