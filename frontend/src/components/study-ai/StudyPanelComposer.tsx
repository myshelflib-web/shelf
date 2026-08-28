"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ImagePlus, Square, X } from "lucide-react";
import type { useStudyPanelChat } from "@/hooks/useStudyPanelChat";
import { readFileAsDataUrl } from "@/lib/studyAiWorkspaceUtils";
import {
  isSlashMenuQuery,
  studyAiSendParts,
  type StudyAiCommand,
} from "@/lib/studyAiCommands";
import { quizSetupHref } from "@/lib/quiz/href";
import { StudyAiCommandsModal } from "./StudyAiCommandsModal";
import { StudyAiSuggestChips } from "./StudyAiSuggestChips";
import { StudyAiThinkingMenu } from "./StudyAiThinkingMenu";
import { StudyAiToolsMenu } from "./StudyAiToolsMenu";
import type { StudyDepth } from "@/lib/studyDepth";

const lockedChip =
  "opacity-45 cursor-not-allowed saturate-[0.85] hover:!text-[var(--text-secondary)] hover:!border-[var(--border)]";

type Panel = ReturnType<typeof useStudyPanelChat>;

export function StudyPanelComposer({
  panel,
  guestLocked,
  onGuestLockedClick,
  embedMode,
  selection,
  imageBase64,
  contextImage,
  pageId,
  depth,
  onDepthChange,
  isPremium,
}: {
  panel: Panel;
  guestLocked?: boolean;
  onGuestLockedClick?: (feature: string) => void;
  embedMode?: boolean;
  selection?: string | null;
  imageBase64?: string;
  pageId?: string;
  depth: StudyDepth;
  onDepthChange: (depth: StudyDepth) => void;
  isPremium: boolean;
  contextImage: (userImg?: string) => {
    image?: string;
    ephemeral: boolean;
  };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [commandSeed, setCommandSeed] = useState("/");
  const canAsk = Boolean(
    panel.question.trim() || panel.attachImage || imageBase64
  );

  const runWithContext = (
    mode: "ask" | "summarize" | "notes" | "mindmap" | "deep-summary" | "analyze",
    q?: string,
    userImg?: string,
    opts?: { prompt?: string }
  ) => {
    const ctx = contextImage(userImg);
    void panel.run(mode, q, ctx.image, {
      skipHistoryImage: ctx.ephemeral,
      prompt: opts?.prompt,
    });
  };

  const runResolved = (raw: string, userImg?: string, label?: string) => {
    const parts = studyAiSendParts(raw, "page", { label });
    if (parts.kind === "help") {
      setCommandSeed("/");
      setCommandsOpen(true);
      return;
    }
    if (parts.kind === "mode") {
      runWithContext(parts.mode, undefined, userImg);
      return;
    }
    if (parts.kind === "quiz") {
      router.push(
        quizSetupHref({
          contextKind: "PAGE",
          pageId,
          focus: parts.topic,
        })
      );
      return;
    }
    if (parts.kind === "send") {
      runWithContext("ask", parts.display, userImg, { prompt: parts.prompt });
    }
  };

  const pickCommand = (cmd: StudyAiCommand) => {
    setCommandsOpen(false);
    panel.setQuestion("");
    if (guestLocked) {
      onGuestLockedClick?.("Use Study AI");
      return;
    }
    if (cmd.slash === "help") {
      setCommandSeed("/");
      setCommandsOpen(true);
      return;
    }
    runResolved(`/${cmd.slash}`);
  };

  return (
    <div className="shrink-0 space-y-3">
      {guestLocked && (
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          Sign in to save chats, highlights, and progress.
        </p>
      )}
      {!guestLocked && (
        <StudyAiSuggestChips
          scope="page"
          mode={
            panel.turns.some((t) => t.role === "assistant" && t.content)
              ? "followup"
              : "suggest"
          }
          count={panel.turns.length > 0 ? 3 : 4}
          onPick={(item) => runResolved(item.insert, undefined, item.label)}
          disabled={panel.busy}
        />
      )}

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
          if (guestLocked) {
            onGuestLockedClick?.("Use Study AI");
            return;
          }
          const q = panel.question.trim();
          const img = panel.attachImage;
          panel.setQuestion("");
          panel.setAttachImage(undefined);
          runResolved(q, img);
        }}
      >
        <div className="flex items-end gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1.5 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--ring)]">
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
          <StudyAiToolsMenu
            scope="page"
            compact
            disabled={panel.busy || guestLocked}
            onPick={pickCommand}
            onBrowseAll={() => {
              if (guestLocked) {
                onGuestLockedClick?.("Use Study AI");
                return;
              }
              setCommandSeed("/");
              setCommandsOpen(true);
            }}
          />
          <StudyAiThinkingMenu
            value={depth}
            onChange={onDepthChange}
            isPremium={isPremium}
            compact
            disabled={panel.busy || guestLocked}
          />
          <input
            value={panel.question}
            onChange={(e) => {
              const v = e.target.value;
              panel.setQuestion(v);
              if (!guestLocked && isSlashMenuQuery(v) && !commandsOpen) {
                setCommandSeed(v);
                setCommandsOpen(true);
              }
            }}
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
                      : "Ask or pick a tool…"
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
              guestLocked ? lockedChip : ""
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </form>
      <StudyAiCommandsModal
        open={commandsOpen}
        initialQuery={commandSeed}
        onPick={pickCommand}
        onClose={() => {
          setCommandsOpen(false);
          if (isSlashMenuQuery(panel.question)) panel.setQuestion("");
        }}
      />
    </div>
  );
}
