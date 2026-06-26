import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, LogOut, Copy, Check, Trash2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { copyText } from "@/lib/clipboard";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

type ClassRow = {
  id: string;
  name: string;
  institution: string | null;
  expected_count: number;
  is_published: boolean;
  invite_code: string;
};

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState("there");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pageNotice, setPageNotice] = useState("");
  const { confirm, confirmationDialog } = useConfirmDialog();

  async function handleCopy(e: React.MouseEvent, code: string, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyText(`${window.location.origin}/join/${code}`);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    }
  }

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setPageNotice("");
      try {
        const { data: prof, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (prof?.full_name) setName(prof.full_name.split(" ")[0]);

        const { data: adminAllowed, error: adminError } = await supabase.rpc("is_platform_admin", {
          _user_id: user.id,
        });
        if (adminError) console.warn("Could not check admin status:", adminError);
        else setIsAdmin(Boolean(adminAllowed));

        const { data, error: classesError } = await supabase
          .from("classes")
          .select("id,name,institution,expected_count,is_published,invite_code")
          .eq("lead_id", user.id)
          .order("created_at", { ascending: false });
        if (classesError) throw classesError;

        setClasses(data ?? []);
        const map: Record<string, number> = {};
        const classIds = (data ?? []).map((c) => c.id);
        if (classIds.length > 0) {
          const { data: respCounts, error: countsError } = await supabase
            .from("survey_responses")
            .select("class_id")
            .in("class_id", classIds)
            .eq("completed", true);
          if (countsError) throw countsError;

          classIds.forEach((id) => {
            map[id] = 0;
          });
          (respCounts ?? []).forEach((row) => {
            map[row.class_id] = (map[row.class_id] ?? 0) + 1;
          });
        }
        setCounts(map);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setPageNotice("Dashboard data could not be loaded. Refresh the page and try again.");
      }
    })();
  }, [user]);

  async function setupDemoClass() {
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    const confirmed = await confirm({
      title: "Set up a demo class?",
      description:
        "This creates a private demo class for your account with test student responses so you can explore publishing and results.",
      confirmLabel: "Set up demo",
    });
    if (!confirmed) {
      return;
    }

    setPageNotice("");
    try {
      const { error } = await supabase.rpc("setup_demo_class", {
        _lead_id: user.id,
      });
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      console.error("Failed to create demo class:", err);
      setPageNotice(demoClassErrorMessage(err));
    }
  }

  async function deleteClass(e: React.MouseEvent, cls: ClassRow) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await confirm({
      title: `Delete "${cls.name}"?`,
      description:
        "This permanently removes the class, roster, survey responses, and published results.",
      confirmLabel: "Delete class",
      destructive: true,
    });
    if (!confirmed) return;

    setDeletingClassId(cls.id);
    setPageNotice("");
    try {
      const { error } = await supabase.from("classes").delete().eq("id", cls.id);
      if (error) throw error;
      setClasses((current) => current.filter((item) => item.id !== cls.id));
      setCounts((current) => {
        const next = { ...current };
        delete next[cls.id];
        return next;
      });
    } catch (err) {
      console.error("Failed to delete class:", err);
      setPageNotice("Class could not be deleted. Check your connection and try again.");
    } finally {
      setDeletingClassId(null);
    }
  }

  return (
    <div className="min-h-screen">
      {confirmationDialog}
      <header className="px-4 sm:px-6 md:px-12 py-4 sm:py-5 border-b border-border/60 flex items-center justify-between gap-4 flex-wrap">
        <Link
          to="/"
          className="font-display text-lg sm:text-xl md:text-2xl tracking-tight hover:opacity-80 transition-opacity"
        >
          Synco
        </Link>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>
      <main className="px-4 sm:px-6 md:px-12 py-8 sm:py-10 md:py-14 max-w-5xl mx-auto">
        {pageNotice && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {pageNotice}
          </div>
        )}
        <div className="flex items-end justify-between mb-8 sm:mb-10 flex-wrap gap-4">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">Welcome back, {name}.</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border bg-card font-medium hover:bg-muted transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Shield className="h-4 w-4 text-accent" /> Master Control
              </Link>
            )}
            <button
              onClick={setupDemoClass}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border bg-card font-medium hover:bg-muted transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 text-accent" /> Set up demo class
            </button>
            <Link
              to="/class/new"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-[color:var(--color-primary-hover)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Create a class
            </Link>
          </div>
        </div>

        {classes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-dashed border-border bg-card p-12 text-center"
          >
            <div className="h-12 w-12 mx-auto rounded-full bg-[color:var(--color-accent-light)] grid place-items-center mb-4">
              <Plus className="h-5 w-5 text-accent" />
            </div>
            <h2 className="font-display text-2xl mb-2">No classes yet.</h2>
            <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
              Create your first private workspace and share the invite with your students.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={setupDemoClass}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-border bg-card font-medium hover:bg-muted transition-all"
              >
                Set up demo class
              </button>
              <Link
                to="/class/new"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-[color:var(--color-primary-hover)] transition-all"
              >
                Create a class
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {classes.map((c, i) => {
              const sub = counts[c.id] ?? 0;
              const pct = c.expected_count ? Math.round((sub / c.expected_count) * 100) : 0;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <article className="rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-primary)]/30 hover:shadow-[0_12px_30px_oklch(0.18_0_0_/_0.05)]">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <Link to="/class/$id" params={{ id: c.id }} className="min-w-0 flex-1">
                        <h3 className="font-medium text-lg mb-1">{c.name}</h3>
                        {c.institution && <p className="text-sm text-muted">{c.institution}</p>}
                      </Link>
                      <span
                        className={
                          "text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-full " +
                          (c.is_published
                            ? "bg-[color:var(--color-accent-light)] text-accent-foreground"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        {c.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center gap-4 text-sm text-muted flex-wrap">
                      <Link
                        to="/class/$id"
                        params={{ id: c.id }}
                        className="flex min-w-0 flex-1 items-center gap-4 transition-colors hover:text-foreground"
                      >
                        <span>
                          <span className="text-foreground font-medium">{sub}</span> of{" "}
                          {c.expected_count} submitted
                        </span>
                        <span className="font-mono text-xs">{pct}%</span>
                      </Link>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={(e) => handleCopy(e, c.invite_code, c.id)}
                          className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-background hover:bg-muted text-xs font-medium transition-colors"
                        >
                          {copiedId === c.id ? (
                            <>
                              <Check className="h-3 w-3 text-[color:var(--color-success)]" /> Link
                              copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy invite link ·{" "}
                              <span className="font-mono">{c.invite_code}</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => deleteClass(e, c)}
                          disabled={deletingClassId === c.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deletingClassId === c.id ? "Deleting" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function demoClassErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("setup_demo_class_forbidden")) {
    return "Demo class could not be created because your session is not allowed to create demo data for this account. Sign in again and retry.";
  }
  if (message.includes("demo_invite_code_unavailable")) {
    return "Demo class could not be created because Synco could not reserve a private demo code for your account. Try again in a moment.";
  }
  return "Demo class could not be created. Check that your Supabase migrations are applied, then try again.";
}
