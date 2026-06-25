import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { setActiveClassId } from "@/lib/class-flow";
import { publicPeerName } from "@/lib/class-helpers";
import type { Answers } from "@/lib/synco";

export const Route = createFileRoute("/c/$id_/roster")({ component: Roster });

type Row = {
  student_id: string;
  display_name: string;
  submitted: boolean | null;
  answers: Answers | null;
  displayIndex: number;
  publicName: string | null;
};

type PublicRosterPeer = { student_id: string; name: string };
type MemberRosterRow = { student_id: string; display_name?: string | null };

function Roster() {
  const { id } = useParams({ from: "/c/$id_/roster" });
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [className, setClassName] = useState("");
  const [published, setPublished] = useState(false);
  const [isLead, setIsLead] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setActiveClassId(id);
      const { data: cls } = await supabase
        .from("classes")
        .select("name,is_published,lead_id")
        .eq("id", id)
        .maybeSingle();
      if (!cls) return;
      const viewerIsLead = cls.lead_id === user.id;
      setClassName(cls.name);
      setPublished(cls.is_published);
      setIsLead(viewerIsLead);
      const { data: ownMember } = !viewerIsLead
        ? await supabase
            .from("class_members")
            .select("display_name")
            .eq("class_id", id)
            .eq("student_id", user.id)
            .maybeSingle()
        : { data: null };
      const { data: members } = viewerIsLead
        ? await supabase
            .from("class_members")
            .select("student_id,display_name")
            .eq("class_id", id)
            .order("display_name")
        : await supabase
            .from("class_members")
            .select("student_id")
            .eq("class_id", id)
            .order("joined_at");
      let responseQuery = supabase
        .from("survey_responses")
        .select("student_id,completed,answers")
        .eq("class_id", id);
      if (!viewerIsLead) {
        responseQuery = responseQuery.eq("student_id", user.id);
      }
      const { data: resps } = await responseQuery;
      const responseByStudent = new Map((resps ?? []).map((r) => [r.student_id, r]));
      const publicNameByStudent = new Map<string, string>();
      if (!viewerIsLead && cls.is_published) {
        const { data: result } = await supabase
          .from("match_results")
          .select("result_data")
          .eq("class_id", id)
          .eq("student_id", user.id)
          .maybeSingle();
        const resultData = result?.result_data as
          | { matches?: PublicRosterPeer[]; avoid?: PublicRosterPeer[] }
          | null
          | undefined;
        [...(resultData?.matches ?? []), ...(resultData?.avoid ?? [])].forEach((peer) => {
          publicNameByStudent.set(peer.student_id, peer.name);
        });
      }
      setRows(
        ((members ?? []) as MemberRosterRow[]).map((m, index) => {
          const response = responseByStudent.get(m.student_id);
          const publicName = publicNameByStudent.get(m.student_id) ?? null;
          const displayName = viewerIsLead
            ? (m.display_name ?? "Classmate")
            : m.student_id === user.id
              ? (ownMember?.display_name ?? "You")
              : "";
          return {
            student_id: m.student_id,
            display_name: displayName,
            submitted: response
              ? response.completed
              : publicName
                ? true
                : viewerIsLead
                  ? false
                  : null,
            answers: response?.answers ? (response.answers as Answers) : null,
            displayIndex: index,
            publicName,
          };
        }),
      );
    })();
  }, [user, id]);

  const visibleRows = rows.map((r) => {
    const isMe = r.student_id === user?.id;
    const publicNameShowsIdentity = Boolean(r.publicName && !isAnonymousRosterName(r.publicName));
    const canSeeDetails =
      isLead ||
      isMe ||
      publicNameShowsIdentity ||
      Boolean(
        r.answers && publicPeerName(r.answers, r.display_name, r.displayIndex) === r.display_name,
      );
    return {
      ...r,
      visibleName: canSeeDetails
        ? r.display_name
        : (r.publicName ??
          publicPeerName(
            r.answers ?? { privacyPreference: "Lead introduction only" },
            r.display_name,
            r.displayIndex,
          )),
      canSeeDetails,
    };
  });
  const filtered = visibleRows.filter((r) =>
    r.visibleName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen">
      <header className="px-4 sm:px-6 md:px-12 py-5 border-b border-border/60 flex items-center justify-between">
        <Link to="/c/$id" params={{ id }} className="text-sm text-muted hover:text-foreground">
          ← Back
        </Link>
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary grid place-items-center text-primary-foreground font-display text-sm">
            S
          </div>
          <span className="font-display text-lg">Synco</span>
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl mb-2">{className}</h1>
          <p className="text-muted mb-8">
            {published
              ? "Tap your name to open your detailed profile. You can only open your own — everyone else's results are private to them."
              : "Results aren't published yet. You'll be able to open your profile once your class lead publishes."}
          </p>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find your name…"
            className="w-full h-11 px-4 mb-4 rounded-lg border border-border bg-card text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
          />

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted">No one matches that name.</div>
            )}
            {filtered.map((r) => {
              const isMe = r.student_id === user?.id;
              const canOpen = isMe && published && r.submitted;
              const canTakeSurvey = isMe && !r.submitted;
              const content = (
                <div className="flex items-center justify-between gap-4 p-4 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{r.visibleName}</span>
                      {isMe && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[color:var(--color-accent-light)] text-accent font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {r.canSeeDetails
                        ? r.submitted
                          ? "Submitted"
                          : "Hasn't submitted yet"
                        : "Submission status hidden"}
                    </div>
                  </div>
                  {canOpen || canTakeSurvey ? (
                    <ArrowRight className="h-4 w-4 text-accent shrink-0" />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted shrink-0">
                      <Lock className="h-3 w-3" />
                      {isMe && !published ? "Not published" : "Private"}
                    </span>
                  )}
                </div>
              );
              return canOpen ? (
                <Link
                  key={r.student_id}
                  to="/results"
                  onClick={() => setActiveClassId(id)}
                  className="block hover:bg-muted/50 transition-colors"
                >
                  {content}
                </Link>
              ) : canTakeSurvey ? (
                <Link
                  key={r.student_id}
                  to="/survey/guide"
                  onClick={() => setActiveClassId(id)}
                  className="block hover:bg-muted/50 transition-colors"
                >
                  {content}
                </Link>
              ) : (
                <div key={r.student_id}>{content}</div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function isAnonymousRosterName(name: string) {
  return /^Classmate\s+\d+$/i.test(name.trim());
}
