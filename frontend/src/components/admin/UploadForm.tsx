"use client";

import { useState, useCallback } from "react";
import { Subject } from "@/types";
import { api } from "@/lib/api";
import { Upload, Loader2, FileUp, X } from "lucide-react";

interface UploadFormProps {
  subjects: Subject[];
  onSuccess?: () => void;
}

const NEW = "__new__";

export function UploadForm({ subjects: initialSubjects, onSuccess }: UploadFormProps) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [subjectChoice, setSubjectChoice] = useState(initialSubjects[0]?.id ?? NEW);
  const [customSubject, setCustomSubject] = useState("");
  const [topicChoice, setTopicChoice] = useState(NEW);
  const [customTopic, setCustomTopic] = useState("");
  const [articleChoice, setArticleChoice] = useState(NEW);
  const [customArticle, setCustomArticle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const selectedSubject =
    subjectChoice !== NEW
      ? subjects.find((s) => s.id === subjectChoice)
      : undefined;
  const topics = selectedSubject?.topics ?? [];
  const selectedTopic =
    topicChoice !== NEW ? topics.find((t) => t.id === topicChoice) : undefined;
  const articles = selectedTopic?.articles ?? [];

  const refreshSubjects = async () => {
    const { subjects: next } = await api.admin.hierarchy();
    setSubjects(next);
    return next;
  };

  const handleFile = (f: File | null) => {
    if (f && f.type !== "application/pdf") {
      setMessage("Only PDF files are allowed");
      return;
    }
    if (f && f.size > 50 * 1024 * 1024) {
      setMessage("File must be under 50MB");
      return;
    }
    setFile(f);
    setMessage("");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }, []);

  const canSubmit =
    !!file &&
    (subjectChoice !== NEW || customSubject.trim()) &&
    (topicChoice !== NEW || customTopic.trim()) &&
    (articleChoice !== NEW || customArticle.trim());

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("pdf", file);

    if (subjectChoice !== NEW) {
      formData.append("subjectId", subjectChoice);
    } else {
      formData.append("subjectName", customSubject.trim());
    }

    if (topicChoice !== NEW) {
      formData.append("topicId", topicChoice);
    } else {
      formData.append("topicName", customTopic.trim());
    }

    if (articleChoice !== NEW) {
      formData.append("articleId", articleChoice);
    } else {
      formData.append("articleTitle", customArticle.trim());
    }

    try {
      await api.admin.upload(formData);
      setMessage("PDF uploaded! It will be processed into an article shortly.");
      setCustomArticle("");
      setArticleChoice(NEW);
      setFile(null);
      const next = await refreshSubjects();
      if (subjectChoice !== NEW) {
        const stillThere = next.find((s) => s.id === subjectChoice);
        if (!stillThere && next[0]) setSubjectChoice(next[0].id);
      }
      onSuccess?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">Subject</label>
        <select
          value={subjectChoice}
          onChange={(e) => {
            setSubjectChoice(e.target.value);
            setTopicChoice(NEW);
            setCustomTopic("");
            setArticleChoice(NEW);
            setCustomArticle("");
          }}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.name}
            </option>
          ))}
          <option value={NEW}>+ Create new subject…</option>
        </select>
        {subjectChoice === NEW && (
          <input
            type="text"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            required
            placeholder="e.g. Ethics"
            className="mt-2 w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Topic</label>
        <select
          value={topicChoice}
          onChange={(e) => {
            setTopicChoice(e.target.value);
            setArticleChoice(NEW);
            setCustomArticle("");
          }}
          disabled={subjectChoice === NEW}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
        >
          <option value={NEW}>+ Create new topic…</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        {(topicChoice === NEW || subjectChoice === NEW) && (
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            required
            placeholder="e.g. Fundamental Rights"
            className="mt-2 w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        )}
        {subjectChoice === NEW && (
          <p className="text-xs text-[var(--text-muted)] mt-1">
            New subjects start with a new topic name.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Article</label>
        <select
          value={articleChoice}
          onChange={(e) => setArticleChoice(e.target.value)}
          disabled={topicChoice === NEW || subjectChoice === NEW}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
        >
          <option value={NEW}>+ Create new article…</option>
          {articles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
        {(articleChoice === NEW ||
          topicChoice === NEW ||
          subjectChoice === NEW) && (
          <input
            type="text"
            value={customArticle}
            onChange={(e) => setCustomArticle(e.target.value)}
            required
            placeholder="e.g. Right to Equality"
            className="mt-2 w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        )}
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Path: /learn/subject/topic/article — pick existing or type a new name
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">PDF File</label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            dragOver
              ? "border-[var(--accent)] bg-[var(--accent-light)]"
              : "border-[var(--border)]"
          }`}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="hidden"
            id="pdf-upload"
          />

          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileUp className="w-8 h-8 text-[var(--accent)]" />
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--accent)]">
                  {file.name}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1 rounded hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
          ) : (
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <Upload className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-sm font-medium">
                Drag & drop a PDF here, or click to browse
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Maximum file size: 50MB
              </p>
            </label>
          )}
        </div>
      </div>

      {message && (
        <p
          className={`text-sm px-3 py-2 rounded-lg ${
            message.includes("failed") ||
            message.includes("Only") ||
            message.includes("under")
              ? "text-red-500 bg-red-500/10"
              : "text-[var(--accent)] bg-[var(--accent-light)]"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={uploading || !canSubmit}
        className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Uploading to S3...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" /> Upload PDF
          </>
        )}
      </button>
    </form>
  );
}
