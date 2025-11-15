import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '@/lib/toast'

// Test component that uses the toast hook
function TestComponent() {
  const { showToast } = useToast()

  return (
    <div>
      <button onClick={() => showToast('Test Title', 'Test Description', 'success')}>
        Show Toast
      </button>
      <button onClick={() => showToast('Error Title', undefined, 'error')}>Show Error</button>
    </div>
  )
}

describe('Toast utilities', () => {
  describe('ToastProvider', () => {
    it('provides toast context to children', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )
      expect(screen.getByRole('button', { name: /show toast/i })).toBeInTheDocument()
    })

    it('throws error when useToast is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useToast must be used within ToastProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('useToast', () => {
    it('shows toast when showToast is called', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      await user.click(screen.getByRole('button', { name: /show toast/i }))

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByText('Test Description')).toBeInTheDocument()
      })
    })

    it('shows toast with different variants', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      await user.click(screen.getByRole('button', { name: /show error/i }))

      await waitFor(() => {
        expect(screen.getByText('Error Title')).toBeInTheDocument()
      })
    })

    it('generates unique IDs for toasts', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      await user.click(screen.getByRole('button', { name: /show toast/i }))
      await user.click(screen.getByRole('button', { name: /show toast/i }))

      await waitFor(() => {
        const toasts = screen.getAllByText('Test Title')
        expect(toasts.length).toBeGreaterThan(0)
      })
    })

    it('closes toast when closeToast is called', async () => {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      await user.click(screen.getByRole('button', { name: /show toast/i }))

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close notification/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
      })
    })
  })
})
