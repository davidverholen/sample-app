'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { ToastContainer, ToastProps, ToastVariant } from '@/components/ui/toast'

interface ToastContextType {
  showToast: (
    title: string,
    description?: string,
    variant?: ToastVariant,
    duration?: number
  ) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = useCallback(
    (title: string, description?: string, variant: ToastVariant = 'info', duration = 5000) => {
      const id = Math.random().toString(36).substring(7)
      setToasts((prev) => [
        ...prev,
        { id, title, description, variant, duration, onClose: () => {} },
      ])
    },
    []
  )

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer
        toasts={toasts.map((toast) => ({ ...toast, onClose: closeToast }))}
        onClose={closeToast}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
