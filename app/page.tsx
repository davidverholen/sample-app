import { auth } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Zap, Lock, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default async function Home() {
  const session = await auth()

  // Redirect to dashboard if already logged in
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* ARIA Live Region for Status Updates */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="status-announcements"
      />

      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-primary">
              {'<DevSaaS />'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Built for{' '}
              <span className="text-primary font-mono">Developers</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A modern Next.js SaaS platform with authentication, database
              integration, and developer-friendly tooling out of the box.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/login">
                <Button variant="primary" size="lg">
                  Get Started
                </Button>
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>

          {/* Code Example */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Quick Start</h2>
            <CodeBlock
              code={`// Install dependencies
npm install

// Set up database
npm run db:setup

// Start development server
npm run dev`}
              language="bash"
              showLineNumbers
            />
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="rounded-lg border border-border bg-card p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <Zap className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg">Fast Development</h3>
              <p className="text-sm text-muted-foreground">
                Next.js 14 App Router with Server Components and Server Actions
                for optimal performance.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <Lock className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg">Secure by Default</h3>
              <p className="text-sm text-muted-foreground">
                NextAuth.js integration with Prisma adapter for robust
                authentication and session management.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <Palette className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg">Developer UX</h3>
              <p className="text-sm text-muted-foreground">
                Dark mode, monospace fonts, and terminal-inspired UI designed
                for developers.
              </p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="space-y-4 pt-8">
            <h2 className="text-2xl font-semibold">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {[
                'Next.js 14',
                'TypeScript',
                'Prisma',
                'NextAuth.js',
                'Tailwind CSS',
                'PostgreSQL',
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-full bg-muted text-sm font-mono"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

