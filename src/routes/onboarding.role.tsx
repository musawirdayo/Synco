import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Users, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { getPendingJoinCode } from "@/lib/class-flow";

export const Route = createFileRoute("/onboarding/role")({ component: Role });

function Role() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState<"lead" | "student" | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  async function pick(role: "lead" | "student") {
    if (!user) return;
    setSaving(role);
    await supabase
      .from("profiles")
      .upsert({ id: user.id, role, full_name: user.user_metadata.full_name ?? "" });
    const pendingCode = getPendingJoinCode();
    if (role === "student" && pendingCode) {
      navigate({ to: "/join/$code", params: { code: pendingCode } });
      return;
    }
    navigate({ to: role === "lead" ? "/dashboard" : "/join" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-3xl"
      >
        <div className="text-center mb-12">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl mb-3">What brings you to Synco?</h1>
          <p className="text-muted">Pick one — you can always switch later.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              role: "lead" as const,
              icon: Users,
              title: "I'm running a class",
              desc: "Create a workspace, invite students, and publish compatibility results.",
            },
            {
              role: "student" as const,
              icon: LogIn,
              title: "I'm joining a class",
              desc: "Enter your code, complete a short survey, and find who you work best with.",
            },
          ].map(({ role, icon: Icon, title, desc }) => (
            <button
              key={role}
              onClick={() => pick(role)}
              disabled={!!saving}
              className="group text-left p-8 rounded-xl border border-border bg-card hover:border-primary hover:shadow-[0_4px_24px_-12px_oklch(0.33_0.045_155/0.25)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Icon className="h-6 w-6 text-primary mb-6" />
              <h3 className="font-medium text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
              {saving === role && <p className="text-xs text-muted mt-4">Setting you up…</p>}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
