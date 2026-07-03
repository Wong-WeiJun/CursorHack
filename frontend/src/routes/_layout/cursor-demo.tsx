import { createFileRoute } from "@tanstack/react-router"
import {
  Bot,
  Code2,
  FileSearch,
  Sparkles,
  Terminal,
  Wrench,
  Zap,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_layout/cursor-demo")({
  component: CursorDemo,
  head: () => ({
    meta: [{ title: "Cursor Demo - Duely" }],
  }),
})

const capabilities = [
  {
    icon: FileSearch,
    title: "Read your codebase",
    description:
      "I search and open files to understand patterns before writing anything.",
  },
  {
    icon: Code2,
    title: "Write & edit code",
    description:
      "Full files, matching your stack and conventions — not vague snippets.",
  },
  {
    icon: Terminal,
    title: "Run commands",
    description:
      "Tests, migrations, linters, git — I execute and fix what breaks.",
  },
  {
    icon: Wrench,
    title: "Debug from errors",
    description:
      "Paste a stack trace or describe a bug; I trace it to the root cause.",
  },
  {
    icon: Bot,
    title: "Multi-step tasks",
    description:
      "Backend route + migration + frontend page + tests in one conversation.",
  },
  {
    icon: Zap,
    title: "Follow your rules",
    description:
      "Project rules in .cursorrules and CLAUDE.md shape every response.",
  },
] as const

const promptResponses: Record<string, string> = {
  default:
    "I'd explore the repo, read related files, make a focused change, and run tests to verify.",
  auth: "I'd check useAuth.ts, deps.py, and login routes — then patch the mismatch and suggest make generate-client if types drift.",
  bug: "I'd read the stack trace, grep for the failing symbol, reproduce with a test, fix the root cause — not a band-aid.",
  feature:
    "I'd add the SQLModel + Alembic migration, FastAPI route with tests, regenerate the client, and build the React page with loading/empty/error states.",
  refactor:
    "I'd map callers first, keep the diff minimal, and run lint + tests so behavior stays identical.",
}

function matchResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (
    lower.includes("auth") ||
    lower.includes("login") ||
    lower.includes("jwt")
  ) {
    return promptResponses.auth
  }
  if (
    lower.includes("bug") ||
    lower.includes("error") ||
    lower.includes("fix")
  ) {
    return promptResponses.bug
  }
  if (
    lower.includes("add") ||
    lower.includes("feature") ||
    lower.includes("build") ||
    lower.includes("create")
  ) {
    return promptResponses.feature
  }
  if (lower.includes("refactor") || lower.includes("clean")) {
    return promptResponses.refactor
  }
  return promptResponses.default
}

function CursorDemo() {
  const [prompt, setPrompt] = useState("Add a notes page with CRUD and tests")
  const [clicks, setClicks] = useState(0)
  const [accent, setAccent] = useState("#6366f1")

  const agentReply = useMemo(() => matchResponse(prompt), [prompt])

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-500/10 via-background to-violet-500/5 p-8 md:p-10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" />
            Built by Cursor Agent
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            This page is the demo.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            You asked for one file. I read your project structure, matched your
            React + TanStack Router + shadcn/ui stack, and created this
            interactive page — no copy-paste from a template repo.
          </p>
          <p className="text-sm text-muted-foreground">
            Open the chat and try:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              @cursor-demo.tsx add a dark gradient toggle
            </code>
          </p>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 size-48 rounded-full blur-3xl"
          style={{ backgroundColor: `${accent}33` }}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prompt playground</CardTitle>
            <CardDescription>
              Type a request like you would in Cursor chat. The reply below is a
              simplified preview of how I&apos;d approach it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want built or fixed…"
              aria-label="Example Cursor prompt"
            />
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Agent plan
              </p>
              <p className="text-sm leading-relaxed">{agentReply}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live widget</CardTitle>
            <CardDescription>
              Proof I can ship UI — state, styling, and accessibility included.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setClicks((n) => n + 1)}
                aria-label={`Increment counter, current value ${clicks}`}
              >
                Clicked {clicks} {clicks === 1 ? "time" : "times"}
              </Button>
              <Button variant="outline" onClick={() => setClicks(0)}>
                Reset
              </Button>
            </div>
            <div className="space-y-2">
              <label htmlFor="accent-color" className="text-sm font-medium">
                Accent color (updates the hero glow)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="accent-color"
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="size-10 cursor-pointer rounded border bg-transparent"
                />
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                  {accent}
                </code>
              </div>
            </div>
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                clicks > 0 && "shadow-sm",
              )}
              style={{
                width: `${Math.min(clicks * 12, 100)}%`,
                backgroundColor: accent,
              }}
              role="progressbar"
              aria-valuenow={Math.min(clicks * 12, 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress bar driven by click counter"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Three ways to use Cursor</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Chat (Agent)",
                body: "Describe goals in plain English. I edit files, run commands, and iterate until it works.",
              },
              {
                step: "2",
                title: "Inline edit",
                body: "Select code, press Ctrl+K, ask for a local change — great for small refactors.",
              },
              {
                step: "3",
                title: "@ references",
                body: "Point me at files, folders, docs, or terminal output so I stay grounded in your project.",
              },
            ].map(({ step, title, body }) => (
              <li key={step} className="rounded-lg border p-4">
                <span className="text-xs font-semibold text-primary">
                  {step}
                </span>
                <p className="mt-1 font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

export default CursorDemo
