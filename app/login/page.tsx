'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useToast } from '@/lib/toast'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Inline email validation
  useEffect(() => {
    if (email && !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }, [email])

  // Focus management after error
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    } else if (error && emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate email format
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      emailInputRef.current?.focus()
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        toast.showToast('Login failed', 'Invalid email or password', 'error')
      } else {
        toast.showToast('Success!', 'You have been signed in successfully', 'success', 3000)
        // Small delay to show success message
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 500)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-primary">
              {'<DevSaaS />'}
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8" id="main-content">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Sign In</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {error && (
                <div
                  ref={errorRef}
                  id="form-error"
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20"
                  role="alert"
                  aria-live="assertive"
                  tabIndex={-1}
                >
                  <span className="font-mono text-xs font-semibold">Error:</span>{' '}
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none"
                >
                  Email
                </label>
                <Input
                  ref={emailInputRef}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  error={emailError}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none"
                >
                  Password
                </label>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                variant="primary"
                isLoading={isLoading}
                disabled={isLoading || !!emailError}
                aria-busy={isLoading}
                aria-live="polite"
                aria-label={isLoading ? 'Signing in, please wait' : 'Sign in'}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <Link
              href="/"
              className="hover:text-foreground transition-colors underline"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

