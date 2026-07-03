import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { type TaskPublic, TasksService } from "@/client"
import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/share/$token")({
  component: SharedTasks,
  head: () => ({
    meta: [{ title: "Shared Tasks - SurviveUni" }],
  }),
})

const priorityLabel: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
}

const priorityVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
}

function formatDueDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function isOverdue(task: TaskPublic) {
  return !task.is_done && new Date(task.due_date).getTime() < Date.now()
}

function SharedTaskRow({ task }: { task: TaskPublic }) {
  return (
    <Card
      className={cn(
        "flex flex-row items-center justify-between gap-4 p-4",
        task.is_done && "opacity-60",
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate font-medium",
              task.is_done && "line-through",
            )}
          >
            {task.title}
          </p>
          {task.subject && <Badge variant="outline">{task.subject}</Badge>}
          <Badge variant={priorityVariant[task.priority ?? "medium"]}>
            {priorityLabel[task.priority ?? "medium"]}
          </Badge>
          {task.is_done && <Badge variant="secondary">Done</Badge>}
        </div>
        <p
          className={cn(
            "text-sm text-muted-foreground",
            isOverdue(task) && "text-destructive",
          )}
        >
          Due {formatDueDate(task.due_date)}
          {isOverdue(task) && " · Overdue"}
        </p>
      </div>
    </Card>
  )
}

function SharedTasks() {
  const { token } = Route.useParams()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["shared-tasks", token],
    queryFn: () => TasksService.readSharedTasks({ token }),
    retry: false,
  })

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4 md:px-10">
        <Logo variant="full" />
        <Appearance />
      </header>

      <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Shared Tasks</h1>
            <p className="text-muted-foreground">
              A read-only view of this student's deadlines.
            </p>
          </div>

          {isLoading && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {isError && (
            <Card className="p-8 text-center text-muted-foreground">
              This share link is invalid or no longer exists.
            </Card>
          )}

          {!isLoading && !isError && data && data.count === 0 && (
            <Card className="p-12 text-center text-muted-foreground">
              No tasks to show.
            </Card>
          )}

          {!isLoading && !isError && data && data.count > 0 && (
            <div className="flex flex-col gap-3">
              {data.data.map((task) => (
                <SharedTaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default SharedTasks
