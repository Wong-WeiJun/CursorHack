import { Link } from "@tanstack/react-router"
import { CalendarCheck } from "lucide-react"

import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-[0.55rem] bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      <CalendarCheck className="size-[60%]" strokeWidth={2.5} />
    </span>
  )
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const wordmark = (
    <span className="font-display text-xl font-bold leading-none tracking-tight text-foreground">
      Duely
    </span>
  )

  let content: React.ReactNode

  if (variant === "icon") {
    content = <Mark className={className} />
  } else if (variant === "responsive") {
    content = (
      <span className={cn("flex items-center gap-2.5", className)}>
        <Mark />
        <span className="group-data-[collapsible=icon]:hidden">{wordmark}</span>
      </span>
    )
  } else {
    content = (
      <span className={cn("flex items-center gap-2.5", className)}>
        <Mark />
        {wordmark}
      </span>
    )
  }

  if (!asLink) {
    return content
  }

  return (
    <Link to="/" className="inline-flex">
      {content}
    </Link>
  )
}
