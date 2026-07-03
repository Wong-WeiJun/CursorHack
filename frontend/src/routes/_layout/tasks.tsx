import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarClock,
  Check,
  type LucideIcon,
  MapPin,
  PartyPopper,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
  Undo2,
  UserRound,
  Users,
} from "lucide-react"
import { type ReactNode, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  type TaskCreate,
  type TaskPublic,
  TasksService,
  type TaskUpdate,
} from "@/client"
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
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import {
  CATEGORIES,
  categoryLabel,
  categorySubjectHint,
  dueTodayCount,
  formatDueDate,
  formatRelativeDue,
  getUrgency,
  groupTasks,
  normalizeCategory,
  overdueCount,
  type SortKey,
  searchTasks,
  sortTasks,
  subjectOptions,
  subjectProgress,
  type TaskCategory,
  urgencyClasses,
} from "@/lib/tasks"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/tasks")({
  component: Tasks,
  head: () => ({
    meta: [{ title: "Tasks - Duely" }],
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

const categoryIcon: Record<TaskCategory, LucideIcon> = {
  class: BookOpen,
  club: Users,
  campus: MapPin,
  social: PartyPopper,
  personal: UserRound,
}

const ALL = "all"

function toDateTimeLocalValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  category: z.enum(["class", "club", "campus", "social", "personal"]),
  subject: z.string().optional(),
  due_date: z.string().min(1, { message: "Due date is required" }),
  priority: z.enum(["high", "medium", "low"]),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

function TaskFormDialog({
  task,
  trigger,
}: {
  task?: TaskPublic
  trigger: ReactNode
}) {
  const isEdit = Boolean(task)
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      title: task?.title ?? "",
      category: normalizeCategory(task?.category),
      subject: task?.subject ?? "",
      due_date: task ? toDateTimeLocalValue(task.due_date) : "",
      priority: (task?.priority ?? "medium") as FormData["priority"],
      notes: task?.notes ?? "",
    },
  })

  const category = form.watch("category")

  const mutation = useMutation({
    mutationFn: (values: FormData) => {
      const body = {
        title: values.title,
        category: values.category,
        subject: values.subject ? values.subject : null,
        due_date: new Date(values.due_date).toISOString(),
        priority: values.priority,
        notes: values.notes ? values.notes : null,
      }
      if (task) {
        return TasksService.updateTask({
          taskId: task.id,
          requestBody: body satisfies TaskUpdate,
        })
      }
      return TasksService.createTask({ requestBody: body satisfies TaskCreate })
    },
    onSuccess: () => {
      showSuccessToast(isEdit ? "Task updated" : "Task created")
      if (!isEdit) form.reset()
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "Add task"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this task."
              : "Track a new deadline, meeting, or plan."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {categoryLabel[c]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
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

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={categorySubjectHint[category]}
                        {...field}
                      />
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Anything to remember? (optional)"
                        {...field}
                      />
                    </FormControl>
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
                {isEdit ? "Save changes" : "Save"}
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

  const urgencyStyle = urgencyClasses(getUrgency(task))
  const category = normalizeCategory(task.category)
  const CategoryIcon = categoryIcon[category]

  return (
    <Card
      className={cn(
        "flex flex-row items-center justify-between gap-4 border-l-4 p-4",
        task.is_done ? "border-l-muted opacity-60" : urgencyStyle.border,
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "truncate font-medium",
              task.is_done && "line-through",
            )}
          >
            {task.title}
          </p>
          <Badge variant="secondary" className="gap-1">
            <CategoryIcon className="size-3" />
            {categoryLabel[category]}
          </Badge>
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
        {task.notes && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {task.notes}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
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
        <TaskFormDialog
          task={task}
          trigger={
            <Button variant="ghost" size="icon" aria-label="Edit task">
              <Pencil className="size-4" />
            </Button>
          }
        />
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
          : "Stay on top of today's deadlines and keep your week on track."}
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

  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>(ALL)
  const [subject, setSubject] = useState<string>(ALL)
  const [sortKey, setSortKey] = useState<SortKey>("due")

  const tasks = useMemo(() => data?.data ?? [], [data])
  const subjects = useMemo(() => subjectOptions(tasks), [tasks])

  const filteredTasks = useMemo(() => {
    const searched = searchTasks(tasks, query)
    const byCategory =
      category === ALL
        ? searched
        : searched.filter((t) => normalizeCategory(t.category) === category)
    const bySubject =
      subject === ALL
        ? byCategory
        : byCategory.filter((t) => t.subject?.trim() === subject)
    return sortTasks(bySubject, sortKey)
  }, [tasks, query, category, subject, sortKey])

  const groups = useMemo(() => groupTasks(filteredTasks), [filteredTasks])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Everything on your plate, grouped by when it's due.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RemindButton />
          <ShareButton />
          <TaskFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 size-4" />
                Add task
              </Button>
            }
          />
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
            Add your first deadline and Duely will keep it in view.
          </p>
        </Card>
      )}

      {!isLoading && !isError && data && data.count > 0 && (
        <>
          <DueBanner tasks={tasks} />
          <SubjectProgressPanel tasks={filteredTasks} />

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks"
                className="pl-9"
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All areas</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryLabel[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All labels</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortKey}
              onValueChange={(v) => setSortKey(v as SortKey)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due">Sort: Due date</SelectItem>
                <SelectItem value="priority">Sort: Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {groups.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No tasks match your filters.
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
