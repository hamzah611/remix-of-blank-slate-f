import { useEffect } from "react";
import { useFieldArray, UseFormReturn, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StrokeCanvas } from "./StrokeCanvas";
import type { QuestionType } from "./adminTypes";

// ── Shared styles ──────────────────────────────────────────

const inputStyle = { backgroundColor: "white", borderColor: "#E8E0D5", color: "#1E2D3D" };
const urduInputStyle = { ...inputStyle, fontFamily: "'Amiri', serif", direction: "rtl" as const, fontSize: 18 };
const labelStyle = { color: "#1E2D3D", opacity: 0.55, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em" };

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <FormLabel style={labelStyle}>{children}</FormLabel>;
}

function OptionsArray({ form, name, label, urdu = false }: {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  urdu?: boolean;
}) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name });
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      {fields.map((field, i) => (
        <div key={field.id} className="flex items-center gap-2">
          <FormField control={form.control} name={`${name}.${i}.value`} render={({ field: f }) => (
            <FormItem className="flex-1 m-0">
              <FormControl>
                <Input
                  placeholder={`Option ${i + 1}`}
                  style={urdu ? urduInputStyle : inputStyle}
                  {...f}
                />
              </FormControl>
            </FormItem>
          )} />
          <button type="button" onClick={() => remove(i)} style={{ color: "#C17B4A", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ value: "" })}
        style={{ borderColor: "#E8E0D5", color: "#1E2D3D", alignSelf: "flex-start" }}
      >
        <Plus size={13} className="mr-1" /> Add Option
      </Button>
    </div>
  );
}

// ── Per-type field components ──────────────────────────────

function TraceLetterFields({ form }: { form: UseFormReturn<any> }) {
  const tolerance = useWatch({ control: form.control, name: "tolerance" }) ?? 3;
  const referencePoints: { x: number; y: number }[][] =
    useWatch({ control: form.control, name: "reference_points" }) ?? [];
  const letterValue: string = useWatch({ control: form.control, name: "letter" }) ?? "";

  return (
    <>
      <FormField control={form.control} name="letter" render={({ field }) => (
        <FormItem>
          <FieldLabel>Letter (Urdu Script)</FieldLabel>
          <FormControl><Input style={urduInputStyle} placeholder="ا" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="language" render={({ field }) => (
        <FormItem>
          <FieldLabel>Language</FieldLabel>
          <FormControl><Input style={inputStyle} placeholder="urdu" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormItem>
        <FieldLabel>Reference Stroke</FieldLabel>
        <p style={{ fontSize: 11, color: "#1E2D3D", opacity: 0.45, marginBottom: 8 }}>
          Draw the correct stroke path once. Users' traces will be compared to this.
        </p>
        <StrokeCanvas
          value={referencePoints}
          onChange={(pts) => form.setValue("reference_points", pts)}
          letter={letterValue || undefined}
        />
      </FormItem>

      <FormItem>
        <FieldLabel>Tolerance (1 = strict, 5 = lenient)</FieldLabel>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={tolerance}
            onChange={(e) => form.setValue("tolerance", Number(e.target.value))}
            style={{ accentColor: "#D4A853", flex: 1 }}
          />
          <span style={{ fontWeight: 700, color: "#1E2D3D", minWidth: 16, textAlign: "center" }}>
            {tolerance}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#1E2D3D", opacity: 0.4, marginTop: 4 }}>
          Controls how strictly the user's stroke is matched using DTW distance.
        </p>
      </FormItem>
    </>
  );
}

function FindLetterFields({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField control={form.control} name="roman" render={({ field }) => (
        <FormItem>
          <FieldLabel>Roman Transliteration</FieldLabel>
          <FormControl><Input style={inputStyle} placeholder="alif" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="correct_letter" render={({ field }) => (
        <FormItem>
          <FieldLabel>Correct Urdu Letter</FieldLabel>
          <FormControl><Input style={urduInputStyle} placeholder="ا" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <OptionsArray form={form} name="options" label="Wrong Options (3)" urdu />
    </>
  );
}

function AudioPlayFields({ form, uploadFile, uploading }: {
  form: UseFormReturn<any>;
  uploadFile: (bucket: "guftugu-audio" | "guftugu-images", file: File) => Promise<string>;
  uploading: boolean;
}) {
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile("guftugu-audio", file);
    form.setValue("audio_url", url);
  };

  return (
    <>
      <FormItem>
        <FieldLabel>Audio File</FieldLabel>
        <input type="file" accept="audio/*" onChange={handleFile} disabled={uploading}
          style={{ color: "#1E2D3D", fontSize: 13 }} />
        <FormField control={form.control} name="audio_url" render={({ field }) => (
          <Input style={{ ...inputStyle, fontSize: 11 }} placeholder="URL auto-filled on upload" readOnly {...field} />
        )} />
        {uploading && <p style={{ color: "#6BA3C8", fontSize: 11 }}>Uploading…</p>}
      </FormItem>
      <FormField control={form.control} name="transcript" render={({ field }) => (
        <FormItem>
          <FieldLabel>Transcript (shown after playing)</FieldLabel>
          <FormControl><Textarea style={urduInputStyle} rows={2} placeholder="ارے یار، کیا حال ہے؟" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="correct_answer" render={({ field }) => (
        <FormItem>
          <FieldLabel>Correct Answer</FieldLabel>
          <FormControl><Input style={inputStyle} placeholder="Answer" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <OptionsArray form={form} name="options" label="Wrong Options" />
    </>
  );
}

function ConversationFields({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField control={form.control} name="prompt" render={({ field }) => (
        <FormItem>
          <FieldLabel>Prompt</FieldLabel>
          <FormControl><Textarea style={inputStyle} placeholder="Say hello in Urdu" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="correct_answer" render={({ field }) => (
        <FormItem>
          <FieldLabel>Correct Answer</FieldLabel>
          <FormControl><Input style={inputStyle} placeholder="آداب" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <OptionsArray form={form} name="options" label="Wrong Options" />
    </>
  );
}

function FillBlankFields({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField control={form.control} name="sentence" render={({ field }) => (
        <FormItem>
          <FieldLabel>Sentence (use ___ for blank)</FieldLabel>
          <FormControl><Textarea style={urduInputStyle} placeholder="میرا نام ___ ہے" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="blank_position" render={({ field }) => (
        <FormItem>
          <FieldLabel>Blank Position (word number)</FieldLabel>
          <FormControl><Input type="number" min={1} style={inputStyle} placeholder="3" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="correct_answer" render={({ field }) => (
        <FormItem>
          <FieldLabel>Correct Answer</FieldLabel>
          <FormControl><Input style={urduInputStyle} placeholder="احمد" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </>
  );
}

function BuildWordFields({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField control={form.control} name="word" render={({ field }) => (
        <FormItem>
          <FieldLabel>Target Urdu Word</FieldLabel>
          <FormControl><Input style={urduInputStyle} placeholder="سلام" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <p style={{ color: "#1E2D3D", opacity: 0.45, fontSize: 12 }}>
        Letters will be automatically scrambled when saved.
      </p>
    </>
  );
}

function ImageMatchFields({ form, uploadFile, uploading }: {
  form: UseFormReturn<any>;
  uploadFile: (bucket: "guftugu-audio" | "guftugu-images", file: File) => Promise<string>;
  uploading: boolean;
}) {
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile("guftugu-images", file);
    form.setValue("image_url", url);
  };

  return (
    <>
      <FormItem>
        <FieldLabel>Image File</FieldLabel>
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading}
          style={{ color: "#1E2D3D", fontSize: 13 }} />
        <FormField control={form.control} name="image_url" render={({ field }) => (
          <Input style={{ ...inputStyle, fontSize: 11 }} placeholder="URL auto-filled on upload" readOnly {...field} />
        )} />
        {uploading && <p style={{ color: "#6BA3C8", fontSize: 11 }}>Uploading…</p>}
      </FormItem>
      <FormField control={form.control} name="correct_urdu" render={({ field }) => (
        <FormItem>
          <FieldLabel>Correct Urdu Label</FieldLabel>
          <FormControl><Input style={urduInputStyle} placeholder="کتاب" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <OptionsArray form={form} name="options" label="Wrong Urdu Options" urdu />
    </>
  );
}

function DialogueFields({ form }: { form: UseFormReturn<any> }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "dialogue" });
  return (
    <>
      <div>
        <FieldLabel>Dialogue Lines</FieldLabel>
        <div className="flex flex-col gap-2 mt-1">
          {fields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-start">
              <FormField control={form.control} name={`dialogue.${i}.speaker`} render={({ field: f }) => (
                <FormItem style={{ width: 90 }}>
                  <FormControl><Input style={inputStyle} placeholder="Speaker" {...f} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name={`dialogue.${i}.line`} render={({ field: f }) => (
                <FormItem className="flex-1">
                  <FormControl><Input style={urduInputStyle} placeholder="Line…" {...f} /></FormControl>
                </FormItem>
              )} />
              <button type="button" onClick={() => remove(i)} style={{ color: "#C17B4A", background: "none", border: "none", cursor: "pointer", paddingTop: 8 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => append({ speaker: "", line: "" })}
            style={{ borderColor: "#E8E0D5", color: "#1E2D3D", alignSelf: "flex-start" }}>
            <Plus size={13} className="mr-1" /> Add Line
          </Button>
        </div>
      </div>
      <FormField control={form.control} name="question" render={({ field }) => (
        <FormItem>
          <FieldLabel>Comprehension Question</FieldLabel>
          <FormControl><Input style={inputStyle} placeholder="What did X say?" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="correct_answer" render={({ field }) => (
        <FormItem>
          <FieldLabel>Correct Answer</FieldLabel>
          <FormControl><Input style={inputStyle} placeholder="Answer" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <OptionsArray form={form} name="options" label="Wrong Options" />
    </>
  );
}

function ReadingFields({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField control={form.control} name="passage" render={({ field }) => (
        <FormItem>
          <FieldLabel>Passage</FieldLabel>
          <FormControl><Textarea rows={5} style={urduInputStyle} placeholder="Urdu passage…" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="question" render={({ field }) => (
        <FormItem>
          <FieldLabel>Comprehension Question</FieldLabel>
          <FormControl><Input style={inputStyle} placeholder="What is the passage about?" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="correct_answer" render={({ field }) => (
        <FormItem>
          <FieldLabel>Correct Answer</FieldLabel>
          <FormControl><Input style={inputStyle} placeholder="Answer" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <OptionsArray form={form} name="options" label="Wrong Options" />
    </>
  );
}

// ── Dispatcher ─────────────────────────────────────────────

interface DispatcherProps {
  type: QuestionType;
  form: UseFormReturn<any>;
  uploadFile: (bucket: "guftugu-audio" | "guftugu-images", file: File) => Promise<string>;
  uploading: boolean;
}

export function QuestionFieldsForType({ type, form, uploadFile, uploading }: DispatcherProps) {
  // Reset form fields when type changes
  useEffect(() => {
    form.reset({ type });
  }, [type]);

  switch (type) {
    case "trace_letter": return <TraceLetterFields form={form} />;
    case "find_letter":  return <FindLetterFields form={form} />;
    case "audio_play":   return <AudioPlayFields form={form} uploadFile={uploadFile} uploading={uploading} />;
    case "conversation": return <ConversationFields form={form} />;
    case "fill_blank":   return <FillBlankFields form={form} />;
    case "build_word":   return <BuildWordFields form={form} />;
    case "image_match":  return <ImageMatchFields form={form} uploadFile={uploadFile} uploading={uploading} />;
    case "dialogue":     return <DialogueFields form={form} />;
    case "reading":      return <ReadingFields form={form} />;
    default:             return null;
  }
}

// ── Content builder (form values → jsonb content) ──────────

export function buildContent(type: QuestionType, values: Record<string, any>): Record<string, unknown> {
  switch (type) {
    case "trace_letter":
      return {
        letter: values.letter,
        language: values.language,
        reference_points: values.reference_points ?? [],
        tolerance: values.tolerance ?? 3,
      };
    case "find_letter":
      return {
        roman: values.roman,
        correct_letter: values.correct_letter,
        options: (values.options || []).map((o: any) => o.value).filter(Boolean),
      };
    case "audio_play":
      return {
        audio_url: values.audio_url,
        transcript: values.transcript ?? "",
        correct_answer: values.correct_answer,
        options: (values.options || []).map((o: any) => o.value).filter(Boolean),
      };
    case "conversation":
      return {
        prompt: values.prompt,
        correct_answer: values.correct_answer,
        options: (values.options || []).map((o: any) => o.value).filter(Boolean),
      };
    case "fill_blank":
      return {
        sentence: values.sentence,
        blank_position: Number(values.blank_position),
        correct_answer: values.correct_answer,
      };
    case "build_word": {
      const letters = (values.word || "").split("");
      const scrambled = [...letters].sort(() => Math.random() - 0.5);
      return { word: values.word, scrambled_letters: scrambled };
    }
    case "image_match":
      return {
        image_url: values.image_url,
        correct_urdu: values.correct_urdu,
        options: (values.options || []).map((o: any) => o.value).filter(Boolean),
      };
    case "dialogue":
      return {
        dialogue: (values.dialogue || []).filter((d: any) => d.speaker || d.line),
        question: values.question,
        correct_answer: values.correct_answer,
        options: (values.options || []).map((o: any) => o.value).filter(Boolean),
      };
    case "reading":
      return {
        passage: values.passage,
        question: values.question,
        correct_answer: values.correct_answer,
        options: (values.options || []).map((o: any) => o.value).filter(Boolean),
      };
    default:
      return {};
  }
}
