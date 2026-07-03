import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  LayoutList,
  Share2,
} from "lucide-react"

import { Appearance } from "@/components/Common/Appearance"
import { Footer } from "@/components/Common/Footer"
import { Logo } from "@/components/Common/Logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "Duely — never miss a deadline" }],
  }),
})

const previewTasks = [
  {
    title: "Lab report",
    subject: "Chem",
    due: "Due in 2h",
    border: "border-l-destructive",
    text: "text-destructive",
    priority: "High",
    priorityVariant: "destructive" as const,
  },
  {
    title: "Reading response",
    subject: "History",
    due: "Due today",
    border: "border-l-primary",
    text: "text-primary",
    priority: "Medium",
    priorityVariant: "default" as const,
  },
  {
    title: "Group project draft",
    subject: "CS101",
    due: "Due tomorrow",
    border: "border-l-orange-500",
    text: "text-orange-600",
    priority: "Medium",
    priorityVariant: "default" as const,
  },
  {
    title: "Scholarship form",
    subject: "Admin",
    due: "Due in 5d",
    border: "border-l-yellow-500",
    text: "text-muted-foreground",
    priority: "Low",
    priorityVariant: "secondary" as const,
  },
]

const features = [
  {
    icon: CalendarClock,
    title: "Sorted by urgency",
    body: "Every task is color-coded by time left, so the thing due in two hours never hides behind next week's.",
  },
  {
    icon: LayoutList,
    title: "Grouped by day",
    body: "Today, Tomorrow, This Week, Later. See your week at a glance instead of one endless list.",
  },
  {
    icon: Share2,
    title: "Share your list",
    body: "Send a read-only link to a study partner or group so everyone's on the same deadline.",
  },
  {
    icon: BellRing,
    title: "Email reminders",
    body: "Get a nudge for everything due in the next 24 hours, straight to your inbox.",
  },
]

function TaskPreview() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl" />
      <div className="rounded-2xl border bg-card p-4 shadow-xl shadow-primary/5">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="font-display text-sm font-semibold">Today</p>
          <Badge variant="secondary">4</Badge>
        </div>
        <div className="flex flex-col gap-2.5">
          {previewTasks.map((task) => (
            <div
              key={task.title}
              className={`flex items-center justify-between gap-3 rounded-xl border border-l-4 bg-background p-3 ${task.border}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {task.title}
                  </span>
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {task.subject}
                  </Badge>
                </div>
                <p className={`text-xs font-medium ${task.text}`}>{task.due}</p>
              </div>
              <Badge variant={task.priorityVariant}>{task.priority}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo variant="full" />
        <div className="flex items-center gap-2">
          <Appearance />
          <Link to="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />A calmer way
              to study
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Stay ahead of{" "}
              <span className="text-primary">every deadline.</span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Classes, readings, labs, forms, that one email you keep putting
              off. Duely puts it all in one list, sorted by what needs you
              first, so nothing slips.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  Start for free
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  I already have an account
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Free to use. No credit card, no clutter.
            </p>
          </div>

          <TaskPreview />
        </section>

        <section className="border-t bg-card/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="mb-10 max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Everything you need to stay on top of it.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Built for students who have a lot going on and no time to
                babysit a to-do app.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="flex flex-col items-center gap-5 rounded-3xl border bg-primary px-6 py-14 text-center text-primary-foreground">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Get this week under control.
            </h2>
            <p className="max-w-md text-primary-foreground/80">
              Add your first deadline in under a minute. Your future self will
              thank you.
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Create your free account
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default HomePage
