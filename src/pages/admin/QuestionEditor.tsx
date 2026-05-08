import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { GripVertical, Copy, Trash2, Plus, AlertTriangle, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { QuestionFieldsForType, buildContent } from "./QuestionFields";
import { QuestionPreviewModal } from "./QuestionPreviewModal";
import { useStorageUpload } from "./useStorageUpload";
import {
  useQuestions,
  createQuestion,
  deleteQuestion,
  reorderQuestions,
  duplicateQuestion,
  setQuestionStatus,
  setStageStatus,
} from "./useAdminData";
import type { StageType, QuestionType } from "./adminTypes";
import { QUESTION_TYPES_BY_STAGE, QUESTION_TYPE_LABELS, REQUIRED_QUESTION_COUNTS } from "./adminTypes";

// ── Styles ──────────────────────────────────────────────────

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  published: { backgroundColor: "#E8F5E9", color: "#2E7D32" },
  draft:     { backgroundColor: "#F5F5F5", color: "#757575" },
};

interface Props {
  stageId: string;
  stageType: StageType;
  unitId: string;
}

function contentPreview(content: Record<string, unknown>): string {
  const val = content.letter || content.word || content.prompt || content.passage || content.audio_url || content.image_url || "";
  return String(val).slice(0, 60) || "—";
}

export function QuestionEditor({ stageId, stageType, unitId }: Props) {
  const qc = useQueryClient();
  const { data: questions = [], isLoading } = useQuestions(stageId);
  const { uploadFile, uploading } = useStorageUpload();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<QuestionType | "">("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);

  // Drag-and-drop state
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const form = useForm({ defaultValues: {} });
  const allowedTypes = QUESTION_TYPES_BY_STAGE[stageType];
  const required = REQUIRED_QUESTION_COUNTS[stageType];
  const isUnderfull = required > 0 && questions.length < required;

  // ── Dohrao info ─────────────────────────────────────────────

  if (stageType === "dohrao") {
    return (
      <div className="rounded-2xl p-5" style={{ border: "1.5px solid #6BA3C8", backgroundColor: "#F0F6FB" }}>
        <p className="font-semibold text-sm" style={{ color: "#1E2D3D" }}>Dohrao — Auto-Generated Stage</p>
        <p className="text-sm mt-2" style={{ color: "#1E2D3D", opacity: 0.6 }}>
          This stage has no editable questions. It is automatically populated from the user's weakest questions across stages 1–4.
        </p>
      </div>
    );
  }

  // ── Reorder via drag ────────────────────────────────────────

  const handleDrop = async (toIdx: number) => {
    if (dragFrom === null || dragFrom === toIdx) return;
    setDragFrom(null);
    setDragOver(null);
    try {
      await reorderQuestions(questions, dragFrom, toIdx);
      qc.invalidateQueries({ queryKey: ["admin", "questions", stageId] });
    } catch {
      toast.error("Failed to reorder questions.");
    }
  };

  // ── Duplicate ───────────────────────────────────────────────

  const handleDuplicate = async (q: typeof questions[number]) => {
    try {
      await duplicateQuestion(q, questions.length);
      qc.invalidateQueries({ queryKey: ["admin", "questions", stageId] });
      qc.invalidateQueries({ queryKey: ["admin", "stageCounts"] });
      toast.success("Question duplicated.");
    } catch {
      toast.error("Failed to duplicate question.");
    }
  };

  // ── Publish toggle ──────────────────────────────────────────

  const handleToggleQuestionStatus = async (q: typeof questions[number]) => {
    const next = q.status === "published" ? "draft" : "published";
    setPublishing(q.id);
    try {
      await setQuestionStatus(q.id, next);
      qc.invalidateQueries({ queryKey: ["admin", "questions", stageId] });
      toast.success(next === "published" ? "Question published." : "Question unpublished.");
    } catch (err: any) {
      if (err?.message?.includes("column") || err?.code === "42703") {
        toast.error("Run the SQL migration to enable the publish system.");
      } else {
        toast.error("Failed to update status.");
      }
    } finally {
      setPublishing(null);
    }
  };

  const handlePublishStage = async () => {
    setPublishing("stage");
    try {
      await setStageStatus(stageId, "published");
      toast.success("Stage published.");
    } catch (err: any) {
      if (err?.message?.includes("column") || err?.code === "42703") {
        toast.error("Run the SQL migration to enable the publish system.");
      } else {
        toast.error("Failed to publish stage.");
      }
    } finally {
      setPublishing(null);
    }
  };

  // ── Save new question ───────────────────────────────────────

  const handleSave = form.handleSubmit(async (values) => {
    if (!selectedType) { toast.error("Select a question type."); return; }
    setSaving(true);
    try {
      const content = buildContent(selectedType as QuestionType, values as Record<string, any>);
      await createQuestion(stageId, selectedType as QuestionType, content, questions.length);
      qc.invalidateQueries({ queryKey: ["admin", "questions", stageId] });
      qc.invalidateQueries({ queryKey: ["admin", "stageCounts"] });
      toast.success("Question added.");
      setAddOpen(false);
      setSelectedType("");
      form.reset({});
    } catch {
      toast.error("Failed to save question.");
    } finally {
      setSaving(false);
    }
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Validation warning */}
      {isUnderfull && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: "#FFF8E1", border: "1.5px solid #D4A853" }}
        >
          <AlertTriangle size={16} style={{ color: "#D4A853", flexShrink: 0, marginTop: 1 }} />
          <p className="text-sm" style={{ color: "#1E2D3D" }}>
            This stage needs <strong>{required - questions.length} more question{required - questions.length !== 1 ? "s" : ""}</strong> to meet the minimum of {required} required for <em>{stageType}</em>. Publishing is blocked until this is met.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold" style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Questions
          </h2>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: isUnderfull ? "#FFF8E1" : "#E8F5E9",
              color: isUnderfull ? "#C17B4A" : "#2E7D32",
            }}
          >
            {questions.length} / {required > 0 ? required : "∞"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Preview as user */}
          <button
            onClick={() => window.open(`/stage/${stageId}`, "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: "rgba(107,163,200,0.12)", color: "#4A7FA5", border: "1px solid rgba(107,163,200,0.3)", cursor: "pointer" }}
            title="Preview this stage as a learner"
          >
            <Play size={11} /> Preview
          </button>
          {!isUnderfull && (
            <button
              onClick={handlePublishStage}
              disabled={publishing === "stage"}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: "#E8F5E9", color: "#2E7D32", border: "none", cursor: "pointer" }}
            >
              {publishing === "stage" ? "Publishing…" : "Publish Stage"}
            </button>
          )}
          <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setSelectedType(""); form.reset({}); } }}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#1E2D3D", color: "#FAF6F0", border: "none", cursor: "pointer" }}
              >
                <Plus size={14} /> Add Question
              </button>
            </DialogTrigger>
            <DialogContent style={{ backgroundColor: "#FAF6F0", border: "1.5px solid #E8E0D5", maxWidth: 520 }}>
              <DialogHeader>
                <DialogTitle style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Add Question
                </DialogTitle>
              </DialogHeader>

              <div className="mb-4">
                <label style={{ color: "#1E2D3D", opacity: 0.55, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Question Type
                </label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as QuestionType)}>
                  <SelectTrigger className="mt-1" style={{ backgroundColor: "white", borderColor: "#E8E0D5", color: "#1E2D3D" }}>
                    <SelectValue placeholder="Choose a type…" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: "white", borderColor: "#E8E0D5" }}>
                    {allowedTypes.map((t) => (
                      <SelectItem key={t} value={t} style={{ color: "#1E2D3D" }}>
                        {QUESTION_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <ScrollArea className="max-h-[50vh] pr-2">
                  <Form {...form}>
                    <div className="flex flex-col gap-4">
                      <QuestionFieldsForType
                        type={selectedType as QuestionType}
                        form={form}
                        uploadFile={uploadFile}
                        uploading={uploading}
                      />
                    </div>
                  </Form>
                </ScrollArea>
              )}

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !selectedType}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    backgroundColor: "#D4A853",
                    color: "#1E2D3D",
                    border: "none",
                    cursor: saving || !selectedType ? "not-allowed" : "pointer",
                    opacity: saving || !selectedType ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving…" : "Save Question"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Question list */}
      {isLoading ? (
        <p className="text-sm" style={{ color: "#1E2D3D", opacity: 0.4 }}>Loading…</p>
      ) : questions.length === 0 ? (
        <p className="text-sm" style={{ color: "#1E2D3D", opacity: 0.35 }}>
          No questions yet. Click "Add Question" to get started.
        </p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #E8E0D5" }}>
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: "white", borderBottom: "1.5px solid #E8E0D5" }}>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", width: 28 }} />
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", width: 32 }}>#</TableHead>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Type</TableHead>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Content</TableHead>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</TableHead>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", width: 120 }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q, i) => (
                <TableRow
                  key={q.id}
                  draggable
                  onDragStart={() => setDragFrom(i)}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
                  style={{
                    backgroundColor:
                      dragOver === i
                        ? "#E8F0F8"
                        : dragFrom === i
                        ? "transparent"
                        : i % 2 === 0
                        ? "white"
                        : "#FDFAF6",
                    borderBottom: "1px solid #F0EAE0",
                    opacity: dragFrom === i ? 0.4 : 1,
                    transition: "background-color 0.1s",
                  }}
                >
                  {/* Drag handle */}
                  <TableCell style={{ cursor: "grab", color: "#1E2D3D", opacity: 0.25, paddingRight: 0, paddingLeft: 8 }}>
                    <GripVertical size={14} />
                  </TableCell>
                  <TableCell style={{ color: "#1E2D3D", opacity: 0.4, fontSize: 12 }}>{i + 1}</TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: "#E8F0F8", color: "#1E2D3D", fontWeight: 500, fontSize: 11 }}>
                      {QUESTION_TYPE_LABELS[q.type] || q.type}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: "#1E2D3D", opacity: 0.7, fontSize: 13, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {contentPreview(q.content)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleQuestionStatus(q)}
                      disabled={publishing === q.id}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: "none",
                        cursor: "pointer",
                        ...(STATUS_BADGE[q.status ?? "draft"]),
                      }}
                    >
                      {publishing === q.id ? "…" : q.status === "published" ? "Published" : "Draft"}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <QuestionPreviewModal question={q} />
                      <button
                        onClick={() => handleDuplicate(q)}
                        title="Duplicate"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#6BA3C8", opacity: 0.8, padding: 2 }}
                      >
                        <Copy size={14} />
                      </button>
                      <DeleteConfirmDialog
                        trigger={
                          <button title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "#C17B4A", opacity: 0.7, padding: 2 }}>
                            <Trash2 size={14} />
                          </button>
                        }
                        itemLabel={`Question ${i + 1}`}
                        onConfirm={async () => {
                          await deleteQuestion(q.id);
                          qc.invalidateQueries({ queryKey: ["admin", "questions", stageId] });
                          qc.invalidateQueries({ queryKey: ["admin", "stageCounts"] });
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
