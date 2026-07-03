import { CalendarCheck } from "lucide-react"

import { Appearance } from "@/components/Common/Appearance"
import { Footer } from "./Footer"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-black/10 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-[0.55rem] bg-white text-primary shadow-sm">
            <CalendarCheck className="size-5" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Duely
          </span>
        </div>
        <div className="relative space-y-4">
          <p className="font-display text-4xl font-bold leading-tight tracking-tight">
            Never miss a deadline again.
          </p>
          <p className="max-w-sm text-primary-foreground/80">
            Duely keeps every assignment, reading, and due date in one place —
            sorted by what needs you first.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/60">
          Your deadlines, handled.
        </p>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-end">
          <Appearance />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
        <Footer />
      </div>
    </div>
  )
}
