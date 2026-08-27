"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { ChatContextKind, StudyRelevancyDocSummary, UserSubject } from "@/types";
import { quizFieldClass } from "@/lib/quiz/ui";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

export type QuizScopeValue = {
  contextKind: ChatContextKind;
  contextNotebookId: string;
  contextTopicId: string;
  contextPageId: string;
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
  { value: "NOTEBOOK", label: "Collection" },
  { value: "TOPIC", label: "Topic" },
  { value: "PAGE", label: "Document" },
];

export function QuizScopeFields({
  value,
  onChange,
  disabled,
  syllabusOnly = false,
}: {
  value: QuizScopeValue;
  onChange: (next: QuizScopeValue) => void;
  disabled?: boolean;
  syllabusOnly?: boolean;
}) {
  const [notebooks, setNotebooks] = useState<UserSubject[]>([]);
  const [docs, setDocs] = useState<StudyRelevancyDocSummary[]>([]);

  useEffect(() => {
    void api.myContent
      .listSubjects({ pageSize: 100, sort: "name" })
      .then(({ subjects }) => setNotebooks(subjects))
      .catch(() => {});
    void api.study
      .listRelevancyDocs()
      .then(({ docs: next }) => setDocs(next))
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
      opts.push({ value: "__notebook__", label: "Collection pages" });
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

  const docOptions = useMemo(
    () => [
      { value: "", label: "None — use study goal + relevance" },
      ...docs.map((d) => ({ value: d.id, label: d.title })),
    ],
    [docs]
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {!syllabusOnly && (
      <>
      <label className="text-[12px] font-medium text-[var(--text-secondary)]">
        Scope
        <ShelfSelect
          className={quizFieldClass}
          disabled={disabled}
          value={value.contextKind}
          options={SCOPE_OPTIONS}
          aria-label="Quiz scope"
          onChange={(next) => {
            const contextKind = next as ChatContextKind;
            const nb = selectedNb ?? notebooks[0];
            onChange({
              contextKind,
              contextNotebookId: contextKind === "LIBRARY" ? "" : nb?.id ?? "",
              contextTopicId:
                contextKind === "TOPIC" ? nb?.topicGroups?.[0]?.id ?? "" : "",
              contextPageId:
                contextKind === "PAGE"
                  ? nb?.topicGroups?.[0]?.pages?.[0]?.id ?? nb?.pages?.[0]?.id ?? ""
                  : "",
              relevancyDocId: value.relevancyDocId,
            });
          }}
        />
      </label>
      {value.contextKind !== "LIBRARY" && (
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">
          Collection
          <ShelfSelect
            className={quizFieldClass}
            disabled={disabled}
            value={value.contextNotebookId}
            options={notebookOptions}
            aria-label="Collection"
            onChange={(contextNotebookId) =>
              onChange({
                ...value,
                contextNotebookId,
                contextTopicId: "",
                contextPageId: "",
              })
            }
          />
        </label>
      )}
      {(value.contextKind === "TOPIC" || value.contextKind === "PAGE") && (
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">
          Topic
          <ShelfSelect
            className={quizFieldClass}
            disabled={disabled}
            value={value.contextTopicId}
            options={topicOptions}
            aria-label="Topic"
            onChange={(contextTopicId) =>
              onChange({ ...value, contextTopicId, contextPageId: "" })
            }
          />
        </label>
      )}
      {value.contextKind === "PAGE" && (
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">
          Document
          <ShelfSelect
            className={quizFieldClass}
            disabled={disabled}
            value={value.contextPageId}
            options={pageOptions}
            aria-label="Document"
            onChange={(contextPageId) => onChange({ ...value, contextPageId })}
          />
        </label>
      )}
      </>
      )}
      <label className="text-[12px] font-medium text-[var(--text-secondary)] sm:col-span-2">
        Syllabus / relevancy (optional)
        <ShelfSelect
          className={quizFieldClass}
          disabled={disabled}
          value={value.relevancyDocId}
          options={docOptions}
          aria-label="Syllabus or relevancy document"
          onChange={(relevancyDocId) => onChange({ ...value, relevancyDocId })}
        />
      </label>
    </div>
  );
}
