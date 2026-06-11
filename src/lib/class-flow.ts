import { supabase } from "@/integrations/supabase/client";

const ACTIVE_CLASS_KEY = "synco_active_class";
const PENDING_JOIN_CODE_KEY = "synco_pending_join_code";
const LEGACY_ACTIVE_CLASS_KEY = "pg_active_class";
const LEGACY_PENDING_JOIN_CODE_KEY = "pg_pending_join_code";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase();
}

export function normalizeStudentIdentifier(identifier: string) {
  return identifier.trim().replace(/\s+/g, " ").toLowerCase();
}

export function getActiveClassId() {
  if (!canUseStorage()) return null;
  return (
    window.localStorage.getItem(ACTIVE_CLASS_KEY) ??
    window.localStorage.getItem(LEGACY_ACTIVE_CLASS_KEY)
  );
}

export function setActiveClassId(classId: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACTIVE_CLASS_KEY, classId);
  window.localStorage.removeItem(LEGACY_ACTIVE_CLASS_KEY);
}

export function clearActiveClassId() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACTIVE_CLASS_KEY);
  window.localStorage.removeItem(LEGACY_ACTIVE_CLASS_KEY);
}

export function rememberPendingJoinCode(code: string) {
  const normalized = normalizeInviteCode(code);
  if (!canUseStorage() || !normalized) return;
  window.localStorage.setItem(PENDING_JOIN_CODE_KEY, normalized);
  window.localStorage.removeItem(LEGACY_PENDING_JOIN_CODE_KEY);
}

export function getPendingJoinCode() {
  if (!canUseStorage()) return null;
  return (
    window.localStorage.getItem(PENDING_JOIN_CODE_KEY) ??
    window.localStorage.getItem(LEGACY_PENDING_JOIN_CODE_KEY)
  );
}

export function clearPendingJoinCode() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(PENDING_JOIN_CODE_KEY);
  window.localStorage.removeItem(LEGACY_PENDING_JOIN_CODE_KEY);
}

export async function getLatestMembershipClassId(userId: string) {
  const { data } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", userId)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.class_id ?? null;
}
