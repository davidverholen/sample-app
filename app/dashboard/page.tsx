import { requireAuth } from '@/lib/auth'
import { LogoutButton } from '@/components/features/LogoutButton'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { CodeBlock } from '@/components/ui/code-block'
import { MobileNav } from '@/components/ui/mobile-nav'
import { Zap, BarChart3, Code, BookOpen, User, Mail, Key } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await requireAuth()

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
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-primary">
              {'<DevSaaS />'}
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <LogoutButton />
            </div>
            <MobileNav>
              <div className="space-y-4">
                <ThemeToggle />
                <LogoutButton />
              </div>
            </MobileNav>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name || session.user.email}
            </p>
          </div>

          {/* User Info Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" aria-hidden="true" />
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-4 border border-border">
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground min-w-[80px]">
                      Email:
                    </span>
                    <span className="text-foreground">{session.user.email}</span>
                  </div>
                  {session.user.name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-muted-foreground min-w-[80px]">
                        Name:
                      </span>
                      <span className="text-foreground">
                        {session.user.name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground min-w-[80px]">
                      User ID:
                    </span>
                    <span className="text-foreground break-all">
                      {session.user.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
                Quick Actions
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground">API Status</span>
                  <span className="font-mono text-xs text-green-500">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground">Database</span>
                  <span className="font-mono text-xs text-green-500">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground">Session</span>
                  <span className="font-mono text-xs text-primary">Active</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
                System Info
              </h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center justify-between p-2 rounded">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="text-foreground">
                    {process.env.NODE_ENV || 'development'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded">
                  <span className="text-muted-foreground">Framework</span>
                  <span className="text-foreground">Next.js 14</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded">
                  <span className="text-muted-foreground">Runtime</span>
                  <span className="text-foreground">Node.js</span>
                </div>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" aria-hidden="true" />
              Example API Call
            </h3>
            <CodeBlock
              code={`// Example: Fetch user data
const response = await fetch('/api/user', {
  headers: {
    'Authorization': 'Bearer ${session.user.id}',
  },
});

const userData = await response.json();
console.log(userData);`}
              language="typescript"
              showLineNumbers
            />
          </div>

          {/* Developer Resources */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              Developer Resources
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <a
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="font-semibold mb-1">Next.js Docs</div>
                <div className="text-xs text-muted-foreground">
                  Official documentation
                </div>
              </a>
              <a
                href="https://www.prisma.io/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="font-semibold mb-1">Prisma Docs</div>
                <div className="text-xs text-muted-foreground">
                  Database toolkit
                </div>
              </a>
              <a
                href="https://next-auth.js.org"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="font-semibold mb-1">NextAuth.js</div>
                <div className="text-xs text-muted-foreground">
                  Authentication
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

