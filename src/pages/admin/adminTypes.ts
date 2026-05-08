export const STAGE_TYPES = ["aghaaz", "suno", "samjho", "pehchano", "dohrao", "guftugu"] as const;
export type StageType = typeof STAGE_TYPES[number];

export type ContentStatus = "draft" | "published";
export type AdminRole = "super_admin" | "content_admin";

export const REQUIRED_QUESTION_COUNTS: Record<StageType, number> = {
  aghaaz:   0,
  suno:     0,
  samjho:   0,
  pehchano: 0,
  dohrao:   0,
  guftugu:  0,
};

export function getAdminRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): AdminRole | null {
  const meta = (user.app_metadata ?? user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.role === "super_admin") return "super_admin";
  if (meta.role === "content_admin") return "content_admin";
  if (meta.is_admin) return "content_admin";
  return null;
}

export const STAGE_LABELS: Record<StageType, string> = {
  aghaaz:   "Aghaaz",
  suno:     "Suno",
  samjho:   "Samjho",
  pehchano: "Pehchano",
  dohrao:   "Dohrao",
  guftugu:  "Guftugu",
};

export type QuestionType =
  | "trace_letter"
  | "find_letter"
  | "audio_play"
  | "conversation"
  | "fill_blank"
  | "build_word"
  | "image_match"
  | "dialogue"
  | "reading";

export const QUESTION_TYPES_BY_STAGE: Record<StageType, QuestionType[]> = {
  aghaaz:   ["trace_letter", "find_letter"],
  suno:     ["audio_play"],
  samjho:   ["conversation", "fill_blank", "build_word"],
  pehchano: ["image_match"],
  dohrao:   [],
  guftugu:  ["dialogue", "reading"],
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  trace_letter: "Trace Letter",
  find_letter:  "Find Letter",
  audio_play:   "Audio Play",
  conversation: "Conversation",
  fill_blank:   "Fill in the Blank",
  build_word:   "Build a Word",
  image_match:  "Image Match",
  dialogue:     "Dialogue",
  reading:      "Reading",
};

// Domain row types
export interface AdminLanguage {
  id: string;
  code: string;
  name: string;
}

export interface AdminCourse {
  id: string;
  language_id: string;
  title: string;
  description: string | null;
  order_index: number;
  status?: ContentStatus;
}

export interface AdminUnit {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  status?: ContentStatus;
}

export interface AdminStage {
  id: string;
  unit_id: string;
  name: string;
  stage_type: StageType;
  stage_number: number;
  order_index: number;
  status?: ContentStatus;
}

export interface AdminQuestion {
  id: string;
  stage_id: string;
  type: QuestionType;
  content: Record<string, unknown>;
  order_index: number;
  status?: ContentStatus;
}

// Stage auto-creation definitions
export const STAGE_DEFS: Array<{
  name: string;
  stage_type: StageType;
  stage_number: number;
  order_index: number;
}> = [
  { name: "Aghaaz",   stage_type: "aghaaz",   stage_number: 1, order_index: 0 },
  { name: "Suno",     stage_type: "suno",     stage_number: 2, order_index: 1 },
  { name: "Samjho",   stage_type: "samjho",   stage_number: 3, order_index: 2 },
  { name: "Pehchano", stage_type: "pehchano", stage_number: 4, order_index: 3 },
  { name: "Dohrao",   stage_type: "dohrao",   stage_number: 5, order_index: 4 },
  { name: "Guftugu",  stage_type: "guftugu",  stage_number: 6, order_index: 5 },
];
