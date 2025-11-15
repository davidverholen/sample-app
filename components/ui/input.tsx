import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  helpText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, error, helpText, id, 'aria-describedby': ariaDescribedBy, ...props },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const errorId = error ? `${inputId}-error` : undefined
    const helpTextId = helpText ? `${inputId}-help` : undefined
    const describedBy =
      [ariaDescribedBy, errorId, helpTextId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full">
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={helpTextId} className="mt-1 text-xs text-muted-foreground">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
