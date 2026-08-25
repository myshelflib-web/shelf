"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkey } from "@/hooks/useHotkeys";
import {
  createTask,
  updateTask,
} from "@/lib/offline/tasks";
import { listSubjects } from "@/lib/offline/library";
import { StudyItemKind, StudyTask, UserSubject } from "@/types";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import {
  CalendarItemModal,
  Recurrence,
} from "@/components/CalendarItemModal";
import { CircleLoader } from "@/components/CircleLoader";
import {
  PLANNER_DND_MIME,
  addDays,
  backlogItems,
  canDragItem,
  dayKey,
  formatPlanTime,
  formatWeekRange,
  itemsForDay,
  moveDueToDay,
  moveEndsWithDue,
  startOfLocalDay,
  startOfWeek,
  weekDays,
} from "@/lib/plannerBoard";
import { usePlannerTasks } from "@/components/usePlannerTasks";

type View = "week" | "month";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function masterId(id: string) {
  return id.split("::")[0];
}

function monthCells(cursor: Date): (Date | null)[] {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const lastDate = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
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

function atNine(day: Date) {
  const x = new Date(day);
  x.setHours(9, 0, 0, 0);
  return toLocalInput(x);
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
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [focusedDay, setFocusedDay] = useState<Date | null>(null);

  const { from, to } = useMemo(() => rangeForView(view, cursor), [view, cursor]);
  const { tasks, setTasks, tasksLoading, loadTasks, toggleDone, remove } =
    usePlannerTasks(from, to);

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
    setDueAt(day ? atNine(day) : "");
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
    loadTasks();
    window.dispatchEvent(new Event("shelf:tasks-changed"));
  };

  const applyDrop = async (target: Date | "backlog", rawId: string) => {
    const task = tasks.find((t) => t.id === rawId);
    if (!task || !canDragItem(task)) return;
    const id = masterId(task.id);
    if (target === "backlog") {
      setTasks((prev) =>
        prev.map((t) => (masterId(t.id) === id ? { ...t, dueAt: null, endsAt: null } : t))
      );
      await updateTask(id, { dueAt: null, endsAt: null });
    } else {
      const nextDue = moveDueToDay(task.dueAt, target);
      const nextEnd = moveEndsWithDue(task.dueAt, task.endsAt, nextDue);
      setTasks((prev) =>
        prev.map((t) =>
          masterId(t.id) === id ? { ...t, dueAt: nextDue, endsAt: nextEnd } : t
        )
      );
      await updateTask(id, { dueAt: nextDue, endsAt: nextEnd });
    }
    loadTasks();
    window.dispatchEvent(new Event("shelf:tasks-changed"));
  };

  const onDragStart = (task: StudyTask, e: React.DragEvent) => {
    if (!canDragItem(task)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(PLANNER_DND_MIME, task.id);
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const allowDrop = (key: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(key);
  };

  const finishDrop = (target: Date | "backlog", e: React.DragEvent) => {
    e.preventDefault();
    const id =
      e.dataTransfer.getData(PLANNER_DND_MIME) || e.dataTransfer.getData("text/plain");
    setDropTarget(null);
    if (id) void applyDrop(target, id);
  };

  const now = new Date();
  const days = weekDays(cursor);
  const monthDays = monthCells(cursor);
  const monthWeeks = monthDays.length / 7;
  const inbox = backlogItems(tasks, now);
  const label =
    view === "week"
      ? formatWeekRange(startOfWeek(cursor))
      : cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const notebookMeta = (task: StudyTask) => {
    const h = taskHref(task);
    if (!h) return null;
    return pages.find((p) => p.href === h)?.notebook ?? null;
  };

  const renderCard = (task: StudyTask, compact = false) => {
    const isEvent = task.kind === "EVENT";
    const repeating = Boolean(isEvent && task.recurrence && task.recurrence !== "NONE");
    const ext = isEvent && task.href && /^https?:\/\//i.test(task.href) ? task.href : null;
    const draggable = canDragItem(task);
    if (compact) {
      return (
        <button
          key={task.id}
          type="button"
          draggable={draggable}
          onDragStart={(e) => {
            e.stopPropagation();
            onDragStart(task, e);
          }}
          onDragEnd={() => setDropTarget(null)}
          onClick={(e) => {
            e.stopPropagation();
            fillFromTask(task);
          }}
          className={`block w-full truncate rounded px-1 py-0.5 text-left text-[9px] font-medium border-l-2 ${
            isEvent
              ? "border-l-[var(--text-muted)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
              : "border-l-[var(--accent)] bg-[var(--accent-light)] text-[var(--text-primary)]"
          } ${task.completed ? "line-through opacity-60" : ""} ${
            draggable ? "cursor-grab active:cursor-grabbing" : ""
          }`}
        >
          {task.title}
        </button>
      );
    }
    return (
      <div
        key={task.id}
        draggable={draggable}
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => onDragStart(task, e)}
        onDragEnd={() => setDropTarget(null)}
        className={`group rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 border-l-2 ${
          isEvent ? "border-l-[var(--text-muted)]" : "border-l-[var(--accent)]"
        } ${task.completed ? "opacity-60" : ""} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className="flex items-start gap-1.5 min-w-0">
          {isEvent ? (
            <CalendarDays className="w-3 h-3 mt-0.5 shrink-0 text-[var(--text-muted)]" />
          ) : (
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleDone(task)}
              className="mt-0.5"
              aria-label="Mark task done"
            />
          )}
          <button
            type="button"
            onClick={() => fillFromTask(task)}
            className={`flex-1 min-w-0 text-left ${compact ? "text-[10px]" : "text-[11px]"} font-semibold leading-snug hover:text-[var(--accent)] ${
              task.completed ? "line-through" : ""
            }`}
          >
            {task.title}
          </button>
          {repeating && <Repeat className="w-2.5 h-2.5 mt-0.5 shrink-0 text-[var(--accent)]" />}
          {ext && (
            <a
              href={ext}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 text-[var(--accent)]"
              aria-label="Open event link"
            >
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => remove(task.id)}
            className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)]"
            aria-label="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        {!compact && (
          <>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              {formatPlanTime(task, now)}
              {notebookMeta(task) ? ` · ${notebookMeta(task)}` : ""}
            </p>
            <span
              className={`mt-1 inline-flex text-[9px] font-semibold rounded-full px-1.5 py-0.5 ${
                isEvent
                  ? "bg-[var(--bg-primary)] text-[var(--text-muted)]"
                  : "bg-[var(--accent-subtle)] text-[var(--accent)]"
              }`}
            >
              {isEvent ? "Event" : "Task"}
            </span>
          </>
        )}
      </div>
    );
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
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden gap-3">
          <div
            className={`shrink-0 rounded-[10px] border bg-[var(--bg-secondary)] p-2 ${
              dropTarget === "backlog" ? "border-[var(--accent)] bg-[var(--accent-light)]" : "border-[var(--border)]"
            }`}
            onDragOver={(e) => allowDrop("backlog", e)}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => finishDrop("backlog", e)}
          >
            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-[12px] font-semibold">To plan</p>
              <span className="text-[10px] text-[var(--text-muted)]">{inbox.length}</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {inbox.map((task) => (
                <div key={task.id} className="min-w-[12rem] max-w-[14rem]">
                  {renderCard(task)}
                </div>
              ))}
              <button
                type="button"
                onClick={() => openForm("TASK")}
                className="shrink-0 h-[34px] px-3 rounded-lg border border-dashed border-[var(--border)] text-[11px] text-[var(--accent)] font-semibold"
              >
                + Add
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-2">
            <div className="grid grid-cols-7 gap-1 shrink-0 mb-1">
              {WEEKDAYS.map((d) => (
                <p key={d} className="text-[10px] text-[var(--text-muted)] text-center">
                  {d}
                </p>
              ))}
            </div>
            <div
              className="flex-1 min-h-0 grid grid-cols-7 gap-1 overflow-hidden"
              style={{ gridTemplateRows: `repeat(${monthWeeks}, minmax(0, 1fr))` }}
            >
              {monthDays.map((day, i) => {
                if (!day) {
                  return <div key={`empty-${i}`} className="min-h-0 rounded-lg bg-[var(--bg-primary)]/40" />;
                }
                const dayTasks = itemsForDay(tasks, day, now);
                const shown = dayTasks.slice(0, 2);
                const extra = dayTasks.length - shown.length;
                const isToday = dayKey(day) === dayKey(now);
                const key = dayKey(day);
                return (
                  <div
                    key={key}
                    onDragOver={(e) => allowDrop(key, e)}
                    onDragLeave={() => setDropTarget(null)}
                    onDrop={(e) => finishDrop(day, e)}
                    onClick={() => setFocusedDay(day)}
                    className={`min-h-0 overflow-hidden p-1 rounded-lg border flex flex-col ${
                      dropTarget === key
                        ? "border-[var(--accent)] bg-[var(--accent-light)]"
                        : isToday
                          ? "border-[var(--accent)] bg-[var(--bg-primary)]"
                          : "border-[var(--border)] bg-[var(--bg-primary)]"
                    }`}
                  >
                    <p className="text-[10px] text-[var(--text-muted)] shrink-0 leading-none mb-1">{day.getDate()}</p>
                    <div className="min-h-0 overflow-hidden space-y-0.5">
                      {shown.map((task) => renderCard(task, true))}
                      {extra > 0 && (
                        <p className="text-[9px] text-[var(--text-muted)] px-1">+{extra} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-x-auto">
          <div className="h-full min-w-[1100px] grid grid-cols-[260px_minmax(0,1fr)] gap-3">
          <aside
            className={`min-h-0 flex flex-col rounded-[10px] border bg-[var(--bg-secondary)] overflow-hidden ${
              dropTarget === "backlog" ? "border-[var(--accent)] bg-[var(--accent-light)]" : "border-[var(--border)]"
            }`}
            onDragOver={(e) => allowDrop("backlog", e)}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => finishDrop("backlog", e)}
          >
            <div className="px-3.5 pt-3.5 pb-2.5 border-b border-[var(--border)]">
              <div className="flex items-center justify-between text-[13px] font-semibold">
                <span>To plan</span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">{inbox.length}</span>
              </div>
              <p className="text-[10.5px] text-[var(--text-muted)] mt-1">
                Capture first. Schedule when you are ready.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openForm("TASK")}
              className="mx-3 mt-2.5 mb-2 h-[34px] rounded-lg border border-dashed border-[var(--accent)]/40 bg-[var(--accent-subtle)] text-[var(--accent)] text-[11px] font-semibold"
            >
              + Add task
            </button>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-1.5">
              {inbox.length === 0 ? (
                <p className="text-[11px] text-[var(--text-muted)] px-2 py-3">
                  Nothing waiting. Add a task or drag unfinished work here.
                </p>
              ) : (
                inbox.map((task) => renderCard(task))
              )}
            </div>
            <p className="px-3 py-2.5 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
              Drag an item onto a day when you are ready to schedule it.
            </p>
          </aside>

          <div className="min-h-0 min-w-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="grid grid-cols-7 min-w-[52rem] h-full">
                {days.map((day) => {
                  const dayTasks = itemsForDay(tasks, day, now);
                  const isToday = dayKey(day) === dayKey(now);
                  const key = dayKey(day);
                  return (
                    <div
                      key={key}
                      className={`min-h-0 h-full border-r border-[var(--border)] last:border-r-0 flex flex-col ${
                        dropTarget === key ? "bg-[var(--accent-light)]" : isToday ? "bg-[var(--bg-primary)]" : ""
                      }`}
                      onDragOver={(e) => allowDrop(key, e)}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={(e) => finishDrop(day, e)}
                    >
                      <button
                        type="button"
                        onClick={() => setFocusedDay(day)}
                        className="h-14 px-2.5 text-left border-b border-[var(--border)]"
                      >
                        <p className="text-[9.5px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                          {WEEKDAYS[day.getDay()]}
                        </p>
                        <p className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[16px] font-bold">{day.getDate()}</span>
                          {isToday && (
                            <span className="text-[8.5px] font-bold text-[var(--accent)] bg-[var(--accent-subtle)] rounded-full px-1.5 py-0.5">
                              Today
                            </span>
                          )}
                        </p>
                      </button>
                      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
                        {dayTasks.map((task) => renderCard(task))}
                        <button
                          type="button"
                          onClick={() => openForm("TASK", day)}
                          className="w-full h-[30px] rounded-lg text-[10px] text-[var(--text-muted)] opacity-40 hover:opacity-100 hover:border hover:border-[var(--border)] hover:bg-[var(--bg-primary)]"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2.5 text-[10px] text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <i className="w-2 h-2 rounded-sm bg-[var(--accent)] not-italic" /> Task
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i className="w-2 h-2 rounded-sm bg-[var(--text-muted)] not-italic" /> Event
              </span>
              <span>Completed cards fade and strike through.</span>
            </div>
          </div>
          </div>
        </div>
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
    </section>
  );
}
