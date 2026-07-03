import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  Plus,
  Share2,
  Trash2,
  Undo2,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type TaskCreate, type TaskPublic, TasksService } from "@/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import useCustomToast from "@/hooks/useCustomToast"
import {
  dueTodayCount,
  formatDueDate,
  formatRelativeDue,
  getUrgency,
  groupTasks,
  overdueCount,
  subjectOptions,
  subjectProgress,
  urgencyClasses,
} from "@/lib/tasks"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/tasks")({
  component: Tasks,
  head: () => ({
    meta: [{ title: "Tasks - SurviveUni" }],
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

const ALL_SUBJECTS = "all"

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  subject: z.string().optional(),
  due_date: z.string().min(1, { message: "Due date is required" }),
  priority: z.enum(["high", "medium", "low"]),
})

type FormData = z.infer<typeof formSchema>

function CreateTaskDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      subject: "",
      due_date: "",
      priority: "medium",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: TaskCreate) =>
      TasksService.createTask({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Task created")
      form.reset()
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const onSubmit = (data: FormData) => {
    const requestBody: TaskCreate = {
      title: data.title,
      subject: data.subject ? data.subject : null,
      due_date: new Date(data.due_date).toISOString(),
      priority: data.priority,
    }
    mutation.mutate(requestBody)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>
            Track a new assignment or deadline.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Title <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Essay draft" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CS101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Due date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function TaskRow({ task }: { task: TaskPublic }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const toggleMutation = useMutation({
    mutationFn: () =>
      TasksService.updateTask({
        taskId: task.id,
        requestBody: { is_done: !task.is_done },
      }),
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => TasksService.deleteTask({ taskId: task.id }),
    onSuccess: () => showSuccessToast("Task deleted"),
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const urgency = getUrgency(task)
  const urgencyStyle = urgencyClasses(urgency)

  return (
    <Card
      className={cn(
        "flex flex-row items-center justify-between gap-4 border-l-4 p-4",
        task.is_done ? "border-l-muted opacity-60" : urgencyStyle.border,
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
        </div>
        <p
          className={cn(
            "text-sm text-muted-foreground",
            !task.is_done && urgencyStyle.text,
          )}
        >
          <span className="font-medium">{formatRelativeDue(task)}</span>
          <span className="text-muted-foreground">
            {" · "}
            {formatDueDate(task.due_date)}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleMutation.mutate()}
          disabled={toggleMutation.isPending}
        >
          {task.is_done ? (
            <>
              <Undo2 className="mr-1 size-4" />
              Undo
            </>
          ) : (
            <>
              <Check className="mr-1 size-4" />
              Done
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          aria-label="Delete task"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </Card>
  )
}

function ShareButton() {
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => TasksService.shareTasks(),
    onSuccess: async (data) => {
      try {
        await navigator.clipboard.writeText(data.share_url)
        showSuccessToast("Share link copied to clipboard")
      } catch {
        showSuccessToast(`Share link: ${data.share_url}`)
      }
    },
    onError: handleError.bind(showErrorToast),
  })

  return (
    <Button
      variant="outline"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      <Share2 className="mr-2 size-4" />
      Share
    </Button>
  )
}

function RemindButton() {
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => TasksService.sendReminders(),
    onSuccess: (data) => {
      showSuccessToast(
        data.sent > 0
          ? `Sent ${data.sent} reminder${data.sent === 1 ? "" : "s"} to your inbox`
          : "No tasks due in the next 24 hours",
      )
    },
    onError: handleError.bind(showErrorToast),
  })

  return (
    <Button
      variant="outline"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      <Bell className="mr-2 size-4" />
      Email me reminders
    </Button>
  )
}

function DueBanner({ tasks }: { tasks: TaskPublic[] }) {
  const today = dueTodayCount(tasks)
  const overdue = overdueCount(tasks)

  if (today === 0 && overdue === 0) return null

  const variant = overdue > 0 ? "destructive" : "default"

  return (
    <Alert variant={variant}>
      {overdue > 0 ? <AlertTriangle /> : <CalendarClock />}
      <AlertTitle>
        {today > 0
          ? `You have ${today} task${today === 1 ? "" : "s"} due today`
          : "Heads up"}
      </AlertTitle>
      <AlertDescription>
        {overdue > 0
          ? `${overdue} task${overdue === 1 ? " is" : "s are"} overdue — tackle ${
              overdue === 1 ? "it" : "them"
            } first.`
          : "Stay on top of today's deadlines to keep surviving uni."}
      </AlertDescription>
    </Alert>
  )
}

function SubjectProgressPanel({ tasks }: { tasks: TaskPublic[] }) {
  const progress = useMemo(() => subjectProgress(tasks), [tasks])

  if (progress.length === 0) return null

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Progress by subject
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {progress.map(({ subject, done, total }) => {
          const pct = total === 0 ? 0 : Math.round((done / total) * 100)
          return (
            <div key={subject} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{subject}</span>
                <span className="text-muted-foreground">
                  {done}/{total} done
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
    </Card>
  )
}

function Tasks() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => TasksService.readTasks(),
  })

  const [subject, setSubject] = useState<string>(ALL_SUBJECTS)

  const tasks = data?.data ?? []
  const subjects = useMemo(() => subjectOptions(tasks), [tasks])

  const filteredTasks = useMemo(
    () =>
      subject === ALL_SUBJECTS
        ? tasks
        : tasks.filter((task) => task.subject?.trim() === subject),
    [tasks, subject],
  )

  const groups = useMemo(() => groupTasks(filteredTasks), [filteredTasks])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Your assignments and deadlines, grouped by when they're due.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RemindButton />
          <ShareButton />
          <CreateTaskDialog />
        </div>
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
          Failed to load tasks. Please try again.
        </Card>
      )}

      {!isLoading && !isError && data && data.count === 0 && (
        <Card className="flex flex-col items-center gap-2 p-12 text-center">
          <p className="font-medium">No tasks yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first deadline to start surviving uni.
          </p>
        </Card>
      )}

      {!isLoading && !isError && data && data.count > 0 && (
        <>
          <DueBanner tasks={tasks} />
          <SubjectProgressPanel tasks={filteredTasks} />

          <div className="flex items-center gap-2">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SUBJECTS}>All subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {groups.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No tasks match this filter.
            </Card>
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map((group) => (
                <section key={group.label} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </h2>
                    <Badge variant="secondary">{group.tasks.length}</Badge>
                  </div>
                  {group.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Tasks
