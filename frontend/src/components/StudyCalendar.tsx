"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkey } from "@/hooks/useHotkeys";
import { createTask, updateTask } from "@/lib/offline/tasks";
import { listSubjects } from "@/lib/offline/library";
import { StudyItemKind, StudyTask, UserSubject } from "@/types";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  CalendarItemModal,
  Recurrence,
} from "@/components/CalendarItemModal";
import { CircleLoader } from "@/components/CircleLoader";
import {
  PlannerMonthBoard,
  PlannerWeekBoard,
} from "@/components/PlannerBoardViews";
import { PlannerTaskCard } from "@/components/PlannerTaskCard";
import { usePlannerDragDrop } from "@/components/usePlannerDragDrop";
import { usePlannerTasks } from "@/components/usePlannerTasks";
import { localDateTimeAtNine } from "@/components/ui/ShelfDateTimeField";
import {
  addDays,
  formatWeekRange,
  itemsForDay,
  startOfLocalDay,
  startOfWeek,
} from "@/lib/plannerBoard";

type View = "week" | "month";

function masterId(id: string) {
  return id.split("::")[0];
}

function rangeForView(view: View, cursor: Date): { from: Date; to: Date } {
  if (view === "week") {
    const from = startOfWeek(cursor);
    return { from, to: addDays(from, 7) };
  }
  const from = startOfLocalDay(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  return { from, to: addDays(startOfLocalDay(last), 1) };
}

function toLocalInput(d: Date) {
  const local = new Date(d);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizeExternalUrl(raw: string) {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function taskHref(task: StudyTask): string | null {
  if (task.href) return task.href;
  const a = task.article;
  if (!a) return null;
  return `/learn/${a.topic.subject.slug}/${a.topic.slug}/${a.slug}`;
}

export function StudyCalendar({
  library: libraryProp,
  initialView = "week",
  initialCursor: initialCursorProp,
  initialEditTaskId,
}: {
  library?: UserSubject[];
  initialView?: View | "day";
  initialCursor?: Date;
  initialEditTaskId?: string | null;
}) {
  const openedEdit = useRef(false);
  const [view, setView] = useState<View>(initialView === "month" ? "month" : "week");
  const [cursor, setCursor] = useState(() =>
    startOfLocalDay(initialCursorProp ?? new Date())
  );
  const [fetchedLibrary, setFetchedLibrary] = useState<UserSubject[]>([]);
  const [formKind, setFormKind] = useState<StudyItemKind>("TASK");
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [href, setHref] = useState("");
  const [pageHref, setPageHref] = useState("");
  const [notebookSlug, setNotebookSlug] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("NONE");
  const [recurUntil, setRecurUntil] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusedDay, setFocusedDay] = useState<Date | null>(null);

  const { from, to } = useMemo(() => rangeForView(view, cursor), [view, cursor]);
  const { tasks, setTasks, tasksLoading, loadTasks, toggleDone, remove } =
    usePlannerTasks(from, to);
  const {
    dropTarget,
    draggingId,
    dropError,
    clearDropError,
    motionTaskId,
    cardMotion,
    onDragStart,
    onDragEnd,
    enterDrop,
    allowDrop,
    leaveDrop,
    finishDrop,
  } = usePlannerDragDrop(tasks, setTasks);

  useEffect(() => {
    if (libraryProp) return;
    listSubjects()
      .then(({ subjects }) => setFetchedLibrary(subjects))
      .catch(() => {});
  }, [libraryProp]);

  const library = libraryProp ?? fetchedLibrary;

  const pages = useMemo(() => {
    const list: { href: string; label: string; notebook: string; notebookSlug: string }[] = [];
    for (const s of library) {
      for (const p of s.pages ?? []) {
        list.push({
          href: `/my-content/${s.slug}/file/${p.slug}`,
          label: `${s.name} / ${p.title}`,
          notebook: s.name,
          notebookSlug: s.slug,
        });
      }
      for (const g of s.topicGroups ?? []) {
        list.push({
          href: `/my-content/${s.slug}/${g.slug}`,
          label: `${s.name} / ${g.title}`,
          notebook: s.name,
          notebookSlug: s.slug,
        });
        for (const p of g.pages) {
          list.push({
            href: `/my-content/${s.slug}/${g.slug}/${p.slug}`,
            label: `${s.name} / ${g.title} / ${p.title}`,
            notebook: s.name,
            notebookSlug: s.slug,
          });
        }
      }
    }
    return list;
  }, [library]);

  const notebooks = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }>();
    for (const s of library) map.set(s.slug, { slug: s.slug, name: s.name });
    return [...map.values()];
  }, [library]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
  }, []);

  const shift = (dir: number) => {
    if (view === "week") setCursor((c) => addDays(c, dir * 7));
    else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
  };

  const openForm = (kind: StudyItemKind, day?: Date | null) => {
    setEditingId(null);
    setFormKind(kind);
    setTitle("");
    setDueAt(day ? localDateTimeAtNine(day) : "");
    setEndsAt("");
    setHref("");
    setNotebookSlug("");
    setPageHref("");
    setRecurrence("NONE");
    setRecurUntil("");
    setShowForm(true);
  };

  const calendarKeys = !showForm;
  useHotkey("n", () => openForm("TASK"), { enabled: calendarKeys });
  useHotkey("shift+n", () => openForm("EVENT"), { enabled: calendarKeys });
  useHotkey("t", () => setCursor(startOfLocalDay(new Date())), { enabled: calendarKeys });
  useHotkey("left", () => shift(-1), { enabled: calendarKeys });
  useHotkey("right", () => shift(1), { enabled: calendarKeys });
  useHotkey("w", () => setView("week"), { enabled: calendarKeys });
  useHotkey("m", () => setView("month"), { enabled: calendarKeys });

  const fillFromTask = useCallback(
    (task: StudyTask) => {
      const h = task.href ?? "";
      const isEvent = task.kind === "EVENT";
      const linked = !isEvent ? pages.find((p) => p.href === h) : undefined;
      setEditingId(task.seriesId || masterId(task.id));
      setFormKind(isEvent ? "EVENT" : "TASK");
      setTitle(task.title);
      const start = task.seriesStart || task.dueAt;
      setDueAt(start ? toLocalInput(new Date(start)) : "");
      setEndsAt(task.endsAt ? toLocalInput(new Date(task.endsAt)) : "");
      setHref(isEvent && /^https?:\/\//i.test(h) ? h : "");
      setPageHref(linked ? h : "");
      setNotebookSlug(linked?.notebookSlug ?? "");
      setRecurrence(
        isEvent && task.recurrence && task.recurrence !== "NONE" ? task.recurrence : "NONE"
      );
      setRecurUntil(task.recurUntil ? toDateInput(new Date(task.recurUntil)) : "");
      setShowForm(true);
      if (task.dueAt) setCursor(startOfLocalDay(new Date(task.dueAt)));
    },
    [pages]
  );

  useEffect(() => {
    if (openedEdit.current || !initialEditTaskId) return;
    const task = tasks.find(
      (t) => t.id === initialEditTaskId || masterId(t.id) === initialEditTaskId
    );
    if (!task) return;
    fillFromTask(task);
    openedEdit.current = true;
  }, [initialEditTaskId, tasks, fillFromTask]);

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const isEvent = formKind === "EVENT";
    if (isEvent && recurrence !== "NONE" && !dueAt) return;
    const payload = {
      title: title.trim(),
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      kind: formKind,
      href: isEvent ? normalizeExternalUrl(href) : pageHref || null,
      recurrence: isEvent ? recurrence : ("NONE" as const),
      recurUntil:
        isEvent && recurrence !== "NONE" && recurUntil
          ? new Date(`${recurUntil}T23:59:00`).toISOString()
          : null,
    };
    if (editingId) await updateTask(editingId, payload);
    else {
      await createTask({
        ...payload,
        endsAt: payload.endsAt ?? undefined,
        href: payload.href ?? undefined,
      });
    }
    setTitle("");
    setHref("");
    setPageHref("");
    setEndsAt("");
    setRecurrence("NONE");
    setRecurUntil("");
    closeForm();
    loadTasks({ silent: true });
    window.dispatchEvent(new Event("shelf:tasks-changed"));
  };

  const now = new Date();
  const label =
    view === "week"
      ? formatWeekRange(startOfWeek(cursor))
      : cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const notebookMeta = (task: StudyTask) => {
    const h = taskHref(task);
    if (!h) return null;
    return pages.find((p) => p.href === h)?.notebook ?? null;
  };

  const renderCard = (task: StudyTask, compact = false) => (
    <PlannerTaskCard
      key={task.id}
      task={task}
      compact={compact}
      dragging={draggingId === task.id}
      motion={motionTaskId === masterId(task.id) ? cardMotion : null}
      notebook={notebookMeta(task)}
      now={now}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onEdit={fillFromTask}
      onToggleDone={toggleDone}
      onRemove={remove}
    />
  );

  const boardProps = {
    cursor,
    tasks,
    now,
    dropTarget,
    enterDrop,
    allowDrop,
    leaveDrop,
    finishDrop,
    renderCard,
    openForm,
    setFocusedDay,
  };

  return (
    <section className="relative h-full min-h-0 flex flex-col overflow-hidden">
      {tasksLoading && tasks.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[10px] bg-[var(--bg-primary)]/70 backdrop-blur-[1px]">
          <CircleLoader size="md" label="Loading planner" />
        </div>
      )}

      <div className="shrink-0 mb-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => shift(-1)} className="p-1.5 rounded-lg border border-[var(--border)]" aria-label="Previous">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setCursor(startOfLocalDay(new Date()))}
          className="h-[34px] px-2.5 rounded-lg border border-[var(--border)] text-[11.5px] font-semibold"
        >
          Today
        </button>
        <button type="button" onClick={() => shift(1)} className="p-1.5 rounded-lg border border-[var(--border)]" aria-label="Next">
          <ChevronRight className="w-4 h-4" />
        </button>
        <p className="text-[13px] font-semibold ml-1">{label}</p>
        <div className="flex-1" />
        <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--bg-primary)]">
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`text-[11px] px-2.5 py-1.5 rounded-md ${
                view === v
                  ? "bg-[var(--bg-secondary)] text-[var(--accent)] font-semibold shadow-sm"
                  : "text-[var(--text-muted)]"
              }`}
            >
              {v === "week" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <CalendarItemModal
          kind={formKind}
          editing={Boolean(editingId)}
          title={title}
          dueAt={dueAt}
          endsAt={endsAt}
          href={href}
          pageHref={pageHref}
          notebookSlug={notebookSlug}
          recurrence={recurrence}
          recurUntil={recurUntil}
          notebooks={notebooks}
          pages={pages}
          onKindChange={(k) => {
            setFormKind(k);
            setHref("");
            setPageHref("");
            setNotebookSlug("");
            setRecurrence("NONE");
            setRecurUntil("");
          }}
          onTitleChange={setTitle}
          onDueAtChange={setDueAt}
          onEndsAtChange={setEndsAt}
          onHrefChange={setHref}
          onPageHrefChange={setPageHref}
          onNotebookSlugChange={(v) => {
            setNotebookSlug(v);
            setPageHref("");
          }}
          onRecurrenceChange={setRecurrence}
          onRecurUntilChange={setRecurUntil}
          onSubmit={saveItem}
          onClose={closeForm}
        />
      )}

      {view === "month" ? (
        <PlannerMonthBoard {...boardProps} />
      ) : (
        <PlannerWeekBoard {...boardProps} />
      )}

      {focusedDay && (
        <div className="shrink-0 mt-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold">
                {focusedDay.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-[10.5px] text-[var(--text-muted)] mt-0.5">
                Day focus — click a card to edit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFocusedDay(null)}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)]"
              aria-label="Close day focus"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-3 space-y-1.5">
            {itemsForDay(tasks, focusedDay, now).length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)]">Nothing planned yet for this day.</p>
            ) : (
              itemsForDay(tasks, focusedDay, now).map((task) => renderCard(task))
            )}
            <button
              type="button"
              onClick={() => openForm("TASK", focusedDay)}
              className="text-[11px] font-semibold text-[var(--accent)]"
            >
              + Add to this day
            </button>
          </div>
        </div>
      )}

      {dropError && (
        <div
          className="pointer-events-auto fixed bottom-6 left-1/2 z-[200] w-[min(100%,24rem)] -translate-x-1/2 px-3"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-2 rounded-[10px] border border-red-500/35 bg-[var(--bg-elevated)] px-3.5 py-3 shadow-xl">
            <p className="min-w-0 flex-1 text-sm font-medium text-red-400">
              {dropError}
            </p>
            <button
              type="button"
              onClick={clearDropError}
              className="shrink-0 rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
