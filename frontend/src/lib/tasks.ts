import type { TaskPublic } from "@/client"

export type TaskCategory = "class" | "club" | "campus" | "social" | "personal"

export const CATEGORIES: TaskCategory[] = [
  "class",
  "club",
  "campus",
  "social",
  "personal",
]

export const categoryLabel: Record<TaskCategory, string> = {
  class: "Class",
  club: "Club",
  campus: "Campus",
  social: "Friends",
  personal: "Personal",
}

// Placeholder shown in the subject/label field, tuned to each category.
export const categorySubjectHint: Record<TaskCategory, string> = {
  class: "e.g. CS101",
  club: "e.g. Chess Club",
  campus: "e.g. Career Fair",
  social: "e.g. Study group",
  personal: "e.g. Errands",
}

export function normalizeCategory(
  value: string | null | undefined,
): TaskCategory {
  return CATEGORIES.includes(value as TaskCategory)
    ? (value as TaskCategory)
    : "class"
}

export type SortKey = "due" | "priority"

const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 }

export function sortTasks(tasks: TaskPublic[], sortBy: SortKey): TaskPublic[] {
  const copy = [...tasks]
  copy.sort((a, b) => {
    const byDue =
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    if (sortBy === "priority") {
      const byPriority =
        (priorityRank[a.priority ?? "medium"] ?? 1) -
        (priorityRank[b.priority ?? "medium"] ?? 1)
      return byPriority || byDue
    }
    return byDue
  })
  return copy
}

export function searchTasks(tasks: TaskPublic[], query: string): TaskPublic[] {
  const q = query.trim().toLowerCase()
  if (!q) return tasks
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      (t.subject?.toLowerCase().includes(q) ?? false) ||
      (t.notes?.toLowerCase().includes(q) ?? false),
  )
}

export interface CategoryBreakdown {
  category: TaskCategory
  open: number
  total: number
}

export function categoryBreakdown(tasks: TaskPublic[]): CategoryBreakdown[] {
  return CATEGORIES.map((category) => {
    const inCat = tasks.filter(
      (t) => normalizeCategory(t.category) === category,
    )
    return {
      category,
      open: inCat.filter((t) => !t.is_done).length,
      total: inCat.length,
    }
  }).filter((c) => c.total > 0)
}

export type Urgency = "overdue" | "soon" | "today" | "week" | "later"

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getUrgency(task: TaskPublic, now: Date = new Date()): Urgency {
  const due = new Date(task.due_date)
  const diff = due.getTime() - now.getTime()

  if (!task.is_done && diff < 0) return "overdue"
  if (diff <= 6 * HOUR) return "soon"

  const dayDiff = Math.round(
    (startOfDay(due).getTime() - startOfDay(now).getTime()) / DAY,
  )
  if (dayDiff <= 0) return "today"
  if (dayDiff <= 7) return "week"
  return "later"
}

export function urgencyClasses(urgency: Urgency): {
  border: string
  text: string
} {
  switch (urgency) {
    case "overdue":
      return { border: "border-l-destructive", text: "text-destructive" }
    case "soon":
      return { border: "border-l-orange-500", text: "text-orange-600" }
    case "today":
      return { border: "border-l-primary", text: "text-primary" }
    case "week":
      return { border: "border-l-yellow-500", text: "text-muted-foreground" }
    default:
      return { border: "border-l-muted", text: "text-muted-foreground" }
  }
}

export function formatRelativeDue(
  task: TaskPublic,
  now: Date = new Date(),
): string {
  const due = new Date(task.due_date)
  const diff = due.getTime() - now.getTime()
  const absHours = Math.abs(diff) / HOUR

  if (task.is_done) return "Completed"

  if (diff < 0) {
    if (absHours < 1) return "Overdue"
    if (absHours < 24) return `Overdue by ${Math.round(absHours)}h`
    return `Overdue by ${Math.round(absHours / 24)}d`
  }

  if (absHours < 1) return `Due in ${Math.max(1, Math.round(diff / 60000))}m`
  if (absHours < 24) return `Due in ${Math.round(absHours)}h`

  const dayDiff = Math.round(
    (startOfDay(due).getTime() - startOfDay(now).getTime()) / DAY,
  )
  if (dayDiff === 1) return "Due tomorrow"
  return `Due in ${dayDiff}d`
}

export function formatDueDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export interface TaskGroup {
  label: string
  tasks: TaskPublic[]
}

export function groupTasks(
  tasks: TaskPublic[],
  now: Date = new Date(),
): TaskGroup[] {
  const buckets: Record<string, TaskPublic[]> = {
    Overdue: [],
    Today: [],
    Tomorrow: [],
    "This Week": [],
    Later: [],
  }

  for (const task of tasks) {
    const due = new Date(task.due_date)
    const dayDiff = Math.round(
      (startOfDay(due).getTime() - startOfDay(now).getTime()) / DAY,
    )

    if (!task.is_done && due.getTime() < now.getTime() && dayDiff < 0) {
      buckets.Overdue.push(task)
    } else if (dayDiff <= 0) {
      buckets.Today.push(task)
    } else if (dayDiff === 1) {
      buckets.Tomorrow.push(task)
    } else if (dayDiff <= 7) {
      buckets["This Week"].push(task)
    } else {
      buckets.Later.push(task)
    }
  }

  return Object.entries(buckets)
    .map(([label, groupTasks]) => ({ label, tasks: groupTasks }))
    .filter((group) => group.tasks.length > 0)
}

export interface SubjectProgress {
  subject: string
  done: number
  total: number
}

export function subjectProgress(tasks: TaskPublic[]): SubjectProgress[] {
  const map = tasks.reduce<Record<string, SubjectProgress>>((acc, task) => {
    const subject = task.subject?.trim() || "No subject"
    if (!acc[subject]) {
      acc[subject] = { subject, done: 0, total: 0 }
    }
    acc[subject].total += 1
    if (task.is_done) acc[subject].done += 1
    return acc
  }, {})

  return Object.values(map).sort((a, b) => a.subject.localeCompare(b.subject))
}

export function dueTodayCount(
  tasks: TaskPublic[],
  now: Date = new Date(),
): number {
  return tasks.filter((task) => {
    if (task.is_done) return false
    const dayDiff = Math.round(
      (startOfDay(new Date(task.due_date)).getTime() -
        startOfDay(now).getTime()) /
        DAY,
    )
    return dayDiff === 0
  }).length
}

export function overdueCount(
  tasks: TaskPublic[],
  now: Date = new Date(),
): number {
  return tasks.filter(
    (task) =>
      !task.is_done && new Date(task.due_date).getTime() < now.getTime(),
  ).length
}

export function subjectOptions(tasks: TaskPublic[]): string[] {
  const set = new Set<string>()
  for (const task of tasks) {
    const subject = task.subject?.trim()
    if (subject) set.add(subject)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}
