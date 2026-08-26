"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { ChatContextKind, StudyRelevancyDocSummary, UserSubject } from "@/types";
import { quizFieldClass } from "@/lib/quiz/ui";

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
  const topics = selectedNb?.topicGroups ?? [];
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

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {!syllabusOnly && (
      <>
      <label className="text-[12px] font-medium text-[var(--text-secondary)]">
        Scope
        <select
          className={quizFieldClass}
          disabled={disabled}
          value={value.contextKind}
          onChange={(e) => {
            const contextKind = e.target.value as ChatContextKind;
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
        >
          <option value="LIBRARY">Entire library</option>
          <option value="NOTEBOOK">Collection</option>
          <option value="TOPIC">Topic</option>
          <option value="PAGE">Document</option>
        </select>
      </label>
      {value.contextKind !== "LIBRARY" && (
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">
          Collection
          <select
            className={quizFieldClass}
            disabled={disabled}
            value={value.contextNotebookId}
            onChange={(e) =>
              onChange({
                ...value,
                contextNotebookId: e.target.value,
                contextTopicId: "",
                contextPageId: "",
              })
            }
          >
            <option value="">Select…</option>
            {notebooks.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {(value.contextKind === "TOPIC" || value.contextKind === "PAGE") && (
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">
          Topic
          <select
            className={quizFieldClass}
            disabled={disabled}
            value={value.contextTopicId}
            onChange={(e) =>
              onChange({ ...value, contextTopicId: e.target.value, contextPageId: "" })
            }
          >
            <option value="">Select…</option>
            {value.contextKind === "PAGE" && (selectedNb?.pages?.length ?? 0) > 0 && (
              <option value="__notebook__">Collection pages</option>
            )}
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {value.contextKind === "PAGE" && (
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">
          Document
          <select
            className={quizFieldClass}
            disabled={disabled}
            value={value.contextPageId}
            onChange={(e) => onChange({ ...value, contextPageId: e.target.value })}
          >
            <option value="">Select…</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      )}
      </>
      )}
      <label className="text-[12px] font-medium text-[var(--text-secondary)] sm:col-span-2">
        Syllabus / relevancy (optional)
        <select
          className={quizFieldClass}
          disabled={disabled}
          value={value.relevancyDocId}
          onChange={(e) => onChange({ ...value, relevancyDocId: e.target.value })}
        >
          <option value="">None — use study goal + relevance</option>
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
