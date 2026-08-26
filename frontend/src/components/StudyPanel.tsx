"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, MessageSquareText, X } from "lucide-react";
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
import { StudyPanelComposer } from "./study-ai/StudyPanelComposer";

interface StudyPanelProps {
  articleId?: string;
  userTopicId?: string;
  selection?: string | null;
  imageBase64?: string;
  /** Visible PDF page JPEG when the file has little/no text. */
  getPageImage?: () => string;
  onClearSelection?: () => void;
  onAttachNote?: (note: string) => Promise<void> | void;
  embedMode?: boolean;
  guestLocked?: boolean;
  onGuestLockedClick?: (feature: string) => void;
}

export function StudyPanel({
  articleId,
  userTopicId,
  selection,
  imageBase64,
  getPageImage,
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

  const contextImage = (userImg?: string) => {
    if (userImg || imageBase64) {
      return { image: userImg || imageBase64, ephemeral: false };
    }
    if (selection) return { image: undefined, ephemeral: false };
    const shot = getPageImage?.();
    return { image: shot || undefined, ephemeral: Boolean(shot) };
  };
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
    Boolean(guestLocked || user?.name) && !panel.restoring;
  const greetingName = user?.name ?? "there";

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

      {showGreeting && chatting && (
        <div className="shrink-0 mb-2">
          <GreetingBlock
            name={greetingName}
            size="sm"
            align="left"
            showAccent={false}
            showSubtitle={false}
          />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-3 pr-0.5">
        {showGreeting && !chatting && (
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

      <StudyPanelComposer
        panel={panel}
        guestLocked={guestLocked}
        onGuestLockedClick={onGuestLockedClick}
        embedMode={embedMode}
        selection={selection}
        imageBase64={imageBase64}
        contextImage={contextImage}
      />

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
