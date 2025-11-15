'use client'

import * as React from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  children?: React.ReactNode
}

export function MobileNav({ children }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-nav"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <>
          <div
            className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="mobile-nav"
            className={cn(
              'fixed bottom-0 left-0 right-0 top-16 z-50',
              'border-b border-border bg-background',
              'md:hidden',
              'overflow-y-auto'
            )}
            aria-label="Mobile navigation"
          >
            <div className="container mx-auto space-y-4 px-4 py-6">{children}</div>
          </nav>
        </>
      )}
    </>
  )
}
