import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ListTodo,
  type LucideIcon,
  MapPin,
  PartyPopper,
  UserRound,
  Users,
} from "lucide-react"
import { useMemo } from "react"

import { TasksService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import useAuth from "@/hooks/useAuth"
import {
  categoryBreakdown,
  categoryLabel,
  dueTodayCount,
  formatRelativeDue,
  getUrgency,
  overdueCount,
  subjectProgress,
  type TaskCategory,
  urgencyClasses,
} from "@/lib/tasks"
import { cn } from "@/lib/utils"

const categoryIcon: Record<TaskCategory, LucideIcon> = {
  class: BookOpen,
  club: Users,
  campus: MapPin,
  social: PartyPopper,
  personal: UserRound,
}

export const Route = createFileRoute("/_layout/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [{ title: "Dashboard - Duely" }],
  }),
})

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ListTodo
  label: string
  value: number
  tone: "default" | "destructive" | "primary" | "success"
}) {
  const toneClass = {
    default: "bg-muted text-muted-foreground",
    destructive: "bg-destructive/10 text-destructive",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }[tone]

  return (
    <Card className="flex flex-row items-center gap-4 p-4">
      <span
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-xl",
          toneClass,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-display text-2xl font-bold leading-none">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

function Dashboard() {
  const { user: currentUser } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => TasksService.readTasks(),
  })

  const tasks = data?.data ?? []

  const stats = useMemo(() => {
    const open = tasks.filter((t) => !t.is_done)
    const done = tasks.filter((t) => t.is_done)
    const now = new Date()
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() + 7)
    const thisWeek = open.filter((t) => {
      const due = new Date(t.due_date).getTime()
      return due >= now.getTime() && due <= weekEnd.getTime()
    })
    return {
      today: dueTodayCount(tasks),
      overdue: overdueCount(tasks),
      week: thisWeek.length,
      done: done.length,
    }
  }, [tasks])

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => !t.is_done)
        .sort(
          (a, b) =>
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
        )
        .slice(0, 5),
    [tasks],
  )

  const progress = useMemo(() => subjectProgress(tasks).slice(0, 5), [tasks])
  const areas = useMemo(() => categoryBreakdown(tasks), [tasks])

  const name = currentUser?.full_name || currentUser?.email?.split("@")[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {greeting()}
            {name ? `, ${name}` : ""}.
          </h1>
          <p className="text-muted-foreground">
            {stats.overdue > 0
              ? `You have ${stats.overdue} overdue task${stats.overdue === 1 ? "" : "s"} — let's clear them.`
              : stats.today > 0
                ? `${stats.today} task${stats.today === 1 ? "" : "s"} due today. You've got this.`
                : "Nothing overdue. Nice and calm."}
          </p>
        </div>
        <Link to="/tasks">
          <Button className="gap-2">
            Go to tasks
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[76px] w-full" />
          <Skeleton className="h-[76px] w-full" />
          <Skeleton className="h-[76px] w-full" />
          <Skeleton className="h-[76px] w-full" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={AlertTriangle}
            label="Overdue"
            value={stats.overdue}
            tone="destructive"
          />
          <StatCard
            icon={CalendarClock}
            label="Due today"
            value={stats.today}
            tone="primary"
          />
          <StatCard
            icon={CalendarDays}
            label="This week"
            value={stats.week}
            tone="default"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={stats.done}
            tone="success"
          />
        </div>
      )}

      {!isLoading && areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {areas.map(({ category, open, total }) => {
            const Icon = categoryIcon[category]
            return (
              <div
                key={category}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm"
              >
                <Icon className="size-4 text-muted-foreground" />
                <span className="font-medium">{categoryLabel[category]}</span>
                <span className="text-muted-foreground">
                  {open > 0 ? `${open} open` : "all done"}
                  {" · "}
                  {total}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Up next</h2>
            <Link
              to="/tasks"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ListTodo className="size-6" />
              </span>
              <div>
                <p className="font-medium">You're all caught up</p>
                <p className="text-sm text-muted-foreground">
                  Add a deadline to see it show up here.
                </p>
              </div>
              <Link to="/tasks">
                <Button size="sm">Add a task</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {upcoming.map((task) => {
                const style = urgencyClasses(getUrgency(task))
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border border-l-4 bg-background p-3",
                      style.border,
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {task.title}
                        </span>
                        {task.subject && (
                          <Badge variant="outline">{task.subject}</Badge>
                        )}
                      </div>
                      <p className={cn("text-xs font-medium", style.text)}>
                        {formatRelativeDue(task)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-display text-base font-semibold">
            Progress by subject
          </h2>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : progress.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No tasks yet. Your subjects will appear here.
            </p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {progress.map(({ subject, done, total }) => {
                const pct = total === 0 ? 0 : Math.round((done / total) * 100)
                return (
                  <div key={subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{subject}</span>
                      <span className="text-muted-foreground">
                        {done}/{total}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
