"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Download,
  ImagePlus,
  ListTree,
  MessageSquareText,
  Network,
  Square,
  StickyNote,
  X,
} from "lucide-react";
import { isPremiumUser } from "@/lib/premium";
import { StudyAIContent } from "@/lib/studyAiMarkdown";
import { useAuth } from "@/hooks/useAuth";
import { useStudyPanelChat } from "@/hooks/useStudyPanelChat";
import { GreetingBlock } from "./GreetingBlock";
import { LivelyLine } from "./LivelyLine";
import { CopyMessageButton } from "./study-ai/CopyMessageButton";
import { DeleteMessageButton } from "./study-ai/DeleteMessageButton";
import { SaveAnswerModal } from "./study-ai/SaveAnswerModal";
import { StreamActivity } from "./study-ai/StreamActivity";

interface StudyPanelProps {
  articleId?: string;
  userTopicId?: string;
  selection?: string | null;
  imageBase64?: string;
  onClearSelection?: () => void;
  onAttachNote?: (note: string) => Promise<void> | void;
  embedMode?: boolean;
  guestLocked?: boolean;
  onGuestLockedClick?: (feature: string) => void;
}

const ACTIONS: Array<{
  mode: "summarize" | "notes" | "mindmap";
  label: string;
  icon: typeof ListTree;
}> = [
  { mode: "summarize", label: "Summarize", icon: ListTree },
  { mode: "notes", label: "Short notes", icon: StickyNote },
  { mode: "mindmap", label: "Mind map", icon: Network },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export function StudyPanel({
  articleId,
  userTopicId,
  selection,
  imageBase64,
  onClearSelection,
  onAttachNote,
  embedMode = false,
  guestLocked = false,
  onGuestLockedClick,
}: StudyPanelProps) {
  const { user } = useAuth();
  const memoryLimit = isPremiumUser(user) ? 300 : 30;
  const [pasted, setPasted] = useState("");
  const [attached, setAttached] = useState(false);
  const [saveContent, setSaveContent] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const panel = useStudyPanelChat({
    articleId,
    userTopicId,
    selection: selection || pasted.trim() || null,
    imageBase64,
    guestLocked,
    onGuestLockedClick,
    memoryLimit,
    userId: user?.id,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [panel.turns, panel.busy, panel.statusEvents]);

  const canAsk = Boolean(
    panel.question.trim() || panel.attachImage || imageBase64
  );
  const lastAssistant = [...panel.turns]
    .reverse()
    .find((t) => t.role === "assistant");
  const chatting =
    panel.turns.length > 0 ||
    panel.busy ||
    panel.question.trim().length > 0 ||
    Boolean(panel.attachImage) ||
    Boolean(imageBase64);
  const showGreeting =
    Boolean(guestLocked || user?.name) && !chatting && !panel.restoring;
  const greetingName = user?.name ?? "there";
  const lockedChip =
    "opacity-45 cursor-not-allowed saturate-[0.85] hover:!text-[var(--text-secondary)] hover:!border-[var(--border)]";

  return (
    <div className="flex flex-col min-h-0 h-full">
      {embedMode && (
        <p className="text-[12px] text-[var(--text-secondary)] mb-3 leading-relaxed shrink-0">
          Highlights and sending selected text are not available in embeds. Ask
          about the linked page, or paste a passage below.
        </p>
      )}
      {embedMode && (
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={3}
          placeholder="Optional: paste a passage to use as context…"
          className="w-full mb-3 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[13px] text-[var(--text-primary)] p-3 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
        />
      )}
      {!embedMode && selection && (
        <div className="mb-3 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--accent-subtle)] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide text-[var(--accent)]">
              Highlight
            </span>
            <button
              type="button"
              className="text-[11px] text-[var(--accent)] hover:underline"
              onClick={onClearSelection}
            >
              clear
            </button>
          </div>
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-4">
            {selection}
          </p>
        </div>
      )}

      {panel.threadId && (
        <div className="mb-2 shrink-0 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <MessageSquareText className="w-3 h-3" />
            Saved to Study AI
          </span>
          <Link
            href={`/study-ai/${panel.threadId}`}
            className="text-[11px] text-[var(--accent)] hover:underline shrink-0"
          >
            Open chat
          </Link>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-3 pr-0.5">
        {showGreeting && (
          <div className="space-y-2 pt-0.5">
            <GreetingBlock
              name={greetingName}
              size="md"
              align="left"
              showAccent={false}
              animatedDots
              showSubtitle={false}
            />
            <LivelyLine
              surface="studyPanel"
              className="text-[12px] text-[var(--text-muted)] leading-relaxed"
            />
          </div>
        )}
        {!showGreeting && !user?.name && panel.turns.length === 0 && !panel.busy && (
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {selection
              ? "Highlight is the focus; the full file and your study profile still inform the answer."
              : "Questions use the full file, your library vectors, and study profile."}{" "}
            Keeps the last {memoryLimit} messages (
            {isPremiumUser(user) ? "Premium" : "Free"}).
          </p>
        )}
        {panel.turns.map((t) =>
          t.role === "user" ? (
            <div key={t.id} className="group flex justify-end">
              <div className="max-w-[92%]">
                <div className="rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-3.5 py-2.5 text-[13px] leading-relaxed">
                  {t.imageBase64 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.imageBase64}
                      alt="Attached"
                      className="mb-2 max-h-28 rounded-lg border border-white/20"
                    />
                  )}
                  <p className="whitespace-pre-wrap">{t.content}</p>
                </div>
                {!t.id.startsWith("u-") && !t.id.startsWith("a-") && (
                  <div className="mt-1 flex justify-end opacity-0 group-hover:opacity-100">
                    <DeleteMessageButton onDelete={() => void panel.deleteTurn(t.id)} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div key={t.id} className="flex justify-start">
              <div className="max-w-[96%] w-full rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-3">
                <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-2">
                  {t.streaming ? (
                    <span className="study-ai-live-dot" aria-hidden />
                  ) : null}
                  Study AI
                  {t.streaming ? " · live" : ""}
                </p>
                {t.content ? (
                  <StudyAIContent content={t.content} streaming={t.streaming} />
                ) : (
                  <StreamActivity
                    events={panel.statusEvents}
                    live={Boolean(t.streaming)}
                  />
                )}
                {t.streaming && t.content && panel.statusEvents.length > 0 && (
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    {panel.statusEvents[panel.statusEvents.length - 1]?.detail}
                  </p>
                )}
                {!t.streaming && t.content && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <CopyMessageButton text={t.content} />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline"
                      onClick={() => setSaveContent(t.content)}
                    >
                      <Download className="w-3 h-3" />
                      Save / download
                    </button>
                    {onAttachNote &&
                      !embedMode &&
                      lastAssistant?.id === t.id && (
                        <button
                          type="button"
                          disabled={attached}
                          className="text-[11px] text-[var(--accent)] hover:underline disabled:opacity-60"
                          onClick={async () => {
                            await onAttachNote(t.content);
                            setAttached(true);
                          }}
                        >
                          {attached
                            ? "Saved on highlight"
                            : "Save as note on highlight"}
                        </button>
                      )}
                    {!t.id.startsWith("a-") && (
                      <DeleteMessageButton
                        onDelete={() => void panel.deleteTurn(t.id)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {panel.busy && !panel.turns.some((t) => t.streaming) && (
          <StreamActivity events={panel.statusEvents} live />
        )}
        {panel.error && (
          <p className="text-xs text-red-400 leading-relaxed">{panel.error}</p>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 space-y-3">
        {guestLocked && (
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Sign in to save chats, highlights, and progress.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.mode}
              type="button"
              disabled={panel.busy}
              aria-disabled={guestLocked}
              onClick={() => void panel.run(a.mode)}
              className={`inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--accent-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] disabled:opacity-50 transition-colors ${
                guestLocked ? lockedChip : ""
              }`}
            >
              <a.icon className="w-3.5 h-3.5" />
              {a.label}
            </button>
          ))}
        </div>

        {panel.queue.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {panel.queue.map((item, i) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
              >
                Queued {i + 1}: {item.text.slice(0, 40) || "Image"}
                <button
                  type="button"
                  aria-label="Remove queued message"
                  onClick={() => panel.removeQueued(item.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {(panel.attachImage || imageBase64) && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={panel.attachImage || imageBase64}
              alt="Attachment"
              className="h-14 rounded-lg border border-[var(--border)]"
            />
            {panel.attachImage && (
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => panel.setAttachImage(undefined)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canAsk && !guestLocked) return;
            const q = panel.question.trim();
            const img = panel.attachImage;
            panel.setQuestion("");
            panel.setAttachImage(undefined);
            void panel.run("ask", q, img);
          }}
        >
          <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1.5 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--ring)]">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                void readFileAsDataUrl(file)
                  .then(panel.setAttachImage)
                  .catch(() => panel.setError("Could not attach image"));
              }}
            />
            <button
              type="button"
              aria-disabled={guestLocked}
              aria-label="Attach image"
              onClick={() => {
                if (guestLocked) {
                  onGuestLockedClick?.("Use Study AI");
                  return;
                }
                fileRef.current?.click();
              }}
              className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] ${
                guestLocked ? lockedChip : ""
              }`}
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <input
              value={panel.question}
              onChange={(e) => panel.setQuestion(e.target.value)}
              readOnly={guestLocked}
              onFocus={() => {
                if (guestLocked) onGuestLockedClick?.("Use Study AI");
              }}
              placeholder={
                guestLocked
                  ? "Sign in to use Study AI…"
                  : embedMode
                    ? "Ask about this linked page…"
                    : selection
                      ? "Ask about the highlight…"
                      : panel.busy
                        ? "Queue another question…"
                        : "Ask about this file…"
              }
              className={`flex-1 min-w-0 bg-transparent px-1 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none ${
                guestLocked ? "cursor-not-allowed opacity-60" : ""
              }`}
            />
            {panel.busy && (
              <button
                type="button"
                onClick={panel.stop}
                aria-label="Stop generating"
                className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}
            <button
              type="submit"
              disabled={!guestLocked && !canAsk}
              aria-label={panel.busy ? "Queue" : "Ask"}
              aria-disabled={guestLocked}
              className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center bg-[var(--accent)] text-white disabled:opacity-35 hover:bg-[var(--accent-hover)] transition-colors ${
                guestLocked ? "opacity-45 cursor-not-allowed saturate-[0.85]" : ""
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {saveContent && (
        <SaveAnswerModal
          content={saveContent}
          defaultTitle="Study AI notes"
          onClose={() => setSaveContent(null)}
        />
      )}
    </div>
  );
}
