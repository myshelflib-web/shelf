"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Plus, Square, X } from "lucide-react";
import type { useStudyPanelChat } from "@/hooks/useStudyPanelChat";
import { readFileAsDataUrl } from "@/lib/studyAiWorkspaceUtils";
import {
  isSlashMenuQuery,
  studyAiSendParts,
  type StudyAiCommand,
} from "@/lib/studyAiCommands";
import { quizSetupHref } from "@/lib/quiz/href";
import { StudyAiCommandsModal } from "./StudyAiCommandsModal";
import { StudyAiThinkingMenu } from "./StudyAiThinkingMenu";
import { StudyAiToolsMenu } from "./StudyAiToolsMenu";
import { StudyAiWebSearchToggle } from "./StudyAiWebSearchToggle";
import type { StudyDepth } from "@/lib/studyDepth";

const lockedChip =
  "opacity-45 cursor-not-allowed saturate-[0.85] hover:!text-[var(--text-secondary)] hover:!bg-transparent";

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
  webSearch,
  onWebSearchChange,
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
  webSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
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

  const placeholder = guestLocked
    ? "Sign in to use Study AI…"
    : embedMode
      ? "Ask about this linked page…"
      : selection
        ? "Ask about the highlight…"
        : panel.busy
          ? "Queue another question…"
          : "Ask anything";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-1 pb-1">
      <div className="pointer-events-auto w-full">
        {guestLocked && (
          <p className="text-center text-[10px] text-[var(--text-muted)] mb-2 leading-relaxed">
            Sign in to save chats, highlights, and progress.
          </p>
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
          {panel.queue.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 justify-center">
              {panel.queue.map((item, i) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                >
                  Queued {i + 1}: {item.text.slice(0, 40) || "Image"}
                  <button
                    type="button"
                    aria-label="Remove queued message"
                    onClick={() => panel.removeQueued(item.id)}
                    className="no-focus-ring leading-none opacity-70 hover:opacity-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {(panel.attachImage || imageBase64) && (
            <div className="mb-2 relative block w-fit mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={panel.attachImage || imageBase64}
                alt="Attachment"
                className="h-14 rounded-lg border border-[var(--border)] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
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

          <div className="flex items-center gap-1 h-12 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] pl-2 pr-2 shadow-[0_8px_28px_rgba(0,0,0,0.14)] transition-shadow focus-within:border-[var(--accent)] focus-within:shadow-[0_8px_28px_rgba(0,0,0,0.14),0_0_0_3px_var(--ring)]">
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
              title="Attach image"
              onClick={() => {
                if (guestLocked) {
                  onGuestLockedClick?.("Use Study AI");
                  return;
                }
                fileRef.current?.click();
              }}
              className={`no-focus-ring w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors ${
                guestLocked ? lockedChip : ""
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
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
              placeholder={placeholder}
              className={`no-focus-ring flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[var(--text-muted)] py-2 px-1 ${
                guestLocked ? "cursor-not-allowed opacity-60" : ""
              }`}
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <StudyAiToolsMenu
                scope="page"
                disabled={panel.busy || guestLocked}
                iconOnly
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
                disabled={panel.busy || guestLocked}
                iconOnly
              />
              <StudyAiWebSearchToggle
                scope="page"
                enabled={webSearch}
                onChange={onWebSearchChange}
                disabled={panel.busy || guestLocked}
                iconOnly
              />
              {panel.busy && (
                <button
                  type="button"
                  onClick={panel.stop}
                  aria-label="Stop generating"
                  className="no-focus-ring w-8 h-8 shrink-0 rounded-full text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              )}
              <button
                type="submit"
                disabled={!guestLocked && !canAsk}
                aria-label={panel.busy ? "Queue" : "Ask"}
                aria-disabled={guestLocked}
                className={`no-focus-ring w-8 h-8 shrink-0 rounded-full bg-[var(--accent)] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors ${
                  guestLocked ? lockedChip : ""
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
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
