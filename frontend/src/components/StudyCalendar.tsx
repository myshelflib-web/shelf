"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkey } from "@/hooks/useHotkeys";
import { listSubjects, peekCachedLibrary } from "@/lib/offline/library";
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
import { PlannerFlashToast } from "@/components/PlannerFlashToast";
import { usePlannerDragDrop } from "@/components/usePlannerDragDrop";
import { usePlannerCardMotion } from "@/components/usePlannerCardMotion";
import { usePlannerTasks } from "@/components/usePlannerTasks";
import { localDateTimeAtNine } from "@/components/ui/ShelfDateTimeField";
import { toUserFacingError } from "@/lib/userFacingError";
import {
  addDays,
  formatWeekRange,
  itemsForDay,
  startOfLocalDay,
  startOfWeek,
} from "@/lib/plannerBoard";
import type { PlannerHeaderActions } from "@/components/PlannerHeaderMenu";
import {
  masterTaskId,
  normalizeExternalUrl,
  rangeForView,
  taskHref,
  toDateInput,
  toLocalInput,
  type PlannerView,
} from "@/lib/plannerCalendarUtils";

export { taskHref } from "@/lib/plannerCalendarUtils";

export function StudyCalendar({
  library: libraryProp,
  initialView = "week",
  initialCursor: initialCursorProp,
  initialEditTaskId,
  actionsRef,
}: {
  library?: UserSubject[];
  initialView?: PlannerView | "day";
  initialCursor?: Date;
  initialEditTaskId?: string | null;
  actionsRef?: React.MutableRefObject<PlannerHeaderActions | null>;
}) {
  const openedEdit = useRef(false);
  const [view, setView] = useState<PlannerView>(
    initialView === "month" ? "month" : "week"
  );
  const [cursor, setCursor] = useState(() =>
    startOfLocalDay(initialCursorProp ?? new Date())
  );
  const [fetchedLibrary, setFetchedLibrary] = useState<UserSubject[]>(
    () => peekCachedLibrary()?.subjects ?? []
  );
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
  const [actionError, setActionError] = useState<string | null>(null);

  const motion = usePlannerCardMotion();
  const { from, to } = useMemo(() => rangeForView(view, cursor), [view, cursor]);
  const {
    tasks,
    setTasks,
    tasksLoading,
    toggleDone,
    createItem,
    updateItem,
    remove,
  } = usePlannerTasks(from, to, motion);
  const {
    dropTarget,
    draggingId,
    dropError,
    clearDropError,
    onDragStart,
    onDragEnd,
    enterDrop,
    allowDrop,
    leaveDrop,
    finishDrop,
  } = usePlannerDragDrop(tasks, setTasks, motion);

  const flashError = dropError ?? actionError;
  const clearFlashError = useCallback(() => {
    clearDropError();
    setActionError(null);
  }, [clearDropError]);

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

  if (actionsRef) {
    actionsRef.current = {
      onNewTask: () => openForm("TASK"),
      onNewEvent: () => openForm("EVENT"),
      onToday: () => setCursor(startOfLocalDay(new Date())),
      onWeek: () => setView("week"),
      onMonth: () => setView("month"),
    };
  }

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
      setEditingId(task.seriesId || masterTaskId(task.id));
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
      (t) => t.id === initialEditTaskId || masterTaskId(t.id) === initialEditTaskId
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
    const name = title.trim();
    const editing = editingId;
    const payload = {
      title: name,
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

    setTitle("");
    setHref("");
    setPageHref("");
    setEndsAt("");
    setRecurrence("NONE");
    setRecurUntil("");
    closeForm();
    clearFlashError();

    try {
      if (editing) await updateItem(editing, payload);
      else await createItem(payload);
    } catch (err) {
      const fallback = editing
        ? "Couldn't save that item. Try again."
        : "Couldn't create that item. Try again.";
      setActionError(
        err instanceof Error ? toUserFacingError(err.message, fallback) : fallback
      );
    }
  };

  const onRemove = async (id: string) => {
    clearFlashError();
    try {
      await remove(id);
    } catch (err) {
      const fallback = "Couldn't delete that item. Try again.";
      setActionError(
        err instanceof Error ? toUserFacingError(err.message, fallback) : fallback
      );
    }
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
      motion={motion.motionTaskId === masterTaskId(task.id) ? motion.cardMotion : null}
      notebook={notebookMeta(task)}
      now={now}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onEdit={fillFromTask}
      onToggleDone={toggleDone}
      onRemove={onRemove}
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
        {tasksLoading && tasks.length === 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] ml-1">
            <CircleLoader size="sm" label="Loading" />
          </span>
        )}
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

      {flashError && (
        <PlannerFlashToast message={flashError} onDismiss={clearFlashError} />
      )}
    </section>
  );
}
