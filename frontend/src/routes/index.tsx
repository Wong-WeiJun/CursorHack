import { createFileRoute, Link } from "@tanstack/react-router"
import { LogIn, UserPlus } from "lucide-react"
import { Appearance } from "@/components/Common/Appearance"
import { socialLinks } from "@/components/Common/Footer"
import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "FastSkeleton" }],
  }),
})

const currentYear = new Date().getFullYear()

function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Logo variant="full" />
        <Appearance />
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Welcome to <span className="text-primary">FastSkeleton</span>
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              A streamlined full-stack foundation for your next project. FastAPI
              meets React. Built for speed.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/login">
              <Button size="lg" className="gap-2 min-w-[160px]">
                <LogIn className="size-4" />
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 min-w-[160px]"
              >
                <UserPlus className="size-4" />
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            Jun's Template - {currentYear}
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Built with FastAPI & React. Fork of the FastAPI full-stack template.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
