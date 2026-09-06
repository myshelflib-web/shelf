"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { ChatContextKind, UserSubject } from "@/types";
import { quizFieldClass } from "@/lib/quiz/ui";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

export type QuizScopeValue = {
  contextKind: ChatContextKind;
  contextNotebookId: string;
  contextTopicId: string;
  contextPageId: string;
  /** Kept for API compatibility; quiz UI always uses study goal instead. */
  relevancyDocId: string;
};

function pagesFor(
  notebooks: UserSubject[],
  kind: ChatContextKind,
  notebookId: string,
  topicId: string
) {
  const nb = notebooks.find((n) => n.id === notebookId);
  if (!nb || kind !== "PAGE") return [];
  if (topicId === "__notebook__") return nb.pages ?? [];
  if (topicId) {
    const topic = nb.topicGroups?.find((t) => t.id === topicId);
    return topic?.pages ?? [];
  }
  return [
    ...(nb.pages ?? []),
    ...(nb.topicGroups ?? []).flatMap((t) => t.pages ?? []),
  ];
}

const SCOPE_OPTIONS = [
  { value: "LIBRARY", label: "Entire library" },
  { value: "NOTEBOOK", label: "Folder" },
  { value: "TOPIC", label: "Nested folder" },
  { value: "PAGE", label: "File" },
];

export function QuizScopeFields({
  value,
  onChange,
  disabled,
}: {
  value: QuizScopeValue;
  onChange: (next: QuizScopeValue) => void;
  disabled?: boolean;
}) {
  const [notebooks, setNotebooks] = useState<UserSubject[]>([]);

  useEffect(() => {
    void api.myContent
      .listSubjects({ pageSize: 100, sort: "name", tree: true })
      .then(({ subjects }) => setNotebooks(subjects))
      .catch(() => {});
  }, []);

  const selectedNb = notebooks.find((n) => n.id === value.contextNotebookId);
  const topics = useMemo(
    () => selectedNb?.topicGroups ?? [],
    [selectedNb]
  );
  const pages = useMemo(
    () =>
      pagesFor(
        notebooks,
        value.contextKind,
        value.contextNotebookId,
        value.contextTopicId
      ),
    [notebooks, value.contextKind, value.contextNotebookId, value.contextTopicId]
  );

  const notebookOptions = useMemo(
    () => [
      { value: "", label: "Select…" },
      ...notebooks.map((n) => ({ value: n.id, label: n.name })),
    ],
    [notebooks]
  );

  const topicOptions = useMemo(() => {
    const opts = [{ value: "", label: "Select…" }];
    if (value.contextKind === "PAGE" && (selectedNb?.pages?.length ?? 0) > 0) {
      opts.push({ value: "__notebook__", label: "Folder files (top level)" });
    }
    topics.forEach((t) => opts.push({ value: t.id, label: t.title }));
    return opts;
  }, [value.contextKind, selectedNb?.pages?.length, topics]);

  const pageOptions = useMemo(
    () => [
      { value: "", label: "Select…" },
      ...pages.map((p) => ({ value: p.id, label: p.title })),
    ],
    [pages]
  );

  const patch = (next: Partial<QuizScopeValue>) =>
    onChange({ ...value, ...next, relevancyDocId: "" });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-[11px] text-[var(--text-muted)]">
        Scope
        <ShelfSelect
          className={`${quizFieldClass} mt-0.5`}
          disabled={disabled}
          value={value.contextKind}
          options={SCOPE_OPTIONS}
          aria-label="Quiz scope"
          onChange={(next) => {
            const contextKind = next as ChatContextKind;
            const nb = selectedNb ?? notebooks[0];
            patch({
              contextKind,
              contextNotebookId: contextKind === "LIBRARY" ? "" : nb?.id ?? "",
              contextTopicId:
                contextKind === "TOPIC" ? nb?.topicGroups?.[0]?.id ?? "" : "",
              contextPageId:
                contextKind === "PAGE"
                  ? nb?.topicGroups?.[0]?.pages?.[0]?.id ??
                    nb?.pages?.[0]?.id ??
                    ""
                  : "",
            });
          }}
        />
      </label>
      {value.contextKind !== "LIBRARY" && (
        <label className="block text-[11px] text-[var(--text-muted)]">
          Folder
          <ShelfSelect
            className={`${quizFieldClass} mt-0.5`}
            disabled={disabled}
            value={value.contextNotebookId}
            options={notebookOptions}
            aria-label="Folder"
            onChange={(contextNotebookId) =>
              patch({
                contextNotebookId,
                contextTopicId: "",
                contextPageId: "",
              })
            }
          />
        </label>
      )}
      {(value.contextKind === "TOPIC" || value.contextKind === "PAGE") && (
        <label className="block text-[11px] text-[var(--text-muted)]">
          Nested folder
          <ShelfSelect
            className={`${quizFieldClass} mt-0.5`}
            disabled={disabled}
            value={value.contextTopicId}
            options={topicOptions}
            aria-label="Nested folder"
            onChange={(contextTopicId) =>
              patch({ contextTopicId, contextPageId: "" })
            }
          />
        </label>
      )}
      {value.contextKind === "PAGE" && (
        <label className="block text-[11px] text-[var(--text-muted)]">
          File
          <ShelfSelect
            className={`${quizFieldClass} mt-0.5`}
            disabled={disabled}
            value={value.contextPageId}
            options={pageOptions}
            aria-label="File"
            onChange={(contextPageId) => patch({ contextPageId })}
          />
        </label>
      )}
    </div>
  );
}
