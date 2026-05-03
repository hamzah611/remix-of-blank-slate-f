import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  AdminLanguage,
  AdminCourse,
  AdminUnit,
  AdminStage,
  AdminQuestion,
  QuestionType,
  ContentStatus,
} from "./adminTypes";
import { STAGE_DEFS, REQUIRED_QUESTION_COUNTS } from "./adminTypes";

// ── Query hooks ────────────────────────────────────────────

export function useLanguages() {
  return useQuery<AdminLanguage[]>({
    queryKey: ["admin", "languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as AdminLanguage[];
    },
  });
}

export function useCourses(languageId: string | null) {
  return useQuery<AdminCourse[]>({
    queryKey: ["admin", "courses", languageId],
    enabled: !!languageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("language_id", languageId!)
        .order("order_index");
      if (error) throw error;
      return data as AdminCourse[];
    },
  });
}

export function useUnits(courseId: string | null) {
  return useQuery<AdminUnit[]>({
    queryKey: ["admin", "units", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("course_id", courseId!)
        .order("order_index");
      if (error) throw error;
      return data as AdminUnit[];
    },
  });
}

export function useStages(unitId: string | null) {
  return useQuery<AdminStage[]>({
    queryKey: ["admin", "stages", unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("unit_id", unitId!)
        .order("order_index");
      if (error) throw error;
      return data as AdminStage[];
    },
  });
}

export function useQuestions(stageId: string | null) {
  return useQuery<AdminQuestion[]>({
    queryKey: ["admin", "questions", stageId],
    enabled: !!stageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("stage_id", stageId!)
        .order("order_index");
      if (error) throw error;
      return data as AdminQuestion[];
    },
  });
}

// ── Mutation helpers ───────────────────────────────────────

export async function createLanguage(name: string, code: string) {
  const { error } = await supabase.from("languages").insert({ name, code });
  if (error) throw error;
}

export async function deleteLanguage(id: string) {
  const { error } = await supabase.from("languages").delete().eq("id", id);
  if (error) throw error;
}

export async function createCourse(
  languageId: string,
  title: string,
  description: string
) {
  const { data: existing } = await supabase
    .from("courses")
    .select("order_index")
    .eq("language_id", languageId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
  const { error } = await supabase
    .from("courses")
    .insert({ language_id: languageId, title, description: description || null, order_index: nextIndex });
  if (error) throw error;
}

export async function deleteCourse(id: string) {
  const { data: units } = await supabase.from("units").select("id").eq("course_id", id);
  if (units) {
    for (const unit of units) {
      await deleteUnit(unit.id);
    }
  }
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

export async function createUnit(courseId: string, title: string) {
  const { data: existing } = await supabase
    .from("units")
    .select("order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data: unit, error } = await supabase
    .from("units")
    .insert({ course_id: courseId, title, order_index: nextIndex })
    .select()
    .single();
  if (error) throw error;

  const stages = STAGE_DEFS.map((def) => ({ ...def, unit_id: unit.id }));
  const { error: stageError } = await supabase.from("stages").insert(stages);
  if (stageError) throw stageError;
}

export async function deleteUnit(id: string) {
  const { data: stages } = await supabase.from("stages").select("id").eq("unit_id", id);
  if (stages) {
    for (const stage of stages) {
      const { error } = await supabase.from("questions").delete().eq("stage_id", stage.id);
      if (error) throw error;
    }
  }
  const { error: stageErr } = await supabase.from("stages").delete().eq("unit_id", id);
  if (stageErr) throw stageErr;
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) throw error;
}

export async function createQuestion(
  stageId: string,
  type: QuestionType,
  content: Record<string, unknown>,
  orderIndex: number
) {
  const { error } = await supabase
    .from("questions")
    .insert({ stage_id: stageId, type, content: content as never, order_index: orderIndex });
  if (error) throw error;
}

export async function updateQuestion(
  id: string,
  content: Record<string, unknown>
) {
  const { error } = await supabase
    .from("questions")
    .update({ content: content as never })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderQuestions(
  questions: AdminQuestion[],
  fromIdx: number,
  toIdx: number
) {
  const reordered = [...questions];
  const [moved] = reordered.splice(fromIdx, 1);
  reordered.splice(toIdx, 0, moved);

  const updates = reordered.map((q, i) =>
    supabase.from("questions").update({ order_index: i }).eq("id", q.id)
  );
  await Promise.all(updates);
}

export async function duplicateQuestion(q: AdminQuestion, newOrderIndex: number) {
  const { error } = await supabase.from("questions").insert({
    stage_id: q.stage_id,
    type: q.type,
    content: q.content as never,
    order_index: newOrderIndex,
  });
  if (error) throw error;
}

// ── Publish mutations ──────────────────────────────────────

export async function setQuestionStatus(id: string, status: ContentStatus) {
  const { error } = await supabase.from("questions").update({ status } as never).eq("id", id);
  if (error) throw error;
}

export async function setStageStatus(id: string, status: ContentStatus) {
  const { error } = await supabase.from("stages").update({ status } as never).eq("id", id);
  if (error) throw error;
}

export async function setUnitStatus(id: string, status: ContentStatus) {
  const { error } = await supabase.from("units").update({ status } as never).eq("id", id);
  if (error) throw error;
}

// Validate then bulk-publish a unit (unit + all stages + all questions).
// Returns an array of stage names that fail validation (empty = OK to publish).
export async function publishUnit(unitId: string): Promise<string[]> {
  // Fetch stages
  const { data: stages, error: stageErr } = await supabase
    .from("stages")
    .select("id, name, stage_type")
    .eq("unit_id", unitId);
  if (stageErr) throw stageErr;

  // Count questions per stage
  const stageIds = (stages ?? []).map((s) => s.id);
  const { data: qs } = await supabase
    .from("questions")
    .select("stage_id")
    .in("stage_id", stageIds);

  const counts: Record<string, number> = {};
  for (const q of qs ?? []) {
    counts[q.stage_id] = (counts[q.stage_id] ?? 0) + 1;
  }

  const failing = (stages ?? []).filter((s) => {
    const req = REQUIRED_QUESTION_COUNTS[s.stage_type as keyof typeof REQUIRED_QUESTION_COUNTS] ?? 0;
    return req > 0 && (counts[s.id] ?? 0) < req;
  }).map((s) => s.name);

  if (failing.length > 0) return failing;

  // Publish unit
  await supabase.from("units").update({ status: "published" } as never).eq("id", unitId);

  // Publish all stages
  if (stageIds.length > 0) {
    await supabase.from("stages").update({ status: "published" } as never).in("id", stageIds);
    // Publish all questions in those stages
    await supabase.from("questions").update({ status: "published" } as never).in("stage_id", stageIds);
  }

  return [];
}

export async function unpublishUnit(unitId: string) {
  const { data: stages } = await supabase.from("stages").select("id").eq("unit_id", unitId);
  const stageIds = (stages ?? []).map((s) => s.id);

  await supabase.from("units").update({ status: "draft" } as never).eq("id", unitId);
  if (stageIds.length > 0) {
    await supabase.from("stages").update({ status: "draft" } as never).in("id", stageIds);
    await supabase.from("questions").update({ status: "draft" } as never).in("stage_id", stageIds);
  }
}

// ── Stage question counts (for sidebar badges) ─────────────

export function useStageQuestionCounts(unitId: string | null) {
  return useQuery<Record<string, number>>({
    queryKey: ["admin", "stageCounts", unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const { data: stages } = await supabase.from("stages").select("id").eq("unit_id", unitId!);
      const stageIds = (stages ?? []).map((s) => s.id);
      if (stageIds.length === 0) return {};

      const { data: qs } = await supabase
        .from("questions")
        .select("stage_id")
        .in("stage_id", stageIds);

      const counts: Record<string, number> = {};
      for (const q of qs ?? []) {
        counts[q.stage_id] = (counts[q.stage_id] ?? 0) + 1;
      }
      return counts;
    },
  });
}

// ── Admin users (super_admin only) ─────────────────────────

export interface AdminUserRow {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: "super_admin" | "content_admin";
  created_at: string;
}

export function useAdminUsers() {
  return useQuery<AdminUserRow[]>({
    queryKey: ["admin", "adminUsers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_users" as never).select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as AdminUserRow[];
    },
  });
}

export async function inviteAdminUser(email: string, role: "super_admin" | "content_admin", invitedBy: string) {
  const { error } = await supabase.from("admin_invites" as never).insert({
    email,
    role,
    invited_by: invitedBy,
  } as never);
  if (error) throw error;
}

export async function removeAdminUser(userId: string) {
  const { error } = await supabase.from("admin_users" as never).delete().eq("user_id", userId);
  if (error) throw error;
}

export { useQueryClient };
