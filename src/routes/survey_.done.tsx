import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  getActiveClassId,
  getLatestMembershipClassId,
  getPendingJoinCode,
  setActiveClassId,
} from "@/lib/class-flow";
import { copyText } from "@/lib/clipboard";

export const Route = createFileRoute("/survey_/done")({ component: Done });

function Done() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState<{
    classId: string;
    className: string;
    submitted: number;
    expected: number;
    submittedAt: string | null;
    code: string;
    published: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const cid = getActiveClassId() ?? (await getLatestMembershipClassId(user.id));
      if (!cid) {
        const pendingCode = getPendingJoinCode();
        if (pendingCode) navigate({ to: "/join/$code", params: { code: pendingCode } });
        else navigate({ to: "/join" });
        return;
      }
      setActiveClassId(cid);
      const { data: cls } = await supabase
        .from("classes")
        .select("name,expected_count,invite_code,is_published")
        .eq("id", cid)
        .single();
      if (!cls) {
        navigate({ to: "/join" });
        return;
      }
      const { count } = await supabase
        .from("survey_responses")
        .select("id", { count: "exact", head: true })
        .eq("class_id", cid)
        .eq("completed", true);
      const { data: own } = await supabase
        .from("survey_responses")
        .select("submitted_at")
        .eq("class_id", cid)
        .eq("student_id", user.id)
        .maybeSingle();
      setInfo({
        classId: cid,
        className: cls.name,
        submitted: count ?? 0,
        expected: cls.expected_count,
        submittedAt: own?.submitted_at ?? null,
        code: cls.invite_code,
        published: cls.is_published,
      });
    })();
  }, [user, navigate]);

  async function copyLink() {
    if (!info) return;
    const ok = await copyText(`${window.location.origin}/join/${info.code}`);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-md w-full text-center"
      >
        <div className="h-12 w-12 mx-auto rounded-full bg-[color:var(--color-accent-light)] grid place-items-center mb-6">
          <Check className="h-6 w-6 text-accent" />
        </div>
        <h1 className="font-display text-4xl mb-3">You're in.</h1>
        <p className="text-muted mb-8">
          {info?.published ? (
            <>
              Results are ready.{" "}
              <Link to="/results" className="text-foreground hover:underline">
                View yours →
              </Link>
            </>
          ) : (
            "Results unlock when your class lead publishes them."
          )}
        </p>

        {info && (
          <div className="rounded-xl border border-border bg-card p-5 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Class</span>
              <span className="font-medium">{info.className}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Submissions</span>
              <span className="font-medium">
                {info.submitted} of {info.expected}
              </span>
            </div>
            {info.submittedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">You submitted</span>
                <span className="font-medium">
                  {new Date(info.submittedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/results"
            className={
              "inline-flex items-center justify-center h-11 px-5 rounded-lg font-medium text-sm transition-all " +
              (info?.published
                ? "bg-primary text-primary-foreground hover:bg-[color:var(--color-primary-hover)] hover:scale-[1.02] active:scale-[0.98]"
                : "border border-border bg-card hover:bg-muted")
            }
          >
            {info?.published ? "Open my results" : "Check results"}
          </Link>
          {info && (
            <Link
              to="/c/$id"
              params={{ id: info.classId }}
              className="inline-flex items-center justify-center h-11 px-5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
            >
              Class page
            </Link>
          )}
        </div>

        <button
          onClick={copyLink}
          className="mt-3 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-[color:var(--color-success)]" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Share with a classmate
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
