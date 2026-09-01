"use client";

import { useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Plus, Square, X } from "lucide-react";
import type { StudyAiQueuedPrompt } from "@/lib/studyAiQueue";
import { readFileAsDataUrl } from "@/lib/studyAiWorkspaceUtils";
import {
  isSlashMenuQuery,
  studyAiSendParts,
  type StudyAiCommand,
} from "@/lib/studyAiCommands";
import { quizSetupHref } from "@/lib/quiz/href";
import type { QuizLaunch } from "@/lib/quiz/types";
import { StudyAiCommandsModal } from "./StudyAiCommandsModal";
import { StudyAiSuggestChips } from "./StudyAiSuggestChips";
import { StudyAiThinkingMenu } from "./StudyAiThinkingMenu";
import { StudyAiToolsMenu } from "./StudyAiToolsMenu";
import { StudyAiWebSearchToggle } from "./StudyAiWebSearchToggle";
import type { StudyDepth } from "@/lib/studyDepth";

export function StudyAiComposer({
  input,
  onInput,
  attachImage,
  onAttachImage,
  onAttachError,
  loading,
  queue,
  contextChips,
  sourcesActive,
  onOpenAttach,
  attachBtnRef,
  fileRef,
  onSend,
  onStop,
  onRemoveQueued,
  depth,
  onDepthChange,
  isPremium,
  webSearch,
  onWebSearchChange,
  quizLaunch,
  suggestMode = "suggest",
  showSuggestions = true,
}: {
  input: string;
  onInput: (v: string) => void;
  attachImage?: string;
  onAttachImage: (v: string | undefined) => void;
  onAttachError: () => void;
  loading: boolean;
  queue: StudyAiQueuedPrompt[];
  contextChips: { key: string; label: string; onRemove: () => void }[];
  sourcesActive: boolean;
  onOpenAttach: (el: HTMLElement) => void;
  attachBtnRef: RefObject<HTMLButtonElement | null>;
  fileRef: RefObject<HTMLInputElement | null>;
  onSend: (text: string, image?: string, opts?: { prompt?: string }) => void;
  onStop: () => void;
  onRemoveQueued: (id: string) => void;
  depth: StudyDepth;
  onDepthChange: (depth: StudyDepth) => void;
  isPremium: boolean;
  webSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  quizLaunch?: QuizLaunch;
  suggestMode?: "suggest" | "followup";
  showSuggestions?: boolean;
}) {
  const router = useRouter();
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [commandSeed, setCommandSeed] = useState("/");
  const canSend = Boolean(input.trim() || attachImage);

  const runResolved = (
    raw: string,
    image?: string,
    label?: string
  ) => {
    const parts = studyAiSendParts(raw, "library", { label });
    if (parts.kind === "help") {
      setCommandSeed("/");
      setCommandsOpen(true);
      return;
    }
    if (parts.kind === "quiz") {
      router.push(
        quizSetupHref({ ...quizLaunch, focus: parts.topic || quizLaunch?.focus })
      );
      return;
    }
    if (parts.kind === "send") {
      onSend(parts.display, image, { prompt: parts.prompt });
    }
  };

  const pickCommand = (cmd: StudyAiCommand) => {
    onInput("");
    if (cmd.slash === "help") {
      setCommandSeed("/");
      setCommandsOpen(true);
      return;
    }
    runResolved(`/${cmd.slash}`);
  };

  const closeCommands = () => {
    setCommandsOpen(false);
    if (isSlashMenuQuery(input)) onInput("");
  };

  return (
    <div className="study-ai-composer-shell pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3 sm:px-6">
      <div className="pointer-events-auto w-full max-w-[820px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSend) return;
            const text = input;
            const image = attachImage;
            onInput("");
            onAttachImage(undefined);
            runResolved(text, image);
          }}
        >
          {contextChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 justify-center">
              {contextChips.map((chip) => (
                <span
                  key={chip.key}
                  className="study-ai-context-chip inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-semibold"
                >
                  {chip.label}
                  <button
                    type="button"
                    aria-label={`Remove ${chip.label}`}
                    onClick={chip.onRemove}
                    className="no-focus-ring leading-none opacity-70 hover:opacity-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {queue.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 justify-center">
              {queue.map((item, i) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                >
                  <span className="text-[var(--text-muted)]">
                    Queued {i + 1}
                  </span>
                  <span className="max-w-[180px] truncate">
                    {item.text || "Image"}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove queued message"
                    onClick={() => onRemoveQueued(item.id)}
                    className="no-focus-ring leading-none opacity-70 hover:opacity-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {attachImage && (
            <div className="mb-2 relative block w-fit mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachImage}
                alt="Attachment preview"
                className="h-16 rounded-lg border border-[var(--border)] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onAttachImage(undefined)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {showSuggestions && (
            <div className="mb-2 flex justify-center">
              <StudyAiSuggestChips
                scope="library"
                mode={suggestMode}
                count={suggestMode === "followup" ? 3 : 4}
                disabled={loading}
                onPick={(item) =>
                  runResolved(item.insert, undefined, item.label)
                }
              />
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
                  .then((url) => onAttachImage(url))
                  .catch(onAttachError);
              }}
            />
            <button
              ref={attachBtnRef}
              type="button"
              aria-label="Attach or set sources"
              title="Attach or set sources"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenAttach(e.currentTarget);
              }}
              className={`no-focus-ring relative w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors ${
                sourcesActive ? "text-[var(--accent)]" : ""
              }`}
            >
              <Plus className="w-4 h-4" />
              {sourcesActive && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              )}
            </button>
            <input
              value={input}
              onChange={(e) => {
                const v = e.target.value;
                onInput(v);
                if (isSlashMenuQuery(v) && !commandsOpen) {
                  setCommandSeed(v);
                  setCommandsOpen(true);
                }
              }}
              placeholder={
                loading ? "Queue another message…" : "Ask anything"
              }
              className="no-focus-ring flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[var(--text-muted)] py-2 px-1"
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <StudyAiToolsMenu
                scope="library"
                disabled={loading}
                iconOnly
                onPick={pickCommand}
                onBrowseAll={() => {
                  setCommandSeed("/");
                  setCommandsOpen(true);
                }}
              />
              <StudyAiThinkingMenu
                value={depth}
                onChange={onDepthChange}
                isPremium={isPremium}
                disabled={loading}
                iconOnly
              />
              <StudyAiWebSearchToggle
                scope="library"
                enabled={webSearch}
                onChange={onWebSearchChange}
                disabled={loading}
                iconOnly
              />
              {loading && (
                <button
                  type="button"
                  onClick={onStop}
                  className="no-focus-ring w-8 h-8 shrink-0 rounded-full text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                  aria-label="Stop generating"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              )}
              <button
                type="submit"
                disabled={!canSend}
                className="no-focus-ring w-8 h-8 shrink-0 rounded-full bg-[var(--accent)] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
                aria-label={loading ? "Queue message" : "Send"}
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
        onClose={closeCommands}
      />
    </div>
  );
}
