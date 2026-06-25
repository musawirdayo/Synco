import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Database,
  KeyRound,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { RouteErrorFallback } from "@/components/route-error-boundary";
import type { Database as SupabaseDatabase, Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
  errorComponent: RouteErrorFallback,
});

type AdminRpc = SupabaseDatabase["public"]["Functions"];
type AdminUserRow = AdminRpc["admin_search_users"]["Returns"][number];
type AdminClassRow = AdminRpc["admin_list_classes"]["Returns"][number];
type AdminAuditRow = AdminRpc["admin_list_audit_log"]["Returns"][number];

type OverviewCounts = {
  users?: number;
  profiles?: number;
  platform_admins?: number;
  classes?: number;
  published_classes?: number;
  class_members?: number;
  survey_responses?: number;
  completed_surveys?: number;
  match_results?: number;
  feedback_total?: number;
  feedback_useful?: number;
  feedback_unsure?: number;
  feedback_not_useful?: number;
  active_5m?: number;
  active_15m?: number;
  active_60m?: number;
};

type ActiveUser = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: "lead" | "student" | null;
  last_seen_at: string;
  last_path: string;
};

type RecentSignup = {
  user_id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  role: "lead" | "student" | null;
};

type RecentClass = {
  id: string;
  name: string;
  institution: string | null;
  created_at: string;
  is_published: boolean;
  invite_code: string;
  expected_count: number;
  lead_name: string | null;
  lead_email: string | null;
  member_count: number;
  completed_count: number;
};

type RecentSubmission = {
  class_id: string;
  class_name: string | null;
  student_id: string;
  display_name: string | null;
  email: string | null;
  completed: boolean;
  submitted_at: string | null;
  updated_at: string;
};

type AdminOverview = {
  generated_at: string;
  counts: OverviewCounts;
  active_now: ActiveUser[];
  recent_signups: RecentSignup[];
  recent_classes: RecentClass[];
  recent_submissions: RecentSubmission[];
  recent_audit: AdminAuditRow[];
};

type DetailState = {
  kind: "user" | "class";
  id: string;
  title: string;
  data: Json;
};

function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [access, setAccess] = useState<"checking" | "denied" | "ready">("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [classes, setClasses] = useState<AdminClassRow[]>([]);
  const [audit, setAudit] = useState<AdminAuditRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [detail, setDetail] = useState<DetailState | null>(null);
  const { confirm, confirmationDialog } = useConfirmDialog();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const { data: allowed, error: adminError } = await supabase.rpc("is_platform_admin", {
        _user_id: user.id,
      });
      if (adminError) throw adminError;
      if (!allowed) {
        setAccess("denied");
        return;
      }

      setAccess("ready");
      const [overviewRes, usersRes, classesRes, auditRes] = await Promise.all([
        supabase.rpc("admin_get_overview"),
        supabase.rpc("admin_search_users", { _query: userSearch, _limit: 100 }),
        supabase.rpc("admin_list_classes", { _query: classSearch, _limit: 100 }),
        supabase.rpc("admin_list_audit_log", { _limit: 80 }),
      ]);

      if (overviewRes.error) throw overviewRes.error;
      if (usersRes.error) throw usersRes.error;
      if (classesRes.error) throw classesRes.error;
      if (auditRes.error) throw auditRes.error;

      setOverview(overviewRes.data as AdminOverview);
      setUsers(usersRes.data ?? []);
      setClasses(classesRes.data ?? []);
      setAudit(auditRes.data ?? []);
    } catch (err) {
      console.error("Admin load failed:", err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("platform_admin_required")) {
        setAccess("denied");
      } else {
        setError("Admin data could not be loaded. Check permissions and migrations.");
      }
    } finally {
      setBusy(false);
    }
  }, [classSearch, user, userSearch]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const counts = overview?.counts ?? {};
  const completionRate = useMemo(() => {
    const total = counts.survey_responses ?? 0;
    if (!total) return 0;
    return Math.round(((counts.completed_surveys ?? 0) / total) * 100);
  }, [counts.completed_surveys, counts.survey_responses]);

  async function runAction(label: string, action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await loadAll();
    } catch (err) {
      console.error(`${label} failed:`, err);
      setError(`${label} failed. Check permissions and try again.`);
    } finally {
      setBusy(false);
    }
  }

  async function openUser(row: AdminUserRow) {
    const { data, error } = await supabase.rpc("admin_get_user_detail", { _user_id: row.user_id });
    if (error) {
      setError("User detail could not be loaded.");
      return;
    }
    setDetail({
      kind: "user",
      id: row.user_id,
      title: row.full_name || row.email || row.user_id,
      data,
    });
  }

  async function openClass(row: AdminClassRow) {
    const { data, error } = await supabase.rpc("admin_get_class_detail", {
      _class_id: row.class_id,
    });
    if (error) {
      setError("Class detail could not be loaded.");
      return;
    }
    setDetail({ kind: "class", id: row.class_id, title: row.name, data });
  }

  if (loading || access === "checking") return <AdminLoading />;

  if (access === "denied") {
    return (
      <AdminShell>
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Platform admin access required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Your account is signed in, but it is not on the platform-admin allowlist. Add your user
            id to <span className="font-mono text-foreground">public.platform_admins</span> or set
            the Supabase Auth app metadata claim{" "}
            <span className="font-mono text-foreground">platform_admin=true</span>.
          </p>
          <div className="mt-6 rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              First-admin SQL example
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-card p-3 text-xs text-muted">
              {`insert into public.platform_admins (user_id, note)
select id, 'founder'
from auth.users
where email = 'your-email@example.com';`}
            </pre>
          </div>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {confirmationDialog}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Platform operations
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            Master Control
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Full-platform visibility for admins: users, classes, survey data, team results,
            feedback, recent activity, and destructive controls.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll()}
          disabled={busy}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw className={"h-4 w-4 " + (busy ? "animate-spin" : "")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Signed up users" value={counts.users ?? 0} detail="Auth accounts" />
        <Metric title="Active now" value={counts.active_5m ?? 0} detail="Seen in last 5 minutes" />
        <Metric
          title="Classes"
          value={counts.classes ?? 0}
          detail={`${counts.published_classes ?? 0} published`}
        />
        <Metric
          title="Survey completion"
          value={`${completionRate}%`}
          detail={`${counts.completed_surveys ?? 0}/${counts.survey_responses ?? 0} completed`}
        />
        <Metric title="Members" value={counts.class_members ?? 0} detail="Class membership rows" />
        <Metric title="Match results" value={counts.match_results ?? 0} detail="Published rows" />
        <Metric
          title="Feedback"
          value={counts.feedback_total ?? 0}
          detail={`${counts.feedback_useful ?? 0} useful · ${counts.feedback_not_useful ?? 0} not useful`}
        />
        <Metric
          title="Admins"
          value={counts.platform_admins ?? 0}
          detail="Allowlisted platform admins"
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Panel
          icon={<Activity className="h-4 w-4" />}
          title="Live Activity"
          detail="Heartbeat-based. Shows users seen in the last 15 minutes."
        >
          <div className="space-y-2">
            {(overview?.active_now ?? []).map((active) => (
              <div
                key={active.user_id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {active.full_name || active.email || active.user_id}
                  </p>
                  <p className="truncate text-xs text-muted">{active.last_path}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {relativeTime(active.last_seen_at)}
                </span>
              </div>
            ))}
            {!overview?.active_now?.length && (
              <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
                No recent heartbeat rows yet. This fills in as signed-in users browse the app.
              </p>
            )}
          </div>
        </Panel>

        <Panel
          icon={<KeyRound className="h-4 w-4" />}
          title="Audit Log"
          detail="Recent admin-control actions."
        >
          <div className="space-y-2">
            {audit.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.action}</p>
                  <span className="text-xs text-muted">{relativeTime(item.created_at)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {item.actor_email ?? "Unknown admin"} · {item.target_type}
                </p>
              </div>
            ))}
            {!audit.length && (
              <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
                No admin actions logged yet.
              </p>
            )}
          </div>
        </Panel>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel
          icon={<Users className="h-4 w-4" />}
          title="Users"
          detail="Search accounts and control roles/admin status."
        >
          <SearchRow
            value={userSearch}
            onChange={setUserSearch}
            onSearch={() => void loadAll()}
            placeholder="Search name, email, or user id"
          />
          <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {users.map((row) => (
              <div key={row.user_id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {row.full_name || row.email || "Unnamed user"}
                      </p>
                      {row.is_admin && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">{row.email ?? row.user_id}</p>
                    <p className="mt-1 text-xs text-muted">
                      {row.role ?? "no role"} · {row.class_count} classes joined ·{" "}
                      {row.led_class_count} led · last seen{" "}
                      {row.last_seen_at ? relativeTime(row.last_seen_at) : "never"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void openUser(row)}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Inspect
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <MiniButton
                    onClick={() =>
                      void runAction("Set role", async () => {
                        const { error } = await supabase.rpc("admin_set_user_role", {
                          _user_id: row.user_id,
                          _role: row.role === "lead" ? "student" : "lead",
                        });
                        if (error) throw error;
                      })
                    }
                  >
                    <UserCog className="h-3 w-3" />
                    Make {row.role === "lead" ? "student" : "lead"}
                  </MiniButton>
                  {row.is_admin ? (
                    <MiniButton
                      danger
                      onClick={() => {
                        void (async () => {
                          const confirmed = await confirm({
                            title: "Revoke platform-admin access?",
                            description: `This removes platform-wide admin access from ${row.email ?? row.user_id}.`,
                            confirmLabel: "Revoke admin",
                            destructive: true,
                          });
                          if (!confirmed) return;

                          void runAction("Revoke admin", async () => {
                            const { error } = await supabase.rpc("admin_revoke_platform_admin", {
                              _user_id: row.user_id,
                            });
                            if (error) throw error;
                          });
                        })();
                      }}
                    >
                      Revoke admin
                    </MiniButton>
                  ) : (
                    <MiniButton
                      onClick={() => {
                        void (async () => {
                          const confirmed = await confirm({
                            title: "Grant platform-admin access?",
                            description: `This gives ${row.email ?? row.user_id} full platform-admin access.`,
                            confirmLabel: "Grant admin",
                          });
                          if (!confirmed) return;

                          void runAction("Grant admin", async () => {
                            const { error } = await supabase.rpc("admin_grant_platform_admin", {
                              _user_id: row.user_id,
                              _note: "Granted from Master Control",
                            });
                            if (error) throw error;
                          });
                        })();
                      }}
                    >
                      Grant admin
                    </MiniButton>
                  )}
                  <MiniButton
                    danger
                    onClick={() => {
                      void (async () => {
                        const confirmed = await confirm({
                          title: "Delete this user account?",
                          description: `This removes ${row.email ?? row.user_id} from Auth and cascades linked data where the database schema allows it.`,
                          confirmLabel: "Delete user",
                          destructive: true,
                        });
                        if (!confirmed) return;

                        void runAction("Delete user", async () => {
                          const { error } = await supabase.rpc("admin_delete_user_account", {
                            _user_id: row.user_id,
                          });
                          if (error) throw error;
                        });
                      })();
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete user
                  </MiniButton>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          icon={<Database className="h-4 w-4" />}
          title="Classes"
          detail="Search workspaces, inspect raw data, and delete classes."
        >
          <SearchRow
            value={classSearch}
            onChange={setClassSearch}
            onSearch={() => void loadAll()}
            placeholder="Search class, invite code, lead, or institution"
          />
          <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {classes.map((row) => (
              <div key={row.class_id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{row.name}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px]">
                        {row.invite_code}
                      </span>
                      {row.is_published && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                          Published
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">
                      Lead: {row.lead_name || row.lead_email || row.lead_id}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {row.member_count}/{row.expected_count} members · {row.completed_count}{" "}
                      surveys · {row.result_count} results · team size {row.team_size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void openClass(row)}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Inspect
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`/class/${row.class_id}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Open lead view
                  </a>
                  <MiniButton
                    danger
                    onClick={() => {
                      void (async () => {
                        const confirmed = await confirm({
                          title: `Delete "${row.name}"?`,
                          description:
                            "This deletes the class and linked roster, survey, result, and team data where the database schema allows it.",
                          confirmLabel: "Delete class",
                          destructive: true,
                        });
                        if (!confirmed) return;

                        void runAction("Delete class", async () => {
                          const { error } = await supabase.rpc("admin_delete_class", {
                            _class_id: row.class_id,
                          });
                          if (error) throw error;
                        });
                      })();
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete class
                  </MiniButton>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <RecentList title="Recent Signups" items={overview?.recent_signups ?? []} />
        <RecentList title="Recent Classes" items={overview?.recent_classes ?? []} />
        <RecentList title="Recent Survey Writes" items={overview?.recent_submissions ?? []} />
      </section>

      {detail && (
        <section className="mt-8 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                {detail.kind} detail
              </p>
              <h2 className="mt-1 text-xl font-semibold">{detail.title}</h2>
              <p className="mt-1 font-mono text-xs text-muted">{detail.id}</p>
            </div>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="h-9 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted"
            >
              Close detail
            </button>
          </div>
          <pre className="max-h-[620px] overflow-auto rounded-xl border border-border bg-background p-4 text-xs leading-relaxed text-muted">
            {JSON.stringify(detail.data, null, 2)}
          </pre>
        </section>
      )}

      <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-muted">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>
            Master Control can expose private survey responses and delete platform data. Keep access
            limited, review the audit log, and disclose operational monitoring in the platform
            privacy policy before production use.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-4 sm:px-6 md:px-10">
        <Link to="/" className="font-display text-lg tracking-tight">
          Synco
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10">{children}</main>
    </div>
  );
}

function AdminLoading() {
  return (
    <AdminShell>
      <div className="grid min-h-[420px] place-items-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-accent" />
          <p className="mt-3 text-sm text-muted">Checking admin access...</p>
        </div>
      </div>
    </AdminShell>
  );
}

function Metric({
  title,
  value,
  detail,
}: {
  title: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
      <div className="mt-3 font-display text-3xl font-semibold">{value}</div>
      <p className="mt-2 text-xs text-muted">{detail}</p>
    </div>
  );
}

function Panel({
  icon,
  title,
  detail,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-muted">{detail}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SearchRow({
  value,
  onChange,
  onSearch,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder: string;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      <button
        type="submit"
        className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
      >
        Search
      </button>
    </form>
  );
}

function MiniButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors " +
        (danger
          ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
          : "border-border bg-card hover:bg-muted")
      }
    >
      {children}
    </button>
  );
}

function RecentList({ title, items }: { title: string; items: Array<Record<string, unknown>> }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="space-y-2">
        {items.slice(0, 8).map((item, index) => {
          const primary =
            stringValue(item.full_name) ||
            stringValue(item.name) ||
            stringValue(item.class_name) ||
            stringValue(item.email) ||
            stringValue(item.id) ||
            stringValue(item.user_id) ||
            `Item ${index + 1}`;
          const time =
            stringValue(item.created_at) ||
            stringValue(item.submitted_at) ||
            stringValue(item.updated_at) ||
            "";
          return (
            <div
              key={`${primary}-${index}`}
              className="rounded-xl border border-border bg-background p-3"
            >
              <p className="truncate text-sm font-medium">{primary}</p>
              <p className="mt-1 truncate text-xs text-muted">
                {stringValue(item.email) ||
                  stringValue(item.invite_code) ||
                  stringValue(item.display_name)}
              </p>
              {time && <p className="mt-1 text-xs text-muted">{relativeTime(time)}</p>}
            </div>
          );
        })}
        {!items.length && <p className="text-sm text-muted">Nothing to show yet.</p>}
      </div>
    </section>
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "";
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "unknown";
  const diff = Date.now() - timestamp;
  const minutes = Math.max(0, Math.round(diff / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
